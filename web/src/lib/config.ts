function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const MUDBASE_PROJECT_ID = requireEnv(
  "NEXT_PUBLIC_MUDBASE_PROJECT_ID",
  process.env.NEXT_PUBLIC_MUDBASE_PROJECT_ID,
)

export const MUDBASE_URL = process.env.NEXT_PUBLIC_MUDBASE_URL ?? "https://cloud.mudbase.dev"

// The role new users are created under (see .env.example). Defaults to the
// platform's built-in "user" role, which grants the chat capability.
export const MUDBASE_APP_ROLE = process.env.NEXT_PUBLIC_MUDBASE_APP_ROLE ?? "user"

// Project key scoped to "messaging" - authorizes the chat write paths for the
// acting user. Empty string means the app runs read-only (see mudbase.ts).
export const MUDBASE_MESSAGING_KEY = process.env.NEXT_PUBLIC_MUDBASE_MESSAGING_KEY ?? ""

// Project key + bucket scoped to "storage" for native media uploads. Optional.
export const MUDBASE_STORAGE_KEY = process.env.NEXT_PUBLIC_MUDBASE_STORAGE_KEY ?? ""
export const MUDBASE_STORAGE_BUCKET = process.env.NEXT_PUBLIC_MUDBASE_STORAGE_BUCKET ?? ""

/** True when the messaging key is configured, so the composer / new-chat actions are live. */
export const CHAT_WRITE_ENABLED = MUDBASE_MESSAGING_KEY.length > 0

/** True when native attachment upload is available (storage key + bucket set). */
export const STORAGE_UPLOAD_ENABLED = MUDBASE_STORAGE_KEY.length > 0 && MUDBASE_STORAGE_BUCKET.length > 0
