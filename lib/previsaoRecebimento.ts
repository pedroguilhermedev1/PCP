/**
 * Utilitários para cálculo de período estimado de recebimento em dias úteis,
 * serialização de metadados e histórico de entregas parciais.
 */

export interface PrevisaoRecebimento {
  dias_min: number;
  dias_max: number;
  data_inicio?: string; // YYYY-MM-DD
  data_fim?: string;    // YYYY-MM-DD
  historico?: Array<{
    dias_min: number;
    dias_max: number;
    data_inicio?: string;
    data_fim?: string;
    alterado_por: string;
    data_alteracao: string;
  }>;
}

export interface EntregaParcial {
  entrega_numero: number;
  quantidade: number;
  data_hora: string;
  usuario: string;
  quantidade_acumulada: number;
  saldo_restante: number;
  observacao?: string;
}

export interface EncerramentoSaldo {
  quantidade_encerrada: number;
  justificativa: string;
  usuario: string;
  data_hora: string;
}

export interface ObservacaoCriador {
  usuario: string;
  data_hora: string;
  texto: string;
}

export interface HistoricoReabertura {
  usuario: string;
  data_hora: string;
  motivo_anterior?: string;
}

export interface HistoricoReprovacao {
  usuario: string;
  data_hora: string;
  motivo: string;
}

export interface MovimentacaoMetadata {
  quantidade_prevista?: number;
  quantidade_recebida?: number;
  saldo_pendente?: number;
  entregas?: EntregaParcial[];
  encerramento?: EncerramentoSaldo;
  observacoes_criador?: ObservacaoCriador[];
  reaberturas?: HistoricoReabertura[];
  reprovacoes?: HistoricoReprovacao[];
  previsao_dias_min?: number;
  previsao_dias_max?: number;
  previsao_data_inicio?: string;
  previsao_data_fim?: string;
  data_criacao_original?: string;
}

/**
 * Adiciona X dias úteis (segunda a sexta-feira) a uma data base YYYY-MM-DD.
 */
export function somarDiasUteis(dataBaseStr: string, diasUteis: number): string {
  if (!dataBaseStr || isNaN(diasUteis) || diasUteis < 1) return "";

  // Suporte a strings com ou sem hora
  const cleanDate = dataBaseStr.includes('T') ? dataBaseStr.split('T')[0] : dataBaseStr.split(' ')[0];
  const partes = cleanDate.split('-');
  if (partes.length !== 3) return "";

  const ano = parseInt(partes[0], 10);
  const mes = parseInt(partes[1], 10) - 1;
  const dia = parseInt(partes[2], 10);

  const data = new Date(ano, mes, dia);
  let diasAdicionados = 0;

  while (diasAdicionados < diasUteis) {
    data.setDate(data.getDate() + 1);
    const diaSemana = data.getDay(); // 0 = Domingo, 6 = Sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAdicionados++;
    }
  }

  const y = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, '0');
  const d = String(data.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Calcula o intervalo de datas estimadas de recebimento com base na data original de criação
 * e nos prazos mínimo e máximo em dias úteis.
 */
export function calcularDatasPrevisao(
  dataBaseStr: string,
  diasMin: number,
  diasMax: number
): { data_inicio: string; data_fim: string } {
  const data_inicio = somarDiasUteis(dataBaseStr, diasMin);
  const data_fim = somarDiasUteis(dataBaseStr, diasMax);
  return { data_inicio, data_fim };
}

/**
 * Formata o período estimado para exibição legível.
 * Exemplo: "De 3 até 5 dias úteis (28/10 a 30/10)" ou "De 1 até 1 dia útil (26/10)"
 */
export function formatarPeriodoEstimado(
  diasMin?: number | null,
  diasMax?: number | null,
  dataInicio?: string | null,
  dataFim?: string | null
): string {
  if (!diasMin || !diasMax) {
    return "Não informado";
  }

  const formatBR = (dStr?: string | null) => {
    if (!dStr) return "";
    const clean = dStr.includes('T') ? dStr.split('T')[0] : dStr.split(' ')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return dStr;
  };

  const dInicioBR = formatBR(dataInicio);
  const dFimBR = formatBR(dataFim);

  if (diasMin === diasMax) {
    const textoDia = diasMin === 1 ? "1 até 1 dia útil" : `${diasMin} até ${diasMax} dias úteis`;
    return dInicioBR ? `De ${textoDia} (${dInicioBR})` : `De ${textoDia}`;
  }

  const intervaloDatas = (dInicioBR && dFimBR) ? ` (${dInicioBR} a ${dFimBR})` : '';
  return `De ${diasMin} até ${diasMax} dias úteis${intervaloDatas}`;
}

const META_PREFIX = '___META_PCP___:';

/**
 * Serializa metadados estruturados para dentro do campo observacoes do estoque_movimentacoes,
 * preservando qualquer texto legível anterior.
 */
export function serializarObservacoesComMeta(
  textoLegivel: string,
  meta: MovimentacaoMetadata
): string {
  const textoLimpo = (textoLegivel || '').split(META_PREFIX)[0].trim();
  const metaJson = JSON.stringify(meta);
  if (!textoLimpo) {
    return `${META_PREFIX}${metaJson}`;
  }
  return `${textoLimpo} | ${META_PREFIX}${metaJson}`;
}

/**
 * Extrai texto legível e metadados estruturados de observacoes do estoque_movimentacoes.
 */
export function extrairMetaDeObservacoes(observacoes?: string | null): {
  textoLegivel: string;
  meta: MovimentacaoMetadata;
} {
  if (!observacoes) {
    return { textoLegivel: "", meta: {} };
  }

  if (observacoes.includes(META_PREFIX)) {
    const parts = observacoes.split(META_PREFIX);
    const textoLegivel = parts[0].replace(/\|\s*$/, '').trim();
    try {
      const meta = JSON.parse(parts[1]) as MovimentacaoMetadata;
      return { textoLegivel, meta };
    } catch {
      return { textoLegivel, meta: {} };
    }
  }

  return { textoLegivel: observacoes, meta: {} };
}
