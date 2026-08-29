import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { ChatAnthropic } from "@langchain/anthropic"
import { ChatPromptTemplate } from "@langchain/core/prompts"
import { ONBOARDING_EXTRACTION_PROMPT, ONBOARDING_SYSTEM_INSTRUCTIONS } from "@/prompts/onboarding"
import { COMPANION_SYSTEM_INSTRUCTIONS, FORMAT_INSTRUCTIONS } from "@/prompts/companion"
import { EmotionService } from "@/lib/services/emotionService"
import { MemoryService } from "@/lib/services/memoryService"

export const dynamic = "force-dynamic"

// GET: Fetch profile memory status and message history
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    // Fetch or create profile memory
    const profile = await MemoryService.getOrCreateProfile(userId)

    // Fetch last 40 companion messages
    const messages = await prisma.companionMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 40,
    })

    // Fetch episodic memories
    const episodicMemories = await MemoryService.getEpisodicMemories(userId)

    return NextResponse.json({
      profile,
      messages,
      episodicMemories,
    })
  } catch (error) {
    console.error("GET companion error:", error)
    return NextResponse.json({ error: "Failed to load companion details" }, { status: 500 })
  }
}

// POST: Process message and execute modular cognitive node pipelines
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json()
    // Support custom payload `{ message }` or Vercel AI SDK `{ messages }` payload
    const message =
      body.message ||
      (body.messages && body.messages.length > 0
        ? body.messages[body.messages.length - 1].content
        : null)
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    // Initialize LLM
    const llm = new ChatAnthropic({
      anthropicApiKey: process.env.AI_API_KEY,
      modelName: process.env.AI_MODEL || "claude-haiku-4-5",
    })

    // Save user message immediately to establish continuity
    const userMessageRecord = await prisma.companionMessage.create({
      data: {
        userId,
        role: "user",
        content: message,
      },
    })

    // --- NODE 1: Fetch Profile & Session Context ---
    const profile = await MemoryService.getOrCreateProfile(userId)

    // Get chat history (last 15 messages)
    const historyMessages = await prisma.companionMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: 15,
    })
    const formattedHistory = historyMessages
      .map((m: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => `${m.role === "user" ? "User" : "MirrorMind"}: ${m.content}`)
      .join("\n")

    // Get user's resolved decisions (to check for patterns)
    const recentDecisions = await prisma.decision.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    })
    const formattedDecisions = recentDecisions
      .map(
        (d) =>
          `- Title: "${d.title}" | Category: ${d.category} | Choice: "${d.choice}" | Outcome: "${d.outcome || "Pending"}" | Emotion: "${d.emotion || "None"}" | Regret: ${d.regretScore || 0}/10`
      )
      .join("\n")

    // Get episodic memories
    const episodicMemories = await MemoryService.getEpisodicMemories(userId, 10)
    const formattedEpisodics = episodicMemories
      .map(
        (e: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) =>
          `- ${e.event} (Importance: ${e.importance}/10, Emotion: ${e.emotion || "neutral"})`
      )
      .join("\n")

    const onboardingStage = profile.onboardingStage

    // --- NODE 2: Fetch Current Emotional State (Fast DB query) ---
    const lastEmotionAnalysis = await prisma.emotionAnalysis.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })
    const emotionState = lastEmotionAnalysis?.dominantEmotion || "Neutral"
    const behaviorCues = [
      lastEmotionAnalysis?.avoidance ? "avoidance" : "",
      lastEmotionAnalysis?.overthinking ? "overthinking" : "",
    ]
      .filter(Boolean)
      .join(", ")

    // --- BACKGROUND COGNITIVE PIPELINE ---
    // We run these heavy LLM & database processes asynchronously in the background.
    // This guarantees near-zero streaming delay for the user response.
    const runBackgroundCognitivePipeline = async () => {
      try {
        // A. Real-time Structured Emotion Extraction & Save
        const emotionAnalysis = await EmotionService.analyzeAndSave(
          userId,
          message,
          userMessageRecord.id
        )
        const currentEmotion = emotionAnalysis.dominantEmotion

        // B. Onboarding Extraction & Stage Advancement
        let profileUpdate: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = {}
        let nextStage = onboardingStage

        if (onboardingStage < 6) {
          const extractionPrompt = ONBOARDING_EXTRACTION_PROMPT.replace(
            "{onboardingStage}",
            String(onboardingStage)
          )
            .replace("{message}", message)
            .replace("{history}", formattedHistory)

          try {
            const parserResponse = await llm.invoke(extractionPrompt)
            const content = parserResponse.content;
            const parsedText = (typeof content === 'string' ? content : (Array.isArray(content) ? content.map((c: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => c.type === 'text' ? c.text : '').join('') : '')).trim()

            let cleanParsed = parsedText
            if (cleanParsed.startsWith("```json")) cleanParsed = cleanParsed.slice(7)
            if (cleanParsed.startsWith("```")) cleanParsed = cleanParsed.slice(3)
            if (cleanParsed.endsWith("```")) cleanParsed = cleanParsed.slice(0, -3)
            cleanParsed = cleanParsed.trim()

            const result = JSON.parse(cleanParsed)
            if (result.extracted && Object.keys(result.extracted).length > 0) {
              profileUpdate = result.extracted
            }
            if (result.shouldAdvance) {
              nextStage = Math.min(6, onboardingStage + 1)
            }
          } catch (err) {
            console.error("Failed to parse onboarding extraction JSON in background:", err)
          }
        }

        // C. Save Structured Memory Updates & Episodic Spikes
        const updatePayload: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = {}
        if (profileUpdate.name) updatePayload.name = profileUpdate.name
        if (profileUpdate.preferredName) updatePayload.preferredName = profileUpdate.preferredName
        if (profileUpdate.age) updatePayload.age = parseInt(profileUpdate.age)
        if (profileUpdate.birthday) updatePayload.birthday = profileUpdate.birthday
        if (profileUpdate.gender) updatePayload.gender = profileUpdate.gender
        if (profileUpdate.country) updatePayload.country = profileUpdate.country
        if (profileUpdate.language) updatePayload.language = profileUpdate.language
        if (profileUpdate.profession) updatePayload.profession = profileUpdate.profession
        if (profileUpdate.company) updatePayload.company = profileUpdate.company
        if (profileUpdate.designation) updatePayload.designation = profileUpdate.designation
        if (profileUpdate.routine) updatePayload.routine = profileUpdate.routine
        if (profileUpdate.workStyle) updatePayload.workStyle = updatePayload.workStyle
        if (profileUpdate.riskStyle) updatePayload.riskStyle = profileUpdate.riskStyle
        if (profileUpdate.relationshipStatus)
          updatePayload.relationshipStatus = profileUpdate.relationshipStatus
        if (nextStage !== onboardingStage) updatePayload.onboardingStage = nextStage

        // For arrays, append uniquely if present
        const arrayFields = [
          "goals",
          "ambitions",
          "traits",
          "fears",
          "motivations",
          "overthinkItems",
        ]
        for (const field of arrayFields) {
          if (Array.isArray(profileUpdate[field]) && profileUpdate[field].length > 0) {
            const existing = (profile as unknown as Record<string, unknown[]>)[field] || []
            const combined = Array.from(new Set([...existing, ...profileUpdate[field]]))
            updatePayload[field] = combined
          }
        }

        if (Object.keys(updatePayload).length > 0) {
          await prisma.profileMemory.update({
            where: { userId },
            data: updatePayload,
          })
        }

        // Persist life events as EpisodicMemory records
        if (Array.isArray(profileUpdate.lifeEvents) && profileUpdate.lifeEvents.length > 0) {
          for (const event of profileUpdate.lifeEvents) {
            try {
              await prisma.episodicMemory.create({
                data: {
                  userId,
                  event: String(event),
                  importance: 8,
                  emotion: currentEmotion,
                  timestamp: new Date(),
                },
              })
            } catch (err) {
              console.error("Failed to persist life event in background:", err)
            }
          }
        }

        // D. Memory Classification & Persistence Threshold Engine
        await MemoryService.evaluateAndSaveMemory(userId, message, currentEmotion)
      } catch (err) {
        console.error("Error in background cognitive pipeline:", err)
      }
    }

    // Trigger pipeline without awaiting, returning the stream instantly
    runBackgroundCognitivePipeline()

    // --- NODE 6: Dynamic Companion Response Generation ---
    let systemInstructions = ""

    if (profile.onboardingStage < 6) {
      systemInstructions = ONBOARDING_SYSTEM_INSTRUCTIONS.replaceAll(
        "{onboardingStage}",
        String(profile.onboardingStage)
      )
    } else {
      systemInstructions = COMPANION_SYSTEM_INSTRUCTIONS.replace(
        "{preferredName}",
        profile.preferredName || profile.name || "Explorer"
      )
        .replace("{birthday}", profile.birthday || "Not specified")
        .replace(
          "{career}",
          `${profile.designation || profile.profession || "Not specified"} at ${profile.company || "Not specified"}`
        )
        .replace("{goals}", profile.goals?.join(", ") || "None listed")
        .replace("{traits}", profile.traits?.join(", ") || "None listed")
        .replace("{motivations}", profile.motivations?.join(", ") || "None listed")
        .replace("{fears}", profile.fears?.join(", ") || "None listed")
        .replace("{overthinkItems}", profile.overthinkItems?.join(", ") || "None listed")
        .replace("{riskStyle}", profile.riskStyle || "Balanced")
        .replace("{episodicMemories}", formattedEpisodics || "None recorded yet.")
        .replace("{decisions}", formattedDecisions || "No decisions logged yet.")
        .replace("{localTime}", new Date().toLocaleDateString())
    }

    const fullSystemInstruction = `${systemInstructions}\n\nDetected Emotional State: ${emotionState}. Behavioral Cues: ${behaviorCues || "normal"}.\n\n${FORMAT_INSTRUCTIONS}`

    const conversationPrompt = ChatPromptTemplate.fromMessages([
      ["system", fullSystemInstruction],
      [
        "user",
        `Latest Message: "${message}"\n\nHistory Context:\n{history}\n\nMirrorMind, stream your response:`,
      ],
    ])

    const responseChain = conversationPrompt.pipe(llm)
    const stream = await responseChain.stream({
      history: formattedHistory,
    })

    let accumulatedText = ""

    const customStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.content;
          const textChunk = typeof content === 'string' ? content : (Array.isArray(content) ? content.map((c: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => c.type === 'text' ? c.text : '').join('') : '');
          accumulatedText += textChunk
          controller.enqueue(textChunk)
        }
        controller.close()

        // AFTER stream finishes, save assistant message to database:
        try {
          await prisma.companionMessage.create({
            data: { userId, role: "assistant", content: accumulatedText },
          })
        } catch (e) {
          console.error("Failed to save assistant stream to DB", e)
        }
      },
    })

    return new Response(customStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error) {
    console.error("POST companion error:", error)
    return NextResponse.json({ error: "Failed to process message" }, { status: 500 })
  }
}
