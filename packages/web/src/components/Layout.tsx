import type { ReactNode } from "react"
import { Navbar } from "./Navbar"

type SandboxStatus = 'active' | 'inactive' | 'loading'
type SandboxProvider = 'daytona' | 'cloudflare' | 'vercel'

interface LayoutProps {
  children: ReactNode
  sandboxProvider?: SandboxProvider
  sandboxStatus?: SandboxStatus
  timeRemaining?: string
  onProviderChange?: (provider: SandboxProvider) => void
}

export function Layout({ 
  children, 
  sandboxProvider,
  sandboxStatus,
  timeRemaining,
  onProviderChange,
}: LayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar 
        sandboxProvider={sandboxProvider}
        sandboxStatus={sandboxStatus}
        timeRemaining={timeRemaining}
        onProviderChange={onProviderChange}
      />
      <main className="pt-16">
        {children}
      </main>
    </div>
  )
}
