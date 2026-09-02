"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AuthShell } from "@/components/auth/AuthShell"
import { LoginForm } from "@/components/auth/LoginForm"
import { useAuth } from "@/hooks/useAuth"

export default function LoginPage(): React.JSX.Element {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace("/")
  }, [isAuthenticated, loading, router])

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your conversations"
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-primary underline underline-offset-4">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  )
}
