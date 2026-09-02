"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useMudbase } from "@/lib/mudbase-provider"
import { MudbaseError, errorCode, type UserObject } from "@/lib/mudbase"
import { getMudbaseSocket } from "@/lib/mudbase-socket"

export interface RegisterResult {
  success: boolean
  /** true when the account was created but still needs email verification before it can sign in. */
  requireVerification: boolean
}

interface UseAuthReturn {
  user: UserObject | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    agreedToTerms: boolean,
  ) => Promise<RegisterResult>
  login: (email: string, password: string, options?: { redirect?: boolean }) => Promise<boolean>
  logout: () => Promise<void>
  clearError: () => void
}

export function useAuth(): UseAuthReturn {
  const { client, session, loading: sessionLoading, refreshSession } = useMudbase()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
      agreedToTerms: boolean,
    ): Promise<RegisterResult> => {
      setLoading(true)
      setError(null)
      try {
        const res = await client.register({ email, password, firstName, lastName, agreedToTerms })
        // Only treat this as a live session if a token actually came back. Projects that require
        // email verification return 201 with no token - the account exists but cannot sign in yet.
        if (res.token) await refreshSession()
        return { success: true, requireVerification: res.requireVerification === true || !res.token }
      } catch (err) {
        setError(err instanceof MudbaseError ? err.message : "Registration failed")
        return { success: false, requireVerification: false }
      } finally {
        setLoading(false)
      }
    },
    [client, refreshSession],
  )

  const login = useCallback(
    async (email: string, password: string, options?: { redirect?: boolean }): Promise<boolean> => {
      setLoading(true)
      setError(null)
      try {
        await client.login({ email, password })
        await refreshSession()
        if (options?.redirect !== false) router.push("/")
        return true
      } catch (err) {
        if (errorCode(err) === "EMAIL_VERIFICATION_REQUIRED") {
          setError("Verify your email first - open the link we sent, then sign in.")
        } else {
          setError(err instanceof MudbaseError ? err.message : "Sign in failed")
        }
        return false
      } finally {
        setLoading(false)
      }
    },
    [client, router, refreshSession],
  )

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await client.logout()
      getMudbaseSocket().disconnect()
      await refreshSession()
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }, [client, router, refreshSession])

  const user = session?.user ?? null

  return {
    user,
    isAuthenticated: !!user && user.isAnonymous !== true,
    loading: loading || sessionLoading,
    error,
    register,
    login,
    logout,
    clearError: () => setError(null),
  }
}
