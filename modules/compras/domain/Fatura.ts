// Status da Fatura: calculado com base na data_vencimento
export type StatusFatura = 'A vencer' | 'Vencido' | 'Pago';
// Status do Pagamento: Estágio no fluxo manual
export type StatusPagamento = 'Em andamento' | 'Aguardando pagamento' | 'Pago' | 'ERP' | 'V360' | 'HEFLO';
export type Etapa = 'Integração' | 'HEFLO' | 'ERP' | 'V360' | 'Aguardando pagamento' | 'Pago';

export interface FaturaInsumo {
  codigo: string;
  item: string;
  quantidade: number;
  preco_unitario?: number;
  valor_total?: number;
  conta_protheus?: string;
  desc_conta_protheus?: string;
  observacoes?: string;
}

export interface Fatura {
  id: string;
  identificador?: string;

  marca: string;
  categoria: 'Serviço' | 'Material';
  
  fornecedor: string;
  cnpj: string;
  centro_custo: string;
  filial: string;
  conta_protheus?: string;
  desc_conta_protheus?: string;
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
  
  data_pagamento_real?: string;
  observacoes?: string;
  
  insumos?: FaturaInsumo[];

  possui_encargo: boolean;
  valor_encargo?: number;

  status_pagamento: StatusPagamento;

  // Calculados (Opcionais no model para persistência, mas gerados pela view/helper)
  status?: StatusFatura;
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

export function calcularStatus(fatura: Partial<Fatura>): StatusFatura {
  if (fatura.status_pagamento === 'Pago') return 'Pago';
  if (!fatura.data_vencimento) return 'A vencer';
  
  const dias = calcularDiasRestantes(fatura.data_vencimento);
  if (dias < 0) return 'Vencido';
  return 'A vencer';
}

export function calcularEtapa(fatura: Partial<Fatura>): Etapa {
  if (fatura.status_pagamento === 'Pago') return 'Pago';
  if (fatura.status_pagamento === 'Aguardando pagamento') return 'Aguardando pagamento';
  if (fatura.status_pagamento === 'ERP') return 'ERP';
  if (fatura.status_pagamento === 'V360') return 'V360';
  if (fatura.status_pagamento === 'HEFLO') return 'HEFLO';
  
  // Se está 'Em andamento', calcula pela fase operacional
  if (fatura.v360 && fatura.data_abertura_v360) return 'V360';
  if (fatura.erp && fatura.data_aprovacao) return 'ERP';
  if (fatura.heflo && fatura.data_abertura_heflo) return 'HEFLO';
  
  return 'Integração';
}


