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
  'app/compras/faturas/client.tsx'
];

for (const file of files) {
  const filePath = path.join('c:/Users/conta/OneDrive/Documentos/PCP', file);
  if (!fs.existsSync(filePath)) {
    console.log('Not found:', file);
    continue;
  }
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace in arrays
  content = content.replace(/'pedro\.queiroz',\s*'debora\.mota'/g, "'pedro.queiroz', 'felipe.castro', 'debora.mota'");
  content = content.replace(/'pedro\.queiroz',\n\s*'debora\.mota'/g, "'pedro.queiroz',\n  'felipe.castro',\n  'debora.mota'");
  content = content.replace(/\['pedro\.queiroz', 'debora\.mota'/g, "['pedro.queiroz', 'felipe.castro', 'debora.mota'");

  // Replace in strings/conditions
  content = content.replace(/currentUser === 'pedro\.queiroz'/g, "(currentUser === 'pedro.queiroz' || currentUser === 'felipe.castro')");
  content = content.replace(/currentUser\.startsWith\('pedro\.queiroz'\)/g, "(currentUser.startsWith('pedro.queiroz') || currentUser.startsWith('felipe.castro'))");
  content = content.replace(/currentUserOriginal\.startsWith\('pedro\.queiroz'\)/g, "(currentUserOriginal.startsWith('pedro.queiroz') || currentUserOriginal.startsWith('felipe.castro'))");
  content = content.replace(/responsavelOriginal\.startsWith\('pedro\.queiroz'\)/g, "(responsavelOriginal.startsWith('pedro.queiroz') || responsavelOriginal.startsWith('felipe.castro'))");
  content = content.replace(/responsavelOriginal\.toLowerCase\(\) === 'pedro\.queiroz'/g, "(responsavelOriginal.toLowerCase() === 'pedro.queiroz' || responsavelOriginal.toLowerCase() === 'felipe.castro')");
  content = content.replace(/responsavelOriginal\.toLowerCase\(\)\.startsWith\('pedro\.queiroz'\)/g, "(responsavelOriginal.toLowerCase().startsWith('pedro.queiroz') || responsavelOriginal.toLowerCase().startsWith('felipe.castro'))");
  content = content.replace(/user\.startsWith\('pedro\.queiroz'\)/g, "(user.startsWith('pedro.queiroz') || user.startsWith('felipe.castro'))");
  content = content.replace(/user\.toLowerCase\(\) === 'pedro\.queiroz'/g, "(user.toLowerCase() === 'pedro.queiroz' || user.toLowerCase() === 'felipe.castro')");

  // Specific formatUserName
  if (file === 'lib/roles.ts') {
    content = content.replace(/if \(normalized === 'pedro\.queiroz'\) return 'Pedro Queiroz';/, "if (normalized === 'pedro.queiroz') return 'Pedro Queiroz';\n  if (normalized === 'felipe.castro') return 'Felipe Castro';");
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated:', file);
}
