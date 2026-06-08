"use client";

import { useEffect, useState } from "react";

export type InsumoMovimentacao = {
  id: string;
  responsavel: string;
  tipo: 'Entrada' | 'Saída';
  item: string;
  codigo?: string;
  quantidade: number;
  data_hora: string;
  marca: string;
  setor?: string;
  solicitante?: string;
  justificativa?: string;
};

export function useInsumosMovimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<InsumoMovimentacao[]>([]);

  useEffect(() => {
    const data = localStorage.getItem('insumos_movimentacoes');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // Map old data to new schema to avoid crashes
        const fixed = parsed.map((m: any) => {
          if (!m.id) {
            m.id = crypto.randomUUID(); // Fallback for old items that didn't have id
          }
          return {
            ...m,
            setor: m.setor || 'N/A',
            justificativa: m.justificativa || m.observacoes || 'N/A',
          };
        });
        setMovimentacoes(fixed);
        // Ensure that any generated IDs are saved back to localStorage so they don't change on next reload
        localStorage.setItem('insumos_movimentacoes', JSON.stringify(fixed));
      } catch (e) {
        console.error("Failed to parse insumos:", e);
      }
    }
  }, []);

  const addMovimentacao = async (mov: Omit<InsumoMovimentacao, 'id' | 'data_hora'>) => {
    const newMov: InsumoMovimentacao = {
      ...mov,
      id: crypto.randomUUID(),
      data_hora: new Date().toISOString()
    };
    
    setMovimentacoes(prev => {
      const updated = [...prev, newMov];
      localStorage.setItem('insumos_movimentacoes', JSON.stringify(updated));
      return updated;
    });
    
    const cdTarget = (mov.marca === 'sas' || mov.marca === 'sae') ? `JDI-${mov.marca.toUpperCase()}` : mov.marca.toUpperCase();

    // Dispara a atualização no banco de dados (Supabase)
    try {
      await fetch('/api/estoque', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cd: cdTarget,
          item: mov.item,
          codigo: mov.codigo,
          tipo: mov.tipo,
          quantidade: mov.quantidade
        })
      });
    } catch (e) {
      console.error("Failed to update remote stock:", e);
    }
    
    return newMov;
  };

  const deleteMovimentacao = (id: string) => {
    setMovimentacoes(prev => {
      const updated = prev.filter(m => m.id !== id);
      localStorage.setItem('insumos_movimentacoes', JSON.stringify(updated));
      return updated;
    });
  };

  const updateMovimentacao = (id: string, updates: Partial<InsumoMovimentacao>) => {
    setMovimentacoes(prev => {
      const updated = prev.map(m => m.id === id ? { ...m, ...updates } : m);
      localStorage.setItem('insumos_movimentacoes', JSON.stringify(updated));
      return updated;
    });
  };

  const clearMovimentacoes = () => {
    setMovimentacoes([]);
    localStorage.setItem('insumos_movimentacoes', JSON.stringify([]));
  };

  return {
    movimentacoes,
    addMovimentacao,
    deleteMovimentacao,
    updateMovimentacao,
    clearMovimentacoes
  };
}
