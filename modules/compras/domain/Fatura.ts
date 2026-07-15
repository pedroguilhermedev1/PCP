// Status da Fatura: calculado com base na data_vencimento
export type StatusFatura = 'A vencer' | 'Vencido' | 'Pago';
// Status do Pagamento: Estágio no fluxo manual
export type StatusPagamento = 'Em andamento' | 'Aguardando pagamento' | 'Pago' | 'ERP' | 'V360' | 'HEFLO';
export type Etapa = 'Cadastro da NF' | 'Requisição de Compras' | 'Aprovação' | 'Inclusão no V360' | 'Pedido de Compras' | 'Aguardando emissão de NF' | 'Aguardando lançamento fiscal' | 'Aguardando programação de pagamento' | 'Pagamento programado' | 'Aguardando pagamento' | 'Pago';

export interface FaturaInsumo {
  codigo: string;
  item: string;
  quantidade: number;
  preco_unitario?: number;
  valor_total?: number;
  conta_protheus?: string;
  desc_conta_protheus?: string;
  cd?: string;
  codigo_fornecedor?: string;
}

export interface Fatura {
  id: string;
  identificador?: string;
  codigo_fatura?: string;

  marca: string;
  categoria: 'Serviço' | 'Material';
  
  fornecedor: string;
  cnpj: string;
  codigo_fornecedor?: string;
  centro_custo: string;
  filial: string;
  cd?: string;
  conta_protheus?: string;
  desc_conta_protheus?: string;
  conta_contabil?: string;
  descricao_contabil?: string;
  tipo_documento: string;
  tipo_servico: string;
  codigo_servico: string;
  responsavel: string;
  forma_pagamento: string; // pix, boleto, ted, etc.

  // Datas
  data_emissao: string;
  data_recebimento: string;
  data_vencimento: string;
  
  numero_documento: string;
  valor: number;
  
  // Sistemas (Manuais)
  heflo?: string;
  data_abertura_heflo?: string;
  erp?: string;
  data_aprovacao?: string;
  v360?: string;
  data_abertura_v360?: string;
  
  // SAP
  is_sap?: boolean;
  rc_sap?: string;
  data_rc_sap?: string;
  pedido_sap?: string;
  data_pedido_sap?: string;
  doc_subsequente_criado?: boolean;
  numero_doc_subsequente?: string;
  
  // Nexa (Fase 2)
  nexa_emitiu_nf?: boolean;
  nexa_anexada?: boolean;
  nexa_chamado?: string;
  nexa_data_envio?: string;
  nexa_lancamento_concluido?: boolean;
  nexa_data_conclusao_lancamento?: string;
  nexa_pagamento_programado?: boolean;
  nexa_data_prevista_pagamento?: string;
  nexa_pagamento_realizado?: boolean;

  data_pagamento_real?: string;
  observacoes?: string;
  
  insumos?: FaturaInsumo[];

  possui_encargo: boolean;
  valor_encargo?: number;

  status_pagamento: StatusPagamento;

  // Calculados (Opcionais no model para persistência, mas gerados pela view/helper)
  status?: string;
  data_pagamento_ideal?: string;
  etapa?: Etapa;
}

export function calcularDiasRestantes(data_vencimento: string): number {
  if (!data_vencimento) return 0;
  const hoje = new Date();
  const dateVencimento = new Date(data_vencimento + 'T00:00:00');
  hoje.setHours(0, 0, 0, 0);
  
  const diff = dateVencimento.getTime() - hoje.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
}

