const fs = require('fs');
const file = 'components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Insert after T1 (RC SAP) which is around:
/*
<div className="md:col-span-4 space-y-4 p-4 border border-purple-400 bg-purple-50 rounded-lg shadow-sm">
  <h4 className="font-semibold text-sm text-purple-900">Requisição de Compra SAP</h4>
*/

const t2Str = `
              <div className="md:col-span-4 space-y-4 p-4 border border-indigo-400 bg-indigo-50 rounded-lg shadow-sm">
                <h4 className="font-semibold text-sm text-indigo-900">Aprovação RC</h4>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-indigo-900">Data da Aprovação</label>
                  <Input className="border-indigo-200 focus-visible:ring-indigo-500 bg-white" type="date" value={formData.data_aprovacao || ""} onChange={handleInputChange('data_aprovacao')} />
                </div>
              </div>
`;

content = content.replace(
  '<div className="md:col-span-4 space-y-4 p-4 border border-indigo-400 bg-indigo-50 rounded-lg shadow-sm">',
  t2Str + '\n              <div className="md:col-span-4 space-y-4 p-4 border border-indigo-400 bg-indigo-50 rounded-lg shadow-sm">'
);

fs.writeFileSync(file, content);
console.log('FaturaSAPModal updated');
