"use client"

import { useState, useEffect } from "react"
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  UserPlus,
  Activity,
  UserCheck,
  Sparkles,
  Layers,
  User,
  ShieldQuestion,
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"

const onboardingQuestions = [
  {
    title: "Career & Risk Profile",
    category: "work",
    question:
      "You receive an unexpected job offer with 30% higher salary, but it is at an early-stage startup with low stability. What is your move?",
    options: [
      "Accept it. I love high-risk, high-reward scenarios and fast-paced learning.",
      "Decline it. I value long-term stability and security in my current role.",
      "Negotiate first. Try to secure safety clauses or remote flexibility before deciding.",
    ],
  },
  {
    title: "Financial Allocation",
    category: "finance",
    question: "You have saved up some extra capital. How do you prefer to manage it?",
    options: [
      "Aggressive growth. Allocate to stocks, crypto, or new business ventures.",
      "Safety first. Put it in secure deposits or high-yield savings accounts.",
      "Balanced. Keep 50% in safe index funds and 50% in secure liquid cash.",
    ],
  },
  {
    title: "Productivity & Lifestyle",
    category: "personal",
    question: "You find yourself with a completely free weekend. How do you spend it?",
    options: [
      "Work on a side project or acquire new skills. I like to stay productive.",
      "Completely unplug. Recharge, read books, or relax with loved ones.",
      "Seek out new experiences. Travel somewhere spontaneous or meet new people.",
    ],
  },
]

const personas = [
  {
    id: "future",
    name: "Future Self",
    sub: "5 Years Later",
    emoji: "🔮",
    desc: "Gentle wisdom and long-term reflection.",
  },
  {
    id: "past",
    name: "Past Self",
    sub: "5 Years Ago",
    emoji: "🎒",
    desc: "Reminds you of your core values.",
  },
  {
    id: "confident",
    name: "Confident Self",
    sub: "Inner Lion",
    emoji: "🦁",
    desc: "Pushes you to take high-growth risks.",
  },
  {
    id: "rational",
    name: "Brutal Analyst",
    sub: "Cold Logic",
    emoji: "💀",
    desc: "Strips away excuses and comfortable lies.",
  },
  {
    id: "stoic",
    name: "Stoic Mentor",
    sub: "Ancient Duty",
    emoji: "🏛️",
    desc: "Find calm by focusing only on control.",
  },
]

const diagnosticSuggestions = [
  "Why do I keep choosing security over career growth?",
  "Why do I tend to overthink low-risk daily decisions?",
  "Why do I experience anxiety before spending money?",
  "Why do I avoid taking risks in relationships?",
]

