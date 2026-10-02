const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import for React if missing
if (!content.includes("import React")) {
  content = content.replace(
    /import \{ useState, useMemo, useEffect \} from "react";/,
    'import React, { useState, useMemo, useEffect } from "react";'
  );
}

// 2. Wrap the tr and expandedRow in React.Fragment
content = content.replace(
  /<tr key=\{f\.id\} className="hover:bg-zinc-50 transition-colors">/g,
  '<React.Fragment key={f.id}>\n<tr className="hover:bg-zinc-50 transition-colors">'
);

content = content.replace(
  /<\/tr>\s*\{expandedRow === f\.id && \([\s\S]*?<FaturasGantt faturas=\{\[f\]\} flowType="2\.0" \/>\s*<\/div>\s*<\/td>\s*<\/tr>\s*\)\}\s*\)\}\)/g,
  match => match.replace(/\)\}\s*\)\}\)$/, ')}\n</React.Fragment>\n)})')
);

// Specifically match the ending of that map loop
// Let's just do a string replace of the exact end.
// We had:
//                             {expandedRow === f.id && (
//                               <tr className="bg-zinc-50 border-b border-zinc-200">
//                                 <td colSpan={6} className="p-6">
//                                   <div className="bg-white rounded-xl shadow-inner border border-zinc-200 p-6">
//                                     <FaturasGantt faturas={[f]} flowType="2.0" />
//                                   </div>
//                                 </td>
//                               </tr>
//                             )}
//                             )})

content = content.replace(
  /<\/td>\s*<\/tr>\s*\)\}\s*\)\}\)/g,
  '</td>\n                              </tr>\n                            )}\n                            </React.Fragment>\n                            )})'
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed React Fragment issue');
