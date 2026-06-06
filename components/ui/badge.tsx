import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-purple-800 text-white shadow hover:bg-purple-900": variant === "default",
          "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80": variant === "secondary",
          "border-transparent bg-red-500 text-zinc-50 shadow hover:bg-red-500/80": variant === "destructive",
          "border-transparent bg-green-500 text-zinc-50 shadow hover:bg-green-500/80": variant === "success",
          "border-transparent bg-yellow-400 text-zinc-900 shadow hover:bg-yellow-400/80": variant === "warning",
          "text-zinc-950": variant === "outline",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
