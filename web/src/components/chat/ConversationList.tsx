"use client"

import { Hash, Megaphone, MessageSquarePlus, Users } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useChats } from "@/hooks/useChats"
import { chatAvatarName, chatTitle, lastMessagePreview } from "@/lib/chat-display"
import { cn, formatRelativeTime } from "@/lib/utils"
import { docId, type Chat } from "@/types/chat"

function TypeIcon({ chat }: { chat: Chat }): React.JSX.Element | null {
  if (chat.type === "group") return <Users className="h-3.5 w-3.5" />
  if (chat.type === "channel") return <Hash className="h-3.5 w-3.5" />
  if (chat.type === "broadcast") return <Megaphone className="h-3.5 w-3.5" />
  return null
}

export function ConversationList({
  selfUserId,
  selectedChatId,
  onSelect,
  onNewChat,
}: {
  selfUserId: string
  selectedChatId: string | null
  onSelect: (chatId: string) => void
  onNewChat: () => void
}): React.JSX.Element {
  const { data: chats, isLoading, isError, error } = useChats()

  if (isLoading) {
    return (
      <div className="flex-1 space-y-1 overflow-y-auto p-2" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg p-3">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
              <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
        <p className="text-sm text-destructive">Could not load your conversations.</p>
        <p className="text-xs text-muted-foreground">{(error as Error)?.message}</p>
      </div>
    )
  }

  if (!chats || chats.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MessageSquarePlus className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-medium">No conversations yet</p>
          <p className="mt-1 text-xs text-muted-foreground">Start a direct message, group, or channel.</p>
        </div>
        <Button size="sm" onClick={onNewChat}>
          New conversation
        </Button>
      </div>
    )
  }

  return (
    <nav className="flex-1 overflow-y-auto p-2" aria-label="Conversations">
      {chats.map((chat) => {
        const id = docId(chat)
        const active = id === selectedChatId
        const time = chat.lastMessageAt ?? chat.updatedAt ?? chat.createdAt
        return (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors",
              active ? "bg-primary/10" : "hover:bg-muted",
            )}
            aria-current={active ? "true" : undefined}
          >
            <Avatar name={chatAvatarName(chat, selfUserId)} size="md" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <TypeIcon chat={chat} />
                <span className="truncate text-sm font-semibold">{chatTitle(chat, selfUserId)}</span>
                <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                  {time ? formatRelativeTime(time) : ""}
                </span>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="truncate text-xs text-muted-foreground">{lastMessagePreview(chat)}</span>
                {chat.unreadCount ? (
                  <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                    {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                  </span>
                ) : null}
              </div>
            </div>
          </button>
        )
      })}
    </nav>
  )
}
