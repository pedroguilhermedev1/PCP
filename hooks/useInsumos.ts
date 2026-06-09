"use client";

import { useEffect, useState } from "react";

export type InsumoMovimentacao = {
  id: string;
  identificador?: string;
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

export function useInsumosMovimentacoes(cdTarget?: string) {
  const [movimentacoes, setMovimentacoes] = useState<InsumoMovimentacao[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMovimentacoes = async () => {
    setLoading(true);
    try {
      const timestamp = new Date().getTime();
      const url = cdTarget ? `/api/movimentacoes?cd=${cdTarget}&_t=${timestamp}` : `/api/movimentacoes?_t=${timestamp}`;
      const res = await fetch(url, { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setMovimentacoes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovimentacoes();
  }, [cdTarget]);

  return {
    movimentacoes,
    loading,
    refresh: fetchMovimentacoes
  };
}
