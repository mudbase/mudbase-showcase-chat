"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AuthShell } from "@/components/auth/AuthShell"
import { RegisterForm } from "@/components/auth/RegisterForm"
import { useAuth } from "@/hooks/useAuth"

export default function RegisterPage(): React.JSX.Element {
  const { isAuthenticated, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace("/")
  }, [isAuthenticated, loading, router])

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start messaging in seconds"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthShell>
  )
}
