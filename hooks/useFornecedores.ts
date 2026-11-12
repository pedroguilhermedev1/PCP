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
    if (!supabase) return null;
    const { data, error } = await supabase.from("fornecedores").insert([f]).select().single();
    if (error) {
      console.error("Erro ao adicionar fornecedor:", error);
      throw error;
    }
    if (data) {
      setFornecedores(prev => [data as Fornecedor, ...prev]);
      await fetchFornecedores();
      return data;
    }
    return null;
  };

  const deleteFornecedor = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!supabase) return { success: false, error: "Conexão com banco de dados indisponível." };

    const target = fornecedores.find(f => f.id === id);
    if (target) {
      try {
        const filters: string[] = [];
        if (target.razao_social && target.razao_social.trim()) {
          filters.push(`fornecedor.ilike.%${target.razao_social.trim()}%`);
        }
        if (target.nome_fantasia && target.nome_fantasia.trim()) {
          filters.push(`fornecedor.ilike.%${target.nome_fantasia.trim()}%`);
        }
        if (target.cnpj && target.cnpj.trim()) {
          filters.push(`cnpj.eq.${target.cnpj.trim()}`);
        }

        if (filters.length > 0) {
          const { count } = await supabase
            .from("faturas")
            .select("id", { count: "exact", head: true })
            .or(filters.join(","));

          if (count && count > 0) {
            const displayName = target.nome_fantasia || target.razao_social;
            return {
              success: false,
              error: `Não é possível excluir o fornecedor "${displayName}": existem ${count} fatura(s) vinculadas a este fornecedor no histórico. Preservar o histórico dos registros é obrigatório.`
            };
          }
        }
      } catch (err: any) {
        console.error("Erro ao checar dependências de fatura:", err);
      }
    }

    const { error } = await supabase.from("fornecedores").delete().eq("id", id);
    if (error) {
      console.error("Erro ao excluir fornecedor:", error);
      return { success: false, error: error.message };
    }

    setFornecedores(prev => prev.filter(f => f.id !== id));
    return { success: true };
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
