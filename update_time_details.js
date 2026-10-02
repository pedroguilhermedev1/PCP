const fs = require('fs');
const file = 'components/faturas/TimeDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const replacement = `  if (fatura.is_sap && fatura.fluxo_iniciado_por !== 'Nexa') {
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
          { label: 'NF Emitida?', value: fatura.nexa_emitiu_nf ? 'Sim' : 'Não', icon: <CheckCircle className="w-4 h-4" /> },
          { label: 'NF Anexada?', value: fatura.nexa_anexada ? 'Sim' : 'Não', icon: <CheckCircle className="w-4 h-4" /> },
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
  }`;

const startIdx = content.indexOf(`  if (fatura.is_sap && fatura.fluxo_iniciado_por !== 'Nexa') {`);
const endIdx = content.indexOf(`  const projecao = calcularViabilidadePagamento(fatura);`);

if (startIdx > -1 && endIdx > -1) {
  content = content.substring(0, startIdx) + replacement + "\n\n" + content.substring(endIdx);
  fs.writeFileSync(file, content);
  console.log("TimeDetailsModal UI replaced!");
} else {
  console.log("Could not find boundaries.");
}
