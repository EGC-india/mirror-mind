import { prisma } from "@/lib/prisma"
import { ChatAnthropic } from "@langchain/anthropic"
import { EMOTION_ANALYSIS_PROMPT } from "@/prompts/emotion"

export class EmotionService {
  private static _llm: ChatAnthropic | null = null;
  private static get llm() {
    if (!this._llm) {
      this._llm = new ChatAnthropic({
        anthropicApiKey: process.env.AI_API_KEY || "dummy_key_for_build",
        modelName: process.env.AI_MODEL || "claude-3-5-sonnet-20241022",
        temperature: 0.1,
      });
    }
    return this._llm;
  }

  /**
   * Analyzes a user message, extracts emotional characteristics, and persists the data.
   */
  static async analyzeAndSave(userId: string, message: string, messageId?: string) {
    try {
      const prompt = EMOTION_ANALYSIS_PROMPT.replace("{message}", message)

      const response = await this.llm.invoke(prompt)
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

      const data = JSON.parse(cleanContent)

      // Save to database
      const analysis = await prisma.emotionAnalysis.create({
        data: {
          userId,
          messageId,
          dominantEmotion: data.dominantEmotion || "Neutral",
          intensity: data.intensity !== undefined ? Number(data.intensity) : 0.5,
          confidence: data.confidence !== undefined ? Number(data.confidence) : 0.8,
          sentiment: data.sentiment || "neutral",
          avoidance: !!data.avoidance,
          overthinking: !!data.overthinking,
        },
      })

      return analysis
    } catch (error) {
      console.error("Failed to analyze user emotion:", error)

      // Fallback save in case of AI parsing failure
      return await prisma.emotionAnalysis.create({
        data: {
          userId,
          messageId,
          dominantEmotion: "Neutral",
          intensity: 0.5,
          confidence: 0.5,
          sentiment: "neutral",
          avoidance: false,
          overthinking: false,
        },
      })
    }
  }

  /**
   * Retrieves the user's latest emotional logs.
   */
  static async getLatestLogs(userId: string, limit = 10) {
    return await prisma.emotionAnalysis.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
  }
}
