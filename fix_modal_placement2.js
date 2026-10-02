const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

// The return statement starts at `return (`. We want to wrap what's inside.
// First, let's remove the badly placed modal.
content = content.replace(
  /\s*\{selectedViewFatura && \(\s*<FaturaDetailsModal fatura=\{selectedViewFatura\} onClose=\{\(\) => setSelectedViewFatura\(null\)\} \/>\s*\)\}/g,
  ''
);

// Now let's inject it right before the last `</div>`
content = content.replace(
  /<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}\s*$/g,
  `\n        {selectedViewFatura && (\n          <FaturaDetailsModal fatura={selectedViewFatura} onClose={() => setSelectedViewFatura(null)} />\n        )}\n      </div>\n    </div>\n  </div>\n  );\n}\n`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed JSX modal placement correctly');
