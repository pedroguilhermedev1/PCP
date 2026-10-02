const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Change listFiltroAno default to 'todos'
content = content.replace(
  /const \[listFiltroAno, setListFiltroAno\] = useState\(new Date\(\)\.getFullYear\(\)\.toString\(\)\);/,
  "const [listFiltroAno, setListFiltroAno] = useState('todos');"
);

// 2. Completely remove the second block
// We want to delete from {/* 2. Fluxo de Faturas 2.0 */} until just before {/* 3. Fluxo de Faturas 2.0 */}
// Wait, the string '3. Fluxo de Faturas' has an em-dash or weird characters.
// Let's just use `indexOf` and `substring` to be completely safe.
const startMarker = '{/* 2. Fluxo de Faturas 2.0 */}';
const endMarker = '{/* 3. Fluxo de Faturas 2.0';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  content = content.substring(0, startIndex) + content.substring(endIndex);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed listFiltroAno and removed section 2 completely');
