const fs = require('fs');
let code = fs.readFileSync('components/faturas/FaturaSAPModal.tsx', 'utf8');

// 1. Add state for modal
if (!code.includes('const [ocorrenciaModal')) {
  code = code.replace(
    'const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);',
    `const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [ocorrenciaModal, setOcorrenciaModal] = useState<{isOpen: boolean, t_origem?: string, novoDestino?: string, novoMotivo?: string}>({isOpen: false});
  const MOTIVOS_OCORRENCIA = ['Falta de Anexo', 'Divergência de Valor', 'Dados Incorretos', 'Falta de Aprovação', 'Erro no Lançamento', 'Outros'];`
  );
}

// 2. Add Ocorrencia Modal JSX at the bottom of the main modal
const modalJsx = `
      {/* Modal de Ocorrência */}
      {ocorrenciaModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-red-600">Registrar Ocorrência</h3>
              <Button variant="ghost" size="icon" onClick={() => setOcorrenciaModal({isOpen: false})} className="h-8 w-8"><X className="w-4 h-4" /></Button>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">T de Destino</label>
                <select 
                  className="w-full h-9 rounded-md border border-zinc-200 text-sm px-3"
                  value={ocorrenciaModal.novoDestino || ''}
                  onChange={(e) => setOcorrenciaModal(prev => ({...prev, novoDestino: e.target.value}))}
                >
                  <option value="">Selecione...</option>
                  <option value="T1">T1 (SAP/Nexa)</option>
                  <option value="T2">T2 (Nexa/PC)</option>
                  <option value="T3">T3 (Fiscal)</option>
                  <option value="T4">T4 (Pagamento)</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Motivo</label>
                <select 
                  className="w-full h-9 rounded-md border border-zinc-200 text-sm px-3"
                  value={ocorrenciaModal.novoMotivo || ''}
                  onChange={(e) => setOcorrenciaModal(prev => ({...prev, novoMotivo: e.target.value}))}
                >
                  <option value="">Selecione...</option>
                  {MOTIVOS_OCORRENCIA.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="p-4 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOcorrenciaModal({isOpen: false})}>Cancelar</Button>
              <Button variant="default" size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => {
                if (!ocorrenciaModal.novoDestino || !ocorrenciaModal.novoMotivo) return;
                const newOcorrencia = {
                  id: Math.random().toString(36).substr(2, 9),
                  t_origem: ocorrenciaModal.t_origem || '',
                  t_destino: ocorrenciaModal.novoDestino,
                  motivo: ocorrenciaModal.novoMotivo,
                  data_envio: new Date().toISOString(),
                  t_destino_codigo: ocorrenciaModal.novoDestino + '.1',
                  t_origem_retorno_codigo: (ocorrenciaModal.t_origem || '') + '.1',
                  status: 'Pendente Destino'
                };
                setFormData(prev => ({...prev, ocorrencias: [...(prev.ocorrencias || []), newOcorrencia]}));
                setOcorrenciaModal({isOpen: false});
              }}>Enviar Ocorrência</Button>
            </div>
          </div>
        </div>
      )}
`;

if (!code.includes('Modal de Ocorrência')) {
  code = code.replace('{/* Modal de Insumos */}', modalJsx + '\n      {/* Modal de Insumos */}');
}

