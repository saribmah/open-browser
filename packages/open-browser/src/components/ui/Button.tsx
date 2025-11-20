import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline"
  children: React.ReactNode
}

export function Button({ variant = "default", className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full font-medium transition-colors",
        "h-12 px-8 text-base",
        variant === "default" && "bg-white text-black hover:bg-zinc-200",
        variant === "outline" && "border border-white/20 bg-transparent text-white hover:bg-white/10",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
