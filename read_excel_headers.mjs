import xlsx from 'xlsx';

const filePath = 'C:\\Users\\conta\\Downloads\\insumos_restantes.xlsx';
const workbook = xlsx.readFile(filePath);
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
if (data.length > 0) {
    console.log("Headers:", data[0]);
    console.log("First row:", data[1]);
} else {
    console.log("No data found");
}
