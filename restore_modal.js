const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/app/compras/dashboard/client.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add import for getFaturaPeriodosAction
if (!content.includes('getFaturaPeriodosAction')) {
  content = content.replace(
    /import \{ getFaturas20Action \} from "@\/app\/compras\/dashboard\/actions";/,
    'import { getFaturas20Action } from "@/app/compras/dashboard/actions";\nimport { getFaturaPeriodosAction } from "@/app/compras/faturas-sap/actions";'
  );
}

// 2. Change expandedRow to selectedViewFatura (which is what I had) or just add faturaPeriodos
content = content.replace(
  /const \[expandedRow, setExpandedRow\] = useState<string \| null>\(null\);/,
  "const [selectedViewFatura, setSelectedViewFatura] = useState<any | null>(null);\n  const [faturaPeriodos, setFaturaPeriodos] = useState<any[]>([]);"
);

// 3. Update the onClick logic
const onClickLogic = `onClick={async (e) => {
                                      e.stopPropagation();
                                      setSelectedViewFatura(f);
                                      try {
                                        const periodos = await getFaturaPeriodosAction(f.id);
                                        setFaturaPeriodos(periodos);
                                      } catch (err) {
                                        setFaturaPeriodos([]);
                                      }
                                    }}`;
content = content.replace(
  /onClick=\{.*?setExpandedRow.*?\}/g,
  onClickLogic
);

// 4. Remove the expanded row inline rendering
content = content.replace(
  /\{expandedRow === f\.id && \([\s\S]*?<\/tr>\s*\)\}/g,
  ""
);

// 5. Re-inject the FaturaDetailsModal at the very end of the file before the final </div></div></div>
const modalJSX = `
        {selectedViewFatura && (
          <FaturaDetailsModal
            isOpen={!!selectedViewFatura}
            onClose={() => { setSelectedViewFatura(null); setFaturaPeriodos([]); }}
            fatura={selectedViewFatura}
            faturaPeriodos={faturaPeriodos}
            canEditOrDelete={false}
            handleDuplicate={() => {}}
            setFaturaToTransfer={() => {}}
            handleEdit={() => {}}
            setSelectedStage={() => {}}
            getStatusColor={(s) => 'gray'}
            getEtapaColor={(e) => 'gray'}
            getEtapaLabel={(e) => e}
          />
        )}
`;

content = content.replace(
  /<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}\s*$/g,
  `${modalJSX}\n      </div>\n    </div>\n  </div>\n  );\n}\n`
);

fs.writeFileSync(path, content, 'utf8');
console.log('Restored Modal and removed inline expansion');
