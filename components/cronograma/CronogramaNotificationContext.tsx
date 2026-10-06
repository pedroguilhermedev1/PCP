"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { getUserRole, getUserCD } from "@/lib/roles";

export interface CronogramaNotificationContextType {
  unseenCount: number;
  activeNotification: any | null;
  dismissNotification: () => void;
  markAllAsSeen: () => void;
}

const Context = createContext<CronogramaNotificationContextType | undefined>(undefined);

export function CronogramaNotificationProvider({ children }: { children: ReactNode }) {
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const [unseenCount, setUnseenCount] = useState(0);
  const [activeNotification, setActiveNotification] = useState<any | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("pcp_cronograma_last_seen");
    if (!saved) {
      const now = new Date().toISOString();
      localStorage.setItem("pcp_cronograma_last_seen", now);
      setLastSeen(now);
    } else {
      setLastSeen(saved);
    }
  }, []);

  useEffect(() => {
    if (!lastSeen || !supabase) return;

    const checkNewEvents = async () => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from("cronograma_entregas")
        .select("*")
        .gt("created_at", lastSeen)
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const user = localStorage.getItem('pcp_user');
        const role = getUserRole(user || '');
        const userCd = getUserCD(user || '');

        let filteredData = data;
        if (role === 'OPERACIONAL' && userCd) {
          filteredData = data.filter(d => d.cd.toLowerCase() === userCd.toLowerCase());
        }

        if (filteredData.length > 0) {
          setUnseenCount(filteredData.length);
          
          const storedDismissed = JSON.parse(localStorage.getItem("pcp_cronograma_dismissed") || "[]");
          const notDismissed = filteredData.filter(d => !storedDismissed.includes(d.id));
          
          if (notDismissed.length > 0) {
            setActiveNotification((prev: any) => prev || notDismissed[0]);
          }
        } else {
          setUnseenCount(0);
        }
      } else {
        setUnseenCount(0);
      }
    };

    checkNewEvents();
    const intervalId = setInterval(checkNewEvents, 15000);
    return () => clearInterval(intervalId);
  }, [lastSeen]);

  const dismissNotification = () => {
    if (activeNotification) {
      const stored = JSON.parse(localStorage.getItem("pcp_cronograma_dismissed") || "[]");
      stored.push(activeNotification.id);
      localStorage.setItem("pcp_cronograma_dismissed", JSON.stringify(stored));
      setActiveNotification(null);
    }
  };

  const markAllAsSeen = () => {
    const now = new Date().toISOString();
    localStorage.setItem("pcp_cronograma_last_seen", now);
    setLastSeen(now);
    setUnseenCount(0);
    setActiveNotification(null);
    localStorage.removeItem("pcp_cronograma_dismissed");
  };

  return (
    <Context.Provider value={{
      unseenCount,
      activeNotification,
      dismissNotification,
      markAllAsSeen
    }}>
      {children}
    </Context.Provider>
  );
}

export function useCronogramaNotification() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useCronogramaNotification must be used within CronogramaNotificationProvider");
  return ctx;
}
