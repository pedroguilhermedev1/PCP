const fs = require('fs');
const pathDash = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let contentDash = fs.readFileSync(pathDash, 'utf8');

// Fix duplicates in CD Filter
contentDash = contentDash.replace(
  /const uniqueCDs = Array\.from\(new Set\(insumos\.map\(i => i\.cd\)\.filter\(Boolean\)\)\)/g,
  "const uniqueCDs = Array.from(new Set(insumos.map(i => typeof i.cd === 'string' ? i.cd.toUpperCase().trim() : null).filter(Boolean)))"
);

// We should also replace in faturas? The user said "dashboard, operacional, insumos". Wait! The dashboard has a tab called "insumos".
// And the dropdown is there.

// Let's also hide Gantt
contentDash = contentDash.replace(
  /<FaturasGantt faturas=\{filteredFaturas\} flowType="2\.0" \/>/g,
  '<div className="hidden">\n  <FaturasGantt faturas={filteredFaturas} flowType="2.0" />\n</div>'
);

fs.writeFileSync(pathDash, contentDash, 'utf8');
console.log('Fixed dashboard (duplicates and gantt visibility)');
