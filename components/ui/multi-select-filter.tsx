"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, X } from "lucide-react";

export interface MultiSelectFilterProps {
  label?: string;
  options: { value: string; label: string }[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  className?: string;
  highlight?: boolean;
}

export function MultiSelectFilter({
  label,
  options,
  selectedValues,
  onChange,
  className,
  highlight,
}: MultiSelectFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (value === "todos") {
      onChange(["todos"]);
      return;
    }

    const newValues = selectedValues.filter((v) => v !== "todos");
    if (newValues.includes(value)) {
      const updated = newValues.filter((v) => v !== value);
      onChange(updated.length === 0 ? ["todos"] : updated);
    } else {
      onChange([...newValues, value]);
    }
  };

  const displayText = React.useMemo(() => {
    if (selectedValues.length === 0 || selectedValues.includes("todos")) {
      return "Todos";
    }
    if (selectedValues.length === 1) {
      return options.find((o) => o.value === selectedValues[0])?.label || selectedValues[0];
    }
    return `${selectedValues.length} selecionados`;
  }, [selectedValues, options]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-lg border shadow-sm transition-all h-9 cursor-pointer select-none",
          highlight
            ? "bg-purple-50/50 border-purple-200 hover:bg-purple-50/80"
            : "bg-white border-zinc-200 hover:border-zinc-300",
          isOpen && "ring-2 ring-purple-500/20 border-purple-500",
          className
        )}
      >
        {label && (
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wider",
              highlight ? "text-purple-700" : "text-zinc-500"
            )}
          >
            {label}
          </span>
        )}
        <div className={cn(
          "flex items-center justify-between gap-1 text-[13px] font-medium min-w-[70px]",
          highlight ? "text-purple-900 font-bold" : "text-zinc-800"
        )}>
          <span className="truncate">{displayText}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-50" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[110] mt-1 w-56 rounded-md bg-white shadow-lg border border-zinc-200 ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-auto py-1">
            {options.map((option) => {
              const isSelected = selectedValues.includes(option.value);
              return (
                <div
                  key={option.value}
                  onClick={() => toggleOption(option.value)}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm cursor-pointer hover:bg-purple-50 transition-colors",
                    isSelected ? "text-purple-900 font-medium bg-purple-50/50" : "text-zinc-700"
                  )}
                >
                  <div className={cn(
                    "mr-3 flex h-4 w-4 items-center justify-center rounded border",
                    isSelected ? "border-purple-600 bg-purple-600" : "border-zinc-300 bg-white"
                  )}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  {option.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
