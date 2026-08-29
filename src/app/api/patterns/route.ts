import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { ChatAnthropic } from "@langchain/anthropic"
import { ChatPromptTemplate } from "@langchain/core/prompts"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    // Fetch decisions of this user
    const decisions = await prisma.decision.findMany({
      where: { userId },
    })

    if (!decisions.length) {
      return NextResponse.json({
        hasData: false,
        riskStyle: "Analyzing...",
        riskDesc:
          "Add a few decisions first to unlock personalized risk and decision style insights.",
        decisionSpeed: "Analyzing...",
        decisionSpeedValue: 1,
        speedDesc: "Reflection speed insights will update once you have logged multiple decisions.",
        trustVsLogic: 50,
        trustVsLogicText: "Intuition vs. Logic (50% / 50%)",
        behavioralPatterns: [],
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

    const systemPrompt = `You are MirrorMind's core behavioral profiling engine. 
Your task is to analyze the user's decision history and compile a structured cognitive, emotional, and risk profile.
Analyze their choices, categories, confidence levels, emotions at the time, stress levels, outcomes, and regret scores to uncover subconscious habits.

You must output a raw, valid JSON object with the following fields:
1. "riskStyle": A title for their risk profile (e.g. "Calculated Risk-Taker", "Safety-Oriented Planner", "Intuitive Pioneer").
2. "riskDesc": A 1-2 sentence description explaining this style based on their choice outcomes and confidence levels.
3. "decisionSpeed": A word describing their deliberation consistency (e.g. "Consistent", "Deliberate", "Dynamic", "Impulsive").
4. "decisionSpeedValue": An integer from 1 to 5 representing how cautious/deliberate they are (1 = very fast/impulsive, 5 = extremely deliberate/cautious).
5. "speedDesc": A 1-sentence explanation of their decision speed/thought process.
6. "trustVsLogic": An integer from 0 to 100 representing how logically-driven they are (0 = purely intuitive/feel-based, 100 = purely logical/analytical).
7. "trustVsLogicText": A brief tagline describing this balance (e.g., "Logically Leaning (65%)", "Highly Intuitive (30%)", "Perfect Balance (50%)").
8. "behavioralPatterns": A list of 2 or 3 objects, each having:
   - "title": A short title of the pattern (e.g. "Financial Risk Avoidance").
   - "desc": A description (1-2 sentences) of what the pattern is and why they exhibit it.
   - "impact": A recommendation or piece of advice (1 sentence) for balancing this habit.
9. "shadowPatterns": A list of 2 objects representing hidden psychological contradictions detected in their history (e.g., stated desire vs. actual choice patterns). Each object has:
   - "title": A short title (e.g. "The Growth vs. Comfort Loop").
   - "desc": A description of the contradiction (e.g., "You state in work decisions that you seek growth, yet repeatedly choose the path with lowest immediate uncertainty").
   - "suggestion": A recommendation on how to break this loop.
10. "cognitiveBiases": A list of 2 objects representing cognitive biases they exhibit based on outcomes/confidence (e.g., Confirmation Bias, Loss Aversion, Sunk Cost Fallacy). Each object has:
   - "title": Name of the bias.
   - "desc": How it manifests in their logged decisions.
   - "advice": Mindset shift advice to counter this bias.
11. "emotionalInsights": A list of 2 detailed correlation points between emotions/stress and outcomes (e.g., "Your regret score is 45% higher in decisions made when feeling Stressed compared to when feeling Calm").

Do not wrap the JSON in markdown code blocks like \`\`\`json. Output only the raw JSON.`

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],
      ["user", "USER DECISION HISTORY:\n{history}\n\nAnalyze my behavioral profile:"],
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
      console.error("Failed to parse AI output for patterns:", rawContent)
      return NextResponse.json({
        hasData: true,
        riskStyle: "Balanced Explorer",
        riskDesc: "You tend to weigh options carefully but aren't afraid to take calculated risks.",
        decisionSpeed: "Consistent",
        decisionSpeedValue: 3,
        speedDesc: "Your average reflection time is stable and balanced.",
        trustVsLogic: 60,
        trustVsLogicText: "Logically Leaning (60%)",
        behavioralPatterns: [],
        shadowPatterns: [],
        cognitiveBiases: [],
        emotionalInsights: [],
      })
    }

    return NextResponse.json({
      hasData: true,
      riskStyle: result.riskStyle,
      riskDesc: result.riskDesc,
      decisionSpeed: result.decisionSpeed,
      decisionSpeedValue: result.decisionSpeedValue,
      speedDesc: result.speedDesc,
      trustVsLogic: result.trustVsLogic,
      trustVsLogicText: result.trustVsLogicText,
      behavioralPatterns: result.behavioralPatterns || [],
      shadowPatterns: result.shadowPatterns || [],
      cognitiveBiases: result.cognitiveBiases || [],
      emotionalInsights: result.emotionalInsights || [],
    })
  } catch (error: unknown) {
    console.error("Patterns API error:", error)
    return NextResponse.json(
      { error: "Failed to compile patterns: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    )
  }
}