export function calcularStatus(fatura: Partial<Fatura>): string {
  const dias = calcularDiasRestantes(fatura.data_vencimento || '');

  if (fatura.status_pagamento === 'Pago') {
    if (fatura.data_pagamento_real && fatura.data_vencimento) {
      const dataPgto = new Date(fatura.data_pagamento_real + 'T00:00:00');
      const dataVenc = new Date(fatura.data_vencimento + 'T00:00:00');
      dataPgto.setHours(0,0,0,0);
      dataVenc.setHours(0,0,0,0);
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

export function calcularEtapa(fatura: Partial<Fatura>): Etapa {
  if (fatura.status_pagamento === 'Pago') return 'Pago';
  if (fatura.status_pagamento === 'Aguardando pagamento') return 'Aguardando pagamento';
  
  if (fatura.status_pagamento === 'ERP') return 'Aprovação';
  if (fatura.status_pagamento === 'V360') return 'Inclusão no V360';
  if (fatura.status_pagamento === 'HEFLO') return 'Requisição de Compras';
  
  if (fatura.is_sap) {
    if (fatura.doc_subsequente_criado) {
      if (!fatura.nexa_emitiu_nf) return 'Aguardando emissão de NF';
      if (!fatura.nexa_lancamento_concluido) return 'Aguardando lançamento fiscal';
      if (!fatura.nexa_pagamento_programado) return 'Aguardando programação de pagamento';
      if (!fatura.nexa_pagamento_realizado) return 'Pagamento programado';
      return 'Pago';
    }
    if (fatura.pedido_sap || fatura.data_pedido_sap) return 'Pedido de Compras';
    if (fatura.rc_sap || fatura.data_rc_sap) return 'Requisição de Compras';
    return 'Cadastro da NF';
  } else {
    if (fatura.v360 && fatura.data_abertura_v360) return 'Inclusão no V360';
    if (fatura.erp && fatura.data_aprovacao) return 'Aprovação';
    if (fatura.heflo && fatura.data_abertura_heflo) return 'Requisição de Compras';
    return 'Cadastro da NF';
  }
}

export type SLAStatus = 'Dentro do prazo' | 'Próximo do vencimento' | 'Atrasado';

export function getBusinessDaysDifference(startDateStr: string, endDate: Date = new Date()): number {
  if (!startDateStr) return 0;
  let current = new Date(startDateStr + 'T00:00:00');
  let days = 0;
  
  const end = new Date(endDate.getTime());
  end.setHours(0, 0, 0, 0);

  while (current < end) {
    current.setDate(current.getDate() + 1);
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      days++;
    }
  }
  return days;
}

export function getDataMetaOperacional(data_vencimento?: string): string | null {
  if (!data_vencimento) return null;
  const d = new Date(data_vencimento + 'T00:00:00');
  d.setDate(d.getDate() - 10);
  return d.toISOString().split('T')[0];
}

export function calcularDiasRestantesUteis(data_vencimento: string): number {
  if (!data_vencimento) return 0;
  
  const dateVencimento = new Date(data_vencimento + 'T00:00:00');
  const hoje = new Date();
  hoje.setHours(0,0,0,0);

  if (dateVencimento < hoje) {
    let current = new Date(dateVencimento.getTime());
    let days = 0;
    while (current < hoje) {
      current.setDate(current.getDate() + 1);
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) days--;
    }
    return days;
  } else {
    let current = new Date(hoje.getTime());
    let days = 0;
    while (current < dateVencimento) {
      current.setDate(current.getDate() + 1);
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) days++;
    }
    return days;
  }
}

export function calcularSLA(fatura: Partial<Fatura>): SLAStatus | null {
  const etapa = calcularEtapa(fatura);
  
  if (etapa === 'Aguardando pagamento' || etapa === 'Pago') {
    return null; // Operação concluída
  }

  const metaOperacional = getDataMetaOperacional(fatura.data_vencimento);
  if (metaOperacional) {
    const metaDate = new Date(metaOperacional + 'T00:00:00');
    metaDate.setHours(0,0,0,0);
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    
    const diffTime = metaDate.getTime() - hoje.getTime();
    const diasVenc = Math.ceil(diffTime / (1000 * 3600 * 24));
    
    if (diasVenc < 0) return 'Atrasado';
    if (diasVenc >= 0 && diasVenc <= 3) return 'Próximo do vencimento';
  }

  let startDateStr = '';
  let limiteDias = 0;

  if (fatura.is_sap) {
    if (etapa === 'Cadastro da NF') {
      startDateStr = fatura.data_recebimento || '';
      limiteDias = 1;
    } else if (etapa === 'Requisição de Compras') {
      startDateStr = fatura.data_rc_sap || '';
      limiteDias = 3;
    } else if (etapa === 'Pedido de Compras') {
      startDateStr = fatura.data_pedido_sap || '';
      limiteDias = 2;
    }
  } else {
    if (etapa === 'Cadastro da NF') {
      startDateStr = fatura.data_recebimento || '';
      limiteDias = 1;
    } else if (etapa === 'Requisição de Compras') {
      startDateStr = fatura.data_abertura_heflo || '';
      limiteDias = 4;
    } else if (etapa === 'Aprovação') {
      startDateStr = fatura.data_aprovacao || '';
      limiteDias = 1;
    } else if (etapa === 'Inclusão no V360') {
      startDateStr = fatura.data_abertura_v360 || '';
      limiteDias = 4;
    }
  }

  if (startDateStr) {
    const diasPassados = getBusinessDaysDifference(startDateStr);
    if (diasPassados > limiteDias) return 'Atrasado';
    if (diasPassados === limiteDias) return 'Próximo do vencimento';
  }

  return 'Dentro do prazo';
}

