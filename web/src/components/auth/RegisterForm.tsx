"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/useAuth"

export function RegisterForm(): React.JSX.Element {
  const { register, login, loading, error, clearError } = useAuth()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [agreed, setAgreed] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    clearError()
    setNotice(null)
    const res = await register(email, password, firstName, lastName, agreed)
    if (!res.success) return
    if (res.requireVerification) {
      setNotice("Account created. Check your inbox for the verification link, then sign in.")
      return
    }
    // Some projects issue a session immediately - sign in and continue.
    await login(email, password)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </div>
      <label className="flex items-start gap-2 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          required
        />
        <span>I agree to the Terms of Service and Privacy Policy.</span>
      </label>
      {notice ? <p className="text-sm text-accent-foreground/90">{notice}</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  )
}
