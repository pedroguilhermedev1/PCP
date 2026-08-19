import xlsx from 'xlsx';
import fs from 'fs';

const buf = fs.readFileSync('C:/Users/conta/Downloads/Contagem CD Itaitinga.xlsx');
const workbook = xlsx.read(buf, { type: 'buffer' });

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { defval: "" });

console.log(data.slice(0, 5));
