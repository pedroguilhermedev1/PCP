const fs = require('fs');
let content = fs.readFileSync('modules/compras/domain/Fatura.ts', 'utf8');

const cicloInterface = `
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
`;

if (!content.includes('export interface CicloProcesso')) {
  const insertIndex = content.indexOf('export interface Fatura {');
  content = content.slice(0, insertIndex) + cicloInterface + '\n' + content.slice(insertIndex);
}

const newFields = `
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
`;

if (!content.includes('rc_data_inicio?: string;')) {
  const insertFieldsIndex = content.indexOf('historico_passagens?: Record<string, HistoricoPassagem[]>;');
  content = content.slice(0, insertFieldsIndex) + newFields + '\n  ' + content.slice(insertFieldsIndex);
}

fs.writeFileSync('modules/compras/domain/Fatura.ts', content);
console.log('Fatura.ts atualizado com sucesso.');
