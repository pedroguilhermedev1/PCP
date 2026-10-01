// Status da Fatura: calculado com base na data_vencimento
export type StatusFatura = 'A vencer' | 'Vencido' | 'Pago';
// Status do Pagamento: Estágio no fluxo manual
export type StatusPagamento = 'Em andamento' | 'Aguardando pagamento' | 'Pago' | 'ERP' | 'V360' | 'HEFLO';
export type Etapa = 'Em andamento' | 'Cadastro do Documento' | 'Requisição de Compras' | 'Aprovação' | 'Inclusão no V360' | 'Pedido de Compras' | 'Aguardando emissão de Documento' | 'Aguardando lançamento fiscal' | 'Aguardando programação de pagamento' | 'Pagamento programado' | 'Aguardando pagamento' | 'Pago' | 'Aguardando PC Nexa';

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


export interface Ocorrencia {
  id: string;
  t_origem: string; // ex: 'T3'
  t_destino: string; // ex: 'T1'
  motivo: string;
  data_envio: string; // data em que foi devolvido
  
  t_destino_codigo: string; // ex: 'T1.1'
  destino_data_inicio?: string;
  destino_data_fim?: string;
  destino_responsavel?: string;
  
  t_origem_retorno_codigo: string; // ex: 'T3.1'
  origem_data_inicio?: string;
  origem_data_fim?: string;
  origem_responsavel?: string;
  
  status: 'Pendente Destino' | 'Pendente Origem' | 'Resolvida';
}

export interface Pendencia {
  id: string;
  etapa_origem: string;
  etapa_destino: string;
  data_abertura: string;
  responsavel: string;
  motivo: string;
  justificativa?: string;
  sla_dias: number;
  status: 'Aberta' | 'Concluída';
  data_conclusao?: string;
}

export interface HistoricoPassagem {
  data_entrada: string;
  data_saida?: string;
}


export interface CicloProcesso {
  id: string;                
  t_referencia: string;
  t_destino?: string;

  data_inicio_efetiva: string;
  data_fim_efetiva?: string;

  data_inicio_registro: string;
  data_fim_registro?: string;

  sla_aplicavel_dias: number; 
  resultado_sla?: 'Dentro do SLA' | 'Fora do SLA' | 'Em andamento';
  
  documento_vinculado?: boolean;
  doc_data_recebimento?: string;
  doc_data_vencimento?: string;
  status_janela?: 'Dentro da janela' | 'Fora da janela';

  motivo_ocorrencia?: string;
  motivo_texto?: string; 
  responsavel?: string;
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
  editado_por?: string;
  forma_pagamento: string; // pix, boleto, ted, etc.
  fluxo_iniciado_por?: string;

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
  origem?: 'SAP' | 'Nexa'; // Adicionado para rastrear fluxo
  rc_sap?: string;
  data_rc_sap?: string;
  pedido_sap?: string;
  data_pedido_sap?: string;
  doc_subsequente_criado?: boolean;
  numero_doc_subsequente?: string;
  
  // Nexa (Fase 2 / Fluxo Alternativo)
  nexa_emitiu_nf?: boolean;
  nexa_anexada?: boolean;
  nexa_chamado?: string;
  nexa_data_envio?: string;
  
  nexa_possui_rc?: boolean;
  nexa_rc_numero?: string;
  nexa_rc_data?: string;

  pc_nexa_concluido?: boolean;
  numero_pc_nexa?: string;
  data_pc_nexa?: string;
  usuario_pc_nexa?: string;

  nexa_lancamento_concluido?: boolean;
  nexa_data_conclusao_lancamento?: string;
  usuario_nexa_lancamento?: string;

  nexa_pagamento_programado?: boolean;
  nexa_data_prevista_pagamento?: string;
  usuario_nexa_programacao?: string;

  nexa_pagamento_realizado?: boolean;
  usuario_nexa_pagamento?: string;

  // Apresentação Semanal (Desvios e Ações)
  is_backlog?: boolean;
  motivo_desvio?: string;
  acao_corretiva?: string;
  acao_responsavel?: string;
  acao_status?: string;

  data_pagamento_real?: string;
  observacoes?: string;
  
  // Responsaveis T (Cards)
  responsavel_t1?: string;
  responsavel_t2?: string;
  responsavel_t3?: string;
  responsavel_t4?: string;
  responsavel_t5?: string;
  responsavel_t6?: string;
  responsavel_t7?: string;

