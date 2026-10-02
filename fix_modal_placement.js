const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

// The problematic snippet is:
//     </div>
//       {selectedViewFatura && (
//         <FaturaDetailsModal fatura={selectedViewFatura} onClose={() => setSelectedViewFatura(null)} />
//       )}
//     );
// }

// Let's replace it to be inside the root div.
// Wait, the root div ends at `</div>\n    </div>\n    </div>\n    );` (Wait, it might be 3 divs deep)
content = content.replace(
  /\n      \{selectedViewFatura && \([\s\S]*?\n      \}\)\n    \);\n\}/,
  ''
);

// Now the end of file looks like:
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//

// I will insert it BEFORE the last `</div>\n    </div>\n    </div>\n  );`
content = content.replace(
  /<\/div>\s*<\/div>\s*<\/div>\s*(\);\s*\}\s*)$/g,
  `\n      {selectedViewFatura && (\n        <FaturaDetailsModal fatura={selectedViewFatura} onClose={() => setSelectedViewFatura(null)} />\n      )}\n    </div>\n  </div>\n</div>\n$1`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed JSX modal placement');
