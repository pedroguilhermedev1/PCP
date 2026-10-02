const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('<FaturaDetailsModal fatura={selectedViewFatura}')) {
  content = content.replace(
    /\s*\);\s*\}\s*$/g,
    `\n      {selectedViewFatura && (\n        <FaturaDetailsModal fatura={selectedViewFatura} onClose={() => setSelectedViewFatura(null)} />\n      )}\n    );\n}\n`
  );
}

fs.writeFileSync(path, content, 'utf8');
console.log('Added Modal JSX to the end of the return statement');
