const fs = require('fs');
const file = 'modules/compras/domain/Fatura.ts';
let content = fs.readFileSync(file, 'utf8');

const newLogic = `
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
`;

if (!content.includes('calcularSlaDinamico')) {
  content += '\n' + newLogic;
  fs.writeFileSync(file, content);
  console.log("calcularSlaDinamico injected into Fatura.ts");
} else {
  console.log("Already exists.");
}
