"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface Lembrete {
  id: string;
  text: string;
  scheduledFor: string; // ISO date string
  isCompleted: boolean;
  notified: boolean; 
  createdAt: string;
}

interface LembretesContextType {
  lembretes: Lembrete[];
  addLembrete: (lembrete: Omit<Lembrete, "id" | "createdAt" | "notified">) => void;
  updateLembrete: (id: string, updates: Partial<Lembrete>) => void;
  deleteLembrete: (id: string) => void;
  markAsCompleted: (id: string) => void;
  markAllNotified: () => void;
  pendingNotifiedLembretes: Lembrete[];
  activeNotification: Lembrete | null;
  dismissNotification: () => void;
  forceRender: number;
}

const LembretesContext = createContext<LembretesContextType | undefined>(undefined);

export function LembretesProvider({ children }: { children: ReactNode }) {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [activeNotification, setActiveNotification] = useState<Lembrete | null>(null);
  const [forceRender, setForceRender] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("pcp_lembretes");
    if (saved) {
      try {
        setLembretes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse lembretes", e);
      }
    }
  }, []);

  const saveLembretes = (newVal: Lembrete[]) => {
    setLembretes(newVal);
    localStorage.setItem("pcp_lembretes", JSON.stringify(newVal));
  };

  const addLembrete = (data: Omit<Lembrete, "id" | "createdAt" | "notified">) => {
    const novo: Lembrete = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      notified: false,
    };
    saveLembretes([...lembretes, novo]);
  };

  const updateLembrete = (id: string, updates: Partial<Lembrete>) => {
    const novo = lembretes.map(l => l.id === id ? { ...l, ...updates } : l);
    saveLembretes(novo);
  };

  const deleteLembrete = (id: string) => {
    saveLembretes(lembretes.filter(l => l.id !== id));
    if (activeNotification?.id === id) {
      setActiveNotification(null);
    }
  };

  const markAsCompleted = (id: string) => {
    updateLembrete(id, { isCompleted: true });
    if (activeNotification?.id === id) {
      setActiveNotification(null);
    }
  };

  const markAllNotified = () => {
    const novo = lembretes.map(l => {
      if (!l.isCompleted && new Date(l.scheduledFor).getTime() <= new Date().getTime()) {
        return { ...l, notified: true };
      }
      return l;
    });
    saveLembretes(novo);
  };

  // Poll for notifications
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date().getTime();
      let hasUpdates = false;
      const novo = [...lembretes];
      let notificationToShow: Lembrete | null = null;

      for (let i = 0; i < novo.length; i++) {
        const l = novo[i];
        if (!l.isCompleted && !l.notified) {
          const scheduledDate = new Date(l.scheduledFor).getTime();
          if (now >= scheduledDate) {
            novo[i] = { ...l, notified: true };
            hasUpdates = true;
            notificationToShow = novo[i];
          }
        }
      }

      if (hasUpdates) {
        saveLembretes(novo);
        if (notificationToShow) {
          setActiveNotification(notificationToShow);
        }
      }
      
      setForceRender(prev => prev + 1); // trigger re-eval of pending ones mostly for UI time updates
    };

    const intervalId = setInterval(checkNotifications, 10000); // 10s
    return () => clearInterval(intervalId);
  }, [lembretes]);

  const pendingNotifiedLembretes = lembretes.filter(l => !l.isCompleted && l.notified);

  const dismissNotification = () => {
    setActiveNotification(null);
  };

  return (
    <LembretesContext.Provider value={{
      lembretes,
      addLembrete,
      updateLembrete,
      deleteLembrete,
      markAsCompleted,
      markAllNotified,
      pendingNotifiedLembretes,
      activeNotification,
      dismissNotification,
      forceRender
    }}>
      {children}
    </LembretesContext.Provider>
  );
}

export function useLembretes() {
  const ctx = useContext(LembretesContext);
  if (!ctx) throw new Error("useLembretes must be used within LembretesProvider");
  return ctx;
}
