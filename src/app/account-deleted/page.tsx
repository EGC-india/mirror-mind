import Link from "next/link"

export default function AccountDeletedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#080810] text-white px-5 text-center">
      <div className="max-w-md w-full bg-[#13131e] border border-white/6 rounded-3xl p-8 shadow-xl shadow-purple-950/10">
        <h1 className="text-2xl font-bold mb-4">Account Deleted</h1>
        <p className="text-zinc-400 text-sm mb-8">
          Your account and all associated data have been permanently deleted. Thank you for using MirrorMind.
        </p>
        <Link
          href="/"
          className="inline-block w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-2xl text-sm transition-colors text-center"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  )
}
