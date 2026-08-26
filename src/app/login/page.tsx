"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast.error("Invalid email or password")
      } else {
        toast.success("Welcome back!")
        window.location.href = "/dashboard"
      }
    } catch (error) {
      toast.error("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#080810] px-6 pt-20">
      <div className="mb-10 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#13131e] border border-violet-500/20 flex items-center justify-center shadow-xl shadow-violet-900/30 mx-auto mb-6 p-1.5 overflow-hidden">
          <Image
            src="/logo.png"
            alt="MirrorMind Logo"
            width={64}
            height={64}
            className="object-contain w-full h-full rounded-xl"
          />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
        <p className="text-zinc-500 text-sm">Sign in to your MirrorMind account</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
        <div>
          <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#13131e] border border-white/8 rounded-xl text-white text-sm px-4 py-3.5 outline-none focus:border-violet-600 transition-colors placeholder:text-zinc-700"
            placeholder="you@example.com"
          />
        </div>
        <div className="relative">
          <label className="text-xs text-zinc-500 font-medium mb-1.5 block">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#13131e] border border-white/8 rounded-xl text-white text-sm px-4 py-3.5 pr-12 outline-none focus:border-violet-600 transition-colors"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 bottom-3.5 text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="text-right">
          <button type="button" className="text-violet-400 text-xs font-medium">
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:text-zinc-400 text-white font-semibold py-4 rounded-2xl text-sm transition-colors mt-4 shadow-lg shadow-violet-900/40"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>


      <p className="text-zinc-600 text-xs text-center mb-10">
        Don't have an account?{" "}
        <Link href="/signup" className="text-violet-400 font-medium hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
