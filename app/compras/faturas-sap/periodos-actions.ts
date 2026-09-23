"use server";

import { Fatura } from "@/modules/compras/domain/Fatura";
import { faturaRepository } from "@/modules/compras/infra/SupabaseFaturaRepository";
import { revalidatePath } from "next/cache";
import { supabase } from "@/lib/supabase";

export async function getFaturaPeriodosAction(faturaId: string) {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('fatura_periodos')
    .select('*')
    .eq('fatura_id', faturaId)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error("Erro ao buscar períodos da fatura:", error);
    return [];
  }
  return data || [];
}

export async function transferirFaturaAction({
  faturaId,
  novaEtapa,
  novoTime,
  slaDias,
  motivo,
  observacao,
  usuario,
  origem
}: {
  faturaId: string;
  novaEtapa: string;
  novoTime: string;
  slaDias: number;
  motivo: string;
  observacao: string;
  usuario: string;
  origem: string;
}) {
  if (!supabase) return { success: false, error: 'Supabase client not initialized' };

  try {
    // 1. Fechar o período atual (se houver algum em aberto)
    const { data: periodosAbertos } = await supabase
      .from('fatura_periodos')
      .select('id')
      .eq('fatura_id', faturaId)
      .is('data_termino', null);
      
    if (periodosAbertos && periodosAbertos.length > 0) {
      await supabase
        .from('fatura_periodos')
        .update({ data_termino: new Date().toISOString() })
        .in('id', periodosAbertos.map(p => p.id));
    }

    // 2. Criar novo período
    const { error: insertError } = await supabase
      .from('fatura_periodos')
      .insert({
        fatura_id: faturaId,
        origem,
        etapa_nome: novaEtapa,
        time_responsavel: novoTime,
        sla_dias: slaDias,
        motivo_transferencia: motivo,
        observacao_transferencia: observacao,
        usuario_transferencia: usuario
      });

    if (insertError) throw new Error(insertError.message);
    
    // 3. Atualizar a Fatura principal (etapa/status)
    // Opcional: dependendo de como a etapa é mapeada na Fatura, podemos atualizar campos aqui
    // Ex: Se for Nexa e foi pra 'Lançamento Fiscal', atualizamos o status de nexa
    
    revalidatePath('/compras/faturas');
    revalidatePath('/compras/dashboard');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}
