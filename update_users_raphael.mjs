import fs from 'fs';
import path from 'path';

const files = [
  'lib/roles.ts',
  'components/PendenciasNotification.tsx',
  'components/layout/sidebar.tsx',
  'components/estoque/EstoqueInsumosTable.tsx',
  'app/compras/lembretes/client.tsx',
  'app/compras/layout.tsx',
  'app/compras/insumos/[cd]/client.tsx',
  'app/compras/fornecedores/client.tsx',
  'app/compras/fornecedores/cronograma/client.tsx',
  'app/compras/formularios/[cd]/client.tsx',
  'app/compras/faturas-sap/client.tsx',
  'app/compras/dashboard/client.tsx',
  'app/compras/faturas/client.tsx',
  'app/login/LoginForm.tsx'
];

for (const file of files) {
  const filePath = path.join('c:/Users/conta/OneDrive/Documentos/PCP', file);
  if (!fs.existsSync(filePath)) {
    console.log('Not found:', file);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Arrays
  content = content.replace(/'debora\.mota'/g, "'debora.mota', 'raphael.ramiro'");

  // Conditions
  content = content.replace(/currentUser\.startsWith\('debora\.mota'\)/g, "(currentUser.startsWith('debora.mota') || currentUser.startsWith('raphael.ramiro'))");
  content = content.replace(/user\.startsWith\('debora\.mota'\)/g, "(user.startsWith('debora.mota') || user.startsWith('raphael.ramiro'))");

  // Specific formatUserName
  if (file === 'lib/roles.ts') {
    content = content.replace(/if \(normalized === 'debora\.mota', 'raphael\.ramiro'\) return 'Débora Mota';/, "if (normalized === 'debora.mota') return 'Débora Mota';\n  if (normalized === 'raphael.ramiro') return 'Raphael Ramiro';");
  }

  // Specific login form
  if (file === 'app/login/LoginForm.tsx') {
    content = content.replace(/parsedUsername === 'debora\.mota', 'raphael\.ramiro'/g, "(parsedUsername === 'debora.mota' || parsedUsername === 'raphael.ramiro')");
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated:', file);
}
