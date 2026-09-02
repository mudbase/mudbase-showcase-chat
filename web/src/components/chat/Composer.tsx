"use client"

import { useRef, useState } from "react"
import { Lock, Paperclip, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSendText } from "@/hooks/useMessages"
import { useMudbase } from "@/lib/mudbase-provider"
import { useParticipantKeys } from "@/hooks/useE2ee"
import { e2eeAvailable } from "@/lib/e2ee"
import { CHAT_WRITE_ENABLED, STORAGE_UPLOAD_ENABLED, MUDBASE_STORAGE_BUCKET } from "@/lib/config"
import { cn } from "@/lib/utils"
import { messagePreview } from "@/lib/chat-display"
import { displayName, docId, type ChatMessage, type MessageMedia } from "@/types/chat"

function mediaTypeFor(mime: string): "image" | "video" | "audio" | "file" {
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("audio/")) return "audio"
  return "file"
}

export function Composer({
  chatId,
  selfUserId,
  replyTo,
  onClearReply,
  onTyping,
}: {
  chatId: string
  selfUserId: string
  replyTo: ChatMessage | null
  onClearReply: () => void
  onTyping: (isTyping: boolean) => void
}): React.JSX.Element {
  const { client } = useMudbase()
  const { sendText, sendEncrypted, sendMedia } = useSendText(chatId)
  const participantKeys = useParticipantKeys()
  const fileRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState("")
  const [encrypt, setEncrypt] = useState(false)
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const replyId = replyTo ? docId(replyTo) : undefined

  const handleSend = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setNotice(null)
    onTyping(false)
    try {
      if (encrypt) {
        const keys = (await participantKeys.fetch(chatId)).filter((k) => k.userId !== selfUserId && k.publicKey)
        if (keys.length === 0) {
          setNotice("No one else in this chat has published an encryption key yet, so this message cannot be encrypted.")
          setSending(false)
          return
        }
        const ok = await sendEncrypted(body, keys, replyId)
        if (!ok) {
          setNotice("Encryption is not available on this device.")
          setSending(false)
          return
        }
      } else {
        await sendText(body, replyId)
      }
      setText("")
      onClearReply()
    } catch {
      setNotice("Message could not be sent. Please try again.")
    } finally {
      setSending(false)
    }
  }

  const handleFile = async (file: File) => {
    setNotice(null)
    if (!STORAGE_UPLOAD_ENABLED) {
      setNotice("Native upload needs a project storage key. Paste a public link instead.")
      return
    }
    setSending(true)
    try {
      const uploaded = await client.uploadFile(MUDBASE_STORAGE_BUCKET, file)
      const media: MessageMedia = {
        url: uploaded.url,
        filename: uploaded.originalName,
        size: uploaded.size,
        mimeType: uploaded.mimetype,
      }
      await sendMedia(media, mediaTypeFor(uploaded.mimetype), replyId)
      onClearReply()
    } catch {
      setNotice("Upload failed. Check the storage key and bucket, or share a link instead.")
    } finally {
      setSending(false)
    }
  }

  const handleLink = async () => {
    const url = window.prompt("Paste a public link to an image, video, or file")
    if (!url) return
    const clean = url.trim()
    const lower = clean.toLowerCase()
    const type: "image" | "video" | "audio" | "file" =
      /\.(png|jpe?g|gif|webp|avif)$/.test(lower)
        ? "image"
        : /\.(mp4|webm|mov)$/.test(lower)
          ? "video"
          : /\.(mp3|wav|ogg|m4a)$/.test(lower)
            ? "audio"
            : "file"
    setSending(true)
    try {
      await sendMedia({ url: clean, filename: clean.split("/").pop() }, type, replyId)
      onClearReply()
    } catch {
      setNotice("Could not share that link.")
    } finally {
      setSending(false)
    }
  }

  if (!CHAT_WRITE_ENABLED) {
    return (
      <div className="border-t border-border bg-card px-4 py-4 text-center text-sm text-muted-foreground">
        This demo is in read-only mode. Add a project messaging key to send messages.
      </div>
    )
  }

  return (
    <div className="border-t border-border bg-card px-3 py-3">
      {replyTo ? (
        <div className="mx-auto mb-2 flex max-w-3xl items-center gap-2 rounded-lg bg-muted px-3 py-1.5 text-xs">
          <div className="min-w-0 flex-1">
            <span className="font-medium">Replying to {displayName(replyTo.sender)}</span>
            <p className="truncate text-muted-foreground">{messagePreview(replyTo)}</p>
          </div>
          <button onClick={onClearReply} aria-label="Cancel reply">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {notice ? <p className="mx-auto mb-2 max-w-3xl text-xs text-amber-600 dark:text-amber-400">{notice}</p> : null}

      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
            e.target.value = ""
          }}
        />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => (STORAGE_UPLOAD_ENABLED ? fileRef.current?.click() : void handleLink())}
          aria-label="Attach"
          disabled={sending}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        {e2eeAvailable() ? (
          <Button
            variant={encrypt ? "default" : "ghost"}
            size="icon"
            onClick={() => setEncrypt((v) => !v)}
            aria-label={encrypt ? "Encryption on" : "Encryption off"}
            title={encrypt ? "This message will be end-to-end encrypted" : "Turn on end-to-end encryption"}
            disabled={sending}
          >
            <Lock className="h-5 w-5" />
          </Button>
        ) : null}

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            onTyping(e.target.value.length > 0)
          }}
          onBlur={() => onTyping(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void handleSend()
            }
          }}
          rows={1}
          placeholder={encrypt ? "Encrypted message..." : "Type a message..."}
          className={cn(
            "max-h-32 flex-1 resize-none rounded-2xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        />

        <Button size="icon" onClick={() => void handleSend()} disabled={sending || !text.trim()} aria-label="Send">
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
