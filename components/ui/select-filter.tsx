import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectFilterProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  highlight?: boolean;
}

const SelectFilter = React.forwardRef<HTMLSelectElement, SelectFilterProps>(
  ({ className, label, options, highlight, ...props }, ref) => {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm transition-all h-9",
        highlight 
          ? "bg-purple-50/50 border-purple-200 hover:bg-purple-50/80" 
          : "bg-white border-zinc-200 hover:border-zinc-300",
        className
      )}>
        {label && (
          <span className={cn(
            "text-[11px] font-semibold uppercase tracking-wider",
            highlight ? "text-purple-700" : "text-zinc-500"
          )}>
            {label}
          </span>
        )}
        <select
          ref={ref}
          className={cn(
            "text-[13px] font-medium bg-transparent outline-none cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed",
            highlight ? "text-purple-900 font-bold" : "text-zinc-800",
            label ? "min-w-[70px]" : "w-full"
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
)
SelectFilter.displayName = "SelectFilter"

export { SelectFilter }
