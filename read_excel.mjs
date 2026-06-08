import xlsx from 'xlsx';
import * as fs from 'fs';

const filePath = 'C:\\Users\\conta\\Downloads\\insumos do metabase.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

console.log("Headers:", data[0]);
console.log("First 5 rows:", data.slice(1, 6));

// We'll write logic to generate SQL after we see what the columns are
fs.writeFileSync('excel_data.json', JSON.stringify(data, null, 2));
