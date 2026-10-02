const fs = require('fs');
let c = fs.readFileSync('components/faturas/FaturaSAPModal.tsx', 'utf8');

c = c.replace('<span className="text-[11px] font-bold text-purple-800 uppercase block mb-3 mt-1">SAP (RC, Aprovação, PC)</span>', '<span className="text-[11px] font-bold text-purple-800 uppercase block mb-1 mt-1">SAP (RC, Aprovação, PC)</span>\n                    <div className="mb-3"><SlaBadge startDate={formData.data_recebimento} endDate={formData.data_pedido_sap} slaDias={3} /></div>');

c = c.replace('                      {/* RC Block */}', '                      {/* RC Block */}\n                      <div className="mb-2"><SlaBadge startDate={formData.data_recebimento} endDate={formData.data_rc_sap} slaDias={1} /></div>');

c = c.replace('                      {/* Aprovação Block */}', '                      {/* Aprovação Block */}\n                      <div className="mb-2"><SlaBadge startDate={formData.data_rc_sap} endDate={formData.data_aprovacao} slaDias={1} /></div>');

c = c.replace('                      {/* PC Block */}', '                      {/* PC Block */}\n                      <div className="mb-2"><SlaBadge startDate={formData.data_aprovacao} endDate={formData.data_pedido_sap} slaDias={1} /></div>');

fs.writeFileSync('components/faturas/FaturaSAPModal.tsx', c);
console.log("Injected SLA badges for SAP T1");
