import { MessageCircle } from "lucide-react"
import Link from "next/link"

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer?: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {children}
          {footer ? <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div> : null}
        </div>
      </div>
      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        Built on{" "}
        <Link href="https://www.mudbase.dev" className="underline underline-offset-4" target="_blank" rel="noreferrer">
          Mudbase
        </Link>
        {" - a ready-made chat API."}
      </footer>
    </div>
  )
}
