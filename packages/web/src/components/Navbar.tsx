export function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Logo */}
        <a href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="h-6 w-6 rounded-full bg-white" />
          open-browser.ai
        </a>

        {/* Right side - can add global app actions here later */}
        <div className="flex items-center gap-4">
          {/* Future: Global app navigation, user menu, etc. */}
        </div>
      </div>
    </header>
  )
}
