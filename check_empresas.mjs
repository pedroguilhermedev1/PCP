import xlsx from 'xlsx';

const filePath = 'C:\\Users\\conta\\Downloads\\insumos_01.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(sheet);
const empresas = new Set();
data.forEach(row => {
  if (row['Empresa']) empresas.add(row['Empresa']);
});

console.log("Empresas encontradas:", Array.from(empresas));
