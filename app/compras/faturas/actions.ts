"use server";

import { Fatura } from "@/modules/compras/domain/Fatura";
import { faturaRepository } from "@/modules/compras/infra/SupabaseFaturaRepository";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export async function saveFaturaAction(fatura: Object) {
  const faturaData = fatura as Fatura;
  await faturaRepository.saveFatura(faturaData);
  
  if (faturaData.categoria === 'Material' && faturaData.insumos && faturaData.insumos.length > 0) {
    if (supabase) {
      await supabase.from('estoque_movimentacoes')
        .delete()
        .eq('fatura_id', faturaData.id)
        .eq('status', 'PENDENTE');

      const movimentacoes = faturaData.insumos.map(insumo => ({
        tipo: 'Entrada',
        codigo: insumo.codigo,
        item: insumo.item,
        cd: faturaData.filial,
        quantidade: insumo.quantidade,
        usuario: faturaData.responsavel || 'Sistema Faturas',
        observacoes: `Fatura ${faturaData.numero_documento || faturaData.id} - ${insumo.observacoes || ''}`.trim(),
        status: 'PENDENTE',
        fatura_id: faturaData.id,
      }));

      const { error } = await supabase.from('estoque_movimentacoes').insert(movimentacoes);
      if (error) {
        console.error("Erro ao gerar entradas de insumos:", error);
      }
    }
  }

  revalidatePath('/compras/faturas');
  revalidatePath('/compras/dashboard');
}

export async function deleteFaturaAction(id: string) {
  await faturaRepository.deleteFatura(id);
  revalidatePath('/compras/faturas');
  revalidatePath('/compras/dashboard');
}
