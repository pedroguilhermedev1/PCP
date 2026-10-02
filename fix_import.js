const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('import { getFaturaPeriodosAction }')) {
  content = content.replace(
    /import \{ FaturaDetailsModal \} from "@\/components\/faturas\/FaturaDetailsModal";/,
    'import { FaturaDetailsModal } from "@/components/faturas/FaturaDetailsModal";\nimport { getFaturaPeriodosAction } from "../faturas-sap/periodos-actions";'
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed missing import');
