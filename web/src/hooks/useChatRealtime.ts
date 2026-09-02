"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { getMudbaseSocket } from "@/lib/mudbase-socket"
import { useSocket } from "./useSocket"
import { chatsKey } from "./useChats"
import { messagesKey } from "./useMessages"
import { docId, type ChatMessage } from "@/types/chat"

interface TypingPayload {
  chatId: string
  userId: string
}
interface NewMessagePayload {
  message: ChatMessage
}
interface PresencePayload {
  userId: string
  chatId?: string
}

const TYPING_TIMEOUT_MS = 4000

/**
 * Joins a conversation's realtime room and keeps the message/chat caches, typing indicator, and
 * in-conversation presence in sync. Presence here is scoped to the open conversation room (who
 * has the chat open), which is the signal an end-user account is permitted to observe.
 */
export function useChatRealtime(chatId: string | null) {
  const { status } = useSocket()
  const queryClient = useQueryClient()
  const [typingUserIds, setTypingUserIds] = useState<string[]>([])
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([])
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())
  const lastTypingSent = useRef<number>(0)

  useEffect(() => {
    if (!chatId || status !== "connected") return
    const socket = getMudbaseSocket()
    const timers = typingTimers.current

    socket.emit("chat:join", { chatId })

    const clearTyping = (userId: string) => {
      const t = timers.get(userId)
      if (t) clearTimeout(t)
      timers.delete(userId)
      setTypingUserIds((prev) => prev.filter((id) => id !== userId))
    }

    const offs = [
      socket.on<NewMessagePayload>("message:new", (p) => {
        const msg = p?.message
        if (!msg || String(msg.chat) !== chatId) return
        queryClient.setQueryData<ChatMessage[]>(messagesKey(chatId), (prev = []) => {
          if (prev.some((m) => docId(m) === docId(msg))) return prev
          return [...prev, msg]
        })
        void queryClient.invalidateQueries({ queryKey: chatsKey })
      }),
      socket.on<{ messageId: string }>("message:edited", () => {
        void queryClient.invalidateQueries({ queryKey: messagesKey(chatId) })
      }),
      socket.on<{ messageId: string }>("message:deleted", () => {
        void queryClient.invalidateQueries({ queryKey: messagesKey(chatId) })
      }),
      socket.on<{ messageId: string }>("message:reaction", () => {
        void queryClient.invalidateQueries({ queryKey: messagesKey(chatId) })
      }),
      socket.on<{ chatId: string }>("messages:read", (p) => {
        if (p?.chatId !== chatId) return
        void queryClient.invalidateQueries({ queryKey: messagesKey(chatId) })
      }),
      socket.on<TypingPayload>("user:typing:start", (p) => {
        if (!p?.userId || p.chatId !== chatId) return
        setTypingUserIds((prev) => (prev.includes(p.userId) ? prev : [...prev, p.userId]))
        const existing = timers.get(p.userId)
        if (existing) clearTimeout(existing)
        timers.set(p.userId, setTimeout(() => clearTyping(p.userId), TYPING_TIMEOUT_MS))
      }),
      socket.on<TypingPayload>("user:typing:stop", (p) => {
        if (p?.userId) clearTyping(p.userId)
      }),
      socket.on<PresencePayload>("user:online", (p) => {
        if (!p?.userId) return
        setOnlineUserIds((prev) => (prev.includes(p.userId) ? prev : [...prev, p.userId]))
      }),
      socket.on<PresencePayload>("user:offline", (p) => {
        if (!p?.userId) return
        setOnlineUserIds((prev) => prev.filter((id) => id !== p.userId))
      }),
    ]

    return () => {
      socket.emit("chat:leave", { chatId })
      offs.forEach((off) => off())
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
      setTypingUserIds([])
      setOnlineUserIds([])
    }
  }, [chatId, status, queryClient])

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!chatId || status !== "connected") return
      const socket = getMudbaseSocket()
      if (isTyping) {
        const now = Date.now()
        // Throttle typing:start so we do not flood the room on every keystroke.
        if (now - lastTypingSent.current > 1500) {
          socket.emit("chat:typing:start", { chatId })
          lastTypingSent.current = now
        }
      } else {
        socket.emit("chat:typing:stop", { chatId })
        lastTypingSent.current = 0
      }
    },
    [chatId, status],
  )

  return { typingUserIds, onlineUserIds, emitTyping }
}
