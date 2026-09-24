import React from 'react';
import { Fatura } from '@/modules/compras/domain/Fatura';
import { Button } from '@/components/ui/button';
import { X, Clock, User, Calendar, CheckCircle, Info } from 'lucide-react';
import { formatUserName } from '@/lib/roles';

interface TimeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  fatura: Fatura | null;
  stage: string | null;
}

export function TimeDetailsModal({ isOpen, onClose, fatura, stage }: TimeDetailsModalProps) {
  if (!isOpen || !fatura || !stage) return null;

  let title = '';
  let color = 'bg-slate-500';
  let details: { label: string; value: React.ReactNode; icon: React.ReactNode }[] = [];

  const renderDate = (d?: string) => d ? d.split('-').reverse().join('/') : 'Não informada';
  const renderUser = (u?: string) => u ? formatUserName(u) : 'Não informado';

  if (fatura.fluxo_iniciado_por !== 'Nexa') {
    // Fluxo SAP
    switch (stage) {
      case 'T1':
        title = 'T1 - RC SAP';
        color = 'text-purple-700 bg-purple-50 border-purple-200';
        details = [
          { label: 'Número da RC', value: fatura.rc_sap || 'Pendente', icon: <Info className="w-4 h-4" /> },
          { label: 'Data de Criação', value: renderDate(fatura.data_rc_sap), icon: <Calendar className="w-4 h-4" /> },
        ];
        break;
      case 'T2':
        title = 'T2 - Aprovação RC';
        color = 'text-indigo-700 bg-indigo-50 border-indigo-200';
        details = [
          { label: 'Status da Aprovação', value: fatura.data_aprovacao ? 'Aprovada' : 'Pendente', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data de Aprovação', value: renderDate(fatura.data_aprovacao), icon: <Calendar className="w-4 h-4" /> },
        ];
        break;
      case 'T3':
        title = 'T3 - Pedido SAP (PC)';
        color = 'text-blue-700 bg-blue-50 border-blue-200';
        details = [
          { label: 'Número do Pedido', value: fatura.pedido_sap || 'Pendente', icon: <Info className="w-4 h-4" /> },
          { label: 'Data do Pedido', value: renderDate(fatura.data_pedido_sap), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Doc Subsequente', value: fatura.doc_subsequente_criado ? 'Criado' : 'Não criado', icon: <CheckCircle className="w-4 h-4" /> },
        ];
        break;
      case 'T4':
        title = 'T4 - Solicitação Nexa';
        color = 'text-cyan-700 bg-cyan-50 border-cyan-200';
        details = [
          { label: 'Chamado / Ticket', value: fatura.nexa_chamado || 'Pendente', icon: <Info className="w-4 h-4" /> },
          { label: 'Data de Envio', value: renderDate(fatura.nexa_data_envio), icon: <Calendar className="w-4 h-4" /> },
          { label: 'NF Anexada?', value: fatura.nexa_anexada ? 'Sim' : 'Não', icon: <CheckCircle className="w-4 h-4" /> },
        ];
        break;
      case 'T5':
        title = 'T5 - Lançamento Fiscal';
        color = 'text-slate-700 bg-slate-100 border-slate-300';
        details = [
          { label: 'Status do Lançamento', value: fatura.nexa_lancamento_concluido ? 'Concluído' : 'Pendente', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data de Conclusão', value: renderDate(fatura.nexa_data_conclusao_lancamento), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Usuário Responsável', value: renderUser(fatura.usuario_nexa_lancamento), icon: <User className="w-4 h-4" /> },
        ];
        break;
      case 'T6':
        title = 'T6 - Programação de Pagamento';
        color = 'text-amber-700 bg-amber-50 border-amber-200';
        details = [
          { label: 'Status da Programação', value: fatura.nexa_pagamento_programado ? 'Programado' : 'Pendente', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data Prevista', value: renderDate(fatura.nexa_data_prevista_pagamento), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Usuário Responsável', value: renderUser(fatura.usuario_nexa_programacao), icon: <User className="w-4 h-4" /> },
        ];
        break;
      case 'T7':
        title = 'T7 - Efetuar Pagamento';
        color = 'text-green-700 bg-green-50 border-green-200';
        details = [
          { label: 'Status do Pagamento', value: fatura.nexa_pagamento_realizado ? 'Pago' : 'Pendente', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data do Pagamento', value: renderDate(fatura.data_pagamento_real), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Valor Pago', value: fatura.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fatura.valor) : 'R$ 0,00', icon: <Info className="w-4 h-4" /> },
        ];
        break;
    }
  } else {
    // Fluxo Nexa
    switch (stage) {
      case 'T1':
        title = 'T1 - Solicitação Nexa (Ticket)';
        color = 'text-cyan-700 bg-cyan-50 border-cyan-200';
        details = [
          { label: 'Chamado / Ticket', value: fatura.nexa_chamado || 'Pendente', icon: <Info className="w-4 h-4" /> },
          { label: 'Data de Envio', value: renderDate(fatura.nexa_data_envio), icon: <Calendar className="w-4 h-4" /> },
          { label: 'PC Nexa', value: fatura.numero_pc_nexa || (fatura.pc_nexa_concluido ? 'Concluído' : 'Pendente'), icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data do PC Nexa', value: renderDate(fatura.data_pc_nexa), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Responsável PC', value: renderUser(fatura.usuario_pc_nexa), icon: <User className="w-4 h-4" /> },
        ];
        break;
      case 'T2':
        title = 'T2 - Lançamento Fiscal';
        color = 'text-slate-700 bg-slate-100 border-slate-300';
        details = [
          { label: 'Status do Lançamento', value: fatura.nexa_lancamento_concluido ? 'Concluído' : 'Pendente', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data de Conclusão', value: renderDate(fatura.nexa_data_conclusao_lancamento), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Usuário Responsável', value: renderUser(fatura.usuario_nexa_lancamento), icon: <User className="w-4 h-4" /> },
        ];
        break;
      case 'T3':
        title = 'T3 - Programação de Pagamento';
        color = 'text-amber-700 bg-amber-50 border-amber-200';
        details = [
          { label: 'Status da Programação', value: fatura.nexa_pagamento_programado ? 'Programado' : 'Pendente', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data Prevista', value: renderDate(fatura.nexa_data_prevista_pagamento), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Usuário Responsável', value: renderUser(fatura.usuario_nexa_programacao), icon: <User className="w-4 h-4" /> },
        ];
        break;
      case 'T4':
        title = 'T4 - Efetuar Pagamento';
        color = 'text-green-700 bg-green-50 border-green-200';
        details = [
          { label: 'Status do Pagamento', value: fatura.nexa_pagamento_realizado ? 'Pago' : 'Pendente', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data do Pagamento', value: renderDate(fatura.data_pagamento_real), icon: <Calendar className="w-4 h-4" /> },
        ];
        break;
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className={`px-6 py-4 border-b flex justify-between items-center ${color}`}>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 opacity-70" />
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/20 rounded-full h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4">
          {details.map((d, idx) => (
            <div key={idx} className="flex flex-col gap-1 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                {d.icon}
                {d.label}
              </span>
              <span className="text-sm font-medium text-zinc-900 ml-5">{d.value}</span>
            </div>
          ))}

          <div className="mt-6 text-center text-xs text-zinc-400">
            Para editar essas informações, utilize o botão <span className="font-semibold text-zinc-600">Editar</span> na fatura principal.
          </div>
        </div>
      </div>
    </div>
  );
}
