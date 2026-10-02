const fs = require('fs');
let c = fs.readFileSync('components/faturas/FaturaSAPModal.tsx', 'utf8');

c = c.replace('<span className="text-[11px] font-bold text-cyan-800 uppercase block mb-3 mt-1">Nexa / Solicitação</span>', '<span className="text-[11px] font-bold text-cyan-800 uppercase block mb-1 mt-1">Nexa / Solicitação</span>\n                      <div className="mb-3"><SlaBadge startDate={formData.data_recebimento} endDate={formData.nexa_data_envio} slaDias={1} /></div>');

c = c.replace('<span className="text-[11px] font-bold text-blue-800 uppercase block mb-3 mt-1">Requisição / Pedido (Nexa)</span>', '<span className="text-[11px] font-bold text-blue-800 uppercase block mb-1 mt-1">Requisição / Pedido (Nexa)</span>\n                    <div className="mb-3"><SlaBadge startDate={formData.nexa_data_envio} endDate={formData.data_pc_nexa} slaDias={2} /></div>');

// Insert individual SLA for Nexa RC inside the if block for possu_rc
c = c.replace('<label className="text-[10px] font-semibold text-zinc-500 uppercase">Número RC</label>', '<label className="text-[10px] font-semibold text-zinc-500 uppercase flex justify-between w-full"><span>Número RC</span> <span className="ml-2 scale-75 origin-right"><SlaBadge startDate={formData.nexa_data_envio} endDate={formData.nexa_rc_data || formData.data_rc_sap} slaDias={1} /></span></label>');

fs.writeFileSync('components/faturas/FaturaSAPModal.tsx', c);
console.log("Injected SLA badges for Nexa");
