const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// TASK 1: Occurrences History
// 1a. Remove the filtering of `oc.status === 'Pendente Destino'` and `oc.status === 'Pendente Origem'`
// Replace filters:
content = content.replace(/oc => oc\.t_destino === '([^']+)' && oc\.status === 'Pendente Destino'/g, "oc => oc.t_destino === '$1'");
content = content.replace(/oc => oc\.t_origem === '([^']+)' && oc\.status === 'Pendente Origem'/g, "oc => oc.t_origem === '$1' && oc.status !== 'Pendente Destino'");

// 1b. Disable inputs when not pending
// For destino (T_destino_codigo):
content = content.replace(/<Input([^>]+)(onChange=\{\(e\) => \{\s*const newOc[\s\S]*?oc\.id\);\s*newOc\[idx\]\.destino_data_inicio[\s\S]*?\}\})/g, "<Input disabled={oc.status !== 'Pendente Destino'}$1$2");
content = content.replace(/<Input([^>]+)(onChange=\{\(e\) => \{\s*const newOc[\s\S]*?oc\.id\);\s*newOc\[idx\]\.destino_data_fim[\s\S]*?\}\})/g, "<Input disabled={oc.status !== 'Pendente Destino'}$1$2");

// For origem (T_origem_retorno_codigo):
content = content.replace(/<Input([^>]+)(onChange=\{\(e\) => \{\s*const newOc[\s\S]*?oc\.id\);\s*newOc\[idx\]\.origem_data_inicio[\s\S]*?\}\})/g, "<Input disabled={oc.status === 'Resolvida'}$1$2");
content = content.replace(/<Input([^>]+)(onChange=\{\(e\) => \{\s*const newOc[\s\S]*?oc\.id\);\s*newOc\[idx\]\.origem_data_fim[\s\S]*?\}\})/g, "<Input disabled={oc.status === 'Resolvida'}$1$2");

// 1c. Hide buttons when not pending
content = content.replace(/(<Button[^>]+onClick=\{[^}]*newOc\[idx\]\.status = 'Pendente Origem'[^>]+>Devolver para \{oc\.t_origem\}<\/Button>)/g, "{oc.status === 'Pendente Destino' && $1}");
content = content.replace(/(<Button[^>]+onClick=\{[^}]*newOc\[idx\]\.status = 'Resolvida'[^>]+>Finalizar Ocorrência<\/Button>)/g, "{oc.status !== 'Resolvida' && $1}");

// TASK 2: Move checkboxes AFTER dates
// T2 PC: doc_subsequente_criado
const t2PCBlock = /<label className="flex items-center justify-between cursor-pointer group mt-2">[\s\S]*?Doc Subsequente\?[\s\S]*?onChange=\{\(e\) => handleChange\('doc_subsequente_criado', e\.target\.checked\)\}[\s\S]*?<\/label>/;
const matchT2PC = content.match(t2PCBlock);
if (matchT2PC) {
    content = content.replace(matchT2PC[0], ''); // remove from current position
    // insert after Fim (PC)
    const fimPC = /<label className="text-\[10px\] font-semibold text-zinc-500 uppercase">Fim \(PC\)<\/label>\s*<Input[^>]+pc_data_fim[^>]+>\s*<\/div>/;
    content = content.replace(fimPC, match => match + '\n' + matchT2PC[0]);
}

// T3 Fiscal: nexa_lancamento_concluido
const t3FiscalBlock = /<label className="flex items-center justify-between cursor-pointer group mt-2">[\s\S]*?Lançamento Concluído\?[\s\S]*?onChange=\{\(e\) => handleChange\('nexa_lancamento_concluido', e\.target\.checked\)\}[\s\S]*?<\/label>/;
const matchT3Fiscal = content.match(t3FiscalBlock);
if (matchT3Fiscal) {
    content = content.replace(new RegExp(t3FiscalBlock.source, 'g'), ''); // remove all occurrences
    // insert after Fim (Fiscal)
    const fimFiscal = /<label className="text-\[10px\] font-semibold text-zinc-500 uppercase">Fim \(Fiscal\)<\/label>\s*<Input[^>]+fiscal_data_fim[^>]+>\s*<\/div>/g;
    content = content.replace(fimFiscal, match => match + '\n' + matchT3Fiscal[0]);
}

// TASK 3: Remove block on T3 based on T2
// Find: formData.nexa_anexada ? "border-slate-300 hover:border-slate-400" : "border-zinc-200 opacity-60 pointer-events-none"
content = content.replace(/formData\.nexa_anexada \? "border-slate-300 hover:border-slate-400" : "border-zinc-200 opacity-60 pointer-events-none"/g, '"border-slate-300 hover:border-slate-400"');

// Wait, what about T2 Nexa blocking based on `formData.doc_subsequente_criado`? I'll remove that too just in case.
content = content.replace(/formData\.doc_subsequente_criado \? "border-cyan-200 hover:border-cyan-300" : "border-zinc-200 opacity-60 pointer-events-none"/g, '"border-cyan-200 hover:border-cyan-300"');

// And T4 blocked by nexa_lancamento_concluido? 
content = content.replace(/formData\.nexa_lancamento_concluido \? "border-green-300 hover:border-green-400" : "border-zinc-200 opacity-60 pointer-events-none"/g, '"border-green-300 hover:border-green-400"');

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed occurrences, checkboxes, and block requirements');
