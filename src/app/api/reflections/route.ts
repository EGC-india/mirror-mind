import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { ReflectionService } from "@/lib/services/reflectionService"

export const dynamic = "force-dynamic"

// GET: Fetch user's history of reflection reports
export async function GET() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const reports = await ReflectionService.getHistory(userId, 5)
    return NextResponse.json(reports)
  } catch (error) {
    console.error("GET reflections error:", error)
    return NextResponse.json({ error: "Failed to load reflection history" }, { status: 500 })
  }
}

// POST: Trigger compilation of a new ReflectionReport
export async function POST() {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const report = await ReflectionService.generateReport(userId)
    if (!report) {
      return NextResponse.json(
        { error: "Failed to generate reflection report (insufficient context or AI error)" },
        { status: 500 }
      )
    }

    return NextResponse.json(report)
  } catch (error) {
    console.error("POST reflections error:", error)
    return NextResponse.json({ error: "Failed to compile reflection report" }, { status: 500 })
  }
}
