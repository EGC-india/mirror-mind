import { prisma } from "@/lib/prisma"
import { ChatAnthropic } from "@langchain/anthropic"
import { MEMORY_CLASSIFICATION_PROMPT } from "@/prompts/memory"

export class MemoryService {
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
   * Classifies user message for memory importance and conditionally persists to long-term memory.
   */
  static async evaluateAndSaveMemory(userId: string, message: string, dominantEmotion = "Neutral") {
    try {
      const prompt = MEMORY_CLASSIFICATION_PROMPT.replace("{message}", message)

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

      // Persistence only above or equal to threshold (>= 6)
      if (data.isImportant && data.importanceScore >= 6) {
        const memory = await prisma.episodicMemory.create({
          data: {
            userId,
            event: data.summary || message,
            importance: data.importanceScore || 6,
            emotion: data.emotion || dominantEmotion,
            timestamp: new Date(),
          },
        })
        return { saved: true, memory, data }
      }

      return { saved: false, data }
    } catch (error) {
      console.error("Failed to classify and save memory:", error)
      return { saved: false, error }
    }
  }

  /**
   * Retrieves user's historic profile memory or creates a default one.
   */
  static async getOrCreateProfile(userId: string) {
    let profile = await prisma.profileMemory.findUnique({
      where: { userId },
    })

    if (!profile) {
      profile = await prisma.profileMemory.create({
        data: {
          userId,
          onboardingStage: 1,
        },
      })
    }

    return profile
  }

  /**
   * Gets episodic memories for a user.
   */
  static async getEpisodicMemories(userId: string, limit = 15) {
    return await prisma.episodicMemory.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: limit,
    })
  }
}