// 3. Render occurrences block template
const renderT1 = `
                      {/* Ocorrencias T1 Destino */}
                      {formData.ocorrencias?.filter(oc => oc.t_destino === 'T1' && oc.status === 'Pendente Destino').map(oc => (
                        <div key={oc.id} className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg space-y-3">
                          <div>
                            <h5 className="text-xs font-bold text-red-700">{oc.t_destino_codigo} - Ocorrência</h5>
                            <p className="text-[10px] font-medium text-red-600 mt-1">Enviado por: {oc.t_origem} | Motivo: {oc.motivo}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-red-600 uppercase">Início ({oc.t_destino_codigo})</label>
                            <Input className="h-7 text-xs border-red-200" type="datetime-local" value={(oc.destino_data_inicio || '').substring(0, 16)} onChange={(e) => {
                              const newOc = [...formData.ocorrencias];
                              const idx = newOc.findIndex(x => x.id === oc.id);
                              newOc[idx].destino_data_inicio = e.target.value;
                              setFormData({...formData, ocorrencias: newOc});
                            }} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-red-600 uppercase">Fim ({oc.t_destino_codigo})</label>
                            <Input className="h-7 text-xs border-red-200" type="datetime-local" value={(oc.destino_data_fim || '').substring(0, 16)} onChange={(e) => {
                              const newOc = [...formData.ocorrencias];
                              const idx = newOc.findIndex(x => x.id === oc.id);
                              newOc[idx].destino_data_fim = e.target.value;
                              setFormData({...formData, ocorrencias: newOc});
                            }} />
                          </div>
                          <Button size="sm" variant="outline" className="w-full mt-2 border-red-200 text-red-700 hover:bg-red-100" onClick={() => {
                            const newOc = [...formData.ocorrencias];
                            const idx = newOc.findIndex(x => x.id === oc.id);
                            newOc[idx].status = 'Pendente Origem';
                            setFormData({...formData, ocorrencias: newOc});
                          }}>Devolver para {oc.t_origem}</Button>
                        </div>
                      ))}
                      {/* Ocorrencias T1 Origem Retorno */}
                      {formData.ocorrencias?.filter(oc => oc.t_origem === 'T1' && oc.status === 'Pendente Origem').map(oc => (
                        <div key={oc.id} className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg space-y-3">
                          <div>
                            <h5 className="text-xs font-bold text-orange-700">{oc.t_origem_retorno_codigo} - Retorno</h5>
                            <p className="text-[10px] font-medium text-orange-600 mt-1">Devolvido por: {oc.t_destino} | Motivo: {oc.motivo}</p>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-orange-600 uppercase">Início ({oc.t_origem_retorno_codigo})</label>
                            <Input className="h-7 text-xs border-orange-200" type="datetime-local" value={(oc.origem_data_inicio || '').substring(0, 16)} onChange={(e) => {
                              const newOc = [...formData.ocorrencias];
                              const idx = newOc.findIndex(x => x.id === oc.id);
                              newOc[idx].origem_data_inicio = e.target.value;
                              setFormData({...formData, ocorrencias: newOc});
                            }} />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-orange-600 uppercase">Fim ({oc.t_origem_retorno_codigo})</label>
                            <Input className="h-7 text-xs border-orange-200" type="datetime-local" value={(oc.origem_data_fim || '').substring(0, 16)} onChange={(e) => {
                              const newOc = [...formData.ocorrencias];
                              const idx = newOc.findIndex(x => x.id === oc.id);
                              newOc[idx].origem_data_fim = e.target.value;
                              setFormData({...formData, ocorrencias: newOc});
                            }} />
                          </div>
                          <Button size="sm" variant="outline" className="w-full mt-2 border-orange-200 text-orange-700 hover:bg-orange-100" onClick={() => {
                            const newOc = [...formData.ocorrencias];
                            const idx = newOc.findIndex(x => x.id === oc.id);
                            newOc[idx].status = 'Resolvida';
                            setFormData({...formData, ocorrencias: newOc});
                          }}>Finalizar Ocorrência</Button>
                        </div>
                      ))}
                      {/* Botoes Ocorrencia T1 */}
                      <div className="mt-4 pt-3 border-t border-purple-100 flex justify-end">
                        <Button type="button" variant="ghost" size="sm" className="text-[10px] h-7 text-red-500 hover:bg-red-50" onClick={() => setOcorrenciaModal({isOpen: true, t_origem: 'T1'})}>⚠️ Nova Ocorrência</Button>
                      </div>
`;

function getRenderBlock(tName, btnColorClass) {
  return renderT1
    .replace(/'T1'/g, `'${tName}'`)
    .replace(/border-purple-100/g, `border-${btnColorClass}-100`)
    .replace(/<Button type="button" variant="ghost" size="sm" className="text-\[10px\] h-7 text-red-500 hover:bg-red-50" onClick={\(\) => setOcorrenciaModal\({isOpen: true, t_origem: '.*'}\)}>⚠️ Nova Ocorrência<\/Button>/g, 
             `<Button type="button" variant="ghost" size="sm" className="text-[10px] h-7 text-red-500 hover:bg-red-50" onClick={() => setOcorrenciaModal({isOpen: true, t_origem: '${tName}'})}>⚠️ Nova Ocorrência</Button>`);
}

// --- SAP + NEXA FLOW REPLACEMENTS ---
code = code.replace(
`                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (PC)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.pc_data_fim || "").substring(0, 16)} onChange={handleInputChange('pc_data_fim')} />
                        </div>
                      </div>
                    </div>
                  </div>`,
`                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (PC)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.pc_data_fim || "").substring(0, 16)} onChange={handleInputChange('pc_data_fim')} />
                        </div>
                      </div>
` + getRenderBlock('T1', 'purple') + `
                    </div>
                  </div>`
);

