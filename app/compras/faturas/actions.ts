"use server";

import { Fatura } from "@/modules/compras/domain/Fatura";
import { faturaRepository } from "@/modules/compras/infra/SupabaseFaturaRepository";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";
import { serializarObservacoesComMeta } from "@/lib/previsaoRecebimento";

export async function saveFaturaAction(fatura: Object) {
  try {
    const faturaData = fatura as Fatura;
    await faturaRepository.saveFatura(faturaData);
    
    if (faturaData.categoria === 'Material' && faturaData.insumos && faturaData.insumos.length > 0) {
      if (supabase) {
        await supabase.from('estoque_movimentacoes')
          .delete()
          .eq('fatura_id', faturaData.id)
          .eq('status', 'PENDENTE');

        const formatCd = (name: string) => name ? name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-") : '';
        const validInsumos = faturaData.insumos.filter(ins => !(ins as any)._meta && (!ins.tipo_item || ins.tipo_item === 'Insumo'));

        const movimentacoes = validInsumos.map(insumo => {
          const obsTexto = `${faturaData.numero_documento ? 'Fatura ' + faturaData.numero_documento : 'Fatura não informada'} | Conta Protheus: ${insumo.conta_protheus || ''}`.trim();
          const metaData = {
            quantidade_prevista: insumo.quantidade,
            quantidade_recebida: 0,
            saldo_pendente: insumo.quantidade,
            entregas: [],
            previsao_dias_min: faturaData.previsao_recebimento_dias_min,
            previsao_dias_max: faturaData.previsao_recebimento_dias_max,
            previsao_data_inicio: faturaData.previsao_recebimento_data_inicio,
            previsao_data_fim: faturaData.previsao_recebimento_data_fim,
            data_criacao_original: faturaData.data_criacao || faturaData.created_at || faturaData.data_recebimento || new Date().toISOString()
          };
          const observacoesFinal = serializarObservacoesComMeta(obsTexto, metaData);

          return {
            tipo: 'Entrada',
            codigo: insumo.codigo,
            item: insumo.item,
            cd: formatCd(faturaData.cd || ''),
            quantidade: insumo.quantidade,
            usuario: faturaData.responsavel || 'Sistema Faturas',
            observacoes: observacoesFinal,
            status: 'PENDENTE',
            fatura_id: faturaData.id,
            tipo_envio: 'Principal',
          };
        });

        const { error } = await supabase.from('estoque_movimentacoes').insert(movimentacoes);
        if (error) {
          console.error("Erro ao gerar entradas de insumos:", error);
        }
      }
    }

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
