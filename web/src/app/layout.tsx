import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { MudbaseProvider } from "@/lib/mudbase-provider"
import { QueryProvider } from "@/components/providers/QueryProvider"
import { MUDBASE_PROJECT_ID, MUDBASE_URL } from "@/lib/config"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" })

export const metadata: Metadata = {
  title: {
    template: "%s | Mudbase Chat",
    default: "Mudbase Chat - a messenger built on Mudbase",
  },
  description:
    "A complete messenger - direct messages, groups, channels, media, reactions, replies, read receipts, typing, presence, and end-to-end encryption - built on Mudbase's ready-made chat API.",
}

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">
        <QueryProvider>
          <MudbaseProvider config={{ projectId: MUDBASE_PROJECT_ID, baseUrl: MUDBASE_URL }}>
            {children}
          </MudbaseProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
