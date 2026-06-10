import xlsx from 'xlsx';
import fs from 'fs';

const buf = fs.readFileSync('faturas.xlsx');
const workbook = xlsx.read(buf, { type: 'buffer' });
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const json = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
fs.writeFileSync('faturas_output.json', JSON.stringify(json, null, 2));
console.log(`Saved ${json.length} rows to faturas_output.json`);