  // Datas de Conclusão T (Cards)
  data_fim_t1?: string;
  data_fim_t2?: string;
  data_fim_t3?: string;
  data_fim_t4?: string;

  insumos?: FaturaInsumo[];

  pendencias?: Pendencia[];
  ocorrencias?: Ocorrencia[];
  
  // NOVOS CAMPOS PARA RASTREABILIDADE
  rc_data_inicio?: string;
  rc_data_fim?: string;
  aprovacao_data_inicio?: string;
  aprovacao_data_fim?: string;
  pc_data_inicio?: string;
  pc_data_fim?: string;
  
  nexa_data_inicio?: string;
  nexa_data_fim?: string;
  
  req_nexa_data_inicio?: string;
  req_nexa_data_fim?: string;
  
  fiscal_data_inicio?: string;
  fiscal_data_fim?: string;
  
  prog_data_inicio?: string;
  prog_data_fim?: string;
  
  pagamento_data_inicio?: string;
  pagamento_data_fim?: string;
  
  ciclos_processo?: CicloProcesso[];

  historico_passagens?: Record<string, HistoricoPassagem[]>;

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

  const isPaid = (fatura.is_sap && fatura.nexa_pagamento_realizado) || fatura.status_pagamento === 'Pago';

  if (isPaid) {
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
    if (etapa === 'Cadastro do Documento') {
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
    if (etapa === 'Cadastro do Documento') {
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

export interface ProjecaoPagamento {
  possivelSextaAtual?: boolean;
  janelaPerdida?: string;
  motivoPerda?: string;
  consequencia?: string;
  proximaSextaNormal?: string;
  possivelQuartaExcecao?: boolean;
  condicaoQuartaExcecao?: string;
  situacaoProcesso?: string;
  vencimentoUltrapassado?: boolean;
  statusViabilidade?: 'viavel' | 'risco' | 'perdido';
  slasFaltantes?: number;
  etapasPendentes?: string[];
  diasSegurancaFaltantes?: number;
}

export function proximaSextaDisponivel(dataReferencia: Date): Date {
  const d = new Date(dataReferencia);
  // se for sábado (6), passa pra próxima sexta (+6)
  // se for sexta (5), passa pra próxima sexta (+7) se quiser a PRÓXIMA (mas se for a atual disponível, é hoje. Como "dataReferencia" pode ser hoje, se for sexta e for de manhã? A regra diz "próxima sexta").
  // Vamos simplificar: pega a próxima sexta-feira estritamente.
  let diff = 5 - d.getDay();
  if (diff < 0) diff += 7; 
  if (diff === 0 && d.getHours() > 12) diff = 7; // Se já passou de meio dia de sexta, próxima
  d.setDate(d.getDate() + diff);
  return d;
}

export function formatarDataBrasileira(d: Date): string {
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' }).substring(0, 5); // dd/mm
}

export function calcularViabilidadePagamento(fatura: Partial<Fatura>): ProjecaoPagamento {
  if (!fatura.data_vencimento) {
    return {
      statusViabilidade: avaliarSlaDaEtapaAtual(fatura)
    };
  }

  const hoje = new Date();
  hoje.setHours(0,0,0,0);
  
  const vencimento = new Date(fatura.data_vencimento + 'T00:00:00');
  vencimento.setHours(0,0,0,0);
  
  const vencimentoUltrapassado = hoje > vencimento;

  let slasFaltantes = 0;
  let etapasPendentes: string[] = [];
  let processoCompleto = false;

  const ehFluxoNexa = fatura.fluxo_iniciado_por === 'Nexa' || !fatura.is_sap;
  const ehFluxoSap = fatura.is_sap && fatura.fluxo_iniciado_por !== 'Nexa';

  if (ehFluxoSap) {
    if (fatura.nexa_pagamento_realizado || fatura.status_pagamento === 'Pago') {
      processoCompleto = true;
    } else if (fatura.nexa_pagamento_programado) { // T6
      slasFaltantes = 3;
      etapasPendentes = ['Pagamento Realizado'];
      processoCompleto = true; 
    } else if (fatura.nexa_lancamento_concluido) { // T5
      slasFaltantes = 3 + 3;
      etapasPendentes = ['Programação de Pagamento', 'Pagamento Realizado'];
    } else if (fatura.nexa_data_envio) { // T4
      slasFaltantes = 3 + 3 + 3;
      etapasPendentes = ['Lançamento Fiscal', 'Programação de Pagamento', 'Pagamento Realizado'];
    } else if (fatura.pedido_sap || fatura.data_pedido_sap) { // T3
      slasFaltantes = 1 + 3 + 3 + 3;
      etapasPendentes = ['Solicitação no Nexa', 'Lançamento Fiscal', 'Programação de Pagamento', 'Pagamento Realizado'];
    } else if (fatura.data_aprovacao) { // T2
      slasFaltantes = 1 + 1 + 3 + 3 + 3;
      etapasPendentes = ['Criação do Pedido', 'Solicitação no Nexa', 'Lançamento Fiscal', 'Programação de Pagamento', 'Pagamento Realizado'];
    } else if (fatura.data_rc_sap || fatura.rc_sap) { // T1
      slasFaltantes = 1 + 1 + 1 + 3 + 3 + 3;
      etapasPendentes = ['Aprovação da RC', 'Criação do Pedido', 'Solicitação no Nexa', 'Lançamento Fiscal', 'Programação de Pagamento', 'Pagamento Realizado'];
    } else {
      slasFaltantes = 1 + 1 + 1 + 3 + 3 + 3;
      etapasPendentes = ['Criação da RC', 'Aprovação da RC', 'Criação do Pedido', 'Solicitação no Nexa', 'Lançamento Fiscal', 'Programação de Pagamento', 'Pagamento Realizado'];
    }
  } else {
    // Fluxo Apenas Nexa
    if (fatura.nexa_pagamento_realizado || fatura.status_pagamento === 'Pago') {
      processoCompleto = true;
    } else if (fatura.nexa_pagamento_programado) { // T3
      slasFaltantes = 3;
      etapasPendentes = ['Pagamento Realizado'];
      processoCompleto = true;
    } else if (fatura.nexa_lancamento_concluido) { // T2
      slasFaltantes = 3 + 3;
      etapasPendentes = ['Programação de Pagamento', 'Pagamento Realizado'];
    } else if (fatura.nexa_data_envio || fatura.nexa_chamado) { // T1
      slasFaltantes = 1 + 3 + 3;
      etapasPendentes = ['Lançamento Fiscal', 'Programação de Pagamento', 'Pagamento Realizado'];
    } else {
      slasFaltantes = 1 + 3 + 3;
      etapasPendentes = ['Solicitação no Nexa', 'Lançamento Fiscal', 'Programação de Pagamento', 'Pagamento Realizado'];
    }
  }

  const dataPrevisaoTermino = new Date(hoje.getTime());
  let dAdicionados = 0;
  while (dAdicionados < slasFaltantes) {
    dataPrevisaoTermino.setDate(dataPrevisaoTermino.getDate() + 1);
    const day = dataPrevisaoTermino.getDay();
    if (day !== 0 && day !== 6) dAdicionados++;
  }

  let sextaAtual = proximaSextaDisponivel(hoje);
  let sextaPossivel = proximaSextaDisponivel(dataPrevisaoTermino);

  const perdeuSextaAtual = sextaPossivel > sextaAtual;

  let projecao: ProjecaoPagamento = {
    vencimentoUltrapassado
  };

  if (perdeuSextaAtual) {
    projecao.possivelSextaAtual = false;
    projecao.janelaPerdida = formatarDataBrasileira(sextaAtual);
    projecao.motivoPerda = "O processo não estará completo a tempo para utilizar a janela desta sexta-feira.";
    
    if (sextaPossivel > vencimento && !vencimentoUltrapassado) {
      projecao.consequencia = "A próxima janela normal de pagamento será após o vencimento da NF, portanto o pagamento ficará em atraso.";
    }
    
    projecao.proximaSextaNormal = formatarDataBrasileira(sextaPossivel);
  } else {
    projecao.possivelSextaAtual = true;
    projecao.proximaSextaNormal = formatarDataBrasileira(sextaAtual);
  }

  projecao.possivelQuartaExcecao = true;
  projecao.condicaoQuartaExcecao = "Para utilizar essa exceção, a solicitação deve ser aberta até segunda-feira e o processo precisa estar completo.";
  
  if (processoCompleto) {
    projecao.situacaoProcesso = "O processo já está completo e a exceção pode ser solicitada.";
  } else {
    projecao.situacaoProcesso = `O processo ainda não está completo. Faltam: ${etapasPendentes.join(', ')}.`;
  }

  let current = new Date(sextaPossivel.getTime());
  let diasSegurancaFaltantes = 0;
  
  if (sextaPossivel > vencimento) {
    projecao.statusViabilidade = 'perdido';
  } else {
    while (current < vencimento) {
      current.setDate(current.getDate() + 1);
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) diasSegurancaFaltantes++;
    }
    projecao.diasSegurancaFaltantes = diasSegurancaFaltantes;
    
    if (diasSegurancaFaltantes >= 5) {
      projecao.statusViabilidade = 'viavel';
    } else {
      projecao.statusViabilidade = 'risco';
    }
  }

  projecao.slasFaltantes = slasFaltantes;
  projecao.etapasPendentes = etapasPendentes;

  return projecao;
}

export function avaliarSlaDaEtapaAtual(fatura: Partial<Fatura>): 'viavel' | 'risco' | 'perdido' {
  const ehFluxoSap = fatura.is_sap && fatura.fluxo_iniciado_por !== 'Nexa';
  
  let startDateStr = '';
  let limiteDias = 0;

  if (ehFluxoSap) {
    if (!fatura.data_rc_sap && !fatura.rc_sap) { // T1: Criação RC
       startDateStr = fatura.data_recebimento || '';
       limiteDias = 1;
    } else if (!fatura.data_aprovacao) { // T2: Aprovação RC
       startDateStr = fatura.data_rc_sap || '';
       limiteDias = 1;
    } else if (!fatura.pedido_sap && !fatura.data_pedido_sap) { // T3: Criação Pedido
       startDateStr = fatura.data_aprovacao || '';
       limiteDias = 1;
    } else if (!fatura.nexa_data_envio) { // T4: Solicitação no Nexa
       startDateStr = fatura.data_pedido_sap || '';
       limiteDias = 3;
    } else if (!fatura.nexa_lancamento_concluido) { // T5: Lançamento Fiscal
       startDateStr = fatura.nexa_data_envio || '';
       limiteDias = 3;
    } else if (!fatura.nexa_pagamento_programado) { // T6: Programação
       startDateStr = fatura.nexa_data_conclusao_lancamento || '';
       limiteDias = 3;
    } else {
       return 'viavel';
    }
  } else {
    // Apenas Nexa
    if (!fatura.nexa_data_envio && !fatura.nexa_chamado) { // T1
       startDateStr = fatura.data_recebimento || '';
       limiteDias = 1;
    } else if (!fatura.nexa_lancamento_concluido) { // T2
       startDateStr = fatura.nexa_data_envio || fatura.data_abertura_heflo || '';
       limiteDias = 3;
    } else if (!fatura.nexa_pagamento_programado) { // T3
       startDateStr = fatura.nexa_data_conclusao_lancamento || '';
       limiteDias = 3;
    } else {
       return 'viavel';
    }
  }

  if (startDateStr) {
    const diasPassados = getBusinessDaysDifference(startDateStr);
    if (diasPassados > limiteDias) return 'perdido';
    if (diasPassados === limiteDias) return 'risco';
    return 'viavel';
  }
  
  return 'viavel'; 
}




export function calcularSlaDinamico(
  fatura: Partial<Fatura>,
  standardSla: number
): number {
  if (!fatura.data_recebimento || !fatura.data_vencimento) {
    return standardSla;
  }

  const isNexa = fatura.fluxo_iniciado_por === 'Nexa';
  const totalSla = isNexa ? 9 : 10; // Total de dias úteis padrão do fluxo

  const rec = new Date(fatura.data_recebimento + 'T00:00:00');
  const ven = new Date(fatura.data_vencimento + 'T00:00:00');
  
  // Calcular dias úteis entre recebimento e vencimento
  let diasUteis = 0;
  let cur = new Date(rec);
  while (cur < ven) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) diasUteis++;
    cur.setDate(cur.getDate() + 1);
  }

  // Se os dias úteis disponíveis forem menores que o total necessário
  if (diasUteis < totalSla && diasUteis > 0) {
     return Math.max(1, Math.round(standardSla * (diasUteis / totalSla)));
  }

  return standardSla;
}
