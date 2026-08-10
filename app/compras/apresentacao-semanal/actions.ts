"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function updateDesvioFatura(id: string, dadosDesvio: {
  motivo_desvio: string;
  acao_corretiva: string;
  acao_responsavel: string;
  acao_status: string;
}) {
  if (!supabase) throw new Error("Supabase não inicializado");
  
  const { error } = await supabase
    .from('faturas')
    .update(dadosDesvio)
    .eq('id', id);
    
  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/compras/apresentacao-semanal');
  return { success: true };
}
