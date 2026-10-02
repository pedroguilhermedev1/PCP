const fs = require('fs');

// We simulate with an array of edge cases
const mockFaturas = [
  {
    id: 1,
    is_sap: true,
    data_vencimento: "2024-10-15",
    etapa: "Aguardando lançamento fiscal", // Not finalizado
    nexa_pagamento_realizado: false,
    status_pagamento: "Em andamento"
  },
  {
    id: 2,
    is_sap: true,
    data_vencimento: "2024-10-05", // Atrasado if today is > Oct 5
    etapa: "Aguardando lançamento fiscal",
    nexa_pagamento_realizado: false,
    status_pagamento: "Em andamento"
  },
  {
    id: 3,
    is_sap: true,
    data_vencimento: "2024-10-25", // No prazo
    etapa: "Aguardando pagamento", // finalizado, so shouldn't be Em Aberto
    nexa_pagamento_realizado: false,
    status_pagamento: "Aguardando pagamento"
  },
  {
    id: 4,
    is_sap: true,
    data_vencimento: "2024-10-20", // No prazo
    etapa: "Aguardando lançamento fiscal",
    nexa_pagamento_realizado: true, // paid, but not 'Pago' in etapa? Wait, if it's paid, etapa might be Pago if nexa_pagamento_realizado=true and fluxo=Nexa
    fluxo_iniciado_por: "Nexa",
    pc_nexa_concluido: true,
    nexa_lancamento_concluido: true,
    nexa_pagamento_programado: true,
    status_pagamento: "Pago"
  }
];

function calcularEtapa(fatura) {
  if (fatura.is_sap) {
    if (fatura.fluxo_iniciado_por === 'Nexa') {
      if (!fatura.pc_nexa_concluido) return 'Aguardando PC Nexa';
      if (!fatura.nexa_lancamento_concluido) return 'Aguardando lançamento fiscal';
      if (!fatura.nexa_pagamento_programado) return 'Aguardando programação de pagamento';
      if (!fatura.nexa_pagamento_realizado) return 'Aguardando pagamento';
      return 'Pago';
    }

    if (fatura.doc_subsequente_criado) {
      if (!fatura.nexa_emitiu_nf) return 'Aguardando emissão de Documento';
      if (!fatura.nexa_lancamento_concluido) return 'Aguardando lançamento fiscal';
      if (!fatura.nexa_pagamento_programado) return 'Aguardando programação de pagamento';
      if (!fatura.nexa_pagamento_realizado) return 'Aguardando pagamento';
      return 'Pago';
    }
    if (fatura.pedido_sap || fatura.data_pedido_sap) return 'Pedido de Compras';
    if (fatura.rc_sap || fatura.data_rc_sap) return 'Requisição de Compras';
    return 'Em andamento';
  }

  if (fatura.status_pagamento === 'Pago') return 'Pago';
  if (fatura.status_pagamento === 'Aguardando pagamento') return 'Aguardando pagamento';
  if (fatura.status_pagamento === 'ERP') return 'Aprovação';
  
  if (fatura.v360 && fatura.data_abertura_v360) return 'Inclusão no V360';
  if (fatura.erp && fatura.data_aprovacao) return 'Aprovação';
  if (fatura.heflo && fatura.data_abertura_heflo) return 'Requisição de Compras';
  return 'Cadastro do Documento';
}

function calcularDiasRestantes(data_vencimento) {
  if (!data_vencimento) return 0;
  const hoje = new Date("2024-10-10T00:00:00"); // Mock current date
  const dateVencimento = new Date(data_vencimento + 'T00:00:00');
  const diff = dateVencimento.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
}

function calcularStatus(fatura) {
  const dias = calcularDiasRestantes(fatura.data_vencimento || '');

  const isPaid = (fatura.is_sap && fatura.nexa_pagamento_realizado) || fatura.status_pagamento === 'Pago';

  if (isPaid) {
    if (fatura.data_pagamento_real && fatura.data_vencimento) {
      const dataPgto = new Date(fatura.data_pagamento_real + 'T00:00:00');
      const dataVenc = new Date(fatura.data_vencimento + 'T00:00:00');
      if (dataPgto > dataVenc) return 'Pago (Vencida)';
    } else if (fatura.data_vencimento && dias < 0) {
      return 'Pago (Vencida)';
    }
    return 'Pago';
  }

  if (!fatura.data_vencimento) return 'A vencer';
  
  if (dias < 0) return 'Vencido';
  return 'A vencer';
}

// Logic Dashboard
function getDashboardInPrazo(faturas) {
  let inPrazoIds = [];
  faturas.forEach(f => {
    const etapa = calcularEtapa(f);
    const isFinalizado = (etapa === 'Aguardando pagamento');
    const isEmAberto = (etapa !== 'Aguardando pagamento' && etapa !== 'Pago');
    const diasRestantes = calcularDiasRestantes(f.data_vencimento || '');
    const isAtrasado = !!f.data_vencimento && diasRestantes < 0;

    if (isEmAberto && !isAtrasado) {
      inPrazoIds.push(f.id);
    }
  });
  return inPrazoIds;
}

// Logic click A_Vencer & Em Aberto
function getTableInPrazo(faturas) {
  return faturas.filter(f => {
    // filterStatus === 'A_Vencer'
    const stat = calcularStatus(f);
    if (stat.toLowerCase() !== 'a vencer') return false;

    // filtro_etapa === 'em_aberto'
    const etapa = calcularEtapa(f);
    const isFinalizado = (etapa === 'Aguardando pagamento' || etapa === 'Pago');
    if (isFinalizado) return false;

    return true;
  }).map(f => f.id);
}

// Let's create a more exhaustive list of mock cases to see if there is a discrepancy
const cases = [
  { desc: "No date", data_vencimento: null, is_sap: true },
  { desc: "No prazo, Em andamento", data_vencimento: "2024-10-15", is_sap: true },
  { desc: "Atrasado, Em andamento", data_vencimento: "2024-10-05", is_sap: true },
  { desc: "No prazo, Aguardando pagamento", data_vencimento: "2024-10-15", is_sap: true, doc_subsequente_criado: true, nexa_emitiu_nf: true, nexa_lancamento_concluido: true, nexa_pagamento_programado: true },
  { desc: "No prazo, Pago but not marked in etapa correctly", data_vencimento: "2024-10-15", is_sap: true, status_pagamento: 'Pago' },
  { desc: "No prazo, nexa_pagamento_realizado but etapa is Em andamento", data_vencimento: "2024-10-15", is_sap: true, nexa_pagamento_realizado: true },
];

let id = 1;
cases.forEach(c => {
  c.id = id++;
});

const dIds = getDashboardInPrazo(cases);
const tIds = getTableInPrazo(cases);

console.log("Dashboard IDs:", dIds);
console.log("Table IDs:", tIds);
console.log("Difference:");
dIds.forEach(id => {
  if (!tIds.includes(id)) {
    console.log("In Dashboard but not Table:", cases.find(c => c.id === id).desc);
  }
});
tIds.forEach(id => {
  if (!dIds.includes(id)) {
    console.log("In Table but not Dashboard:", cases.find(c => c.id === id).desc);
  }
});

