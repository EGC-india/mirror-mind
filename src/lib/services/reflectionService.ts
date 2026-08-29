import { prisma } from "@/lib/prisma"
import { ChatAnthropic } from "@langchain/anthropic"
import { REFLECTION_ENGINE_PROMPT } from "@/prompts/reflection"

export class ReflectionService {
  private static _llm: ChatAnthropic | null = null;
  private static get llm() {
    if (!this._llm) {
      this._llm = new ChatAnthropic({
        anthropicApiKey: process.env.AI_API_KEY || "dummy_key_for_build",
        modelName: process.env.AI_MODEL || "claude-haiku-4-5",
      });
    }
    return this._llm;
  }

  /**
   * Generates a new deep behavioral ReflectionReport for the user.
   */
  static async generateReport(userId: string) {
    try {
      // 1. Fetch Profile Memory
      const profile = await prisma.profileMemory.findUnique({
        where: { userId },
      })
      if (!profile) return null

      // 2. Fetch recent Decisions (up to 10)
      const decisions = await prisma.decision.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      })

      // 3. Fetch recent Emotion Analyses (up to 20)
      const emotions = await prisma.emotionAnalysis.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
      })

      // 4. Fetch recent Companion Messages (up to 15)
      const historyMessages = await prisma.companionMessage.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 15,
      })

      // Reverse messages to order chronologically
      const history = [...historyMessages].reverse()

      // 5. Format contexts for prompt replacement
      const goalsText = profile.goals?.join(", ") || "None"
      const traitsText = profile.traits?.join(", ") || "None"
      const fearsText = profile.fears?.join(", ") || "None"
      const overthinkText = profile.overthinkItems?.join(", ") || "None"

      const decisionsText =
        decisions
          .map(
            (d, i) =>
              `[${i + 1}] Title: "${d.title}" | Category: ${d.category} | Situation: "${d.situation}" | Choice: "${d.choice}" | Outcome: "${d.outcome}" | Regret: ${d.regretScore}/10 | Stress: ${d.stressLevel}/10`
          )
          .join("\n") || "No recent decisions logged."

      const emotionsText =
        emotions
          .map(
            (e) =>
              `- Emotion: "${e.dominantEmotion}" | Intensity: ${(e.intensity * 100).toFixed(0)}% | Sentiment: "${e.sentiment}" | Avoidance: ${e.avoidance} | Overthinking: ${e.overthinking}`
          )
          .join("\n") || "No emotion analytics compiled yet."

      const historyText =
        history
          .map((m) => `${m.role === "user" ? "User" : "MirrorMind"}: ${m.content.slice(0, 150)}...`)
          .join("\n") || "No conversation history logged."

      // 6. Formulate system prompt
      const prompt = REFLECTION_ENGINE_PROMPT.replace(
        "{preferredName}",
        profile.preferredName || profile.name || "Explorer"
      )
        .replace("{career}", `${profile.designation || "Seeker"} at ${profile.company || "Self"}`)
        .replace("{goals}", goalsText)
        .replace("{traits}", traitsText)
        .replace("{fears}", fearsText)
        .replace("{overthinkItems}", overthinkText)
        .replace("{decisions}", decisionsText)
        .replace("{emotions}", emotionsText)
        .replace("{history}", historyText)

      // 7. Invoke Claude
      const response = await this.llm.invoke(prompt)
      const content = response.content;
      const rawContent = (typeof content === 'string' ? content : (Array.isArray(content) ? content.map((c: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => c.type === 'text' ? c.text : '').join('') : '')).trim()

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

      const data = JSON.parse(cleanContent)

      // 8. Save ReflectionReport to Database
      const report = await prisma.reflectionReport.create({
        data: {
          userId,
          title: data.title || "Behavioral Alignment Summary",
          summary: data.summary || "Reflecting on your decisions and cognitive triggers...",
          fears: data.fears || [],
          loops: data.loops || [],
          avoidanceTrend: data.avoidanceTrend || "",
          confidenceTrend: data.confidenceTrend || "",
          insights: data.insights || [],
        },
      })

      // 9. Update ProfileMemory traits/fears uniquely if new elements were discovered
      const updatedFears = Array.from(new Set([...(profile.fears || []), ...(data.fears || [])]))
      await prisma.profileMemory.update({
        where: { userId },
        data: {
          fears: updatedFears,
        },
      })

      return report
    } catch (error) {
      console.error("Failed to generate reflection report:", error)
      return null
    }
  }

  /**
   * Retrieves user reflection history.
   */
  static async getHistory(userId: string, limit = 5) {
    return await prisma.reflectionReport.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  }
}
