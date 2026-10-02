// Script to build history from Fatura

function buildHistory(fatura) {
  let history = [];

  const addEvent = (cycle, code, name, startDate, endDate, slaDias, responsavel) => {
    if (startDate) {
      history.push({
        cycle: cycle, // 0 = Fluxo Inicial, 1 = Retorno 1, 2 = Retorno 2, etc.
        codigo: code, // T1, T2, T1.1, T3.1
        nome: name,
        data_inicio: startDate,
        data_fim: endDate,
        sla_dias: slaDias,
        responsavel: responsavel || 'Sistema',
        is_ocorrencia: code.includes('.')
      });
    }
  };

  // Base Fluxo Inicial (Cycle 0)
  if (fatura.is_sap) {
    if (fatura.fluxo_iniciado_por !== 'Nexa') {
      addEvent(0, 'T1', 'SAP (RC, Aprovação, PC)', fatura.rc_data_inicio || fatura.data_recebimento, fatura.pc_data_fim || fatura.data_pedido_sap, 3, fatura.responsavel_t1);
      addEvent(0, 'T2', 'Nexa (Chamado)', fatura.nexa_data_inicio || fatura.data_pedido_sap, fatura.nexa_data_fim || fatura.nexa_data_envio, 1, 'Nexa');
      addEvent(0, 'T3', 'Fiscal', fatura.fiscal_data_inicio || fatura.nexa_data_envio, fatura.fiscal_data_fim || fatura.nexa_data_conclusao_lancamento, 3, fatura.usuario_nexa_lancamento);
      addEvent(0, 'T4', 'Pagamento', fatura.prog_data_inicio || fatura.nexa_data_prevista_pagamento, fatura.pagamento_data_fim || fatura.data_pagamento_real, 3, 'Financeiro');
    } else {
      addEvent(0, 'T1', 'Nexa / Solicitação', fatura.nexa_data_inicio || fatura.nexa_data_envio, fatura.nexa_data_fim, 1, fatura.responsavel_t1);
      addEvent(0, 'T2', 'Requisição / Pedido (Nexa)', fatura.req_nexa_data_inicio || fatura.nexa_rc_data, fatura.req_nexa_data_fim || fatura.data_pc_nexa, 2, 'Suprimentos');
      addEvent(0, 'T3', 'Lançamento Fiscal', fatura.fiscal_data_inicio || fatura.nexa_data_envio, fatura.fiscal_data_fim || fatura.nexa_data_conclusao_lancamento, 1, fatura.usuario_nexa_lancamento);
      addEvent(0, 'T4', 'Pagamento', fatura.prog_data_inicio || fatura.nexa_data_prevista_pagamento, fatura.pagamento_data_fim || fatura.data_pagamento_real, 3, 'Financeiro');
    }
  }

  // Ocorrências (Cycles 1, 2, etc.)
  if (fatura.ocorrencias && fatura.ocorrencias.length > 0) {
    // Sort by data_envio to determine cycles
    const sortedOcs = [...fatura.ocorrencias].sort((a, b) => new Date(a.data_envio || 0).getTime() - new Date(b.data_envio || 0).getTime());
    
    sortedOcs.forEach((oc, index) => {
      const cycle = index + 1; // Each ocorrencia creates a new cycle of rework
      
      // Destino (e.g. T1.1)
      addEvent(cycle, oc.t_destino_codigo, `Ocorrência (${oc.t_destino}) - ${oc.motivo}`, oc.destino_data_inicio || oc.data_envio, oc.destino_data_fim, 1, oc.destino_responsavel);
      
      // Origem Retorno (e.g. T3.1)
      addEvent(cycle, oc.t_origem_retorno_codigo, `Retorno (${oc.t_origem})`, oc.origem_data_inicio, oc.origem_data_fim, 1, oc.origem_responsavel);
    });
  }

  // Sort strictly by data_inicio
  history.sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime());

  return history;
}

const mockFatura = {
  is_sap: true,
  fluxo_iniciado_por: 'SAP',
  rc_data_inicio: '2024-10-01T10:00:00',
  pc_data_fim: '2024-10-02T10:00:00',
  nexa_data_inicio: '2024-10-02T11:00:00',
  ocorrencias: [
    {
      t_origem: 'T3',
      t_destino: 'T1',
      motivo: 'Falta de Anexo',
      data_envio: '2024-10-03T09:00:00',
      t_destino_codigo: 'T1.1',
      destino_data_inicio: '2024-10-03T09:00:00',
      destino_data_fim: '2024-10-04T09:00:00',
      t_origem_retorno_codigo: 'T3.1',
      origem_data_inicio: '2024-10-04T09:00:00',
    }
  ]
};

console.log(buildHistory(mockFatura));
