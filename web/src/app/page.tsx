"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { ChatShell } from "@/components/chat/ChatShell"

export default function HomePage(): React.JSX.Element {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace("/login")
  }, [isAuthenticated, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" aria-label="Loading" />
      </div>
    )
  }

  if (!isAuthenticated) return <div className="min-h-screen bg-background" />

  return <ChatShell />
}
