const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix month and year filters
const extractDateLogic = `
                                const dataStr = f.data_vencimento || f.data_emissao || f.data_recebimento || f.data_abertura || f.created_at || f.nexa_data_inicio || new Date().toISOString();
                                const d = new Date(dataStr);
                                const m = (d.getMonth() + 1).toString().padStart(2, '0');
                                const y = d.getFullYear().toString();
                                if (listFiltroMes !== 'todos' && m !== listFiltroMes) return false;
                                if (listFiltroAno !== 'todos' && y !== listFiltroAno) return false;
`;

content = content.replace(
  /if \(listFiltroMes !== 'todos' && f\.mes !== listFiltroMes\) return false;\s*if \(listFiltroAno !== 'todos' && f\.ano !== listFiltroAno\) return false;/g,
  extractDateLogic
);

// Hide Fluxo de Faturas 2.0 (Nexa / SAP)
content = content.replace(
  /\{\/\* 2\. Fluxo de Faturas 2\.0 \*\/\}\s*<div className="flex items-center gap-2 mb-6">/g,
  '{/* 2. Fluxo de Faturas 2.0 */}\n                    <div className="hidden items-center gap-2 mb-6">'
);

content = content.replace(
  /<h2 className="text-lg font-bold text-zinc-800">Fluxo de Faturas 2\.0 <span className="text-sm font-normal text-zinc-500">\(Nexa \/ SAP\)<\/span><\/h2>\s*<\/div>\s*<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">/g,
  '<h2 className="text-lg font-bold text-zinc-800">Fluxo de Faturas 2.0 <span className="text-sm font-normal text-zinc-500">(Nexa / SAP)</span></h2>\n                    </div>\n\n                    <div className="hidden grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">'
);


fs.writeFileSync(path, content, 'utf8');
console.log('Fixed filters and hid old section');
