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
        setMovimentacoes(parsed.map((m: any) => ({
          id: crypto.randomUUID(), // Fallback for old items that didn't have id
          ...m,
          setor: m.setor || 'N/A',
          justificativa: m.justificativa || m.observacoes || 'N/A',
        })));
      } catch (e) {
        console.error("Failed to parse insumos:", e);
      }
    }
  }, []);

  const saveToStorage = (data: InsumoMovimentacao[]) => {
    setMovimentacoes(data);
    localStorage.setItem('insumos_movimentacoes', JSON.stringify(data));
  };

  const addMovimentacao = (mov: Omit<InsumoMovimentacao, 'id' | 'data_hora'>) => {
    const newMov: InsumoMovimentacao = {
      ...mov,
      id: crypto.randomUUID(),
      data_hora: new Date().toISOString()
    };
    saveToStorage([...movimentacoes, newMov]);
    return newMov;
  };

  const deleteMovimentacao = (id: string) => {
    const updated = movimentacoes.filter(m => m.id !== id);
    saveToStorage(updated);
  };

  const updateMovimentacao = (id: string, updates: Partial<InsumoMovimentacao>) => {
    const updated = movimentacoes.map(m => m.id === id ? { ...m, ...updates } : m);
    saveToStorage(updated);
  };

  const clearMovimentacoes = () => {
    saveToStorage([]);
  };

  return {
    movimentacoes,
    addMovimentacao,
    deleteMovimentacao,
    updateMovimentacao,
    clearMovimentacoes
  };
}
