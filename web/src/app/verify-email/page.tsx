"use client"

import Link from "next/link"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AuthShell } from "@/components/auth/AuthShell"
import { Button } from "@/components/ui/button"
import { useMudbase } from "@/lib/mudbase-provider"
import { MudbaseError } from "@/lib/mudbase"

function VerifyEmailInner(): React.JSX.Element {
  const { client } = useMudbase()
  const params = useSearchParams()
  const token = params.get("token")
  const [state, setState] = useState<"working" | "done" | "error">("working")
  const [message, setMessage] = useState("Confirming your email...")

  useEffect(() => {
    if (!token) {
      setState("error")
      setMessage("This link is missing its verification token.")
      return
    }
    void (async () => {
      try {
        const res = await client.verifyEmail(token)
        setState("done")
        setMessage(res.message || "Your email is verified. You can sign in now.")
      } catch (err) {
        setState("error")
        setMessage(err instanceof MudbaseError ? err.message : "We could not verify this link.")
      }
    })()
  }, [client, token])

  return (
    <AuthShell title="Email verification" subtitle="Confirming your account">
      <div className="rounded-lg border border-border bg-card p-6 text-center">
        <p className={state === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{message}</p>
        {state !== "working" ? (
          <Button asChild className="mt-4 w-full">
            <Link href="/login">Go to sign in</Link>
          </Button>
        ) : null}
      </div>
    </AuthShell>
  )
}

export default function VerifyEmailPage(): React.JSX.Element {
  return (
    <Suspense fallback={<AuthShell title="Email verification" subtitle="Confirming your account"><div /></AuthShell>}>
      <VerifyEmailInner />
    </Suspense>
  )
}
