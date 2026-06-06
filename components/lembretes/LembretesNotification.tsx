"use client";

import { useLembretes } from "./LembretesContext";
import { Bell, X, Check } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";

export function LembretesNotification() {
  const { activeNotification, dismissNotification, markAsCompleted } = useLembretes();
  const router = useRouter();
  const pathname = usePathname();

  if (!activeNotification) return null;

  const handleGoToLembretes = () => {
    dismissNotification();
    if (pathname !== "/compras/lembretes") {
      router.push("/compras/lembretes");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-4 right-4 z-50 bg-white border border-purple-200 shadow-xl rounded-xl p-3 max-w-sm w-[280px] flex flex-col gap-2.5"
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="bg-purple-200 text-purple-800 p-1.5 rounded-full flex-shrink-0">
            <Bell className="w-4 h-4" />
          </div>
          <div 
            className="flex-1 cursor-pointer group"
            onClick={handleGoToLembretes}
          >
            <h4 className="font-semibold text-zinc-900 text-sm group-hover:text-purple-800 transition-colors">Lembrete</h4>
            <p className="text-zinc-600 text-xs mt-1 line-clamp-3 group-hover:text-zinc-900 transition-colors">
              {activeNotification.text}
            </p>
          </div>
          <button 
            onClick={dismissNotification}
            className="text-zinc-400 hover:text-zinc-600 transition-colors flex-shrink-0 -mt-0.5 -mr-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2 mt-1 pt-2.5 border-t border-zinc-100">
          <button
            onClick={() => markAsCompleted(activeNotification.id)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-purple-200 hover:bg-purple-200 text-purple-900 py-1.5 rounded-md text-[11px] font-semibold transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Concluir
          </button>
          <button
            onClick={handleGoToLembretes}
            className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white py-1.5 rounded-md text-[11px] font-semibold transition-colors"
          >
            Ver todos
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
