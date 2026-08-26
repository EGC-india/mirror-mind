"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Shield, Eye, Database, AlertCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"
import { toast } from "sonner"

export default function PrivacyPage() {
  const { data: session } = useSession()
  const [userAgent, setUserAgent] = useState("")
  const [showClearModal, setShowClearModal] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserAgent(window.navigator.userAgent) // eslint-disable-line react-hooks/exhaustive-deps
    }
  }, [])

  const handleClearArchive = async () => {
    if (confirmText !== "DELETE") {
      toast.error("Please type 'DELETE' exactly to confirm.")
      return
    }

    setClearing(true)
    try {
      const res = await fetch("/api/decisions?id=all", {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete decisions archive")

      toast.success("Your decision archive has been completely erased.")
      setShowClearModal(false)
      setConfirmText("")
    } catch (err) {
      console.error("Archive clear error:", err)
      toast.error("Failed to clear data archive. Please try again.")
    } finally {
      setClearing(false)
    }
  }

  // Helper to simplify user agent for aesthetics
  const getShortBrowser = (ua: string) => {
    if (!ua) return "Detecting Browser..."
    if (ua.includes("Chrome")) return "Google Chrome"
    if (ua.includes("Firefox")) return "Mozilla Firefox"
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Apple Safari"
    if (ua.includes("Edge")) return "Microsoft Edge"
    return "Web Browser"
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#080810] text-white">
      <div className="px-5 pt-8 pb-24 max-w-md mx-auto w-full">
        {/* Back navigation */}
        <div className="mb-6">
          <Link
            href="/profile"
            className="inline-flex items-center text-xs text-zinc-500 hover:text-zinc-300 gap-1.5 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Profile
          </Link>
        </div>

        <h1 className="text-xl font-bold text-white mb-2">Privacy & Security</h1>
        <p className="text-zinc-500 text-xs mb-8">
          Manage your personal data archive, review operational security parameters, and configure
          retention policies.
        </p>

        {/* Security Summary Cards */}
        <div className="space-y-4 mb-8">
          {/* Card 1 */}
          <div className="bg-[#13131e] border border-white/6 rounded-2xl p-4 flex gap-4">
            <div className="w-9 h-9 rounded-xl bg-violet-900/30 border border-violet-800/40 flex items-center justify-center text-violet-400 shrink-0">
              <Database size={18} />
            </div>
            <div>
              <h3 className="text-white text-sm font-bold">Encrypted Storage</h3>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                All decision logs and cognitive profiles are stored in MongoDB Atlas with active
                AES-256 encryption at rest and SSL/TLS transport encryption.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-[#13131e] border border-white/6 rounded-2xl p-4 flex gap-4">
            <div className="w-9 h-9 rounded-xl bg-purple-900/30 border border-purple-800/40 flex items-center justify-center text-purple-400 shrink-0">
              <Eye size={18} />
            </div>
            <div>
              <h3 className="text-white text-sm font-bold">Zero-Data-Retention LLM Calls</h3>
              <p className="text-zinc-500 text-xs mt-1 leading-relaxed">
                Our AI connections to Anthropic are designated under enterprise policies:
                your inputs are never cached for training public LLM models.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-[#13131e] border border-white/6 rounded-2xl p-4 flex gap-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-900/30 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-white text-sm font-bold">Current Active Session</h3>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500">Account:</span>
                  <span className="text-zinc-300 font-medium">
                    {session?.user?.email || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500">Security Strategy:</span>
                  <span className="text-zinc-300 font-medium">JSON Web Token (JWT)</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500">Client Agent:</span>
                  <span className="text-zinc-300 font-medium truncate max-w-[180px]">
                    {getShortBrowser(userAgent)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        {/* <div className="bg-red-950/10 border border-red-900/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-red-400" />
            <h3 className="text-red-400 text-sm font-bold">Danger Zone</h3>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed mb-4">
            Erasing your archive will permanently delete all decision logs, stress metrics, regret
            scores, and behavioral profiling stats. This cannot be undone.
          </p>
          <button
            onClick={() => setShowClearModal(true)}
            className="w-full bg-red-900/25 border border-red-800/30 hover:bg-red-900/40 hover:border-red-700/50 text-red-400 font-bold py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={14} />
            Clear Decision Archive
          </button>
        </div> */}
      </div>

      {/* Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-[110] px-4 pb-10">
          <div className="bg-[#1a1a27] border border-white/10 rounded-[32px] p-6 w-full max-w-sm animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
            <h3 className="text-white font-bold text-lg mb-2 text-center">
              Confirm Permanent Erasure
            </h3>
            <p className="text-zinc-500 text-xs text-center mb-6 leading-relaxed">
              This action will destroy all logged entries in your MongoDB database. Please type{" "}
              <span className="text-red-400 font-bold">DELETE</span> to authorize.
            </p>

            <input
              type="text"
              placeholder="Type DELETE here"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full bg-[#13131e] border border-white/8 rounded-xl px-4 py-3 text-sm text-center text-red-400 placeholder:text-zinc-700 focus:outline-none focus:border-red-500 mb-5"
            />

            <div className="flex flex-col gap-3">
              <button
                onClick={handleClearArchive}
                disabled={clearing || confirmText !== "DELETE"}
                className="w-full bg-red-600 hover:bg-red-500 disabled:bg-zinc-800 text-white font-bold py-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {clearing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 size={14} />
                    Confirm Archive Deletion
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowClearModal(false)
                  setConfirmText("")
                }}
                className="w-full bg-[#13131e] border border-white/8 text-zinc-300 font-bold py-4 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
