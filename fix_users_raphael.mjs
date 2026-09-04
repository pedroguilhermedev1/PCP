import fs from 'fs';
import path from 'path';

const files = [
  'app/compras/lembretes/client.tsx',
  'app/compras/fornecedores/cronograma/client.tsx',
  'app/compras/fornecedores/client.tsx',
  'app/compras/faturas-sap/client.tsx',
  'app/compras/faturas/client.tsx',
  'app/compras/dashboard/client.tsx',
  'app/login/LoginForm.tsx'
];

for (const file of files) {
  const filePath = path.join('c:/Users/conta/OneDrive/Documentos/PCP', file);
  if (!fs.existsSync(filePath)) {
    console.log('Not found:', file);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/currentUser\.startsWith\('debora\.mota', 'raphael\.ramiro'\)/g, "(currentUser.startsWith('debora.mota') || currentUser.startsWith('raphael.ramiro'))");
  content = content.replace(/user\.startsWith\('debora\.mota', 'raphael\.ramiro'\)/g, "(user.startsWith('debora.mota') || user.startsWith('raphael.ramiro'))");
  
  if (file === 'app/login/LoginForm.tsx') {
    content = content.replace(/'debora\.mota', 'raphael\.ramiro' to match/, "'debora.mota' to match");
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed:', file);
}
