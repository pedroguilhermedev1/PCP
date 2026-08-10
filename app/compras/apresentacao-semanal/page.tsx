import { faturaRepository } from "@/modules/compras/infra/SupabaseFaturaRepository";
import ApresentacaoSemanalClient from "./client";
import { Suspense } from "react";

export const metadata = {
  title: "Apresentação Semanal | PCP Hub",
  description: "Apresentação executiva semanal de performance do processo Faturas 2.0",
};

export default async function ApresentacaoSemanalPage() {
  const faturas = await faturaRepository.getFaturas();
  
  // Filter for Faturas 2.0 only, and material category
  const faturas20 = faturas.filter(f => f.is_sap === true && f.categoria === 'Material');

  return (
    <div className="flex-1 w-full bg-zinc-50 h-full overflow-y-auto">
      <Suspense fallback={<div className="p-8 text-center text-zinc-500">Carregando apresentação semanal...</div>}>
        <ApresentacaoSemanalClient faturas={faturas20} />
      </Suspense>
    </div>
  );
}
