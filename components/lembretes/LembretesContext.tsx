"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";

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
  refresh: () => Promise<void>;
}

const LembretesContext = createContext<LembretesContextType | undefined>(undefined);

export function LembretesProvider({ children }: { children: ReactNode }) {
  const [lembretes, setLembretes] = useState<Lembrete[]>([]);
  const [activeNotification, setActiveNotification] = useState<Lembrete | null>(null);
  const [forceRender, setForceRender] = useState(0);

  const fetchLembretes = useCallback(async () => {
    if (!supabase) return;
    const { data, error } = await supabase.from('lembretes').select('*').order('createdAt', { ascending: false });
    if (!error && data) {
      // API returns column names like scheduledFor, isCompleted because we used them with quotes in SQL,
      // but let's map them just in case.
      const mapped = data.map(l => ({
        id: l.id,
        text: l.text,
        scheduledFor: l.scheduledFor || l.scheduled_for || l.scheduledFor,
        isCompleted: l.isCompleted === true || l.is_completed === true,
        notified: l.notified === true,
        createdAt: l.createdAt || l.created_at || l.createdAt
      })) as Lembrete[];
      setLembretes(mapped);
    }
  }, []);

  useEffect(() => {
    fetchLembretes();
  }, [fetchLembretes]);

  const addLembrete = async (data: Omit<Lembrete, "id" | "createdAt" | "notified">) => {
    const novo: Partial<Lembrete> = {
      ...data,
      notified: false,
    };
    if (!supabase) return;
    const { data: inserted, error } = await supabase.from('lembretes').insert([novo]).select().single();
    if (!error && inserted) {
      setLembretes(prev => [{
        id: inserted.id,
        text: inserted.text,
        scheduledFor: inserted.scheduledFor || inserted.scheduled_for,
        isCompleted: inserted.isCompleted === true,
        notified: inserted.notified === true,
        createdAt: inserted.createdAt || inserted.created_at
      } as Lembrete, ...prev]);
    }
  };

  const updateLembrete = async (id: string, updates: Partial<Lembrete>) => {
    if (!supabase) return;
    setLembretes(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    await supabase.from('lembretes').update(updates).eq('id', id);
  };

  const deleteLembrete = async (id: string) => {
    setLembretes(prev => prev.filter(l => l.id !== id));
    if (activeNotification?.id === id) {
      setActiveNotification(null);
    }
    if (!supabase) return;
    await supabase.from('lembretes').delete().eq('id', id);
  };

  const markAsCompleted = async (id: string) => {
    updateLembrete(id, { isCompleted: true });
    if (activeNotification?.id === id) {
      setActiveNotification(null);
    }
  };

  const markAllNotified = async () => {
    const idsToUpdate: string[] = [];
    setLembretes(prev => prev.map(l => {
      if (!l.isCompleted && new Date(l.scheduledFor).getTime() <= new Date().getTime()) {
        idsToUpdate.push(l.id);
        return { ...l, notified: true };
      }
      return l;
    }));

    if (supabase && idsToUpdate.length > 0) {
      for (const id of idsToUpdate) {
        await supabase.from('lembretes').update({ notified: true }).eq('id', id);
      }
    }
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
        // We update the local state without triggering full DB update here to avoid spamming
        // The individual updates to DB happen when we actually interact. But for just 'notified' flag, 
        // we should persist it.
        setLembretes(novo);
        
        // Optimistically update db
        if (supabase) {
           const newlyNotified = novo.filter((n, idx) => n.notified && !lembretes[idx].notified);
           newlyNotified.forEach(async (n) => {
             await supabase?.from('lembretes').update({ notified: true }).eq('id', n.id);
           });
        }
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
      forceRender,
      refresh: fetchLembretes
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
