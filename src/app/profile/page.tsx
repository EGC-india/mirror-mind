"use client"

import { useEffect, useState } from "react"
import { Bell, Shield, LogOut, ChevronRight, Download, HelpCircle, History } from "lucide-react"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ProfilePage() {
  const [stats, setStats] = useState({ total: 0, good: 0, avgConfidence: 0 })
  const [showLogout, setShowLogout] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [hasPassword, setHasPassword] = useState<boolean | null>(null)
  const [password, setPassword] = useState("")
  const [confirmText, setConfirmText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [checkingAccountType, setCheckingAccountType] = useState(false)

  const { data: session } = useSession()

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/decisions")
        const data = await res.json()
        if (Array.isArray(data)) {
          const total = data.length
          const good = data.filter((d: any) => d.outcome === "good").length
          const avgConfidence = total
            ? Math.round(data.reduce((acc: number, d: any) => acc + d.confidence, 0) / total)
            : 0
          setStats({ total, good, avgConfidence })
        }
      } catch (error) {
        console.error("Failed to fetch profile data", error)
      }
    }
    fetchData()
  }, [])

  const handleExportDecisions = async () => {
    try {
      const res = await fetch("/api/decisions")
      if (!res.ok) throw new Error("Failed to fetch decisions")
      const data = await res.json()
      if (!Array.isArray(data) || data.length === 0) {
        toast.info("No decisions recorded yet to export.")
        return
      }

      const headers = [
        "Title",
        "Category",
        "Choice",
        "Confidence",
        "Outcome",
        "Reasoning",
        "Created At",
      ]
      const csvRows = [
        headers.join(","),
        ...data.map((d) => {
          const values = [
            d.title || "",
            d.category || "",
            d.choice || "",
            d.confidence ?? "",
            d.outcome || "",
            d.reasoning || "",
            d.createdAt ? new Date(d.createdAt).toISOString() : "",
          ]
          return values.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(",")
        }),
      ]

      const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(csvRows.join("\n"))
      const downloadAnchor = document.createElement("a")
      downloadAnchor.setAttribute("href", csvContent)
      downloadAnchor.setAttribute(
        "download",
        `mirrormind_decisions_${new Date().toISOString().split("T")[0]}.csv`
      )
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
      toast.success("Decisions exported successfully!")
    } catch (error) {
      console.error("Failed to export decisions", error)
      toast.error("Failed to export decisions. Please try again.")
    }
  }

  const handleOpenDeleteModal = async () => {
    setCheckingAccountType(true)
    try {
      const res = await fetch("/api/account/delete")
      if (res.ok) {
        const data = await res.json()
        setHasPassword(data.hasPassword)
        setIsDeleteModalOpen(true)
      } else {
        toast.error("Failed to verify account settings. Please try again.")
      }
    } catch (err) {
      toast.error("Failed to verify account settings. Please try again.")
    } finally {
      setCheckingAccountType(false)
    }
  }

  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setPassword("")
    setConfirmText("")
    setDeleteError(null)
  }

  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    setDeleteError(null)
    try {
      const payload: { password?: string } = {}
      if (hasPassword) {
        payload.password = password
      }

      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        toast.success("Account deleted successfully.")
        setIsDeleteModalOpen(false)
        await signOut({ callbackUrl: "/account-deleted" })
      } else {
        const data = await res.json().catch(() => ({}))
        if (res.status === 403) {
          setDeleteError("Incorrect password.")
        } else if (res.status === 400) {
          setDeleteError("Password is required.")
        } else {
          setDeleteError(data.error || "Something went wrong, please try again.")
        }
      }
    } catch (err) {
      setDeleteError("Something went wrong, please try again.")
    } finally {
      setIsDeleting(false)
    }
  }

  const settingsItems = [
    {
      label: "Decision History",
      icon: History,
      href: "/decisions",
    },
    {
      label: "Notifications",
      icon: Bell,
      href: "/profile/notifications",
    },
    {
      label: "Export Decisions",
      icon: Download,
      href: "/profile/export",
    },
    {
      label: "Privacy & Security",
      icon: Shield,
      href: "/profile/privacy",
    },
    {
      label: "Help & Support",
      icon: HelpCircle,
      href: "/profile/support",
    },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#080810] text-white">
      <div className="px-5 pt-10 pb-24">
        <h1 className="text-xl font-bold text-white mb-6">Profile</h1>

        {/* Avatar + Info */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-purple-800 flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg shadow-violet-900/40">
            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "EX"}
          </div>
          <h2 className="text-white text-lg font-bold">{session?.user?.name || "Explorer"}</h2>
          <p className="text-zinc-500 text-sm">{session?.user?.email || ""}</p>
          <div className="mt-2 px-3 py-1 rounded-full bg-violet-900/40 border border-violet-700/40">
            <p className="text-violet-300 text-xs font-medium">Pro Member</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-[#13131e] border border-white/6 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-zinc-600 text-[10px] uppercase tracking-wider mt-0.5">Total</p>
          </div>
          <div className="bg-[#13131e] border border-white/6 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-emerald-400">{stats.good}</p>
            <p className="text-zinc-600 text-[10px] uppercase tracking-wider mt-0.5">Good</p>
          </div>
          <div className="bg-[#13131e] border border-white/6 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-violet-400">{stats.avgConfidence}%</p>
            <p className="text-zinc-600 text-[10px] uppercase tracking-wider mt-0.5">Conf.</p>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-[#13131e] border border-white/6 rounded-2xl overflow-hidden mb-4">
          {settingsItems.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className="w-full flex items-center gap-3 px-4 py-4 border-b border-white/4 last:border-0 hover:bg-white/2 transition-colors group text-left cursor-pointer"
            >
              <item.icon
                size={18}
                className="text-zinc-500 group-hover:text-violet-400 transition-colors"
              />
              <span className="text-zinc-300 text-sm flex-1">{item.label}</span>
              <ChevronRight size={16} className="text-zinc-700" />
            </Link>
          ))}
        </div>

        <button
          onClick={() => setShowLogout(true)}
          className="w-full bg-red-900/10 border border-red-900/20 hover:bg-red-900/20 hover:border-red-900/40 text-red-400 font-semibold py-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          Log Out
        </button>

        {/* Danger Zone */}
        <div className="mt-8 p-6 bg-red-950/10 border border-red-900/20 rounded-2xl">
          <h3 className="text-red-400 font-bold text-base mb-2">Delete Account</h3>
          <p className="text-zinc-500 text-sm mb-4">
            Permanently delete your account and all associated data, including decision history, episodic memories, and companion messages. This action cannot be undone.
          </p>
          <button
            onClick={handleOpenDeleteModal}
            disabled={checkingAccountType}
            className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {checkingAccountType ? "Checking..." : "Delete Account"}
          </button>
        </div>
      </div>

      {/* Logout modal */}
      {showLogout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-end justify-center z-[100] px-4 pb-10">
          <div className="bg-[#1a1a27] border border-white/10 rounded-[32px] p-6 w-full max-w-sm animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />
            <h3 className="text-white font-bold text-xl mb-2 text-center">Log Out?</h3>
            <p className="text-zinc-500 text-sm text-center mb-8">
              You'll need to sign back in to access your decisions archive.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-2xl text-sm transition-colors"
              >
                Yes, Log Out
              </button>
              <button
                onClick={() => setShowLogout(false)}
                className="w-full bg-[#13131e] border border-white/8 text-zinc-300 font-bold py-4 rounded-2xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => { if (!open) handleCloseDeleteModal() }}>
        <DialogContent className="bg-[#1a1a27] border-white/10 text-white max-w-sm rounded-[32px] p-6">
          <DialogHeader>
            <DialogTitle className="text-white font-bold text-xl text-center">Delete Account?</DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm text-center mt-2">
              This action is permanent and irreversible. It will delete all your decisions, reflections, and profile data.
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 space-y-4">
            {hasPassword ? (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400">
                  Confirm Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-[#13131e] border-white/10 text-white focus-visible:ring-violet-500 rounded-xl"
                  disabled={isDeleting}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400">
                  Type <span className="text-red-400 font-bold select-all">DELETE</span> to confirm
                </label>
                <Input
                  type="text"
                  placeholder="Type DELETE"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="bg-[#13131e] border-white/10 text-white focus-visible:ring-violet-500 rounded-xl uppercase"
                  disabled={isDeleting}
                />
              </div>
            )}

            {deleteError && (
              <p className="text-red-400 text-xs font-semibold text-center bg-red-950/10 border border-red-900/20 py-2 rounded-xl">
                {deleteError}
              </p>
            )}
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:space-x-0">
            <Button
              onClick={handleDeleteAccount}
              disabled={
                isDeleting ||
                (hasPassword ? !password : confirmText !== "DELETE")
              }
              variant="destructive"
              className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold py-4 h-auto rounded-2xl text-sm transition-colors border-none"
            >
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
            <Button
              onClick={handleCloseDeleteModal}
              disabled={isDeleting}
              variant="outline"
              className="w-full bg-[#13131e] border border-white/8 hover:bg-white/5 hover:text-white text-zinc-300 font-bold py-4 h-auto rounded-2xl text-sm transition-colors"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
