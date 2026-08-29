import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { ChatAnthropic } from "@langchain/anthropic"
import { ChatPromptTemplate } from "@langchain/core/prompts"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json()
    const {
      mode = "double",
      situation,
      decisionId,
      alternativeChoice,
      personaId,
      query,
      question,
    } = body

    // Fetch decisions of this user
    const decisions = await prisma.decision.findMany({
      where: { userId },
    })

    if (!decisions.length) {
      return NextResponse.json({
        predictedChoice:
          "No decisions found. Add some decisions to your log first to enable simulation.",
        matchedDecision: "None",
        basedOn: 0,
        confidence: "0%",
        reasoning: "We need at least one past decision in your history to start simulating.",
      })
    }

    // Initialize LangChain ChatOpenAI
    const llm = new ChatAnthropic({
      anthropicApiKey: process.env.AI_API_KEY,
      modelName: process.env.AI_MODEL || "claude-haiku-4-5",
    })

    // Format decisions history for context
    const historyText = decisions
      .map((d: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, index) => {
        return `Decision #${index + 1}:
Title: ${d.title}
Category: ${d.category}
Situation: ${d.situation}
Choice made: ${d.choice}
Confidence level: ${d.confidence}%
Emotion/Mood: ${d.emotion || "Neutral"}
Stress level: ${d.stressLevel || 5}/10
Outcome: ${d.outcome}
Regret Score: ${d.regretScore || 0}/10`
      })
      .join("\n\n")

    let systemPrompt = ""
    let userPromptText = ""

    if (mode === "double") {
      if (!situation) {
        return NextResponse.json(
          { error: "situation is required for double mode" },
          { status: 400 }
        )
      }
      systemPrompt = `You are MirrorMind, the user's reflective cognitive double and decision simulation engine. 
Your task is to analyze the user's past decision history and predict what choice they would make in a new situation.
Analyze their behavioral patterns, risk-tolerance, categories of decisions, emotional associations, stress tolerance, and outcomes.

You must output a raw, valid JSON object with the following fields:
1. "predictedChoice": A concise tagline/choice representing what they would do (e.g., "Decline the role change and negotiate for remote flexibility").
2. "matchedDecision": The exact title of the most similar past decision from their history.
3. "confidence": A percentage string representing your prediction confidence (e.g., "85%"), reflecting how closely this new situation matches their historic patterns.
4. "reasoning": A detailed explanation (2-3 sentences) explaining WHY they would make this choice by drawing connections to specific past decisions and their recurring psychological habits.

Do not wrap the JSON in markdown code blocks like \`\`\`json. Output only the raw JSON.`

      userPromptText = `USER DECISION HISTORY:\n{history}\n\nNEW SITUATION:\n${situation}\n\nPredict what I would do:`
    } else if (mode === "alt-reality") {
      if (!decisionId || !alternativeChoice) {
        return NextResponse.json(
          { error: "decisionId and alternativeChoice are required for alt-reality mode" },
          { status: 400 }
        )
      }

      const targetDecision = decisions.find((d) => d.id === decisionId)
      if (!targetDecision) {
        return NextResponse.json(
          { error: "Target decision not found in your history" },
          { status: 404 }
        )
      }

      systemPrompt = `You are MirrorMind's Parallel Timeline Simulator.
Your task is to analyze the user's decision history, select a past decision they made, and simulate what would have happened if they had made a different, alternative choice.
Provide a realistic simulation of the emotional, financial, relationship, and stress trajectories of this alternate reality.

You must output a raw, valid JSON object with the following fields:
1. "predictedChoice": A catchy name for this parallel timeline/pathway (e.g., "The Entrepreneurial Risk Path" or "The Stable Corporate Timeline").
2. "matchedDecision": The title of the original decision.
3. "confidence": An estimated success/satisfaction percentage for this alternate path (e.g., "65%").
4. "reasoning": A detailed narrative (3-4 sentences) describing the timeline progression. Contrast the actual outcome with the simulated path, detailing emotional shifts, stress levels, financial changes, and long-term satisfaction.

Do not wrap the JSON in markdown code blocks. Output only raw JSON.`

      userPromptText = `USER DECISION HISTORY:\n{history}\n\nTARGET DECISION TO SIMULATE ALTERNATE PATH:\nTitle: ${targetDecision.title}\nSituation: ${targetDecision.situation}\nActual Choice Made: ${targetDecision.choice}\nActual Outcome: ${targetDecision.outcome}\n\nALTERNATIVE CHOICE USER COULD HAVE MADE:\n${alternativeChoice}\n\nSimulate this alternate timeline:`
    } else if (mode === "persona") {
      if (!personaId || !query) {
        return NextResponse.json(
          { error: "personaId and query are required for persona mode" },
          { status: 400 }
        )
      }

      let personaName = ""
      let personaRule = ""

      switch (personaId) {
        case "future":
          personaName = "Your Future Self (5 Years Later)"
          personaRule =
            "You are the user's future self. Speak with wisdom, hindsight, and gentle caution. Reflect on the choices they are making now and guide them based on where their patterns will lead them."
          break
        case "past":
          personaName = "Your Past Self (5 Years Ago)"
          personaRule =
            "You are the user's past self. Speak with younger idealism, curiosity, and slight insecurity. Remind them of the core dreams, concerns, and values they held 5 years ago, and ask them reflective questions."
          break
        case "confident":
          personaName = "Your Confident Self"
          personaRule =
            "You are the user's ultimate confident, ambitious, and bold self. Highlight their strengths, push them to take high-growth risks, cut through fear, and encourage bold actions."
          break
        case "rational":
          personaName = "The Brutal Rationalist"
          personaRule =
            "You are the user's inner brutal analyst. Strip away all rationalizations, emotions, excuses, and comfortable lies. Provide unvarnished logical analysis, calling out self-sabotaging patterns directly."
          break
        case "stoic":
          personaName = "The Stoic Mentor"
          personaRule =
            "You are a Stoic mentor inspired by Marcus Aurelius and Seneca. Speak of duty, control over self, acceptance of fate, and focusing only on what is in one's power. Help the user find mental tranquility."
          break
        default:
          personaName = "Mirror Double"
          personaRule = "Provide reflective, balanced coaching."
      }

      systemPrompt = `You are MirrorMind's Identity Persona simulator.
You will assume the persona of: "${personaName}".
Rule: ${personaRule}
Analyze the user's decision history to understand their background, values, and habits, then respond directly to their query in character. Speak in the first person ("I" as the persona, "you" as the user).

You must output a raw, valid JSON object with the following fields:
1. "predictedChoice": A core advice tagline or summary of your message (e.g., "Choose temporary discomfort over permanent stagnation").
2. "matchedDecision": The title of their most relevant past decision that informs this advice.
3. "confidence": A percentage string reflecting how critical this message is for their current situation (e.g., "95%").
4. "reasoning": A detailed, character-authentic, paragraph-length response addressing the user directly.

Do not wrap the JSON in markdown code blocks. Output only raw JSON.`

      userPromptText = `USER DECISION HISTORY:\n{history}\n\nUSER'S CURRENT DILEMMA / QUERY:\n${query}\n\nRespond to me as ${personaName}:`
    } else if (mode === "why-am-i-like-this") {
      if (!question) {
        return NextResponse.json(
          { error: "question is required for why-am-i-like-this mode" },
          { status: 400 }
        )
      }

      systemPrompt = `You are MirrorMind's core Behavioral Pattern Analyzer.
The user is asking a reflective question trying to understand their own habits, failures, or recurring behaviors: "${question}".
Analyze their entire decision history, looking for subconscious loops, risk-mitigation habits, emotional dependencies, cognitive biases, or contradictions.

You must output a raw, valid JSON object with the following fields:
1. "predictedChoice": A title summarizing the primary psychological pattern or block (e.g., "Fear-Based Career Stagnation").
2. "matchedDecision": The title of the most illustrative past decision demonstrating this pattern.
3. "confidence": An estimated strength rating of this pattern in their life (e.g., "80%").
4. "reasoning": A detailed, compassionate, yet highly analytical psychological breakdown (3-4 sentences). Draw direct connections to specific past decisions from their history. Explain why they repeat this pattern (the root trigger) and give 1 actionable advice on how to break it.

Do not wrap the JSON in markdown code blocks. Output only raw JSON.`

      userPromptText = `USER DECISION HISTORY:\n{history}\n\nUSER'S QUESTION:\n${question}\n\nAnalyze my behavior and tell me why I am like this:`
    }

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["user", userPromptText],
    ])

    const chain = prompt.pipe(llm)
    const response = await chain.invoke({
      history: historyText,
    })

    const rawContent = (response.content as string).trim()
    let cleanContent = rawContent
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent.slice(7)
    }
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.slice(3)
    }
    if (cleanContent.endsWith("```")) {
      cleanContent = cleanContent.slice(0, -3)
    }
    cleanContent = cleanContent.trim()

    let result
    try {
      result = JSON.parse(cleanContent)
    } catch (parseErr) {
      console.error("Failed to parse AI output:", rawContent)
      return NextResponse.json({
        predictedChoice: "Reflecting on historical decisions",
        matchedDecision: decisions[0].title,
        basedOn: decisions.length,
        confidence: "70%",
        reasoning:
          "The reflection engine encountered a format error, but historically you favor deliberate, calculated choices.",
      })
    }

    return NextResponse.json({
      predictedChoice: result.predictedChoice,
      matchedDecision: result.matchedDecision,
      basedOn: decisions.length,
      confidence: result.confidence,
      reasoning: result.reasoning,
    })
  } catch (error: unknown) {
    console.error("Simulation route error:", error)
    return NextResponse.json({ error: "Simulation failed: " + (error instanceof Error ? error.message : String(error)) }, { status: 500 })
  }
}
