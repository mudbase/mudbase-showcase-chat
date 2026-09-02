// Types mirroring the Mudbase chat API's response shapes. The server denormalizes senders and
// participants into small user summaries, so a populated reference and a bare id can both appear
// depending on the endpoint - these types cover both.

export type ChatType = "direct" | "group" | "channel" | "broadcast"

export type MessageType = "text" | "image" | "video" | "audio" | "file" | "location" | "contact" | "system"

export interface UserSummary {
  id?: string
  _id?: string
  firstName?: string
  lastName?: string
  email?: string
  isAnonymous?: boolean
}

export interface ChatParticipant {
  user: UserSummary | string
  role?: "owner" | "admin" | "moderator" | "member"
  joinedAt?: string
}

export interface MessageMedia {
  url: string
  filename?: string
  size?: number
  mimeType?: string
  duration?: number
  thumbnail?: string
  width?: number
  height?: number
}

export interface MessageContent {
  text?: string
  media?: MessageMedia
}

export interface MessageReaction {
  user: UserSummary | string
  emoji: string
  createdAt?: string
}

export interface ReadReceipt {
  user: UserSummary | string
  readAt: string
}

export interface MessageE2ee {
  enabled?: boolean
  ciphertext?: string
  /** Per-recipient wrapped keys, keyed by user id (populated by clients, opaque to the server). */
  keys?: Record<string, string>
  alg?: string
}

export interface ChatMessage {
  id?: string
  _id?: string
  chat: string
  sender: UserSummary | string
  type: MessageType
  content?: MessageContent
  replyTo?: ChatMessage | string | null
  mentions?: Array<{ user: UserSummary | string; position?: number; length?: number }>
  reactions?: MessageReaction[]
  readBy?: ReadReceipt[]
  deliveredTo?: ReadReceipt[]
  e2ee?: MessageE2ee
  isEdited?: boolean
  deletedAt?: string | null
  createdAt: string
  updatedAt?: string
}

export interface Chat {
  id?: string
  _id?: string
  name: string
  description?: string
  type: ChatType
  participants: ChatParticipant[]
  avatar?: string
  lastMessage?: ChatMessage | string | null
  lastMessageAt?: string | null
  unreadCount?: number
  settings?: Record<string, unknown>
  createdAt: string
  updatedAt?: string
}

export interface CreateChatInput {
  name: string
  description?: string
  type: ChatType
  participants: string[]
  settings?: Record<string, unknown>
}

export interface SendMessageInput {
  type: MessageType
  content?: MessageContent
  replyTo?: string
  mentions?: string[]
  e2ee?: {
    ciphertext: string
    keys?: Record<string, string>
    alg?: string
  }
}

export interface ParticipantKey {
  userId: string
  publicKey: string
}

export interface PresenceEntry {
  userId: string
  online: boolean
  lastSeen?: string | null
}

// ─── Helpers for the id / populated-reference duality ────────────────────────

export function refId(ref: UserSummary | string | null | undefined): string {
  if (!ref) return ""
  if (typeof ref === "string") return ref
  return ref.id ?? ref._id ?? ""
}

export function docId(doc: { id?: string; _id?: string } | null | undefined): string {
  if (!doc) return ""
  return doc.id ?? doc._id ?? ""
}

export function displayName(user: UserSummary | string | null | undefined): string {
  if (!user || typeof user === "string") return "Member"
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim()
  if (name) return name
  if (user.isAnonymous) return "Guest"
  return user.email?.split("@")[0] ?? "Member"
}
