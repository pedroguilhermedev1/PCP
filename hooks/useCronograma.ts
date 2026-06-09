"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type CronogramaEvento = {
  id: string;
  date: string;       // YYYY-MM-DD
  time: string;       // HH:MM
  description: string;
  cd: string;          // SAS, SAE, IS, COC, NSE, PSD, Raízes
  created_by: string;
  created_at: string;
};

export function useCronograma() {
  const [eventos, setEventos] = useState<CronogramaEvento[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEventos = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    // Supabase client uses PostgREST which shouldn't cache on the client side the same way standard fetch does,
    // but just in case, let's force no-cache by adding a dummy filter if needed, 
    // actually supabase js client uses standard fetch underneath. We can pass a header or query.
    // In this codebase supabase is imported from lib/supabase. Let's just do a normal query.
    // Wait, with supabase js client we don't have this cache issue usually, because we call `.from()`.
    // Next.js might cache it if it's during SSR, but this is a client component.
    // Let's force a cache bypass just in case.
    const { data, error } = await supabase
      .from("cronograma_entregas")
      .select("*")
      .neq("cd", "FORNECEDORES")
      .order("date", { ascending: true })
      .order("time", { ascending: true });

    if (!error && data) {
      setEventos(data as CronogramaEvento[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  const addEvento = async (evento: Omit<CronogramaEvento, "id" | "created_at">) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("cronograma_entregas")
      .insert([evento]);

    if (!error) {
      await fetchEventos();
      return true;
    }
    return false;
  };

  const updateEvento = async (id: string, updates: Partial<CronogramaEvento>) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("cronograma_entregas")
      .update(updates)
      .eq("id", id);

    if (!error) {
      await fetchEventos();
      return true;
    }
    return false;
  };

  const deleteEvento = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from("cronograma_entregas")
      .delete()
      .eq("id", id);

    if (!error) {
      await fetchEventos();
      return true;
    }
    return false;
  };

  return { eventos, loading, fetchEventos, addEvento, updateEvento, deleteEvento };
}
