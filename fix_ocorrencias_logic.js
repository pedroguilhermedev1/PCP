const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix dynamic numbering
content = content.replace(/t_destino_codigo: ocorrenciaModal\.novoDestino \+ '\.1',/g, "t_destino_codigo: ocorrenciaModal.novoDestino + '.' + (((prev.ocorrencias || []).filter(o => o.t_destino === ocorrenciaModal.novoDestino).length) + 1),");
content = content.replace(/t_origem_retorno_codigo: \(ocorrenciaModal\.t_origem \|\| ''\) \+ '\.1',/g, "t_origem_retorno_codigo: (ocorrenciaModal.t_origem || '') + '.' + (((prev.ocorrencias || []).filter(o => o.t_origem === ocorrenciaModal.t_origem).length) + 1),");

// Fix "Devolver para Origem" button to also set origem_data_inicio
content = content.replace(/newOc\[idx\]\.status = 'Pendente Origem';/g, "newOc[idx].status = 'Pendente Origem';\n                              if (!newOc[idx].origem_data_inicio) newOc[idx].origem_data_inicio = new Date().toISOString();");

// Fix "disabled" in Retorno inputs
// Retorno blocks start with {/* Ocorrencias T... Origem Retorno */}
// Inside them, there are <Input for Início and Fim.
// We'll replace `disabled={oc.status !== 'Pendente Destino'}` with `disabled={oc.status !== 'Pendente Origem'}` globally but only where it's for Retorno? Wait, for Destino (Ocorrência) the disabled for Início is `oc.status === 'Resolvida' || oc.status !== 'Pendente Destino'`.
// So we can just fix ALL Retorno blocks by replacing `disabled={oc.status !== 'Pendente Destino'}` near `origem_data_inicio` with `disabled={oc.status !== 'Pendente Origem'}`
content = content.replace(/(origem_data_inicio.*?)disabled=\{oc\.status !== 'Pendente Destino'\}/g, "$1disabled={oc.status !== 'Pendente Origem'}");
content = content.replace(/disabled=\{oc\.status !== 'Pendente Destino'\}(.*?origem_data_inicio)/g, "disabled={oc.status !== 'Pendente Origem'}$1");
// What about ones that don't have disabled at all? Some seem to miss it!
content = content.replace(/(<Input )className="h-7 text-xs border-orange-200" type="date" value=\{\(oc\.origem_data_inicio/g, "$1disabled={oc.status !== 'Pendente Origem'} className=\"h-7 text-xs border-orange-200\" type=\"date\" value={(oc.origem_data_inicio");
content = content.replace(/(<Input )className="h-7 text-xs border-orange-200" type="date" value=\{\(oc\.origem_data_fim/g, "$1disabled={oc.status !== 'Pendente Origem'} className=\"h-7 text-xs border-orange-200\" type=\"date\" value={(oc.origem_data_fim");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed occurrences numbering and Retorno UI logic');
