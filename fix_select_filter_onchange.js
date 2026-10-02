const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /onChange=\{setListFiltroCD\}/g,
  "onChange={(e) => setListFiltroCD(e.target.value)}"
);

content = content.replace(
  /onChange=\{setListFiltroResp\}/g,
  "onChange={(e) => setListFiltroResp(e.target.value)}"
);

content = content.replace(
  /onChange=\{setListFiltroMes\}/g,
  "onChange={(e) => setListFiltroMes(e.target.value)}"
);

content = content.replace(
  /onChange=\{setListFiltroAno\}/g,
  "onChange={(e) => setListFiltroAno(e.target.value)}"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed SelectFilter onChange handlers');
