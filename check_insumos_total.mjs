import xlsx from 'xlsx';

async function run() {
  const filePath = 'C:\\Users\\conta\\Downloads\\insumos_total.xlsx';
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const data = xlsx.utils.sheet_to_json(sheet);
  
  if (data.length === 0) {
    console.log("Nenhum dado encontrado no arquivo excel.");
    return;
  }

  console.log(`Lidas ${data.length} linhas do excel.`);
  console.log("Colunas encontradas:", Object.keys(data[0]));
  
  const empresas = new Set();
  data.forEach(row => {
    if (row['Empresa']) empresas.add(row['Empresa']);
  });
  
  console.log("Empresas listadas:", Array.from(empresas));
}

run();
