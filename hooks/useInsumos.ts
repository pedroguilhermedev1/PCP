"use client";

import { useEffect, useState } from "react";

export type InsumoMovimentacao = {
  id: string;
  identificador?: string;
  codigo_movimentacao?: string;
  usuario: string;
  tipo: 'Entrada' | 'Saída';
  item: string;
  codigo: string;
  quantidade: number;
  data_hora: string;
  cd: string;
  setor?: string;
  observacoes?: string;
  status: 'PENDENTE' | 'CONFIRMADO' | 'REJEITADO';
};

export function useInsumosMovimentacoes(cdTarget?: string, tipo_envio?: string) {
  const [movimentacoes, setMovimentacoes] = useState<InsumoMovimentacao[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMovimentacoes = async (controller?: AbortController) => {
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      let url = cdTarget ? `/api/movimentacoes?cd=${cdTarget}&_t=${timestamp}` : `/api/movimentacoes?_t=${timestamp}`;
      url += `&tipo_envio=${encodeURIComponent(tipo_envio || 'Principal')}`;
      const res = await fetch(url, { 
        cache: 'no-store',
        signal: controller?.signal
      });
      const data = await res.json();
      if (res.ok) {
        setMovimentacoes(data);
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error("Erro ao buscar movimentacoes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    fetchMovimentacoes(abortController);
    return () => { abortController.abort(); };
  }, [cdTarget, tipo_envio]);

  return {
    movimentacoes,
    loading,
    refresh: fetchMovimentacoes
  };
}
