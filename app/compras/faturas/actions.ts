"use server";

import { Fatura } from "@/modules/compras/domain/Fatura";
import { faturaRepository } from "@/modules/compras/infra/SupabaseFaturaRepository";
import { revalidatePath } from "next/cache";

export async function saveFaturaAction(fatura: Object) {
  const faturaData = fatura as Fatura;
  await faturaRepository.saveFatura(faturaData);
  
  revalidatePath('/compras/faturas');
  revalidatePath('/compras/dashboard');
}

export async function deleteFaturaAction(id: string) {
  await faturaRepository.deleteFatura(id);
  revalidatePath('/compras/faturas');
  revalidatePath('/compras/dashboard');
}
