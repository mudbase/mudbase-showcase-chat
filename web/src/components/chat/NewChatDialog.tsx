"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateChat } from "@/hooks/useChats"
import { CHAT_WRITE_ENABLED } from "@/lib/config"
import { MudbaseError } from "@/lib/mudbase"
import { docId, type ChatType } from "@/types/chat"

const TYPES: { value: ChatType; label: string; hint: string }[] = [
  { value: "direct", label: "Direct", hint: "A private 1:1 conversation" },
  { value: "group", label: "Group", hint: "A private group with several people" },
  { value: "channel", label: "Channel", hint: "An open channel others can join" },
]

export function NewChatDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (chatId: string) => void
}): React.JSX.Element | null {
  const create = useCreateChat()
  const [type, setType] = useState<ChatType>("direct")
  const [name, setName] = useState("")
  const [participantsRaw, setParticipantsRaw] = useState("")
  const [formError, setFormError] = useState<string | null>(null)

  if (!open) return null

  const reset = () => {
    setType("direct")
    setName("")
    setParticipantsRaw("")
    setFormError(null)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    const participants = participantsRaw
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)

    if (type === "direct" && participants.length !== 1) {
      setFormError("A direct message needs exactly one other participant id.")
      return
    }
    if (type !== "direct" && !name.trim()) {
      setFormError("Give this conversation a name.")
      return
    }
    if (participants.length === 0) {
      setFormError("Add at least one participant id.")
      return
    }

    try {
      const chat = await create.mutateAsync({
        name: type === "direct" ? name.trim() || "Direct message" : name.trim(),
        type,
        participants,
      })
      reset()
      onCreated(docId(chat))
    } catch (err) {
      setFormError(err instanceof MudbaseError ? err.message : "Could not create the conversation.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">New conversation</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {!CHAT_WRITE_ENABLED ? (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300">
            This demo is running in read-only mode. Set a project messaging key to create conversations and send
            messages.
          </p>
        ) : null}

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`rounded-lg border p-2 text-center text-sm transition-colors ${
                  type === t.value ? "border-primary bg-primary/10 font-medium" : "border-border hover:bg-muted"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{TYPES.find((t) => t.value === type)?.hint}</p>

          {type !== "direct" ? (
            <div className="space-y-2">
              <Label htmlFor="chatName">Name</Label>
              <Input id="chatName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Design team" />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="participants">Participant ids</Label>
            <Input
              id="participants"
              value={participantsRaw}
              onChange={(e) => setParticipantsRaw(e.target.value)}
              placeholder={type === "direct" ? "One user id" : "Comma-separated user ids"}
            />
            <p className="text-xs text-muted-foreground">
              Enter the Mudbase user id of each person to add. User discovery is app-specific, so this demo takes ids
              directly.
            </p>
          </div>

          {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || !CHAT_WRITE_ENABLED}>
              {create.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
