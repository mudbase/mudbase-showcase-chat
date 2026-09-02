"use client"

import { useEffect, useRef } from "react"
import { MessageBubble } from "@/components/chat/MessageBubble"
import { TypingIndicator } from "@/components/chat/TypingIndicator"
import { docId, refId, type ChatMessage } from "@/types/chat"

function dayLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Today"
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d)
}

export function MessageList({
  messages,
  loading,
  error,
  selfUserId,
  chatId,
  typingNames,
  onReply,
}: {
  messages: ChatMessage[]
  loading: boolean
  error: boolean
  selfUserId: string
  chatId: string
  typingNames: string[]
  onReply: (message: ChatMessage) => void
}): React.JSX.Element {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, typingNames.length])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center" aria-busy="true">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-destructive">
        Could not load messages. Check your connection and try again.
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-1 p-6 text-center">
        <p className="text-sm font-medium">No messages yet</p>
        <p className="text-xs text-muted-foreground">Send the first message to get the conversation going.</p>
      </div>
    )
  }

  let lastDay = ""
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-1">
        {messages.map((msg, i) => {
          const day = dayLabel(msg.createdAt)
          const showDay = day !== lastDay
          lastDay = day
          const prev = messages[i - 1]
          const grouped = prev != null && refId(prev.sender) === refId(msg.sender) && !showDay
          return (
            <div key={docId(msg) || i}>
              {showDay ? (
                <div className="my-3 flex items-center justify-center">
                  <span className="rounded-full bg-muted px-3 py-1 text-[11px] font-medium text-muted-foreground">
                    {day}
                  </span>
                </div>
              ) : null}
              <MessageBubble
                message={msg}
                selfUserId={selfUserId}
                chatId={chatId}
                grouped={grouped}
                onReply={onReply}
              />
            </div>
          )
        })}
        {typingNames.length > 0 ? <TypingIndicator names={typingNames} /> : null}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
