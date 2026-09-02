"use client"

import { ArrowLeft, ShieldCheck } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { chatAvatarName, chatTitle, chatTypeLabel } from "@/lib/chat-display"
import { refId, type Chat } from "@/types/chat"

export function ChatHeader({
  chat,
  selfUserId,
  onlineUserIds,
  onBack,
}: {
  chat: Chat | undefined
  selfUserId: string
  onlineUserIds: string[]
  onBack: () => void
}): React.JSX.Element {
  const title = chat ? chatTitle(chat, selfUserId) : "Conversation"
  const memberCount = chat?.participants?.length ?? 0

  let subtitle = ""
  if (chat) {
    if (chat.type === "direct") {
      const otherId = refId(chat.participants?.find((p) => refId(p.user) !== selfUserId)?.user)
      subtitle = otherId && onlineUserIds.includes(otherId) ? "Online now" : chatTypeLabel(chat)
    } else {
      subtitle = `${chatTypeLabel(chat)} - ${memberCount} ${memberCount === 1 ? "member" : "members"}`
    }
  }

  return (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack} aria-label="Back to conversations">
        <ArrowLeft className="h-5 w-5" />
      </Button>
      <Avatar name={chat ? chatAvatarName(chat, selfUserId) : title} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <span className="flex items-center gap-1 text-xs text-muted-foreground" title="End-to-end encryption is available in this chat">
        <ShieldCheck className="h-4 w-4" />
        <span className="hidden sm:inline">Encryption ready</span>
      </span>
    </header>
  )
}
