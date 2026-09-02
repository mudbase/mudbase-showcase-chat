import { displayName, refId, type Chat, type ChatMessage, type UserSummary } from "@/types/chat"

/** The participants other than the current user. */
export function otherParticipants(chat: Chat, selfUserId: string): UserSummary[] {
  return (chat.participants ?? [])
    .filter((p) => refId(p.user) !== selfUserId)
    .map((p) => (typeof p.user === "string" ? { id: p.user } : p.user))
}

/** A human title for a conversation: the other person for DMs, the chat name otherwise. */
export function chatTitle(chat: Chat, selfUserId: string): string {
  if (chat.type === "direct") {
    const others = otherParticipants(chat, selfUserId)
    if (others.length > 0) return displayName(others[0])
  }
  return chat.name || "Conversation"
}

/** The name used to seed the avatar badge. */
export function chatAvatarName(chat: Chat, selfUserId: string): string {
  return chatTitle(chat, selfUserId)
}

export function chatTypeLabel(chat: Chat): string {
  switch (chat.type) {
    case "direct":
      return "Direct message"
    case "group":
      return "Group"
    case "channel":
      return "Channel"
    case "broadcast":
      return "Broadcast"
    default:
      return ""
  }
}

/** A one-line preview of the last message for the conversation list. */
export function lastMessagePreview(chat: Chat): string {
  const lm = chat.lastMessage
  if (!lm || typeof lm === "string") return chat.type === "channel" ? "No messages yet" : "Say hello"
  return messagePreview(lm)
}

export function messagePreview(msg: ChatMessage): string {
  if (msg.deletedAt) return "Message deleted"
  if (msg.e2ee?.ciphertext) return "Encrypted message"
  switch (msg.type) {
    case "image":
      return "Photo"
    case "video":
      return "Video"
    case "audio":
      return "Audio message"
    case "file":
      return msg.content?.media?.filename ?? "File"
    case "location":
      return "Location"
    case "contact":
      return "Contact"
    default:
      return msg.content?.text ?? ""
  }
}
