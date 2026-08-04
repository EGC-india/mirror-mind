import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ hasPassword: !!user.password })
  } catch (error) {
    return NextResponse.json({ error: "Failed to verify account type" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = (session.user as any).id
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Look up the current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // If the user has a password set (credentials account), require and verify it
    if (user.password) {
      let body: any
      try {
        body = await req.json()
      } catch (error) {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
      }

      const { password } = body

      if (!password) {
        return NextResponse.json({ error: "Password is required" }, { status: 400 })
      }

      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 403 })
      }
    }

    // Delete the User row via Prisma
    await prisma.user.delete({
      where: { id: userId },
    })

    return NextResponse.json({ success: true, message: "Account successfully deleted" })
  } catch (error) {
    // Hide details of the error and return a generic message
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 })
  }
}
