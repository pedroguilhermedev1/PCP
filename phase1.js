const fs = require('fs');

// 1. Rename NF to Documento in FaturaSAPModal
let sapModal = fs.readFileSync('components/faturas/FaturaSAPModal.tsx', 'utf8');
sapModal = sapModal.replace(/NF Emitida/g, 'Documento Emitido');
sapModal = sapModal.replace(/NF Anexada/g, 'Documento Anexado');
sapModal = sapModal.replace(/nexa_emitiu_nf/g, 'nexa_emitiu_nf'); // Keep variables identical for now to preserve db compatibility
sapModal = sapModal.replace(/Valor Total \(Previsto \/ RC \/ NF\)/g, 'Valor Total (Previsto / RC / Documento)');
sapModal = sapModal.replace(/placeholder="NF\.\.\."/g, 'placeholder="Documento..."');
sapModal = sapModal.replace(/Cadastro da NF/g, 'Cadastro do Documento');
fs.writeFileSync('components/faturas/FaturaSAPModal.tsx', sapModal);

// 2. Rename in FaturaDetailsModal
let detailsModal = fs.readFileSync('components/faturas/FaturaDetailsModal.tsx', 'utf8');
detailsModal = detailsModal.replace(/NF Emitida/g, 'Documento Emitido');
detailsModal = detailsModal.replace(/NF Anexada/g, 'Documento Anexado');
detailsModal = detailsModal.replace(/Cadastro da NF/g, 'Cadastro do Documento');
fs.writeFileSync('components/faturas/FaturaDetailsModal.tsx', detailsModal);

// 3. Fatura.ts updates
let faturaModel = fs.readFileSync('modules/compras/domain/Fatura.ts', 'utf8');
faturaModel = faturaModel.replace(/Cadastro da NF/g, 'Cadastro do Documento');
faturaModel = faturaModel.replace(/Aguardando emissão de NF/g, 'Aguardando emissão de Documento');
fs.writeFileSync('modules/compras/domain/Fatura.ts', faturaModel);

console.log("Renamed NF to Documento in Phase 1.");
