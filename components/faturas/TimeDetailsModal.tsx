import React from 'react';
import { Fatura, calcularSlaDinamico } from '@/modules/compras/domain/Fatura';
import { Button } from '@/components/ui/button';
import { X, Clock, User, Calendar, CheckCircle, Info, Timer, AlertTriangle } from 'lucide-react';
import { formatUserName } from '@/lib/roles';
import { calcularViabilidadePagamento, ProjecaoPagamento } from '@/modules/compras/domain/Fatura';

const formatDateDisplay = (dateStr?: string) => {
  if (!dateStr) return 'S/ Data';
  const parts = dateStr.split('T');
  return parts[0].split('-').reverse().join('/');
};


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

  const renderDate = (d?: string) => d ? formatDateDisplay(d) : 'Pendente';
  const renderUser = (u?: string) => u ? formatUserName(u) : 'Pendente';

  const renderSLA = (startDate?: string, endDate?: string, slaDias: number = 3) => {
    if (!startDate) return <span className="text-zinc-500">Aguardando início</span>;
    const SLA_DIAS = calcularSlaDinamico(fatura, slaDias);
    const start = new Date(startDate + 'T00:00:00');
    const prazoFinal = new Date(start);
    
    let diasAdicionados = 0;
    while (diasAdicionados < SLA_DIAS) {
      prazoFinal.setDate(prazoFinal.getDate() + 1);
      const diaSemana = prazoFinal.getDay();
      if (diaSemana !== 0 && diaSemana !== 6) {
        diasAdicionados++;
      }
    }
    
    if (endDate) {
      const end = new Date(endDate + 'T00:00:00');
      if (end <= prazoFinal) {
        return <span className="text-green-600 font-bold">Concluído (No prazo)</span>;
      } else {
        return <span className="text-red-600 font-bold">Concluído (Atrasado)</span>;
      }
    }
    
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    const timeDiff = prazoFinal.getTime() - hoje.getTime();
    const diasRestantes = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (diasRestantes < 0) return <span className="text-red-600 font-bold">Atrasado ({Math.abs(diasRestantes)} dia(s))</span>;
    if (diasRestantes === 0) return <span className="text-orange-600 font-bold">Vence hoje</span>;
    return <span className="text-amber-600 font-bold">{diasRestantes} dia(s) restante(s)</span>;
  };

  if (fatura.is_sap && fatura.fluxo_iniciado_por !== 'Nexa') {
    // Fluxo SAP
    switch (stage) {
      case 'T1':
        title = 'T1 - SAP (RC, Aprovação, PC)';
        color = 'text-purple-700 bg-purple-50 border-purple-200';
        details = [
          { label: 'Número da RC', value: fatura.rc_sap || 'Pendente', icon: <Info className="w-4 h-4" /> },
          { label: 'Data de Conclusão RC', value: renderDate(fatura.data_rc_sap), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Aprovação RC', value: fatura.data_aprovacao ? 'Aprovada' : 'Pendente', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Número do Pedido (PC)', value: fatura.pedido_sap || 'Pendente', icon: <Info className="w-4 h-4" /> },
          { label: 'Data do Pedido', value: renderDate(fatura.data_pedido_sap), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Doc Subsequente', value: fatura.doc_subsequente_criado ? 'Criado' : 'Não criado', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Status SLA (1 dia - RC/Aprovação)', value: renderSLA(fatura.data_rc_sap, fatura.data_aprovacao, 1), icon: <Timer className="w-4 h-4" /> },
          { label: 'Status SLA (1 dia - Pedido)', value: renderSLA(fatura.data_aprovacao, fatura.data_pedido_sap, 1), icon: <Timer className="w-4 h-4" /> }
        ];
        break;
      case 'T2':
        title = 'T2 - Nexa';
        color = 'text-cyan-700 bg-cyan-50 border-cyan-200';
        details = [
          { label: 'Chamado / Ticket', value: fatura.nexa_chamado || 'Pendente', icon: <Info className="w-4 h-4" /> },
          { label: 'Data Abertura Nexa', value: renderDate(fatura.nexa_data_envio), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Doc. Emitido?', value: fatura.nexa_emitiu_nf ? 'Sim' : 'Não', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Doc. Anexado?', value: fatura.nexa_anexada ? 'Sim' : 'Não', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Status SLA (1 dia)', value: renderSLA(fatura.data_pedido_sap, fatura.nexa_data_envio, 1), icon: <Timer className="w-4 h-4" /> }
        ];
        break;
      case 'T3':
        title = 'T3 - Fiscal';
        color = 'text-slate-700 bg-slate-100 border-slate-300';
        details = [
          { label: 'Lançamento Concluído?', value: fatura.nexa_lancamento_concluido ? 'Sim' : 'Não', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data de Conclusão', value: renderDate(fatura.nexa_data_conclusao_lancamento), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Usuário', value: renderUser(fatura.usuario_nexa_lancamento), icon: <User className="w-4 h-4" /> },
          { label: 'Status SLA (3 dias)', value: renderSLA(fatura.nexa_data_envio, fatura.nexa_data_conclusao_lancamento, 3), icon: <Timer className="w-4 h-4" /> }
        ];
        break;
      case 'T4':
        title = 'T4 - Pagamento';
        color = 'text-green-700 bg-green-50 border-green-200';
        details = [
          { label: 'Pagamento Programado?', value: fatura.nexa_pagamento_programado ? 'Sim' : 'Não', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data Prevista', value: renderDate(fatura.nexa_data_prevista_pagamento), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Pagamento Realizado?', value: fatura.nexa_pagamento_realizado ? 'Sim' : 'Não', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data Pagamento Real', value: renderDate(fatura.data_pagamento_real), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Valor Pago', value: fatura.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fatura.valor) : 'R$ 0,00', icon: <Info className="w-4 h-4" /> },
          { label: 'Status SLA (3 dias)', value: renderSLA(fatura.nexa_data_prevista_pagamento, fatura.data_pagamento_real, 3), icon: <Timer className="w-4 h-4" /> }
        ];
        break;
    }
  } else {
    // Fluxo Nexa
    switch (stage) {
      case 'T1':
        title = 'T1 - Nexa / Solicitação';
        color = 'text-cyan-700 bg-cyan-50 border-cyan-200';
        details = [
          { label: 'Chamado / Ticket', value: fatura.nexa_chamado || 'Pendente', icon: <Info className="w-4 h-4" /> },
          { label: 'Data Abertura', value: renderDate(fatura.nexa_data_envio), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Responsável', value: renderUser(fatura.responsavel_t1), icon: <User className="w-4 h-4" /> }
        ];
        break;
      case 'T2':
        title = 'T2 - Requisição / Pedido (Nexa)';
        color = 'text-blue-700 bg-blue-50 border-blue-200';
        details = [
          { label: 'Possui RC?', value: fatura.nexa_possui_rc ? 'Sim' : 'Não', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Número RC', value: fatura.nexa_rc_numero || 'Pendente', icon: <Info className="w-4 h-4" /> },
          { label: 'Data RC', value: renderDate(fatura.nexa_rc_data), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Possui PC?', value: fatura.pc_nexa_concluido ? 'Sim' : 'Não', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Número PC', value: fatura.numero_pc_nexa || 'Pendente', icon: <Info className="w-4 h-4" /> },
          { label: 'Data PC', value: renderDate(fatura.data_pc_nexa), icon: <Calendar className="w-4 h-4" /> }
        ];
        break;
      case 'T3':
        title = 'T3 - Lançamento Fiscal';
        color = 'text-slate-700 bg-slate-100 border-slate-300';
        details = [
          { label: 'Lançamento Concluído?', value: fatura.nexa_lancamento_concluido ? 'Sim' : 'Não', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data de Conclusão', value: renderDate(fatura.nexa_data_conclusao_lancamento), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Usuário', value: renderUser(fatura.usuario_nexa_lancamento), icon: <User className="w-4 h-4" /> },
          { label: 'Status SLA (1 dia)', value: renderSLA(fatura.nexa_data_envio, fatura.nexa_data_conclusao_lancamento, 1), icon: <Timer className="w-4 h-4" /> }
        ];
        break;
      case 'T4':
        title = 'T4 - Pagamento (Prog + Real)';
        color = 'text-green-700 bg-green-50 border-green-200';
        details = [
          { label: 'Programado?', value: fatura.nexa_pagamento_programado ? 'Sim' : 'Não', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data Prevista', value: renderDate(fatura.nexa_data_prevista_pagamento), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Pago?', value: fatura.nexa_pagamento_realizado ? 'Sim' : 'Não', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'Data Pagamento Real', value: renderDate(fatura.data_pagamento_real), icon: <Calendar className="w-4 h-4" /> },
          { label: 'Valor Pago', value: fatura.valor ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fatura.valor) : 'R$ 0,00', icon: <Info className="w-4 h-4" /> },
          { label: 'Status SLA (3 dias)', value: renderSLA(fatura.nexa_data_prevista_pagamento, fatura.data_pagamento_real, 3), icon: <Timer className="w-4 h-4" /> }
        ];
        break;
    }
  }

  const projecao = calcularViabilidadePagamento(fatura);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${color}`}>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 opacity-70" />
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-white/20 rounded-full h-8 w-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {details.map((d, idx) => (
            <div key={idx} className="flex flex-col gap-1 p-3 bg-zinc-50 rounded-lg border border-zinc-100">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                {d.icon}
                {d.label}
              </span>
              <span className="text-sm font-medium text-zinc-900 ml-5">{d.value}</span>
            </div>
          ))}
          
          {projecao && Object.keys(projecao).length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-200 space-y-3">
              <h4 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                <Timer className="w-4 h-4"/> Projeção e Viabilidade de Pagamento
              </h4>
              
              {!projecao.possivelSextaAtual && projecao.janelaPerdida && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Pagamento nesta sexta-feira ({projecao.janelaPerdida}): não será possível
                  </p>
                  <p className="text-xs text-red-600 mt-1">{projecao.motivoPerda}</p>
                  {projecao.consequencia && <p className="text-xs font-bold text-red-700 mt-1">Impacto: {projecao.consequencia}</p>}
                </div>
              )}
              
              {projecao.proximaSextaNormal && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm font-bold text-blue-700">Próxima janela normal de pagamento: sexta-feira, {projecao.proximaSextaNormal}</p>
                  {projecao.vencimentoUltrapassado && (
                     <p className="text-xs font-bold text-red-600 mt-1">Atenção: O vencimento do documento já foi ultrapassado.</p>
                  )}
                </div>
              )}

              {projecao.possivelQuartaExcecao && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                  <p className="text-sm font-bold text-amber-700">Existe uma janela excepcional de pagamento na quarta-feira.</p>
                  <p className="text-xs text-amber-600 mt-1">{projecao.condicaoQuartaExcecao}</p>
                  <p className="text-xs font-bold text-amber-700 mt-1">Situação atual: {projecao.situacaoProcesso}</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 text-center text-xs text-zinc-400">
            Para editar essas informações, utilize o botão <span className="font-semibold text-zinc-600">Editar</span> na fatura principal.
          </div>
        </div>
      </div>
    </div>
  );
}
