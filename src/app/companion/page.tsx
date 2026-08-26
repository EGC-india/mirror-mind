"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import dynamic from "next/dynamic"
import {
  Send,
  Brain,
  Info,
  Calendar,
  User,
  ShieldCheck,
  Compass,
  Briefcase,
  Target,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  History,
  Activity,
  Zap,
  Lock,
  Smile,
} from "lucide-react"
import { toast } from "sonner"

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false })

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

interface ProfileMemory {
  name: string | null
  preferredName: string | null
  age: number | null
  birthday: string | null
  gender: string | null
  country: string | null
  language: string | null
  profession: string | null
  company: string | null
  designation: string | null
  routine: string | null
  workStyle: string | null
  goals: string[]
  ambitions: string[]
  traits: string[]
  riskStyle: string | null
  fears: string[]
  motivations: string[]
  overthinkItems: string[]
  relationshipStatus: string | null
  onboardingStage: number
}

interface EpisodicMemory {
  id: string
  event: string
  emotion: string | null
  importance: number
  timestamp: string
}

export default function CompanionPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [profile, setProfile] = useState<ProfileMemory | null>(null)
  const [episodics, setEpisodics] = useState<EpisodicMemory[]>([])
  const [inputText, setInputText] = useState("")
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const parseTaggedMarkdown = (content: string) => {
    const emotionMatch = content.match(/\[EMOTION\]\s*(.*)/i)
    const titleMatch = content.match(/\[TITLE\]\s*(.*)/i)
    const insightsMatch = content.match(/\[INSIGHTS\]\s*(.*)/i)
    const patternsMatch = content.match(/\[PATTERNS\]\s*(.*)/i)
    const suggestionsMatch = content.match(/\[SUGGESTIONS\]\s*(.*)/i)
    const replyMatch = content.match(/\[REPLY\]([\s\S]*)/i)

    return {
      emotion: emotionMatch ? emotionMatch[1].trim() : null,
      title: titleMatch ? titleMatch[1].trim() : null,
      insights: insightsMatch
        ? insightsMatch[1]
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      patterns: patternsMatch
        ? patternsMatch[1]
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      suggestions: suggestionsMatch
        ? suggestionsMatch[1]
            .split("|")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      reply: replyMatch
        ? replyMatch[1].trim()
        : content.includes("[REPLY]")
        ? ""
        : content
            .replace(/\[(EMOTION|TITLE|INSIGHTS|PATTERNS|SUGGESTIONS)\][\s\S]*?(?=\n\[(EMOTION|TITLE|INSIGHTS|PATTERNS|SUGGESTIONS|REPLY)\]|$)/gi, "")
            .replace(/\[[A-Z]+\][^\n]*/gi, "")
            .trim(),
    }
  }

  useEffect(() => {
    async function initData() {
      try {
        const res = await fetch("/api/companion")
        const data = await res.json()
        if (data.profile) {
          setProfile(data.profile)
          setEpisodics(data.episodicMemories || [])

          if (data.messages && data.messages.length > 0) {
            setMessages(
              data.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
              }))
            )
          } else {
            let initialText =
              "[REPLY]\nHey, I'm MirrorMind. Before we begin, I'd love to understand who you are."
            if (data.profile.onboardingStage === 2)
              initialText =
                "[REPLY]\nWelcome back. Let's continue mapping your double. What kind of work do you spend most of your time on?"
            else if (data.profile.onboardingStage === 3)
              initialText =
                "[REPLY]\nLet's explore your personality. What usually stresses you or keeps you up overthinking at night?"
            else if (data.profile.onboardingStage === 4)
              initialText =
                "[REPLY]\nLet's uncover your decision patterns. When life gets difficult, do you confront problems immediately or avoid them for a bit?"
            else if (data.profile.onboardingStage === 5)
              initialText =
                "[REPLY]\nLastly, tell me about your history. What is one of your proudest achievements or biggest regrets in life?"
            else if (data.profile.onboardingStage >= 6)
              initialText =
                "[REPLY]\nHello again. I'm synced with your memory profile. What's on your mind today?"

            setMessages([
              {
                id: "initial-greet",
                role: "assistant",
                content: initialText,
                createdAt: new Date() as any,
              },
            ])
          }
        }
      } catch (err) {
        console.error("Failed to load companion details", err)
      } finally {
        setLoading(false)
      }
    }
    initData()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || sending) return
    if (textToSend.includes("Go to Dashboard") || textToSend.toLowerCase().includes("dashboard")) {
      router.push("/dashboard")
      return
    }

    const userMsg: Message = {
      id: `user-temp-${Date.now()}`,
      role: "user",
      content: textToSend,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInputText("")
    setSending(true)
    setShowEmojiPicker(false)

    try {
      const res = await fetch("/api/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      })

      if (!res.body) throw new Error("No response body")

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      let assistantContent = ""
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-temp-${Date.now()}`,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
        },
      ])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        assistantContent += chunk

        setMessages((prev) => {
          const newMsgs = [...prev]
          newMsgs[newMsgs.length - 1].content = assistantContent
          return newMsgs
        })

        // Progressively parse suggestions
        const parsed = parseTaggedMarkdown(assistantContent)
        if (parsed.suggestions.length > 0) {
          setDynamicSuggestions(parsed.suggestions)
        }
      }

      // Refresh memory profile after stream finishes
      try {
        const updateRes = await fetch("/api/companion")
        const updateData = await updateRes.json()
        if (updateData.profile) {
          if (profile && updateData.profile.onboardingStage !== profile.onboardingStage) {
            if (updateData.profile.onboardingStage === 6) {
              toast.success("Cognitive profile synced! Onboarding complete.", { duration: 4000 })
            } else {
              toast.info(`Onboarding advanced to Stage ${updateData.profile.onboardingStage} of 5`)
            }
          }
          setProfile(updateData.profile)
        }
        if (updateData.episodicMemories) setEpisodics(updateData.episodicMemories)
      } catch (err) {}
    } catch (err) {
      console.error("Error sending message:", err)
      toast.error("Failed to get response. Please check connection.")
    } finally {
      setSending(false)
    }
  }

  const getStageTitle = (stage: number) => {
    switch (stage) {
      case 1:
        return "Warm Introduction"
      case 2:
        return "Identity & Career"
      case 3:
        return "Personality & Emotion"
      case 4:
        return "Behavioral Loops"
      case 5:
        return "Life Timeline"
      default:
        return "Cognitive Double Synced"
    }
  }

  const getSuggestions = () => {
    if (!profile) return []
    const stage = profile.onboardingStage
    const userName = session?.user?.name || profile.preferredName || profile.name || "User"
    if (stage === 1) {
      return [
        "I'm ready. Let's do this!",
        `My name is ${userName}.`,
        "What kind of details do you need?",
      ]
    }
    if (stage === 2) {
      return [
        "I work as a Software Developer.",
        "I spend my time coding and building products.",
        "My daily routine is quite structured.",
      ]
    }
    if (stage === 3) {
      return [
        "Financial risk makes me nervous.",
        "I overthink failure and career shifts.",
        "I feel motivated by creating unique platforms.",
      ]
    }
    if (stage === 4) {
      return [
        "I confront problems immediately.",
        "I avoid hard decisions to bypass conflict.",
        "I take calculated risks with backup plans.",
      ]
    }
    if (stage === 5) {
      return [
        "My proudest achievement was building this app.",
        "I regret not taking an entrepreneurial risk sooner.",
        "My biggest turning point was moving cities.",
      ]
    }
    return [
      "Analyze my recent decisions.",
      "Check if my actions align with my ambitions.",
      "Are you noticing any emotional cycles?",
    ]
  }

  const renderProfilePanel = () => {
    if (!profile) return <p className="text-zinc-500 text-xs italic">Loading profile summary...</p>

    return (
      <div className="space-y-6">
        {/* Sync Status Header */}
        <div className="bg-[#131322] border border-violet-900/30 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-violet-600/10 to-transparent blur-xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Activity size={18} className="animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                Double Connection Status
              </h4>
              <p className="text-[10px] text-zinc-400 flex items-center gap-1 mt-0.5">
                {profile.onboardingStage >= 6 ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-emerald-400 font-medium">100% Synced (Active)</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
                    <span className="text-violet-400 font-medium">
                      Stage {profile.onboardingStage} of 5 Mapping
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Identity Details */}
        <div className="space-y-3">
          <h3 className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-2">
            <User size={12} className="text-violet-400" /> Personal Identity
          </h3>
          <div className="bg-[#0e0e1a]/80 border border-white/4 rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Name</span>{" "}
              <span className="text-zinc-200 font-medium">{profile.name || "Awaiting..."}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Nickname</span>{" "}
              <span className="text-zinc-200 font-medium">
                {profile.preferredName || "Awaiting..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Age</span>{" "}
              <span className="text-zinc-200 font-medium">{profile.age || "Awaiting..."}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Birthday</span>{" "}
              <span className="text-zinc-200 font-medium">{profile.birthday || "Awaiting..."}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Country</span>{" "}
              <span className="text-zinc-200 font-medium">{profile.country || "Awaiting..."}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Language</span>{" "}
              <span className="text-zinc-200 font-medium">{profile.language || "Awaiting..."}</span>
            </div>
          </div>
        </div>

        {/* Professional Details */}
        <div className="space-y-3">
          <h3 className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-2">
            <Briefcase size={12} className="text-violet-400" /> Career Profile
          </h3>
          <div className="bg-[#0e0e1a]/80 border border-white/4 rounded-xl p-3.5 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-500">Profession</span>{" "}
              <span className="text-zinc-200 font-medium">
                {profile.profession || "Awaiting..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Company</span>{" "}
              <span className="text-zinc-200 font-medium">{profile.company || "Awaiting..."}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Designation</span>{" "}
              <span className="text-zinc-200 font-medium">
                {profile.designation || "Awaiting..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Work Style</span>{" "}
              <span className="text-zinc-200 font-medium">
                {profile.workStyle || "Awaiting..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-500">Risk Profile</span>{" "}
              <span className="text-violet-400 font-bold capitalize">
                {profile.riskStyle || "Awaiting..."}
              </span>
            </div>
          </div>
        </div>

        {/* Cognitive & Emotional Markers */}
        <div className="space-y-3">
          <h3 className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-2">
            <Target size={12} className="text-violet-400" /> Cognitive Markers
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-zinc-500 font-bold block mb-1">
                Ambitions & Goals
              </span>
              <div className="flex flex-wrap gap-1">
                {profile.goals.length > 0 ? (
                  profile.goals.map((g, i) => (
                    <span
                      key={i}
                      className="bg-emerald-950/40 border border-emerald-900/30 text-emerald-400 text-[10px] px-2 py-0.5 rounded-md"
                    >
                      {g}
                    </span>
                  ))
                ) : (
                  <span className="text-zinc-600 text-xs italic">Awaiting Discovery (Stage 2)</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 font-bold block mb-1">
                Fears & Stressors
              </span>
              <div className="flex flex-wrap gap-1">
                {profile.fears.length > 0 ? (
                  profile.fears.map((f, i) => (
                    <span
                      key={i}
                      className="bg-red-950/40 border border-red-900/30 text-red-400 text-[10px] px-2 py-0.5 rounded-md"
                    >
                      {f}
                    </span>
                  ))
                ) : (
                  <span className="text-zinc-600 text-xs italic">Awaiting Discovery (Stage 3)</span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-zinc-500 font-bold block mb-1">
                Overthinking Triggers
              </span>
              <div className="flex flex-wrap gap-1">
                {profile.overthinkItems.length > 0 ? (
                  profile.overthinkItems.map((o, i) => (
                    <span
                      key={i}
                      className="bg-purple-950/40 border border-purple-900/30 text-purple-400 text-[10px] px-2 py-0.5 rounded-md"
                    >
                      {o}
                    </span>
                  ))
                ) : (
                  <span className="text-zinc-600 text-xs italic">Awaiting Discovery (Stage 3)</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Saved Timeline Milestones */}
        <div className="space-y-3">
          <h3 className="text-zinc-500 text-[10px] uppercase tracking-wider font-bold flex items-center gap-2">
            <History size={12} className="text-violet-400" /> Saved Timeline Events
          </h3>
          <div className="space-y-2">
            {episodics.length > 0 ? (
              episodics.map((e) => (
                <div
                  key={e.id}
                  className="bg-[#0c0c16] border border-white/5 rounded-xl p-3 relative overflow-hidden group"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-600" />
                  <p className="text-zinc-200 text-xs leading-normal">{e.event}</p>
                  <div className="flex justify-between items-center text-[9px] text-zinc-500 pt-2 mt-2 border-t border-white/4">
                    <span className="capitalize text-violet-400 font-bold flex items-center gap-1">
                      <Zap size={8} /> {e.emotion || "neutral"}
                    </span>
                    <span>Importance: {e.importance}/10</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-[#0c0c16] border border-white/5 rounded-xl p-4 text-center">
                <p className="text-zinc-600 text-xs italic">
                  No milestones saved yet. Epinodics are scored (importance &gt;= 6) during
                  conversation.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#080810] text-white overflow-hidden relative flex flex-col lg:grid lg:grid-cols-12 h-full">
      {/* Dynamic Keyframes Injection */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-8px) scale(1.02); }
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 0.3; filter: blur(10px); }
          50% { transform: scale(1.2); opacity: 0.6; filter: blur(16px); }
        }
        @keyframes holographicRotation {
          0% { background-position: 0% 50%; rotate: 0deg; }
          50% { background-position: 100% 50%; rotate: 180deg; }
          100% { background-position: 0% 50%; rotate: 360deg; }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulseGlow 3.5s ease-in-out infinite;
        }
        .bg-holographic-double {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.25), rgba(139, 92, 246, 0.1), rgba(76, 29, 149, 0.35));
          background-size: 200% 200%;
          animation: holographicRotation 12s linear infinite;
        }
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:block lg:col-span-4 bg-[#0d0d17] border-r border-white/6 overflow-y-auto p-6 h-full select-none scrollbar-none">
        <div className="flex items-center gap-3 pb-5 mb-5 border-b border-white/6 sticky top-0 bg-[#0d0d17] z-10">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/30">
            <Brain size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">MirrorMind Double</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
              Memory & Profiles
            </p>
          </div>
        </div>
        {renderProfilePanel()}
      </aside>

      {/* Mobile Drawer (Collapsible) */}
      <div
        className={`fixed inset-y-0 right-0 w-80 bg-[#0d0d18] border-l border-white/8 z-50 transform transition-transform duration-300 flex flex-col lg:hidden ${
          mobileSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-white/6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-violet-400" />
            <h2 className="text-white font-bold text-sm">Mirror Profile Memory</h2>
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="text-zinc-400 hover:text-zinc-100 text-xs font-bold"
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 scrollbar-none">{renderProfilePanel()}</div>
      </div>

      {/* Main Chat Area */}
      <section className="col-span-12 lg:col-span-8 flex flex-col h-full relative overflow-hidden bg-[#080810]">
        {/* Onboarding Header Status */}
        <div className="px-5 py-4 bg-[#0d0d14]/90 backdrop-blur-xl border-b border-white/6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
              <div className="absolute inset-0 rounded-xl bg-holographic-double animate-float shadow-md shadow-violet-950/20" />
              <div className="absolute inset-0 rounded-xl bg-violet-500 animate-pulse-glow" />
              <Brain size={18} className="relative text-white z-10" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
                MirrorMind Double
                {profile && profile.onboardingStage >= 6 ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                )}
              </h1>
              <p className="text-[10px] text-zinc-400">
                {profile ? getStageTitle(profile.onboardingStage) : "Initializing..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-xl bg-[#141423] border border-white/6 flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <Info size={16} />
            </button>
            <div className="hidden lg:flex items-center gap-1.5 bg-[#131322] border border-white/5 rounded-xl px-3 py-1.5 text-[10px] text-zinc-400">
              <Lock size={10} className="text-violet-400" />
              <span>Session Secure</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {profile && profile.onboardingStage < 6 && (
          <div className="h-1 w-full bg-white/5 flex shrink-0">
            {[1, 2, 3, 4, 5].map((stageNum) => (
              <div
                key={stageNum}
                className={`h-full flex-1 transition-all duration-500 ${
                  stageNum <= profile.onboardingStage
                    ? "bg-gradient-to-r from-violet-500 to-purple-600"
                    : "bg-white/5"
                }`}
              />
            ))}
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-none">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-zinc-500 text-xs">Accessing cognitive double...</p>
            </div>
          ) : (
            <>
              {messages.map((m) => {
                const isUser = m.role === "user"
                const parsed = isUser ? null : parseTaggedMarkdown(m.content)

                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-violet-900/20 border border-violet-800/30 flex items-center justify-center shrink-0 text-violet-400 shadow-md">
                        <Brain size={14} />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] md:max-w-[75%] px-4.5 py-3 rounded-2xl text-xs leading-relaxed transition-all duration-300 shadow-lg whitespace-pre-wrap ${
                        isUser
                          ? "bg-gradient-to-br from-violet-600 to-purple-800 text-white rounded-br-none shadow-violet-950/20"
                          : "bg-transparent text-zinc-100 rounded-bl-none"
                      }`}
                    >
                      {isUser ? (
                        m.content
                      ) : (
                        <div className="flex flex-col gap-3">
                          {parsed?.title && (
                            <div className="flex items-center gap-2 border-b border-white/10 pb-2 mb-1">
                              <Sparkles size={12} className="text-violet-400" />
                              <span className="font-bold text-violet-300 uppercase tracking-widest text-[10px]">
                                {parsed.title}
                              </span>
                              {parsed.emotion && (
                                <span className="ml-auto bg-black/40 border border-white/5 px-2 py-0.5 rounded-full text-[9px] text-zinc-400 capitalize">
                                  {parsed.emotion}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="prose prose-invert prose-p:leading-relaxed prose-p:text-xs prose-strong:text-violet-300 text-zinc-200">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {parsed ? parsed.reply : m.content}
                            </ReactMarkdown>
                          </div>

                          {parsed?.insights?.length || parsed?.patterns?.length ? (
                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-white/5">
                              {parsed.insights?.map((insight, idx) => (
                                <span
                                  key={`i-${idx}`}
                                  className="bg-emerald-900/20 border border-emerald-500/20 text-emerald-400 text-[10px] px-2 py-1 rounded-md flex items-center gap-1.5"
                                >
                                  <Info size={10} /> {insight}
                                </span>
                              ))}
                              {parsed.patterns?.map((pattern, idx) => (
                                <span
                                  key={`p-${idx}`}
                                  className="bg-orange-900/20 border border-orange-500/20 text-orange-400 text-[10px] px-2 py-1 rounded-md flex items-center gap-1.5"
                                >
                                  <Activity size={10} /> {pattern}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {sending && (!messages.length || messages[messages.length - 1].role === "user") && (
                <div className="flex items-end gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-violet-900/20 border border-violet-800/30 flex items-center justify-center shrink-0 text-violet-400 shadow-md">
                    <Brain size={14} />
                  </div>
                  <div className="bg-[#13131e] border border-white/6 px-5 py-4 rounded-2xl rounded-bl-none flex items-center gap-1.5 shadow-lg shadow-black/40">
                    <span
                      className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggested Chips Panel */}
        {profile && !sending && !loading && (
          <div className="px-5 pb-3 flex gap-2 overflow-x-auto scrollbar-none shrink-0 mask-gradient-r">
            {(dynamicSuggestions.length > 0 ? dynamicSuggestions : getSuggestions()).map(
              (suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(suggestion)}
                  className={`border text-[10px] font-bold px-3.5 py-2.5 rounded-xl whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-md ${
                    suggestion.includes("Dashboard") || suggestion.includes("Go to")
                      ? "bg-gradient-to-r from-violet-600/30 to-purple-600/30 hover:from-violet-600/45 hover:to-purple-600/45 border-violet-500/30 text-violet-200 hover:text-white animate-pulse shadow-violet-950/20"
                      : "bg-[#131320] hover:bg-[#1c1c32] border-white/8 text-zinc-300 hover:text-white"
                  }`}
                >
                  {suggestion}
                </button>
              )
            )}
            {profile.onboardingStage >= 6 &&
              !(dynamicSuggestions.length > 0 ? dynamicSuggestions : getSuggestions()).some(
                (s) => s.includes("Dashboard") || s.includes("Go to")
              ) && (
                <button
                  onClick={() => handleSend("Go to Dashboard 🚀")}
                  className="bg-gradient-to-r from-violet-600/30 to-purple-600/30 hover:from-violet-600/45 hover:to-purple-600/45 border border-violet-500/30 text-violet-200 hover:text-white px-3.5 py-2.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 shadow-md animate-pulse"
                >
                  Go to Dashboard 🚀
                </button>
              )}
          </div>
        )}

        {/* Input Control Box */}
        <div className="p-5 bg-[#080810] border-t border-white/5 sticky bottom-0 z-40 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend(inputText)
            }}
            className="flex items-center gap-2 max-w-3xl mx-auto w-full relative"
          >
            {/* Custom Emoji Picker Popup */}
            {showEmojiPicker && (
              <div className="absolute bottom-16 left-0 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-2xl rounded-2xl overflow-hidden border border-white/10">
                <EmojiPicker
                  theme={"dark" as any}
                  onEmojiClick={(emojiData) => {
                    setInputText((prev) => prev + emojiData.emoji)
                    setShowEmojiPicker(false)
                  }}
                  height={320}
                  width={280}
                />
              </div>
            )}

            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  profile && profile.onboardingStage < 6
                    ? "Answer MirrorMind's inquiry..."
                    : "Chat with your double..."
                }
                className="w-full bg-[#13131e] border border-white/8 rounded-xl pl-4.5 pr-12 py-3.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-violet-600 transition-colors shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1"
              >
                <Smile size={18} />
              </button>
            </div>

            <button
              type="submit"
              disabled={sending || !inputText.trim()}
              className="w-12 h-12 rounded-xl bg-violet-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white flex items-center justify-center transition-colors cursor-pointer hover:bg-violet-500 shadow-md shadow-violet-950/40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
