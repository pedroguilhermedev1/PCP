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

export function useEstoqueInsumos(filtro_cd?: string) {
  const [insumos, setInsumos] = useState<EstoqueInsumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEstoque = async (cd?: string) => {
    setLoading(true);
    setError(null);
    try {
      // Add a timestamp query parameter to bust any aggressive browser/Next.js caching
      const timestamp = new Date().getTime();
      const url = cd 
        ? `/api/estoque?cd=${encodeURIComponent(cd)}&_t=${timestamp}` 
        : `/api/estoque?_t=${timestamp}`;
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
         // Silently fail or keep error null to avoid showing aggressive errors
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
       fetchEstoque(filtro_cd);
    }
    return () => { mounted = false; };
  }, [filtro_cd]);

  return { insumos, loading, error, refetch: () => fetchEstoque(filtro_cd) };
}
