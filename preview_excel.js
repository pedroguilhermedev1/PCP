const xlsx = require('xlsx');

const filePath = 'C:\\Users\\conta\\Downloads\\INSUMOS CD JUNDIAI.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Read as array of arrays
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log("First 10 rows:");
for (let i = 0; i < 10; i++) {
  if (data[i]) console.log(`Row ${i + 1}:`, data[i]);
}
