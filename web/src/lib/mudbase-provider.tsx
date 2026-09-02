"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { MudbaseClient, initMudbase, type MudbaseConfig, type SessionResponse } from "./mudbase"
import { useSocket } from "@/hooks/useSocket"

interface MudbaseContextValue {
  client: MudbaseClient
  session: SessionResponse | null
  loading: boolean
  refreshSession: () => Promise<void>
}

const MudbaseContext = createContext<MudbaseContextValue | null>(null)

export function MudbaseProvider({
  children,
  config,
}: {
  children: React.ReactNode
  config: MudbaseConfig
}): React.JSX.Element {
  const [client] = useState<MudbaseClient>(() => initMudbase(config))
  const [session, setSession] = useState<SessionResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const s = await client.getSession()
      setSession(s)
    } catch {
      setSession(null)
      client.clearToken()
    }
  }, [client])

  useEffect(() => {
    const establish = async (): Promise<void> => {
      // A messenger is identity-first: there is no anonymous "guest" browsing mode. If a stored
      // token exists we restore that session; otherwise we stay signed out and the routes gate
      // the user to sign in. Presence and delivery only make sense for a named account.
      if (client.getToken()) {
        await refreshSession()
      } else {
        setSession(null)
      }
      setLoading(false)
    }
    void establish()
  }, [client, refreshSession])

  return (
    <MudbaseContext.Provider value={{ client, session, loading, refreshSession }}>
      <SocketBridge />
      {children}
    </MudbaseContext.Provider>
  )
}

/**
 * Establishes the realtime connection for the current session inside the context that created
 * it, so any component subscribing to a chat room can rely on the socket already existing.
 */
function SocketBridge(): null {
  useSocket()
  return null
}

export function useMudbase(): MudbaseContextValue {
  const ctx = useContext(MudbaseContext)
  if (!ctx) throw new Error("useMudbase must be used inside <MudbaseProvider>")
  return ctx
}
