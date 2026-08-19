const xlsx = require('xlsx');

const filePath = 'C:\\Users\\conta\\Downloads\\CONTROLE DE INSUMOS.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = 'PAINEL';
const worksheet = workbook.Sheets[sheetName];

if (!worksheet) {
  console.log("Sheet 'PAINEL' not found.");
} else {
  const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
  console.log("Total rows:", data.length);
  console.log("Rows 15 to 20:");
  for (let i = 14; i <= 20; i++) {
    if (data[i]) {
      console.log(`Row ${i + 1}: D(3)=${data[i][3]}, E(4)=${data[i][4]}, J(9)=${data[i][9]}, L(11)=${data[i][11]}`);
    }
  }
}
