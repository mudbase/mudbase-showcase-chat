export function TypingIndicator({ names }: { names: string[] }): React.JSX.Element {
  const label =
    names.length === 1
      ? `${names[0]} is typing`
      : names.length === 2
        ? `${names[0]} and ${names[1]} are typing`
        : "Several people are typing"

  return (
    <div className="flex items-center gap-2 px-1 py-1 text-xs text-muted-foreground" aria-live="polite">
      <span className="flex gap-0.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </span>
      {label}
    </div>
  )
}
