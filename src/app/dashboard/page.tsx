"use client"

import { useEffect, useState } from "react"
import {
  Plus,
  Brain,
  Sparkles,
  Activity,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Zap,
  Target,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

const catColors: Record<string, string> = {
  work: "bg-violet-900/50 text-violet-300 border-violet-500/20",
  personal: "bg-blue-900/50 text-blue-300 border-blue-500/20",
  finance: "bg-emerald-900/50 text-emerald-300 border-emerald-500/20",
  health: "bg-pink-900/50 text-pink-300 border-pink-500/20",
  other: "bg-zinc-800 text-zinc-400 border-zinc-700",
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ total: 0, avgConfidence: 0, goodOutcomes: 0 })
  const [recentDecisions, setRecentDecisions] = useState<any[]>([])
  const [latestReflection, setLatestReflection] = useState<any | null>(null)
  const [emotionalState, setEmotionalState] = useState<string>("Calm")
  const [loading, setLoading] = useState(true)
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

  useEffect(() => {
    async function fetchData() {
      try {
        // Check onboarding completion
        const compRes = await fetch("/api/companion")
        const compData = await compRes.json()
        if (compData.profile && compData.profile.onboardingStage < 6) {
          router.push("/companion")
          return
        }

        // Fetch decisions
        const decRes = await fetch("/api/decisions")
        const decData = await decRes.json()
        if (Array.isArray(decData)) {
          setRecentDecisions(decData.slice(0, 3))

          const total = decData.length
          const avgConfidence = total
            ? Math.round(decData.reduce((acc: number, d: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => acc + d.confidence, 0) / total)
            : 0
          const goodOutcomes = decData.filter((d: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => d.outcome === "good").length

          setStats({ total, avgConfidence, goodOutcomes })
        }

        // Fetch reflections
        const refRes = await fetch("/api/reflections")
        const refData = await refRes.json()
        if (Array.isArray(refData) && refData.length > 0) {
          setLatestReflection(refData[0])
        }

        // Fetch latest emotional state from companion GET endpoint
        if (compData.episodicMemories && compData.episodicMemories.length > 0) {
          // Fallback to latest episodic memory emotion or default
          const lastMemory = compData.episodicMemories[0]
          if (lastMemory.emotion) {
            setEmotionalState(lastMemory.emotion)
          }
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [router])

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex flex-col min-h-screen bg-[#080810] items-center justify-center text-zinc-500 text-xs">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin mb-3" />
        Authenticating...
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#080810] text-white">
      <div className="flex-1 px-5 pt-10 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-zinc-500 text-xs font-medium mb-0.5 flex items-center gap-1.5">
              <span>Current Emotional Reflection:</span>
              <span className="text-violet-400 font-bold bg-violet-950/30 px-2 py-0.5 rounded-full capitalize text-[10px] border border-violet-800/20">
                {emotionalState}
              </span>
            </p>
            <h1 className="text-xl font-bold text-white mt-1">
              {session?.user?.name || "Explorer"} 👋
            </h1>
          </div>
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold shadow-lg shadow-violet-950/60">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "EX"}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#13131e] border border-white/6 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-16 h-16 bg-gradient-to-br from-violet-600/5 to-transparent blur-lg pointer-events-none" />
            <p className="text-zinc-500 text-xs mb-1">Decisions Map</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
            <p className="text-violet-400 text-[10px] font-medium mt-1 flex items-center gap-1">
              <TrendingUp size={10} /> Continuous Sync
            </p>
          </div>
          <div className="bg-[#13131e] border border-white/6 rounded-2xl p-4 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 w-16 h-16 bg-gradient-to-br from-emerald-600/5 to-transparent blur-lg pointer-events-none" />
            <p className="text-zinc-500 text-xs mb-1">Avg Confidence</p>
            <p className="text-3xl font-bold text-white">
              {stats.avgConfidence}
              <span className="text-base text-zinc-500">%</span>
            </p>
            <p className="text-emerald-400 text-[10px] font-medium mt-1 flex items-center gap-1">
              <Zap size={10} /> Choice Alignment
            </p>
          </div>
        </div>

        {/* AI Reflection Widget */}
        {latestReflection ? (
          <div className="bg-gradient-to-br from-[#16162a] to-[#0e0e1a] border border-violet-900/30 rounded-2xl p-5 mb-6 relative overflow-hidden group shadow-xl">
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-violet-600/10 to-transparent blur-2xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Sparkles size={12} className="animate-pulse" />
              </div>
              <h3 className="text-xs font-bold text-violet-300 uppercase tracking-widest">
                Active Behavioral Audit
              </h3>
              <span className="ml-auto text-[9px] text-zinc-500">
                {new Date(latestReflection.createdAt).toLocaleDateString()}
              </span>
            </div>

            <h4 className="text-sm font-semibold text-white leading-normal mb-2">
              {latestReflection.title}
            </h4>

            <p className="text-zinc-300 text-xs leading-relaxed mb-4 font-medium italic">
              &ldquo;{latestReflection.summary}&rdquo;
            </p>

            <div className="space-y-2 border-t border-white/5 pt-3.5">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">
                  Actionable Insight
                </span>
                <div className="flex items-start gap-2 bg-[#0a0a14] border border-white/4 p-2.5 rounded-xl text-[11px] text-zinc-200">
                  <Target size={12} className="text-violet-400 mt-0.5 shrink-0" />
                  <span>
                    {latestReflection.insights[0] ||
                      "Continue tracking choices to isolate cognitive growth levers."}
                  </span>
                </div>
              </div>

              {latestReflection.loops?.length > 0 && (
                <div className="pt-1">
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">
                    Recognized Loop
                  </span>
                  <div className="flex items-center gap-2 text-[10px] text-rose-400 bg-rose-950/20 border border-rose-900/30 p-2 rounded-xl">
                    <AlertTriangle size={11} className="shrink-0" />
                    <span className="font-semibold">{latestReflection.loops[0]}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <Link href="/companion">
            <button className="w-full bg-gradient-to-r from-violet-700/20 to-purple-800/20 hover:from-violet-700/30 hover:to-purple-800/30 rounded-2xl p-5 mb-6 text-left border border-violet-500/20 shadow-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-600/10 to-transparent blur-xl pointer-events-none" />
              <p className="text-violet-300 text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Brain size={12} /> Sync Double Insight
              </p>
              <p className="text-white font-bold text-sm">MirrorMind Awaiting Reflection...</p>
              <p className="text-zinc-400 text-xs mt-1 leading-normal">
                Chat with your double inside the Companion tab to build your cognitive profile and
                trigger automatic reports.
              </p>
            </button>
          </Link>
        )}

        {/* Quick Simulator CTA */}
        <Link href="/simulate">
          <div className="bg-[#13131e] border border-white/6 hover:border-violet-800/40 rounded-2xl p-4.5 mb-6 flex justify-between items-center transition-all group">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                <Brain size={14} className="text-violet-400" /> AI Identity Simulation
              </h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                Test future timelines or consult your stopper/Stoic self
              </p>
            </div>
            <div className="w-8 h-8 rounded-xl bg-violet-900/10 border border-violet-800/20 flex items-center justify-center text-violet-400 group-hover:bg-violet-600 group-hover:text-white transition-all">
              <ArrowUpRight size={16} />
            </div>
          </div>
        </Link>

        {/* Recent */}
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-white font-bold text-sm">Recent Decisions</h2>
          <Link href="/decisions" className="text-violet-400 text-xs font-semibold hover:underline">
            See all
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-white/4 animate-pulse" />
            ))
          ) : recentDecisions.length > 0 ? (
            recentDecisions.map((d) => (
              <Link href={`/decisions?id=${d.id}`} key={d.id}>
                <div className="bg-[#13131e] border border-white/6 rounded-2xl p-4 text-left w-full hover:border-violet-800/40 transition-all shadow-md">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white text-xs font-bold leading-snug flex-1">{d.title}</p>
                    <span
                      className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${catColors[d.category] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                    >
                      {d.category}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-[10px] font-medium mt-1.5 line-clamp-1 italic">
                    {d.choice}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex-1 h-1 bg-white/6 rounded-full overflow-hidden mr-3">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${d.confidence}%` }}
                      />
                    </div>
                    <span className="text-zinc-500 text-[10px] font-mono font-bold">
                      {d.confidence}% confidence
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-10 bg-white/4 rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3">
              <p className="text-zinc-500 text-xs font-medium">No decisions logged yet</p>
              <Link href="/add">
                <button className="bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-violet-950/40">
                  Log Your First Decision
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* FAB */}
      <Link href="/add">
        <button className="fixed bottom-24 right-8 w-14 h-14 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center shadow-xl shadow-violet-900/50 transition-colors z-30 cursor-pointer">
          <Plus size={24} color="white" strokeWidth={3} />
        </button>
      </Link>
    </div>
  )
}
