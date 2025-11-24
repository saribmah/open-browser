import { GithubIcon, XIcon } from "./icons"

export function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Logo */}
        <a href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="h-6 w-6 rounded-full bg-white" />
          open-browser.ai
          <span className="text-xs font-normal text-white/50 self-start mt-2">(open-github.com)</span>
        </a>

        {/* Right side - Social links */}
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/saribmah"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <GithubIcon className="h-5 w-5" />
          </a>
          <a
            href="https://x.com/saribmah"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </a>
        </div>
      </div>
    </header>
  )
}
