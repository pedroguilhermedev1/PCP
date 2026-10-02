const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

const filterLogic = `
                                const cdRaw = f.cd || f.insumos?.find(i => (i as any)._meta)?.cd || f.insumos?.[0]?.cd || '';
                                const cd = typeof cdRaw === 'string' ? cdRaw.toUpperCase().trim() : '';
                                const filterCd = typeof listFiltroCD === 'string' ? listFiltroCD.toUpperCase().trim() : '';
                                if (listFiltroCD !== 'todos' && cd !== filterCd) return false;
                                
                                if (listFiltroResp !== 'todos' && f.responsavel !== listFiltroResp) return false;
                                
                                const dataStr = f.data_vencimento || f.data_emissao || f.data_recebimento || f.data_abertura || f.created_at || f.nexa_data_inicio || new Date().toISOString();
                                let d = new Date(dataStr);
                                if (isNaN(d.getTime()) && typeof dataStr === 'string' && dataStr.includes('/')) {
                                  const parts = dataStr.split('/');
                                  if (parts.length === 3) d = new Date(parts[2], parseInt(parts[1])-1, parts[0]);
                                }
                                if (isNaN(d.getTime())) d = new Date();
                                const m = (d.getMonth() + 1).toString().padStart(2, '0');
                                const y = d.getFullYear().toString();
                                
                                if (listFiltroMes !== 'todos' && m !== listFiltroMes) return false;
                                if (listFiltroAno !== 'todos' && y !== listFiltroAno) return false;
                                
                                return true;
`;

// Replace the two occurrences of the filter function
// 1. In the count span
content = content.replace(
  /if \(listFiltroCD !== 'todos' && f\.cd !== listFiltroCD\) return false;[\s\S]*?if \(listFiltroAno !== 'todos' && y !== listFiltroAno\) return false;\s*return true;/g,
  filterLogic
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed robust filter logic');
