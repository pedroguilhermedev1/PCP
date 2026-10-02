const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/prev\.ocorrencias \|\| \[\]\)\.filter\(o => o\.t_destino === ocorrenciaModal\.novoDestino/g, "formData.ocorrencias || []).filter(o => o.t_destino === ocorrenciaModal.novoDestino");
content = content.replace(/prev\.ocorrencias \|\| \[\]\)\.filter\(o => o\.t_origem === ocorrenciaModal\.t_origem/g, "formData.ocorrencias || []).filter(o => o.t_origem === ocorrenciaModal.t_origem");

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed prev to formData in FaturaSAPModal');
