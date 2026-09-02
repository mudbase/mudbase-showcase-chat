"use client"

import { LogOut, PenSquare } from "lucide-react"
import { Avatar } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/useAuth"
import { useSocket } from "@/hooks/useSocket"
import { cn } from "@/lib/utils"

const statusLabel: Record<string, string> = {
  connected: "Connected",
  connecting: "Connecting",
  disconnected: "Offline",
  error: "Reconnecting",
}

export function AppHeader({ onNewChat }: { onNewChat: () => void }): React.JSX.Element {
  const { user, logout } = useAuth()
  const { status } = useSocket()
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "You"

  return (
    <header className="flex items-center gap-3 border-b border-border px-4 py-3">
      <Avatar name={name} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 rounded-full",
              status === "connected" ? "bg-emerald-500" : status === "error" ? "bg-amber-500" : "bg-muted-foreground",
            )}
          />
          {statusLabel[status] ?? status}
        </p>
      </div>
      <Button variant="ghost" size="icon" onClick={onNewChat} aria-label="New conversation">
        <PenSquare className="h-5 w-5" />
      </Button>
      <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Sign out">
        <LogOut className="h-5 w-5" />
      </Button>
    </header>
  )
}
