"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type EntregaStatus = "Programada" | "Em Trânsito" | "Recebida" | "Cancelada";

export type Entrega = {
  id: string;
  data: string;
  fornecedor: string;
  produto: string;
  quantidade: string;
  status: EntregaStatus;
  observacao: string;
  responsavel: string;
};

export function useCronogramaFornecedores() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEntregas = useCallback(async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("cronograma_entregas")
      .select("*")
      .eq("cd", "FORNECEDORES")
      .order("date", { ascending: true });

    if (!error && data) {
      const parsedEntregas: Entrega[] = data.map(d => {
        let payload: any = {};
        try { payload = JSON.parse(d.description); } catch(e) {}
        return {
          id: d.id,
          data: d.date,
          fornecedor: payload.fornecedor || "",
          produto: payload.produto || "",
          quantidade: payload.quantidade || "",
          status: payload.status || "Programada",
          observacao: payload.observacao || "",
          responsavel: d.created_by
        };
      });
      setEntregas(parsedEntregas);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntregas();
  }, [fetchEntregas]);

  const addEntrega = async (entrega: Omit<Entrega, "id">) => {
    if (!supabase) return false;
    const { error } = await supabase
      .from("cronograma_entregas")
      .insert([{
        date: entrega.data,
        time: "12:00",
        description: JSON.stringify({
          fornecedor: entrega.fornecedor,
          produto: entrega.produto,
          quantidade: entrega.quantidade,
          status: entrega.status,
          observacao: entrega.observacao
        }),
        cd: "FORNECEDORES",
        created_by: entrega.responsavel
      }]);

    if (!error) {
      await fetchEntregas();
      return true;
    }
    return false;
  };

  const updateEntrega = async (id: string, updates: Partial<Entrega>) => {
    if (!supabase) return false;
    
    // First fetch existing to merge payload
    const { data } = await supabase.from("cronograma_entregas").select("description").eq("id", id).single();
    let currentPayload = {};
    if (data) {
      try { currentPayload = JSON.parse(data.description); } catch(e) {}
    }

    const mergedPayload = { ...currentPayload, ...updates };

    const updateData: any = {
      description: JSON.stringify({
        fornecedor: mergedPayload.fornecedor,
        produto: mergedPayload.produto,
        quantidade: mergedPayload.quantidade,
        status: mergedPayload.status,
        observacao: mergedPayload.observacao
      })
    };
    
    if (updates.data) updateData.date = updates.data;
    if (updates.responsavel) updateData.created_by = updates.responsavel;

    const { error } = await supabase
      .from("cronograma_entregas")
      .update(updateData)
      .eq("id", id);

    if (!error) {
      await fetchEntregas();
      return true;
    }
    return false;
  };

  const deleteEntrega = async (id: string) => {
    if (!supabase) return false;
    const { error } = await supabase
      .from("cronograma_entregas")
      .delete()
      .eq("id", id);

    if (!error) {
      await fetchEntregas();
      return true;
    }
    return false;
  };

  return { entregas, loading, fetchEntregas, addEntrega, updateEntrega, deleteEntrega };
}