export default function SimulatePage() {
  const [decisions, setDecisions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [hasDecisions, setHasDecisions] = useState<boolean | null>(null)

  // Onboarding states
  const [onboardingActive, setOnboardingActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Simulation suite mode
  const [activeMode, setActiveMode] = useState("double") // "double" | "alt-reality" | "persona" | "why"
  const [result, setResult] = useState<any>(null)

  // Inputs for different modes
  const [situation, setSituation] = useState("")
  const [selectedDecisionId, setSelectedDecisionId] = useState("")
  const [alternativeChoice, setAlternativeChoice] = useState("")
  const [selectedPersonaId, setSelectedPersonaId] = useState("future")
  const [personaQuery, setPersonaQuery] = useState("")
  const [whyQuestion, setWhyQuestion] = useState("")

  async function checkDecisions() {
    try {
      const res = await fetch("/api/decisions")
      const data = await res.json()
      if (Array.isArray(data)) {
        setDecisions(data)
        setHasDecisions(data.length > 0)
        if (data.length > 0 && !selectedDecisionId) {
          setSelectedDecisionId(data[0].id)
        }
      } else {
        setHasDecisions(false)
      }
    } catch (e) {
      setHasDecisions(false)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    checkDecisions()
  }, [])

  async function handleSimulate(modeOverride?: string) {
    const targetMode = modeOverride || activeMode
    setLoading(true)
    setResult(null)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: any = { mode: targetMode }

    if (targetMode === "double") {
      if (!situation.trim()) {
        toast.error("Please describe a situation first")
        setLoading(false)
        return
      }
      payload.situation = situation
    } else if (targetMode === "alt-reality") {
      if (!selectedDecisionId || !alternativeChoice.trim()) {
        toast.error("Please select a decision and specify an alternative choice")
        setLoading(false)
        return
      }
      payload.decisionId = selectedDecisionId
      payload.alternativeChoice = alternativeChoice
    } else if (targetMode === "persona") {
      if (!selectedPersonaId || !personaQuery.trim()) {
        toast.error("Please select a persona and enter your query")
        setLoading(false)
        return
      }
      payload.personaId = selectedPersonaId
      payload.query = personaQuery
    } else if (targetMode === "why") {
      if (!whyQuestion.trim()) {
        toast.error("Please specify a behavioral question")
        setLoading(false)
        return
      }
      payload.mode = "why-am-i-like-this"
      payload.question = whyQuestion
    }

    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        setResult(data)
      }
    } catch (error) {
      toast.error("Simulation failed")
    } finally {
      setLoading(false)
    }
  }

  const handleSelectOption = (optIndex: number) => {
    const updated = [...answers]
    updated[currentStep] = optIndex
    setAnswers(updated)
  }

  const handleNext = async () => {
    if (answers[currentStep] === undefined) {
      toast.error("Please select an option to continue")
      return
    }

    if (currentStep < onboardingQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      setSubmitting(true)
      try {
        for (let i = 0; i < onboardingQuestions.length; i++) {
          const q = onboardingQuestions[i]
          const choiceText = q.options[answers[i]]

          const res = await fetch("/api/decisions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: q.title,
              category: q.category,
              situation: q.question,
              choice: choiceText,
              confidence: 90,
              outcome: "good",
              emotion: "Focused",
              stressLevel: 4,
            }),
          })
          if (!res.ok) throw new Error("Failed to save onboarding decisions")
        }

        toast.success("Cognitive profile created successfully!")
        await checkDecisions()
        setOnboardingActive(false)
      } catch (err) {
        console.error(err)
        toast.error("Failed to build cognitive profile. Please try again.")
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  if (hasDecisions === null) {
    return (
      <div className="flex flex-col min-h-screen bg-[#080810] text-white justify-center items-center">
        <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // AI Onboarding questionnaire
  if (onboardingActive) {
    const q = onboardingQuestions[currentStep]
    return (
      <div className="flex flex-col min-h-screen bg-[#080810] text-white">
        <div className="px-5 pt-12 pb-24 flex flex-col justify-between flex-1 max-w-lg mx-auto w-full">
          <div>
            <div className="flex justify-between items-center text-xs text-zinc-500 mb-2">
              <span className="font-semibold uppercase tracking-wider text-violet-400">
                Twin Simulation Sync
              </span>
              <span>Step {currentStep + 1} of 3</span>
            </div>
            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-purple-500 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
              />
            </div>

            <h2 className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2">
              {q.title}
            </h2>
            <h3 className="text-white text-lg font-bold mb-6 leading-snug">{q.question}</h3>

            <div className="flex flex-col gap-3">
              {q.options.map((opt, i) => {
                const selected = answers[currentStep] === i
                return (
                  <button
                    key={i}
                    onClick={() => handleSelectOption(i)}
                    className={`w-full text-left p-4 rounded-2xl text-xs sm:text-sm transition-all border leading-relaxed cursor-pointer ${
                      selected
                        ? "bg-violet-950/20 border-violet-500 text-violet-300 shadow-lg shadow-violet-950/50"
                        : "bg-[#13131e] border-white/8 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border shrink-0 mt-0.5 flex items-center justify-center ${
                          selected ? "border-violet-500 bg-violet-500" : "border-zinc-700"
                        }`}
                      >
                        {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span>{opt}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-3 mt-8">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                disabled={submitting}
                className="bg-[#13131e] border border-white/8 text-zinc-300 py-4 px-6 rounded-2xl text-xs font-bold transition-all hover:bg-white/5 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={submitting || answers[currentStep] === undefined}
              className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-violet-950/50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating Twin...
                </>
              ) : currentStep === onboardingQuestions.length - 1 ? (
                <>
                  Finish & Sync <CheckCircle2 size={14} />
                </>
              ) : (
                <>
                  Next Step <ChevronRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (hasDecisions === false) {
    return (
      <div className="flex flex-col min-h-screen bg-[#080810] text-white">
        <div className="px-5 pt-10 pb-24 flex flex-col items-center justify-center flex-1 text-center max-w-sm mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#13131e] border border-violet-500/20 flex items-center justify-center mb-6 shadow-xl shadow-violet-900/30 p-1.5 overflow-hidden animate-pulse">
            <Image
              src="/logo.png"
              alt="MirrorMind Logo"
              width={64}
              height={64}
              className="object-contain w-full h-full rounded-xl"
            />
          </div>
          <h2 className="text-xl font-bold mb-2">No Past Decisions Logged</h2>
          <p className="text-zinc-500 text-xs sm:text-sm mb-8 leading-relaxed">
            MirrorMind simulates your choices by analyzing historical decisions. Complete our quick
            questionnaire to sync your twin instantly, or log a decision manually.
          </p>
          <div className="flex flex-col w-full gap-3">
            <button
              onClick={() => setOnboardingActive(true)}
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-semibold py-4 rounded-2xl text-xs sm:text-sm transition-colors shadow-lg shadow-violet-950/50 cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus size={16} /> Start AI Onboarding
            </button>
            <Link href="/add" className="w-full">
              <button className="w-full bg-[#13131e] border border-white/8 hover:bg-white/5 text-zinc-300 font-semibold py-4 rounded-2xl text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2">
                Log a Decision Manually <ArrowRight size={16} />
              </button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Setup mode specific labels for uniform result card displaying
  let resultTitle = "Twin Prediction"
  let resultBadge = "Prediction"
  let confidenceLabel = "Prediction Confidence"
  let matchLabel = "Most similar past decision"

  if (activeMode === "alt-reality") {
    resultTitle = "Parallel Universe Timeline"
    resultBadge = "Simulated Path"
    confidenceLabel = "Timeline Alignment probability"
    matchLabel = "Simulated Past Decision"
  } else if (activeMode === "persona") {
    const p = personas.find((x) => x.id === selectedPersonaId)
    resultTitle = `${p?.name || "Persona"} Response`
    resultBadge = "Advisor Speech"
    confidenceLabel = "Advice Criticality"
    matchLabel = "Informed by Past Decision"
  } else if (activeMode === "why") {
    resultTitle = "Behavioral Diagnostic Report"
    resultBadge = "Insight Analysis"
    confidenceLabel = "Pattern Strength Index"
    matchLabel = "Most Illustrative Past Decision"
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#080810] text-white">
      <div className="px-5 pt-10 pb-24">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white mb-1">Mirror Simulation Suite</h1>
          <p className="text-zinc-500 text-xs">
            Test scenarios, dialogue with selves, and explore why you are you
          </p>
        </div>

        {/* Mode Selector Segmented Bar */}
        <div className="flex bg-[#13131e] border border-white/6 p-1 rounded-2xl mb-6 select-none overflow-x-auto whitespace-nowrap scrollbar-none gap-1">
          {[
            { id: "double", label: "AI Double", icon: Activity },
            { id: "alt-reality", label: "Alt Reality", icon: Layers },
            { id: "persona", label: "Personas", icon: User },
            { id: "why", label: "Why Am I Like This?", icon: ShieldQuestion },
          ].map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.id}
                onClick={() => {
                  setActiveMode(m.id)
                  setResult(null)
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeMode === m.id
                    ? "bg-violet-600 text-white shadow-md shadow-violet-950/20"
                    : "text-zinc-400 hover:text-white hover:bg-white/3"
                }`}
              >
                <Icon size={13} />
                <span>{m.label}</span>
              </button>
            )
          })}
        </div>

        {/* INPUT FORMS DEPENDING ON MODE */}
        <div className="mb-5 flex flex-col gap-4">
          {activeMode === "double" && (
            <div>
              <label className="text-xs text-zinc-500 font-medium mb-1.5 block">
                Describe a future dilemma / situation
              </label>
              <textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="e.g. I have an opportunity to start a business with a friend, but I'd have to quit my job..."
                rows={4}
                className="w-full bg-[#13131e] border border-white/8 rounded-xl text-white text-sm px-4 py-3 outline-none focus:border-violet-600 transition-colors placeholder:text-zinc-700 resize-none"
              />
            </div>
          )}

          {activeMode === "alt-reality" && (
            <>
              <div>
                <label className="text-xs text-zinc-500 font-medium mb-1.5 block">
                  Select a past decision to change
                </label>
                <select
                  value={selectedDecisionId}
                  onChange={(e) => setSelectedDecisionId(e.target.value)}
                  className="w-full bg-[#13131e] border border-white/8 rounded-xl text-white text-sm px-4 py-3 outline-none focus:border-violet-600 transition-colors cursor-pointer"
                >
                  {decisions.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#13131e] text-white">
                      {d.title} ({new Date(d.createdAt).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-500 font-medium mb-1.5 block">
                  What alternative choice would you make?
                </label>
                <textarea
                  value={alternativeChoice}
                  onChange={(e) => setAlternativeChoice(e.target.value)}
                  placeholder="e.g. Instead of playing it safe and declining, what if I had accepted the startup offer and negotiated for equity?"
                  rows={4}
                  className="w-full bg-[#13131e] border border-white/8 rounded-xl text-white text-sm px-4 py-3 outline-none focus:border-violet-600 transition-colors placeholder:text-zinc-700 resize-none"
                />
              </div>
            </>
          )}

          {activeMode === "persona" && (
            <>
              <div>
                <label className="text-xs text-zinc-500 font-medium mb-2 block">
                  Choose an advisor persona
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {personas.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPersonaId(p.id)}
                      className={`p-3 rounded-xl border text-left flex flex-col transition-all cursor-pointer ${
                        selectedPersonaId === p.id
                          ? "bg-violet-600/15 border-violet-500 shadow-md shadow-violet-950/20"
                          : "bg-[#13131e] border-white/8 hover:border-white/15"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">{p.emoji}</span>
                        <span
                          className={`text-[11px] font-bold ${selectedPersonaId === p.id ? "text-violet-300" : "text-white"}`}
                        >
                          {p.name}
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-500 leading-normal">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 font-medium mb-1.5 block">
                  Ask a question or describe a dilemma
                </label>
                <textarea
                  value={personaQuery}
                  onChange={(e) => setPersonaQuery(e.target.value)}
                  placeholder="e.g. I am feeling extremely unmotivated to work on my side business today. How do I break this?"
                  rows={3}
                  className="w-full bg-[#13131e] border border-white/8 rounded-xl text-white text-sm px-4 py-3 outline-none focus:border-violet-600 transition-colors placeholder:text-zinc-700 resize-none"
                />
              </div>
            </>
          )}

          {activeMode === "why" && (
            <>
              <div>
                <label className="text-xs text-zinc-500 font-medium mb-2 block">
                  Suggested behavioral diagnostics
                </label>
                <div className="flex flex-col gap-1.5">
                  {diagnosticSuggestions.map((qText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setWhyQuestion(qText)}
                      className={`w-full text-left p-3 rounded-xl text-xs transition-all border cursor-pointer ${
                        whyQuestion === qText
                          ? "bg-violet-600/15 border-violet-500 text-violet-300"
                          : "bg-[#13131e] border-white/8 text-zinc-400 hover:border-white/15 hover:text-zinc-200"
                      }`}
                    >
                      {qText}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-500 font-medium mb-1.5 block">
                  Or enter a custom question
                </label>
                <input
                  value={whyQuestion}
                  onChange={(e) => setWhyQuestion(e.target.value)}
                  placeholder="Why do I..."
                  className="w-full bg-[#13131e] border border-white/8 rounded-xl text-white text-sm px-4 py-3 outline-none focus:border-violet-600 transition-colors placeholder:text-zinc-700"
                />
              </div>
            </>
          )}
        </div>

        {/* SIMULATE TRIGGER BUTTON */}
        <button
          onClick={() => handleSimulate()}
          disabled={loading}
          className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-2xl text-sm transition-all mb-6 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-violet-950/20"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Running Simulation...
            </>
          ) : activeMode === "double" ? (
            "What would I do?"
          ) : activeMode === "alt-reality" ? (
            "Simulate Parallel Timeline"
          ) : activeMode === "persona" ? (
            "Begin Consultation"
          ) : (
            "Analyze Habits"
          )}
        </button>

        {/* RESULTS CARD */}
        {result && (
          <div className="bg-[#13131e] border border-violet-700/40 rounded-2xl p-5 animate-in fade-in duration-500 shadow-[0_0_20px_rgba(139,92,246,0.04)]">
            <div className="flex items-center gap-2 mb-3.5">
              <Sparkles size={14} className="text-violet-400" />
              <p className="text-violet-400 text-[10px] font-bold tracking-widest uppercase">
                {resultBadge}
              </p>
            </div>

            <p className="text-white text-base font-bold mb-3">{resultTitle}</p>

            <p className="text-violet-300 text-xs font-semibold leading-relaxed mb-3 bg-violet-950/20 border border-violet-900/30 p-3 rounded-xl">
              🔑 {result.predictedChoice}
            </p>

            {result.reasoning && (
              <p className="text-zinc-400 text-xs leading-relaxed mb-4 bg-white/2 p-3.5 rounded-xl border border-white/4">
                {result.reasoning}
              </p>
            )}

            <div className="mb-4">
              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase mb-1.5">
                <span>{confidenceLabel}</span>
                <span className="text-violet-400 font-mono">{result.confidence}</span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${result.confidence ? parseInt(result.confidence) || 0 : 0}%` }}
                />
              </div>
            </div>

            <div className="border-t border-white/6 pt-4">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                {matchLabel}
              </p>
              <p className="text-zinc-300 text-xs font-semibold mb-2">
                → {result.matchedDecision || "No matches"}
              </p>
              <p className="text-zinc-600 text-[9px] leading-relaxed">
                Referenced {result.basedOn} decisions in your cognitive profile.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