code = code.replace(
`                        <span className="text-[9px] font-bold text-zinc-500 uppercase group-hover:text-cyan-600 transition-colors">Documento Anexado?</span>
                        <input 
                          type="checkbox" 
                          className="w-3.5 h-3.5 rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500"
                          checked={!!formData.nexa_anexada}
                          onChange={(e) => handleChange('nexa_anexada', e.target.checked)}
                        />
                      </label>
                    </div>
                  </div>`,
`                        <span className="text-[9px] font-bold text-zinc-500 uppercase group-hover:text-cyan-600 transition-colors">Documento Anexado?</span>
                        <input 
                          type="checkbox" 
                          className="w-3.5 h-3.5 rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500"
                          checked={!!formData.nexa_anexada}
                          onChange={(e) => handleChange('nexa_anexada', e.target.checked)}
                        />
                      </label>
                    </div>
` + getRenderBlock('T2', 'cyan') + `
                  </div>`
);

code = code.replace(
`                    </div>
                    <div className="mt-4">
                      <SlaBadge startDate={formData.fiscal_data_inicio} endDate={formData.fiscal_data_fim} slaDias={3} />
                    </div>
                  </div>`,
`                    </div>
                    <div className="mt-4">
                      <SlaBadge startDate={formData.fiscal_data_inicio} endDate={formData.fiscal_data_fim} slaDias={3} />
                    </div>
` + getRenderBlock('T3', 'slate') + `
                  </div>`
);

code = code.replace(
`                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Valor Pago</label>
                          <Input className="h-7 text-xs border-green-200" type="number" step="0.01" value={formData.valor || ""} onChange={handleInputChange('valor')} />
                        </div>
                      </div>
                    </div>
                  </div>`,
`                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Valor Pago</label>
                          <Input className="h-7 text-xs border-green-200" type="number" step="0.01" value={formData.valor || ""} onChange={handleInputChange('valor')} />
                        </div>
                      </div>
                    </div>
` + getRenderBlock('T4', 'green') + `
                  </div>`
);

// --- NEXA-ONLY REPLACEMENTS ---
code = code.replace(
`                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Nexa)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.nexa_data_fim || "").substring(0, 16)} onChange={handleInputChange('nexa_data_fim')} />
                        </div>
                      </div>
                    </div>
                  </div>`,
`                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Nexa)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.nexa_data_fim || "").substring(0, 16)} onChange={handleInputChange('nexa_data_fim')} />
                        </div>
                      </div>
                    </div>
` + getRenderBlock('T1', 'cyan') + `
                  </div>`
);

code = code.replace(
`                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Req/PC)</label>
                        <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.req_nexa_data_fim || "").substring(0, 16)} onChange={handleInputChange('req_nexa_data_fim')} />
                      </div>
                    </div>
                  </div>`,
`                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Req/PC)</label>
                        <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.req_nexa_data_fim || "").substring(0, 16)} onChange={handleInputChange('req_nexa_data_fim')} />
                      </div>
                    </div>
` + getRenderBlock('T2', 'blue') + `
                  </div>`
);

// T3 Nexa-only
code = code.replace(
  new RegExp(
`                        <div className="space-y-1">\\s*<label className="text-\\[10px\\] font-semibold text-zinc-500 uppercase">Fim \\(Fiscal\\)</label>\\s*<Input className="h-7 text-xs border-zinc-200" type="datetime-local" value=\\{\\(formData.fiscal_data_fim \\|\\| ""\\).substring\\(0, 16\\)\\} onChange=\\{handleInputChange\\('fiscal_data_fim'\\)\\} />\\s*</div>\\s*</div>\\s*</div>\\s*</div>`, 'g'
  ),
`                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Fim (Fiscal)</label>
                          <Input className="h-7 text-xs border-zinc-200" type="datetime-local" value={(formData.fiscal_data_fim || "").substring(0, 16)} onChange={handleInputChange('fiscal_data_fim')} />
                        </div>
                      </div>
                    </div>
` + getRenderBlock('T3', 'slate') + `
                  </div>`
);

// T4 Nexa-only
code = code.replace(
  new RegExp(
`                        <div className="space-y-1">\\s*<label className="text-\\[10px\\] font-semibold text-zinc-500 uppercase">Valor Pago</label>\\s*<Input className="h-7 text-xs border-green-200" type="number" step="0.01" value=\\{formData.valor \\|\\| ""\\} onChange=\\{handleInputChange\\('valor'\\)\\} />\\s*</div>\\s*</div>\\s*</div>\\s*</div>`, 'g'
  ),
`                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Valor Pago</label>
                          <Input className="h-7 text-xs border-green-200" type="number" step="0.01" value={formData.valor || ""} onChange={handleInputChange('valor')} />
                        </div>
                      </div>
                    </div>
` + getRenderBlock('T4', 'green') + `
                  </div>`
);

fs.writeFileSync('components/faturas/FaturaSAPModal.tsx', code);
console.log('Ocorrencia blocks and modals injected successfully.');
