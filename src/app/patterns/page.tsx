"use client"

import { useEffect, useState } from "react"
import {
  Brain,
  AlertCircle,
  Sparkles,
  Activity,
  History,
  Heart,
  ChevronRight,
  ShieldAlert,
  Zap,
  Frown,
  Compass,
  ThumbsUp,
  RefreshCw,
  Target,
  ArrowRight,
  Shield,
  AlertTriangle,
} from "lucide-react"
import Link from "next/link"

const catColors: Record<string, string> = {
  work: "bg-violet-900/50 text-violet-300 border-violet-500/25",
  finance: "bg-emerald-900/50 text-emerald-300 border-emerald-500/25",
  lifestyle: "bg-blue-900/50 text-blue-300 border-blue-500/25",
  health: "bg-pink-900/50 text-pink-300 border-pink-500/25",
  relationships: "bg-red-900/50 text-red-300 border-red-500/25",
  other: "bg-zinc-800 text-zinc-400 border-zinc-700",
}

export default function PatternsPage() {
  const [decisions, setDecisions] = useState<any[]>([])
  const [reflections, setReflections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("profile") // "profile" | "shadows" | "timeline" | "emotions"

  useEffect(() => {
    async function fetchData() {
      try {
        const [decisionsRes, reflectionsRes] = await Promise.all([
          fetch("/api/decisions"),
          fetch("/api/reflections"),
        ])
        const [decisionsData, refData] = await Promise.all([
          decisionsRes.json(),
          reflectionsRes.json(),
        ])
        if (Array.isArray(decisionsData)) {
          setDecisions(decisionsData)
        }
        if (Array.isArray(refData)) {
          setReflections(refData)
        }
      } catch (error) {
        console.error("Failed to fetch patterns data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleGenerateReflection = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/reflections", { method: "POST" })
      const data = await res.json()
      if (data && !data.error) {
        setReflections((prev) => [data, ...prev])
      } else {
        alert(data.error || "Failed to generate reflection report")
      }
    } catch (error) {
      console.error("Error generating reflection:", error)
      alert("An unexpected error occurred while compiling your reflection report.")
    } finally {
      setGenerating(false)
    }
  }

  // Derived Statistics for Profiles/Analytics
  const total = decisions.length

  const catStats = decisions.reduce((acc: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, d: any) => {
    acc[d.category] = (acc[d.category] || 0) + 1
    return acc
  }, {})

  const maxCatCount = Math.max(...(Object.values(catStats) as number[]), 1)

  // Stress stats
  const goodDecisions = decisions.filter((d) => d.outcome === "good")
  const badDecisions = decisions.filter((d) => d.outcome === "bad")

  const avgGoodStress = goodDecisions.length
    ? (
        goodDecisions.reduce((sum, d) => sum + (d.stressLevel || 5), 0) / goodDecisions.length
      ).toFixed(1)
    : "5.0"
  const avgBadStress = badDecisions.length
    ? (
        badDecisions.reduce((sum, d) => sum + (d.stressLevel || 5), 0) / badDecisions.length
      ).toFixed(1)
    : "5.0"

  // Regret stats
  const catRegretStats = decisions.reduce((acc: any /* eslint-disable-line @typescript-eslint/no-explicit-any */, d: any) => {
    if (d.outcome !== "pending" && d.regretScore !== undefined) {
      if (!acc[d.category]) acc[d.category] = { sum: 0, count: 0 }
      acc[d.category].sum += d.regretScore
      acc[d.category].count += 1
    }
    return acc
  }, {})

  const latestReflection = reflections[0] || null

  return (
    <div className="flex flex-col min-h-screen bg-[#080810] text-white">
      <div className="px-5 pt-10 pb-24">
        <h1 className="text-xl font-bold text-white mb-1">Patterns</h1>
        <p className="text-zinc-500 text-xs mb-5">
          Deep behavioral diagnostics based on {total} decision logs and {reflections.length}{" "}
          reflection audits
        </p>

        {/* Tab Selection */}
        <div className="flex bg-[#13131e] border border-white/6 p-1 rounded-2xl mb-6 select-none overflow-x-auto whitespace-nowrap scrollbar-none gap-1">
          {[
            { id: "profile", label: "Profile", icon: Brain },
            { id: "shadows", label: "Contradictions", icon: ShieldAlert },
            { id: "timeline", label: "Decision Map", icon: History },
            { id: "emotions", label: "Emotional Health", icon: Heart },
          ].map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === t.id
                    ? "bg-violet-600 text-white shadow-md shadow-violet-950/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/3"
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-2xl bg-white/3 animate-pulse border border-white/4 flex items-center justify-center text-zinc-600 text-xs"
              >
                Syncing behavioral memory...
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4 pb-20">
            {/* GENERATING OVERLAY CARD */}
            {generating && (
              <div className="bg-[#13131e] border border-violet-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 shadow-xl">
                <RefreshCw size={24} className="text-violet-400 animate-spin" />
                <p className="text-white font-bold text-sm">Compiling Behavioral Reflection...</p>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-[280px]">
                  MirrorMind is auditing your choice structures, emotional spikes, and repeating
                  loops. This will take a moment.
                </p>
              </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === "profile" && (
              <>
                {/* Active Reflection Report */}
                {latestReflection ? (
                  <>
                    <div className="bg-gradient-to-br from-[#16162a] to-[#0e0e1a] border border-violet-900/30 rounded-2xl p-5 mb-1 relative overflow-hidden group shadow-xl">
                      <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-violet-600/10 to-transparent blur-2xl pointer-events-none" />
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-lg bg-violet-600/15 border border-violet-500/20 flex items-center justify-center text-violet-400">
                          <Sparkles size={12} className="animate-pulse" />
                        </div>
                        <h3 className="text-xs font-bold text-violet-300 uppercase tracking-widest">
                          Active Reflection
                        </h3>
                        <span className="ml-auto text-[9px] text-zinc-500">
                          {new Date(latestReflection.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-white leading-normal mb-2">
                        {latestReflection.title}
                      </h4>

                      <p className="text-zinc-300 text-xs leading-relaxed font-medium italic">
                        &ldquo;{latestReflection.summary}&rdquo;
                      </p>
                    </div>

                    {/* Actionable Insights */}
                    <div className="bg-[#13131e] border border-white/6 rounded-2xl p-4">
                      <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3 border-b border-white/6 pb-2">
                        Cognitive Insights & Growth Levers
                      </p>
                      <div className="flex flex-col gap-3">
                        {latestReflection.insights?.map((insight: string, idx: number) => (
                          <div
                            key={idx}
                            className="flex gap-2.5 items-start p-2.5 rounded-xl bg-[#0a0a14] border border-white/4"
                          >
                            <Target className="text-violet-400 mt-0.5 shrink-0" size={13} />
                            <p className="text-zinc-300 text-xs leading-relaxed">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Detected Fears & Anchors */}
                    {latestReflection.fears?.length > 0 && (
                      <div className="bg-[#13131e] border border-white/6 rounded-2xl p-4">
                        <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-3">
                          Identified Anchors & Fears
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {latestReflection.fears.map((fear: string, idx: number) => (
                            <div
                              key={idx}
                              className="bg-rose-950/20 text-rose-300 border border-rose-900/30 px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-semibold shadow-sm"
                            >
                              <Shield size={12} className="text-rose-400 shrink-0" />
                              <span>{fear}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-[#13131e] border border-white/6 rounded-2xl p-6 text-center flex flex-col items-center gap-4">
                    <Brain className="text-violet-400 animate-pulse" size={28} />
                    <div>
                      <p className="text-white font-bold text-sm">Awaiting Reflection Report</p>
                      <p className="text-zinc-500 text-xs leading-relaxed max-w-[260px] mt-1.5">
                        Log choices and discuss with your Double to let the Reflection Engine build
                        your profile.
                      </p>
                    </div>
                    <button
                      onClick={handleGenerateReflection}
                      disabled={generating || total === 0}
                      className="bg-violet-600 hover:bg-violet-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-violet-950/30"
                    >
                      {generating
                        ? "Auditing Profile..."
                        : total === 0
                          ? "Log Decisions First"
                          : "Initialize Cognitive Audit"}
                    </button>
                  </div>
                )}

                {/* Category breakdown (Live from local decisions) */}
                <div className="bg-[#13131e] border border-white/6 rounded-2xl p-4">
                  <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-4">
                    Decisions by Category
                  </p>
                  <div className="flex flex-col gap-3">
                    {Object.entries(catStats).map(([name, count]: [string, any]) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="text-zinc-400 text-xs w-20 capitalize font-medium">
                          {name}
                        </span>
                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-violet-500 rounded-full transition-all"
                            style={{ width: `${Math.round((count / maxCatCount) * 100)}%` }}
                          />
                        </div>
                        <span className="text-zinc-500 text-xs w-4 text-right font-mono font-bold">
                          {count}
                        </span>
                      </div>
                    ))}
                    {total === 0 && (
                      <p className="text-zinc-600 text-xs italic text-center py-2">
                        No category logs yet.
                      </p>
                    )}
                  </div>
                </div>

                {/* Re-run button when reflection is present */}
                {latestReflection && !generating && (
                  <button
                    onClick={handleGenerateReflection}
                    className="w-full flex items-center justify-center gap-2 border border-white/8 hover:border-violet-600/30 bg-[#13131e] hover:bg-[#151525] text-zinc-300 hover:text-white font-bold py-3 rounded-2xl text-xs transition-all cursor-pointer shadow-md"
                  >
                    <RefreshCw size={13} />
                    <span>Run Reflection Engine</span>
                  </button>
                )}
              </>
            )}

            {/* CONTRADICTIONS & BIASES TAB */}
            {activeTab === "shadows" && (
              <>
                {latestReflection ? (
                  <>
                    {/* Shadow Patterns (Loops) */}
                    <div className="flex flex-col gap-3">
                      <div className="mb-2">
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <ShieldAlert size={16} className="text-rose-400 animate-pulse" />
                          Emotional Loops
                        </h3>
                        <p className="text-zinc-500 text-[10px] mt-0.5">
                          Detected cycles of reactive states that drive subconscious behaviors.
                        </p>
                      </div>

                      {latestReflection.loops?.length > 0 ? (
                        latestReflection.loops.map((loop: string, idx: number) => {
                          const steps = loop.split(/→|->|=>/).map((s) => s.trim())
                          return (
                            <div
                              key={idx}
                              className="bg-[#13131e] border border-violet-900/30 rounded-2xl p-4 shadow-[0_0_15px_rgba(139,92,246,0.02)]"
                            >
                              <h4 className="text-white font-bold text-xs mb-3 flex items-center gap-1.5">
                                <AlertTriangle size={13} className="text-rose-400" />
                                Loop Pattern #{idx + 1}
                              </h4>

                              {/* Step Flow */}
                              <div className="flex flex-wrap items-center gap-2 mb-3 bg-[#0a0a14] border border-white/4 p-3 rounded-xl">
                                {steps.map((step, sIdx) => (
                                  <div key={sIdx} className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-violet-950/30 text-violet-300 border border-violet-800/30 px-2.5 py-1 rounded-lg text-[10px] font-semibold">
                                      {step}
                                    </span>
                                    {sIdx < steps.length - 1 && (
                                      <ArrowRight
                                        size={12}
                                        className="text-zinc-600 animate-pulse shrink-0"
                                      />
                                    )}
                                  </div>
                                ))}
                              </div>
                              <p className="text-zinc-400 text-xs leading-relaxed italic">
                                &ldquo;Observe how these states trigger sequentially and stall
                                progression.&rdquo;
                              </p>
                            </div>
                          )
                        })
                      ) : (
                        <div className="bg-[#13131e] border border-white/6 rounded-2xl p-6 text-center text-zinc-500 text-xs">
                          No distinct emotional loops identified in the active reflection.
                        </div>
                      )}
                    </div>

                    {/* Avoidance Manifestations */}
                    {latestReflection.avoidanceTrend && (
                      <div className="flex flex-col gap-3 mt-4">
                        <div className="mb-1">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <ShieldAlert size={16} className="text-violet-400" />
                            Avoidance Profile
                          </h3>
                        </div>
                        <div className="bg-[#13131e] border border-violet-900/30 rounded-2xl p-4 shadow-sm">
                          <p className="text-zinc-300 text-xs leading-relaxed">
                            {latestReflection.avoidanceTrend}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Confidence fluctuation */}
                    {latestReflection.confidenceTrend && (
                      <div className="flex flex-col gap-3 mt-4">
                        <div className="mb-1">
                          <h3 className="text-sm font-bold text-white flex items-center gap-2">
                            <Activity size={16} className="text-blue-400" />
                            Confidence & Stress Stability
                          </h3>
                        </div>
                        <div className="bg-[#13131e] border border-violet-900/30 rounded-2xl p-4 shadow-sm">
                          <p className="text-zinc-300 text-xs leading-relaxed">
                            {latestReflection.confidenceTrend}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-[#13131e] border border-white/6 rounded-2xl p-8 text-center text-zinc-500 text-xs">
                    Please compile your first active reflection to isolate behavioral shadows and
                    avoidance trends.
                  </div>
                )}
              </>
            )}

            {/* DECISION TIMELINE MAP TAB */}
            {activeTab === "timeline" && (
              <div className="flex flex-col gap-1.5">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <History size={16} className="text-violet-400" />
                    Life Decision Timeline Map
                  </h3>
                  <p className="text-zinc-500 text-[10px] mt-0.5">
                    A visual chronological journey of logged choices and outcome values.
                  </p>
                </div>

                {decisions.length > 0 ? (
                  <div className="relative border-l border-white/10 pl-5 ml-2.5 flex flex-col gap-4 py-2">
                    {decisions.map((d) => (
                      <div key={d.id} className="relative">
                        {/* Node marker */}
                        <div
                          className={`absolute -left-[27.5px] top-1.5 w-4 h-4 rounded-full border-2 border-[#080810] ${
                            d.outcome === "good"
                              ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                              : d.outcome === "bad"
                                ? "bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                                : "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                          }`}
                        />

                        {/* Interactive Entry Card */}
                        <Link href={`/decisions?id=${d.id}`}>
                          <div className="bg-[#13131e] border border-white/6 hover:border-violet-600/30 p-4 rounded-2xl transition-all flex justify-between items-start gap-4 hover:bg-[#151523]">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="text-[9px] text-zinc-500 font-mono font-semibold">
                                  {new Date(d.createdAt).toLocaleDateString()}
                                </span>
                                <span
                                  className={`text-[8px] font-bold px-2 py-0.5 rounded-full capitalize border shrink-0 ${catColors[d.category] || "bg-zinc-800 text-zinc-400 border-zinc-700"}`}
                                >
                                  {d.category}
                                </span>
                              </div>
                              <h3 className="text-white text-xs font-bold leading-snug mb-1">
                                {d.title}
                              </h3>
                              <p className="text-zinc-400 text-[10px] font-medium leading-relaxed truncate max-w-[220px]">
                                Choice: {d.choice}
                              </p>
                              {d.outcome !== "pending" && d.regretScore !== undefined && (
                                <p className="text-zinc-600 text-[9px] mt-1.5 font-medium">
                                  Regret Score:{" "}
                                  <span className="text-violet-400 font-mono">
                                    {d.regretScore}/10
                                  </span>
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col items-end gap-1.5 shrink-0 h-full justify-between self-stretch">
                              {d.emotion && (
                                <span className="text-[10px] font-medium bg-white/4 border border-white/6 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  {d.emotion}
                                </span>
                              )}
                              <ChevronRight size={14} className="text-zinc-500 mt-auto" />
                            </div>
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#13131e] border border-white/6 rounded-2xl p-8 text-center text-zinc-500 text-xs">
                    No decisions logged in your map yet.
                  </div>
                )}
              </div>
            )}

            {/* EMOTIONAL HEALTH TAB */}
            {activeTab === "emotions" && (
              <>
                <div className="mb-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Heart size={16} className="text-rose-400" />
                    Emotional Correlation Dashboard
                  </h3>
                  <p className="text-zinc-500 text-[10px] mt-0.5">
                    Analyzing direct correlations between emotions, stress, and choice outcomes.
                  </p>
                </div>

                {/* Stress correlation gauges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#13131e] border border-white/6 rounded-2xl p-4 flex flex-col items-center shadow-sm">
                    <ThumbsUp className="text-emerald-400 mb-2" size={18} />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Good Outcomes
                    </span>
                    <span className="text-white font-mono text-xl font-bold mt-1.5">
                      {avgGoodStress}/10
                    </span>
                    <span className="text-zinc-500 text-[9px] mt-0.5 text-center">
                      Avg Stress Level
                    </span>
                  </div>

                  <div className="bg-[#13131e] border border-white/6 rounded-2xl p-4 flex flex-col items-center shadow-sm">
                    <Frown className="text-rose-400 mb-2" size={18} />
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      Bad Outcomes
                    </span>
                    <span className="text-white font-mono text-xl font-bold mt-1.5">
                      {avgBadStress}/10
                    </span>
                    <span className="text-zinc-500 text-[9px] mt-0.5 text-center">
                      Avg Stress Level
                    </span>
                  </div>
                </div>

                {/* Category regret heatmap */}
                <div className="bg-[#13131e] border border-white/6 rounded-2xl p-4 mt-2">
                  <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-4">
                    Regret Index by Category
                  </p>
                  <div className="flex flex-col gap-3">
                    {Object.entries(catRegretStats).map(([catName, stats]: [string, any]) => {
                      const avgRegret = (stats.sum / stats.count).toFixed(1)
                      const pct = Math.round(Number(avgRegret) * 10)
                      return (
                        <div key={catName} className="flex items-center gap-3">
                          <span className="text-zinc-400 text-xs w-20 font-medium capitalize">
                            {catName}
                          </span>
                          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-zinc-500 text-xs w-8 text-right font-mono font-bold">
                            {avgRegret}/10
                          </span>
                        </div>
                      )
                    })}
                    {Object.keys(catRegretStats).length === 0 && (
                      <p className="text-zinc-600 text-xs italic text-center py-2">
                        Resolve pending decisions in your history to see regret levels.
                      </p>
                    )}
                  </div>
                </div>

                {/* AI Memory Correlations */}
                {latestReflection && latestReflection.insights?.length > 0 && (
                  <div className="flex flex-col gap-3 mt-3">
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                      AI Memory Insights
                    </p>
                    {latestReflection.insights.map((insight: string, idx: number) => (
                      <div
                        key={idx}
                        className="bg-[#13131e] border border-white/6 rounded-2xl p-4 flex gap-3 items-start hover:border-violet-900/30 transition-colors"
                      >
                        <Sparkles className="text-violet-400 shrink-0 mt-0.5" size={14} />
                        <p className="text-zinc-300 text-xs leading-relaxed">{insight}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
