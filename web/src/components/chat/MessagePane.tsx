"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useChat } from "@/hooks/useChats"
import { useMessages, useMessageActions } from "@/hooks/useMessages"
import { useChatRealtime } from "@/hooks/useChatRealtime"
import { ChatHeader } from "@/components/chat/ChatHeader"
import { MessageList } from "@/components/chat/MessageList"
import { Composer } from "@/components/chat/Composer"
import { EmptyState } from "@/components/chat/EmptyState"
import { docId, refId, type ChatMessage } from "@/types/chat"

export function MessagePane({
  chatId,
  selfUserId,
  onBack,
}: {
  chatId: string | null
  selfUserId: string
  onBack: () => void
}): React.JSX.Element {
  const { data: chat } = useChat(chatId)
  const { data: messages, isLoading, isError } = useMessages(chatId)
  const { typingUserIds, onlineUserIds, emitTyping } = useChatRealtime(chatId)
  const { markRead } = useMessageActions(chatId ?? "")
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null)
  const markedRef = useRef<Set<string>>(new Set())

  // Reset per-conversation state when switching chats.
  useEffect(() => {
    setReplyTo(null)
    markedRef.current = new Set()
  }, [chatId])

  // Read receipts: mark inbound, unread messages as read once they are on screen.
  useEffect(() => {
    if (!chatId || !messages || messages.length === 0) return
    const toMark = messages
      .filter((m) => refId(m.sender) !== selfUserId)
      .filter((m) => !(m.readBy ?? []).some((r) => refId(r.user) === selfUserId))
      .map((m) => docId(m))
      .filter((id) => id && !markedRef.current.has(id))
    if (toMark.length === 0) return
    toMark.forEach((id) => markedRef.current.add(id))
    markRead.mutate(toMark)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, chatId, selfUserId])

  const typingNames = useMemo(() => {
    if (!chat || typingUserIds.length === 0) return [] as string[]
    return typingUserIds
      .filter((id) => id !== selfUserId)
      .map((id) => {
        const p = chat.participants?.find((pt) => refId(pt.user) === id)
        const u = p && typeof p.user !== "string" ? p.user : undefined
        return [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "Someone"
      })
  }, [chat, typingUserIds, selfUserId])

  if (!chatId) return <EmptyState />

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ChatHeader chat={chat} selfUserId={selfUserId} onlineUserIds={onlineUserIds} onBack={onBack} />
      <MessageList
        messages={messages ?? []}
        loading={isLoading}
        error={isError}
        selfUserId={selfUserId}
        chatId={chatId}
        typingNames={typingNames}
        onReply={setReplyTo}
      />
      <Composer
        chatId={chatId}
        selfUserId={selfUserId}
        replyTo={replyTo}
        onClearReply={() => setReplyTo(null)}
        onTyping={emitTyping}
      />
    </div>
  )
}
