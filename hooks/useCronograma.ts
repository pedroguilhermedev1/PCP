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
    const { data, error } = await supabase
      .from("cronograma_entregas")
      .select("*")
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
