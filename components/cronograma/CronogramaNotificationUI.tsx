"use client";

import { useCronogramaNotification } from "./CronogramaNotificationContext";
import { Calendar, X, Eye } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";

export function CronogramaNotificationUI() {
  const { activeNotification, dismissNotification, markAllAsSeen } = useCronogramaNotification();
  const router = useRouter();
  const pathname = usePathname();

  if (!activeNotification) return null;

  const handleGoToCronograma = () => {
    markAllAsSeen();
    if (pathname !== "/compras/cronograma") {
      router.push("/compras/cronograma");
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed bottom-4 left-4 z-50 bg-white border border-blue-200 shadow-xl rounded-xl p-3 max-w-sm w-[280px] flex flex-col gap-2.5"
      >
        <div className="flex items-start justify-between gap-2.5">
          <div className="bg-blue-100 text-blue-700 p-1.5 rounded-full flex-shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div 
            className="flex-1 cursor-pointer group"
            onClick={handleGoToCronograma}
          >
            <h4 className="font-semibold text-zinc-900 text-sm group-hover:text-blue-700 transition-colors">Novo Evento</h4>
            <p className="text-zinc-600 text-xs mt-1 line-clamp-2 group-hover:text-zinc-900 transition-colors">
              <span className="font-bold">{activeNotification.cd}</span>: {activeNotification.description}
            </p>
            <p className="text-zinc-400 text-[10px] mt-0.5">
              {activeNotification.date?.split('-').reverse().join('/')} às {activeNotification.time}
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
            onClick={handleGoToCronograma}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-800 py-1.5 rounded-md text-[11px] font-semibold transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Ver Cronograma
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
