"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type Fornecedor = {
  id: string;
  tipo: 'Material' | 'Serviço';
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  contato: string;
  telefone: string;
  email: string;
  categoria: string;
  observacoes: string;
  codigo_fornecedor?: string;
  tipo_servico?: string;
  created_at: string;
};

export function useFornecedores(tipoFiltro?: 'Material' | 'Serviço') {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  const fetchFornecedores = useCallback(async () => {
    if (!supabase) return;
    let query = supabase.from("fornecedores").select("*").order("created_at", { ascending: false });
    
    if (tipoFiltro) {
      query = query.eq("tipo", tipoFiltro);
    }

    const { data, error } = await query;
    if (!error && data) {
      setFornecedores(data as Fornecedor[]);
    }
  }, [tipoFiltro]);

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  const addFornecedor = async (f: Omit<Fornecedor, 'id' | 'created_at'>) => {
    if (!supabase) return;
    const { data, error } = await supabase.from("fornecedores").insert([f]).select().single();
    if (!error && data) {
      setFornecedores(prev => [data as Fornecedor, ...prev]);
      return data;
    }
    return null;
  };

  const deleteFornecedor = async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase.from("fornecedores").delete().eq("id", id);
    if (!error) {
      setFornecedores(prev => prev.filter(f => f.id !== id));
    }
  };

  const updateFornecedor = async (id: string, updates: Partial<Fornecedor>) => {
    if (!supabase) return;
    const { data, error } = await supabase.from("fornecedores").update(updates).eq("id", id).select().single();
    if (!error && data) {
      setFornecedores(prev => prev.map(f => f.id === id ? (data as Fornecedor) : f));
    }
  };

  return {
    fornecedores,
    addFornecedor,
    deleteFornecedor,
    updateFornecedor,
    refresh: fetchFornecedores
  };
}
