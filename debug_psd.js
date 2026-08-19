const xlsx = require('xlsx');

const filePath = 'C:\\Users\\conta\\Downloads\\CONTROLE DE INSUMOS.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = 'PAINEL';
const worksheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
let count = 0;
for (let i = 15; i < data.length; i++) {
  const row = data[i];
  if (!row || !row[3]) continue; // Skip if no description
  count++;
  console.log(`Item ${count} (Row ${i + 1}): "${row[3]}"`);
}
console.log("Total items:", count);
