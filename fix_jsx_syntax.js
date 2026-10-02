const fs = require('fs');
const path = 'c:/Users/conta/OneDrive/Documentos/PCP/components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(path, 'utf8');

// Fix JSX syntax
content = content.replace(
  /\{\!autoStatus\.includes\('Pago'\) && \(\n\s*\{oc\.status === 'Pendente Destino' && (<Button[^>]+>Devolver para \{oc\.t_origem\}<\/Button>)\}\n\s*\)\}/g,
  "{!autoStatus.includes('Pago') && oc.status === 'Pendente Destino' && (\n  $1\n)}"
);

content = content.replace(
  /\{\!autoStatus\.includes\('Pago'\) && \(\n\s*\{oc\.status !== 'Resolvida' && (<Button[^>]+>Finalizar Ocorrência<\/Button>)\}\n\s*\)\}/g,
  "{!autoStatus.includes('Pago') && oc.status !== 'Resolvida' && (\n  $1\n)}"
);

// Just in case it wasn't formatted exactly with \n\s*
content = content.replace(/\{\!autoStatus\.includes\('Pago'\) && \([\s\n]*\{oc\.status === 'Pendente Destino' && (<Button[\s\S]*?<\/Button>)\}[\s\n]*\)\}/g, "{!autoStatus.includes('Pago') && oc.status === 'Pendente Destino' && (\n  $1\n)}");
content = content.replace(/\{\!autoStatus\.includes\('Pago'\) && \([\s\n]*\{oc\.status !== 'Resolvida' && (<Button[\s\S]*?<\/Button>)\}[\s\n]*\)\}/g, "{!autoStatus.includes('Pago') && oc.status !== 'Resolvida' && (\n  $1\n)}");


fs.writeFileSync(path, content, 'utf8');
console.log('Fixed JSX syntax error');
