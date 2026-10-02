const fs = require('fs');
let code = fs.readFileSync('modules/compras/domain/Fatura.ts', 'utf8');

const newInterface = `
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
`;

code = code.replace('export interface Pendencia {', newInterface + '\nexport interface Pendencia {');
code = code.replace('pendencias?: Pendencia[];', 'pendencias?: Pendencia[];\n  ocorrencias?: Ocorrencia[];');

fs.writeFileSync('modules/compras/domain/Fatura.ts', code);
console.log('Ocorrencia interface added to Fatura.ts');
