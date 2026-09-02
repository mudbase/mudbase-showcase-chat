"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, CheckCheck, CornerUpLeft, Lock, MoreHorizontal, Pencil, SmilePlus, Trash2 } from "lucide-react"
import { useMessageActions } from "@/hooks/useMessages"
import { decryptForSelf } from "@/lib/e2ee"
import { cn, formatDateTime } from "@/lib/utils"
import { messagePreview } from "@/lib/chat-display"
import { docId, displayName, refId, type ChatMessage } from "@/types/chat"

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"]

function TextBody({ message, selfUserId }: { message: ChatMessage; selfUserId: string }): React.JSX.Element {
  const [decrypted, setDecrypted] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  const cipher = message.e2ee?.ciphertext

  useEffect(() => {
    if (!cipher) return
    let active = true
    void decryptForSelf(cipher, selfUserId).then((plain) => {
      if (!active) return
      if (plain == null) setFailed(true)
      else setDecrypted(plain)
    })
    return () => {
      active = false
    }
  }, [cipher, selfUserId])

  if (cipher) {
    if (decrypted != null) {
      return (
        <span className="whitespace-pre-wrap break-words">
          {decrypted}
          <Lock className="ml-1 inline h-3 w-3 align-text-top text-muted-foreground" />
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 text-sm italic text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        {failed ? "Encrypted message - not addressed to this device" : "Decrypting..."}
      </span>
    )
  }
  return <span className="whitespace-pre-wrap break-words">{message.content?.text}</span>
}

function MediaBody({ message }: { message: ChatMessage }): React.JSX.Element {
  const media = message.content?.media
  if (!media?.url) return <span className="text-sm italic text-muted-foreground">{messagePreview(message)}</span>
  if (message.type === "image") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={media.url} alt={media.filename ?? "Image"} className="max-h-72 rounded-lg object-cover" />
  }
  if (message.type === "video") {
    return <video src={media.url} controls className="max-h-72 rounded-lg" />
  }
  if (message.type === "audio") {
    return <audio src={media.url} controls className="w-56" />
  }
  return (
    <a
      href={media.url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-lg bg-background/60 px-3 py-2 text-sm underline underline-offset-2"
    >
      {media.filename ?? "Download file"}
    </a>
  )
}

export function MessageBubble({
  message,
  selfUserId,
  chatId,
  grouped,
  onReply,
}: {
  message: ChatMessage
  selfUserId: string
  chatId: string
  grouped: boolean
  onReply: (message: ChatMessage) => void
}): React.JSX.Element {
  const { react, edit, remove } = useMessageActions(chatId)
  const mine = refId(message.sender) === selfUserId
  const [menuOpen, setMenuOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.content?.text ?? "")
  const messageId = docId(message)

  const reactionGroups = useMemo(() => {
    const groups = new Map<string, { count: number; mine: boolean }>()
    for (const r of message.reactions ?? []) {
      const g = groups.get(r.emoji) ?? { count: 0, mine: false }
      g.count += 1
      if (refId(r.user) === selfUserId) g.mine = true
      groups.set(r.emoji, g)
    }
    return Array.from(groups.entries())
  }, [message.reactions, selfUserId])

  const readByOthers = (message.readBy ?? []).some((r) => refId(r.user) !== selfUserId)

  if (message.deletedAt) {
    return (
      <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
        <div className="my-0.5 rounded-2xl bg-muted px-3 py-1.5 text-xs italic text-muted-foreground">
          This message was deleted
        </div>
      </div>
    )
  }

  if (message.type === "system") {
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
          {message.content?.text ?? "System update"}
        </span>
      </div>
    )
  }

  const toggleReaction = (emoji: string) => {
    const already = reactionGroups.find(([e]) => e === emoji)?.[1].mine
    react.mutate({ messageId, emoji, remove: already })
    setPickerOpen(false)
  }

  const submitEdit = () => {
    if (draft.trim() && draft !== message.content?.text) edit.mutate({ messageId, text: draft.trim() })
    setEditing(false)
    setMenuOpen(false)
  }

  return (
    <div className={cn("group flex items-end gap-2", mine ? "flex-row-reverse" : "flex-row")}>
      <div className={cn("flex max-w-[78%] flex-col", mine ? "items-end" : "items-start")}>
        {!grouped && !mine ? (
          <span className="mb-0.5 px-1 text-xs font-medium text-muted-foreground">{displayName(message.sender)}</span>
        ) : null}

        <div className={cn("flex items-end gap-1.5", mine ? "flex-row-reverse" : "flex-row")}>
          <div
            className={cn(
              "relative rounded-2xl px-3 py-2 text-sm shadow-sm",
              mine ? "bg-primary text-primary-foreground" : "bg-card text-card-foreground border border-border",
            )}
          >
            {message.replyTo && typeof message.replyTo !== "string" ? (
              <div
                className={cn(
                  "mb-1.5 rounded-lg border-l-2 px-2 py-1 text-xs",
                  mine ? "border-primary-foreground/50 bg-primary-foreground/10" : "border-primary/50 bg-muted",
                )}
              >
                <span className="font-medium">{displayName(message.replyTo.sender)}</span>
                <p className="truncate opacity-80">{messagePreview(message.replyTo)}</p>
              </div>
            ) : null}

            {editing ? (
              <div className="flex flex-col gap-1">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitEdit()
                    if (e.key === "Escape") setEditing(false)
                  }}
                  autoFocus
                  className="rounded bg-background/20 px-2 py-1 text-sm text-inherit outline-none"
                />
                <div className="flex gap-2 text-[11px] opacity-80">
                  <button onClick={submitEdit}>Save</button>
                  <button onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </div>
            ) : message.type === "text" ? (
              <TextBody message={message} selfUserId={selfUserId} />
            ) : (
              <MediaBody message={message} />
            )}

            <div
              className={cn(
                "mt-1 flex items-center gap-1 text-[10px]",
                mine ? "text-primary-foreground/70" : "text-muted-foreground",
              )}
            >
              <span>{formatDateTime(message.createdAt).split(", ").pop()}</span>
              {message.isEdited ? <span>edited</span> : null}
              {mine ? (
                readByOthers ? (
                  <CheckCheck className="h-3.5 w-3.5" aria-label="Read" />
                ) : (
                  <Check className="h-3.5 w-3.5" aria-label="Sent" />
                )
              ) : null}
            </div>
          </div>

          {/* Hover actions */}
          <div className="relative flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => setPickerOpen((v) => !v)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              aria-label="React"
            >
              <SmilePlus className="h-4 w-4" />
            </button>
            <button
              onClick={() => onReply(message)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              aria-label="Reply"
            >
              <CornerUpLeft className="h-4 w-4" />
            </button>
            {mine ? (
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="More"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            ) : null}

            {pickerOpen ? (
              <div className="absolute bottom-8 z-10 flex gap-1 rounded-full border border-border bg-card p-1 shadow-md">
                {REACTIONS.map((emoji) => (
                  <button key={emoji} onClick={() => toggleReaction(emoji)} className="rounded-full px-1 text-lg hover:bg-muted">
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}

            {menuOpen && mine ? (
              <div className="absolute bottom-8 right-0 z-10 w-32 rounded-lg border border-border bg-card py-1 shadow-md">
                {message.type === "text" && !message.e2ee?.ciphertext ? (
                  <button
                    onClick={() => {
                      setEditing(true)
                      setDraft(message.content?.text ?? "")
                      setMenuOpen(false)
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                ) : null}
                <button
                  onClick={() => {
                    remove.mutate(messageId)
                    setMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-muted"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {reactionGroups.length > 0 ? (
          <div className={cn("mt-1 flex flex-wrap gap-1", mine ? "justify-end" : "justify-start")}>
            {reactionGroups.map(([emoji, g]) => (
              <button
                key={emoji}
                onClick={() => toggleReaction(emoji)}
                className={cn(
                  "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
                  g.mine ? "border-primary bg-primary/10" : "border-border bg-card",
                )}
              >
                <span>{emoji}</span>
                <span className="text-muted-foreground">{g.count}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
