"use server";

import { Fatura } from "@/modules/compras/domain/Fatura";
import { faturaRepository } from "@/modules/compras/infra/SupabaseFaturaRepository";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { serializarObservacoesComMeta } from "@/lib/previsaoRecebimento";

export async function saveFaturaAction(fatura: Object) {
  try {
    const faturaData = fatura as Fatura;
    // O registro da compra salva todos os dados da fatura (insumos, quantidades, preços e metadados)
    // para histórico e controle financeiro, SEM gerar solicitações ou movimentações de estoque.
    await faturaRepository.saveFatura(faturaData);

    revalidatePath('/compras/faturas');
    revalidatePath('/compras/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
}

export async function deleteFaturaAction(id: string) {
  try {
    if (supabase) {
      // 1. Verificar movimentacoes
      const { data: movs } = await supabase.from('estoque_movimentacoes').select('status, id').eq('fatura_id', id);
      
      if (movs && movs.length > 0) {
        // Se alguma movimentacao ja foi confirmada, bloqueamos a exclusão
        const hasConfirmed = movs.some(m => m.status === 'CONFIRMADO');
        if (hasConfirmed) {
          return { success: false, error: "Não é possível excluir esta fatura. Os insumos vinculados já foram recebidos (confirmados) no Centro de Distribuição. Faça uma 'Saída' manual no CD caso queira reverter o estoque." };
        }
        
        // Se não tem confirmadas, mas tem pendentes, excluímos as movimentacoes pendentes primeiro (cascata segura)
        await supabase.from('estoque_movimentacoes').delete().eq('fatura_id', id);
      }
    }

    await faturaRepository.deleteFatura(id);
    revalidatePath('/compras/faturas');
    revalidatePath('/compras/dashboard');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || String(error) };
  }
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
