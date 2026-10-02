const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/disabled=\{oc\.status === 'Resolvida'\} disabled=\{oc\.status === 'Resolvida'\} disabled=\{oc\.status !== 'Pendente Destino'\} disabled=\{oc\.status !== 'Pendente Destino'\}/g, "disabled={oc.status === 'Resolvida' || oc.status !== 'Pendente Destino'}");
content = content.replace(/disabled=\{oc\.status === 'Resolvida'\} disabled=\{oc\.status !== 'Pendente Destino'\}/g, "disabled={oc.status === 'Resolvida' || oc.status !== 'Pendente Destino'}");

// Just to be sure, any duplicate 'disabled' in the file
content = content.replace(/(<Input [^>]*?)disabled=\{([^}]+)\}([^>]*?)disabled=\{([^}]+)\}/g, (match, p1, p2, p3, p4) => {
  return `${p1}disabled={${p2} || ${p4}}${p3}`;
});
// Run it twice in case there are 3 disabled
content = content.replace(/(<Input [^>]*?)disabled=\{([^}]+)\}([^>]*?)disabled=\{([^}]+)\}/g, (match, p1, p2, p3, p4) => {
  return `${p1}disabled={${p2} || ${p4}}${p3}`;
});
content = content.replace(/(<Input [^>]*?)disabled=\{([^}]+)\}([^>]*?)disabled=\{([^}]+)\}/g, (match, p1, p2, p3, p4) => {
  return `${p1}disabled={${p2} || ${p4}}${p3}`;
});

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed duplicate disabled attributes in FaturaSAPModal.tsx');
