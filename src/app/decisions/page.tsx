"use client"

import { useEffect, useState, Suspense } from "react"
import { Search, X, Trash2, Calendar, Target, HelpCircle, Activity, Brain } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

const catColors: Record<string, string> = {
  work: "bg-violet-900/50 text-violet-300",
  personal: "bg-blue-900/50 text-blue-300",
  finance: "bg-emerald-900/50 text-emerald-300",
  health: "bg-pink-900/50 text-pink-300",
}

const emotions = [
  { label: "Neutral", emoji: "😐" },
  { label: "Calm", emoji: "🧘" },
  { label: "Excited", emoji: "⚡" },
  { label: "Anxious", emoji: "😰" },
  { label: "Focused", emoji: "🧠" },
  { label: "Stressed", emoji: "😔" },
]

function HistoryPageContent() {
  const [decisions, setDecisions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const [editOutcome, setEditOutcome] = useState("pending")
  const [editRegret, setEditRegret] = useState(0)
  const [editEmotion, setEditEmotion] = useState("Neutral")
  const [editStress, setEditStress] = useState(5)
  const [updating, setUpdating] = useState(false)

  const searchParams = useSearchParams()
  const router = useRouter()
  const selectedId = searchParams.get("id")

  useEffect(() => {
    async function fetchData() {
      try {
        const query = new URLSearchParams()
        if (search) query.set("search", search)

        const res = await fetch(`/api/decisions?${query.toString()}`)
        const data = await res.json()
        if (Array.isArray(data)) {
          setDecisions(data)
        } else {
          setDecisions([])
        }
      } catch (error) {
        console.error("Failed to fetch decisions", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [search])

  const closeModal = () => {
    router.push("/decisions")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this decision?")) return
    try {
      const res = await fetch(`/api/decisions?id=${id}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to delete")

      toast.success("Decision deleted successfully")
      setDecisions((prev) => prev.filter((d) => d.id !== id))
      closeModal()
    } catch (e) {
      toast.error("Failed to delete decision")
    }
  }

  const selectedDecision = decisions.find((d) => d.id === selectedId)

  useEffect(() => {
    if (selectedDecision) {
      setEditOutcome(selectedDecision.outcome || "pending") // eslint-disable-line react-hooks/exhaustive-deps
      setEditRegret(selectedDecision.regretScore || 0)
      setEditEmotion(selectedDecision.emotion || "Neutral")
      setEditStress(selectedDecision.stressLevel || 5)
    }
  }, [selectedDecision])

  const handleUpdate = async () => {
    if (!selectedDecision) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/decisions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedDecision.id,
          outcome: editOutcome,
          regretScore: editRegret,
          emotion: editEmotion,
          stressLevel: editStress,
        }),
      })
      if (!res.ok) throw new Error("Failed to update")

      const updated = await res.json()
      toast.success("Decision updated successfully")

      // Update local state
      setDecisions((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
      closeModal()
    } catch (e) {
      toast.error("Failed to update decision")
    } finally {
      setUpdating(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#080810] text-white">
      <div className="px-5 pt-10 pb-24">
        <h1 className="text-xl font-bold text-white mb-5">Decision History</h1>

        <div className="relative mb-5">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions..."
            className="w-full bg-[#13131e] border border-white/8 rounded-xl text-white text-sm pl-10 pr-4 py-3 outline-none focus:border-violet-600 transition-colors placeholder:text-zinc-700"
          />
        </div>

        <div className="flex flex-col gap-3 pb-20">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/5 animate-pulse" />
            ))
          ) : decisions.length > 0 ? (
            decisions.map((d) => (
              <Link href={`/decisions?id=${d.id}`} key={d.id}>
                <div className="bg-[#13131e] border border-white/6 rounded-2xl p-4 text-left w-full hover:border-violet-800/50 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-white text-sm font-medium leading-snug flex-1">{d.title}</p>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${catColors[d.category] || "bg-zinc-800 text-zinc-400"}`}
                    >
                      {d.category}
                    </span>
                  </div>
                  <p className="text-zinc-500 text-xs mb-2">→ {d.choice}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-700 text-[10px]">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-widest ${
                        d.outcome === "good"
                          ? "text-emerald-400"
                          : d.outcome === "bad"
                            ? "text-rose-400"
                            : "text-amber-500"
                      }`}
                    >
                      {d.outcome}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-zinc-600 text-sm text-center py-10">No decisions found.</p>
          )}
        </div>
      </div>

      {/* Decision Detail Modal Overlay */}
      {selectedId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={closeModal} />

          <div className="bg-[#13131e] border border-white/10 w-full max-w-lg rounded-[28px] overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-6 border-b border-white/6 flex items-start justify-between gap-4">
              <div>
                <span
                  className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 ${catColors[selectedDecision?.category] || "bg-zinc-800 text-zinc-400"}`}
                >
                  {selectedDecision?.category || "uncategorized"}
                </span>
                <h3 className="text-white font-bold text-lg leading-snug">
                  {selectedDecision ? selectedDecision.title : "Loading..."}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-sm text-zinc-300">
              {selectedDecision ? (
                <>
                  {/* Meta info */}
                  <div className="flex items-center justify-between text-xs text-zinc-500 bg-white/2 p-3 rounded-xl border border-white/4">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} />
                      <span>{new Date(selectedDecision.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target size={13} />
                      <span
                        className={`font-bold uppercase tracking-widest ${
                          selectedDecision.outcome === "good"
                            ? "text-emerald-400"
                            : selectedDecision.outcome === "bad"
                              ? "text-rose-400"
                              : "text-amber-500"
                        }`}
                      >
                        {selectedDecision.outcome}
                      </span>
                    </div>
                  </div>

                  {/* Situation */}
                  <div>
                    <h4 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <HelpCircle size={13} /> The Situation
                    </h4>
                    <div className="bg-[#1a1a27] border border-white/4 rounded-xl p-4 text-white leading-relaxed">
                      {selectedDecision.situation}
                    </div>
                  </div>

                  {/* Choice */}
                  <div>
                    <h4 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Activity size={13} /> Action Taken
                    </h4>
                    <div className="bg-[#1a1a27] border border-white/4 rounded-xl p-4 text-violet-300 font-medium leading-relaxed">
                      {selectedDecision.choice}
                    </div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                        Confidence Level
                      </h4>
                      <span className="text-zinc-400 font-mono text-xs">
                        {selectedDecision.confidence}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/6 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full"
                        style={{ width: `${selectedDecision.confidence}%` }}
                      />
                    </div>
                  </div>

                  {/* Reasoning */}
                  {selectedDecision.reasoning && (
                    <div className="relative mt-2">
                      <h4 className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                        <Brain size={13} className="text-violet-400 animate-pulse" /> Cognitive
                        Reasoning
                      </h4>
                      <div className="bg-gradient-to-br from-violet-950/20 to-purple-950/20 border border-violet-500/20 rounded-xl p-4 text-zinc-300 leading-relaxed shadow-inner">
                        {selectedDecision.reasoning}
                      </div>
                    </div>
                  )}

                  {/* Resolution & Reflection Section */}
                  <div className="bg-[#1a1a27] border border-white/6 rounded-2xl p-4 flex flex-col gap-4 mt-2">
                    <h4 className="text-violet-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-white/6 pb-2">
                      <Brain size={14} /> Resolution & Reflection
                    </h4>

                    <div>
                      <label className="text-[11px] text-zinc-400 font-medium mb-2 block">
                        Outcome State
                      </label>
                      <div className="flex gap-2">
                        {["pending", "good", "bad"].map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setEditOutcome(opt)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                              editOutcome === opt
                                ? opt === "good"
                                  ? "bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-950/20"
                                  : opt === "bad"
                                    ? "bg-rose-600/20 border-rose-500 text-rose-400 shadow-md shadow-rose-950/20"
                                    : "bg-amber-600/20 border-amber-500 text-amber-400 shadow-md shadow-amber-950/20"
                                : "bg-transparent border-white/6 text-zinc-500 hover:border-white/10"
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>

                    {editOutcome !== "pending" && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] text-zinc-400 font-medium">
                            Regret Score
                          </label>
                          <span className="text-violet-400 text-xs font-bold font-mono">
                            {editRegret}/10
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={10}
                          value={editRegret}
                          onChange={(e) => setEditRegret(Number(e.target.value))}
                          className="w-full accent-violet-500 cursor-pointer"
                        />
                        <div className="flex justify-between text-zinc-600 text-[9px] mt-1">
                          <span>No regrets (0)</span>
                          <span>Deep regret (10)</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] text-zinc-400 font-medium mb-2 block">
                        Current Emotion / Mood
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {emotions.map((e) => (
                          <button
                            key={e.label}
                            type="button"
                            onClick={() => setEditEmotion(e.label)}
                            className={`py-1.5 px-2 rounded-lg border text-[10px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                              editEmotion === e.label
                                ? "bg-violet-600/25 border-violet-500 text-violet-300 shadow-sm"
                                : "bg-[#13131e] border-white/6 text-zinc-500 hover:border-white/15"
                            }`}
                          >
                            <span>{e.emoji}</span>
                            <span>{e.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-zinc-400 font-medium">
                          Perceived Stress Level
                        </label>
                        <span className="text-violet-400 text-xs font-bold font-mono">
                          {editStress}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={10}
                        value={editStress}
                        onChange={(e) => setEditStress(Number(e.target.value))}
                        className="w-full accent-violet-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-zinc-500 text-xs">Locating decision archive...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedDecision && (
              <div className="p-6 border-t border-white/6 bg-white/2 flex gap-3">
                <button
                  onClick={() => handleDelete(selectedDecision.id)}
                  className="flex-1 bg-red-950/20 border border-red-900/30 hover:bg-red-900/20 hover:border-red-900/50 text-red-400 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Trash2 size={14} />
                  Delete Entry
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 text-white font-bold py-3.5 rounded-2xl text-xs transition-colors cursor-pointer disabled:bg-violet-800 disabled:text-zinc-400"
                >
                  {updating ? "Saving..." : "Save Reflections"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-[#080810] text-white justify-center items-center">
          <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <HistoryPageContent />
    </Suspense>
  )
}
