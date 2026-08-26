import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const outcome = searchParams.get("outcome")
    const search = searchParams.get("search")

    const where: any /* eslint-disable-line @typescript-eslint/no-explicit-any */ = { userId }
    if (category) where.category = category
    if (outcome) where.outcome = outcome
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { situation: { contains: search, mode: "insensitive" } },
        { choice: { contains: search, mode: "insensitive" } },
      ]
    }

    const decisions = await prisma.decision.findMany({
      where,
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(decisions)
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch decisions" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json()
    const decision = await prisma.decision.create({
      data: {
        userId,
        title: body.title,
        situation: body.situation,
        choice: body.choice,
        category: body.category || "other",
        confidence: body.confidence || 70,
        outcome: body.outcome || "pending",
        emotion: body.emotion || "Neutral",
        regretScore: body.regretScore !== undefined ? Number(body.regretScore) : 0,
        stressLevel: body.stressLevel !== undefined ? Number(body.stressLevel) : 5,
      } as any,
    })
    return NextResponse.json(decision)
  } catch (error) {
    return NextResponse.json({ error: "Failed to create decision" }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await req.json()
    const { id, outcome, regretScore, emotion, stressLevel } = body

    if (!id) {
      return NextResponse.json({ error: "Missing decision ID" }, { status: 400 })
    }

    // Verify ownership
    const existing = (await prisma.decision.findUnique({
      where: { id },
    })) as any

    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Decision not found or unauthorized" }, { status: 404 })
    }

    const updated = await prisma.decision.update({
      where: { id },
      data: {
        outcome: outcome !== undefined ? outcome : existing.outcome,
        regretScore: regretScore !== undefined ? Number(regretScore) : existing.regretScore,
        emotion: emotion !== undefined ? emotion : existing.emotion,
        stressLevel: stressLevel !== undefined ? Number(stressLevel) : existing.stressLevel,
      } as any,
    })

    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: "Failed to update decision" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json({ error: "Missing decision ID" }, { status: 400 })
    }

    if (id === "all") {
      await prisma.decision.deleteMany({
        where: { userId },
      })
      return NextResponse.json({ success: true })
    }

    // Verify ownership
    const decision = await prisma.decision.findUnique({
      where: { id },
    })

    if (!decision || decision.userId !== userId) {
      return NextResponse.json({ error: "Decision not found or unauthorized" }, { status: 404 })
    }

    await prisma.decision.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete decision" }, { status: 500 })
  }
}
