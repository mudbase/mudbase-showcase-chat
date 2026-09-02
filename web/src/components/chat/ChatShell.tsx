"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/useAuth"
import { useE2eeIdentity } from "@/hooks/useE2ee"
import { AppHeader } from "@/components/layout/AppHeader"
import { ConversationList } from "@/components/chat/ConversationList"
import { MessagePane } from "@/components/chat/MessagePane"
import { NewChatDialog } from "@/components/chat/NewChatDialog"
import { cn } from "@/lib/utils"

export function ChatShell(): React.JSX.Element {
  const { user } = useAuth()
  useE2eeIdentity()
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const selfId = user?.id ?? ""

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="grid flex-1 grid-cols-1 overflow-hidden md:grid-cols-[340px_1fr]">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex min-h-0 flex-col border-r border-border bg-card",
            selectedChatId ? "hidden md:flex" : "flex",
          )}
        >
          <AppHeader onNewChat={() => setNewChatOpen(true)} />
          <ConversationList
            selfUserId={selfId}
            selectedChatId={selectedChatId}
            onSelect={setSelectedChatId}
            onNewChat={() => setNewChatOpen(true)}
          />
        </aside>

        {/* Message pane */}
        <section
          className={cn(
            "min-h-0 flex-col bg-background",
            selectedChatId ? "flex" : "hidden md:flex",
          )}
        >
          <MessagePane
            chatId={selectedChatId}
            selfUserId={selfId}
            onBack={() => setSelectedChatId(null)}
          />
        </section>
      </div>

      <NewChatDialog
        open={newChatOpen}
        onOpenChange={setNewChatOpen}
        onCreated={(chatId) => {
          setNewChatOpen(false)
          setSelectedChatId(chatId)
        }}
      />
    </div>
  )
}
