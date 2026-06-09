"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type EstoqueInsumo = {
  id: string;
  cd: string;
  codigo: string;
  item: string;
  unidade: string;
  lead_time: string;
  estoque_minimo: number;
  estoque_real: number;
  status: string;
  categoria: string;
};

export function useEstoqueInsumos(filtro_cd?: string, filtro_empresa?: string) {
  const [insumos, setInsumos] = useState<EstoqueInsumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstoque = async (cd?: string, empresa?: string) => {
    setLoading(true);
    setError(null);
    try {
      const timestamp = new Date().getTime();
      let url = `/api/estoque?_t=${timestamp}`;
      if (cd) url += `&cd=${encodeURIComponent(cd)}`;
      if (empresa) url += `&empresa=${encodeURIComponent(empresa)}`;

      const res = await fetch(url, { cache: 'no-store' });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Erro ao buscar dados.');
      }

      setInsumos(result.data as EstoqueInsumo[]);
    } catch (err: any) {
      console.error("Erro ao buscar estoque_insumos:", err);
      if (err.message?.includes('PGRST205') || err.message?.includes('not find the table') || err.message?.includes('does not exist')) {
         setInsumos([]);
         setError(null);
      } else {
         setError(err.message);
      }
    } finally {
      if (typeof window !== 'undefined') {
        setTimeout(() => setLoading(false), 0);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    let mounted = true;
    if (mounted) {
       fetchEstoque(filtro_cd, filtro_empresa);
    }
    return () => { mounted = false; };
  }, [filtro_cd, filtro_empresa]);

  return { insumos, loading, error, refetch: () => fetchEstoque(filtro_cd, filtro_empresa) };
}
