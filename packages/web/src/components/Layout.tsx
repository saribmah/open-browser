import type { ReactNode } from "react"
import { Navbar } from "./Navbar"

interface LayoutProps {
  children: ReactNode
  sandboxStatus?: {
    status: 'active' | 'inactive' | 'loading'
    label?: string
  }
}

export function Layout({ children, sandboxStatus }: LayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar sandboxStatus={sandboxStatus} />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
