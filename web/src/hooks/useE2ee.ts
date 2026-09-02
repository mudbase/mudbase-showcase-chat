"use client"

import { useEffect, useState } from "react"
import { useMudbase } from "@/lib/mudbase-provider"
import { ensureIdentityKey } from "@/lib/e2ee"
import type { ParticipantKey } from "@/types/chat"

/**
 * On sign-in, generates this device's encryption identity (if needed) and publishes its public
 * key so other participants can encrypt messages to this user.
 */
export function useE2eeIdentity(): { ready: boolean } {
  const { client, session } = useMudbase()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!session) return
    let cancelled = false
    void (async () => {
      const pub = await ensureIdentityKey()
      if (pub) {
        try {
          await client.putE2eeKey(pub)
        } catch {
          // Key registration is best-effort; encrypted send falls back gracefully if it fails.
        }
      }
      if (!cancelled) setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [client, session])

  return { ready }
}

export function useParticipantKeys() {
  const { client } = useMudbase()
  return {
    fetch: (chatId: string): Promise<ParticipantKey[]> => client.getParticipantKeys(chatId),
  }
}
