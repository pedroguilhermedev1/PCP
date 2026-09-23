"use client";

import { useState } from "react";
import { Fatura } from "@/modules/compras/domain/Fatura";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { transferirFaturaAction } from "@/app/compras/faturas-sap/periodos-actions";
import { toast } from "sonner";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  fatura: Fatura | null;
  onSuccess: () => void;
}

export function TransferModal({ isOpen, onClose, fatura, onSuccess }: TransferModalProps) {
  const [novaEtapa, setNovaEtapa] = useState("");
  const [novoTime, setNovoTime] = useState("");
  const [motivo, setMotivo] = useState("");
  const [observacao, setObservacao] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !fatura) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaEtapa || !novoTime || !motivo) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setIsSaving(true);
    const usuario = localStorage.getItem('pcp_user') || 'Sistema';
    
    // SLA fixo em 3 dias para cada etapa por padrão
    const slaDias = 3; 

    const result = await transferirFaturaAction({
      faturaId: fatura.id,
      novaEtapa,
      novoTime,
      motivo,
      observacao,
      slaDias,
      usuario,
      origem: fatura.origem || (fatura.is_sap ? 'SAP' : 'Nexa')
    });

    setIsSaving(false);

    if (result.success) {
      toast.success("Processo transferido com sucesso!");
      onSuccess();
      onClose();
    } else {
      toast.error("Erro ao transferir: " + result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-zinc-900">Transferir Processo / Pendência</h2>
          <Button variant="ghost" size="icon" onClick={onClose} type="button">X</Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Transferir para o Time:</label>
            <select 
              value={novoTime} 
              onChange={e => setNovoTime(e.target.value)}
              className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="" disabled>Selecione um time</option>
              <option value="PCP">PCP</option>
              <option value="Fiscal">Fiscal</option>
              <option value="Programação de Pagamento">Programação de Pagamento</option>
              <option value="Contas a Pagar">Contas a Pagar</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Nova Etapa:</label>
            <Input 
              value={novaEtapa} 
              onChange={e => setNovaEtapa(e.target.value)} 
              placeholder="Ex: Lançamento Fiscal" 
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Motivo da Transferência:</label>
            <select 
              value={motivo} 
              onChange={e => setMotivo(e.target.value)}
              className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="" disabled>Selecione um motivo</option>
              <option value="Avanço de Etapa">Avanço de Etapa (Fluxo Normal)</option>
              <option value="Falta de documento">Devolução: Falta de documento</option>
              <option value="Correção de informação">Devolução: Correção de informação</option>
              <option value="Divergência de informação">Devolução: Divergência de informação</option>
              <option value="Necessidade de aprovação">Devolução: Necessidade de aprovação</option>
              <option value="Erro no processo">Devolução: Erro no processo</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold">Observação (Opcional):</label>
            <textarea 
              value={observacao} 
              onChange={e => setObservacao(e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Detalhes adicionais..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-zinc-100">
            <Button variant="outline" onClick={onClose} type="button">Cancelar</Button>
            <Button type="submit" disabled={isSaving} className="bg-purple-600 hover:bg-purple-700 text-white">
              {isSaving ? "Salvando..." : "Confirmar Transferência"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
