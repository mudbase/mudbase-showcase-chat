import { MessageCircle } from "lucide-react"

export function EmptyState(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <MessageCircle className="h-8 w-8" />
      </div>
      <div>
        <h2 className="text-lg font-semibold">Your messages</h2>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
          Pick a conversation on the left, or start a new one. Messages, reactions, read receipts, and presence update
          in real time.
        </p>
      </div>
    </div>
  )
}
