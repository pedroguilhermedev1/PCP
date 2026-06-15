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

      const formatCd = (name: string) => name ? name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-") : '';

      const movimentacoes = faturaData.insumos.map(insumo => ({
        tipo: 'Entrada',
        codigo: insumo.codigo,
        item: insumo.item,
        cd: formatCd(faturaData.cd || ''),
        quantidade: insumo.quantidade,
        usuario: faturaData.responsavel || 'Sistema Faturas',
        observacoes: `Fatura ${faturaData.numero_documento || faturaData.id} - ${insumo.observacoes || ''} | Conta Protheus: ${insumo.conta_protheus || ''}`.trim(),
        status: 'PENDENTE',
        fatura_id: faturaData.id,
        tipo_envio: 'Principal',
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

export async function deleteMovimentacaoAction(movId: string) {
  if (!supabase) return;
  const { data: mov } = await supabase.from('estoque_movimentacoes').select('*').eq('id', movId).single();
  if (!mov) return;
  
  if (mov.fatura_id) {
    const { data: fatura } = await supabase.from('faturas').select('*').eq('id', mov.fatura_id).single();
    if (fatura && fatura.insumos) {
      const newInsumos = fatura.insumos.filter((ins: any) => ins.codigo !== mov.codigo);
      await supabase.from('faturas').update({ insumos: newInsumos }).eq('id', mov.fatura_id);
    }
  }

  await supabase.from('estoque_movimentacoes').delete().eq('id', movId);
}
