const fs = require('fs');

const file = 'components/faturas/FaturaSAPModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Inject the Pendencia state and UI
const stateInjection = `  const [showPendenciaModal, setShowPendenciaModal] = useState(false);
  const [novaPendencia, setNovaPendencia] = useState({
    etapa_origem: '',
    etapa_destino: '',
    data_abertura: new Date().toISOString().split('T')[0],
    responsavel: localStorage.getItem('pcp_user') || '',
    motivo: '',
    justificativa: '',
    sla_dias: 1,
    status: 'Aberta' as const
  });`;

if (!content.includes('showPendenciaModal')) {
    content = content.replace('const [formError, setFormError] = useState<string | null>(null);', 
    'const [formError, setFormError] = useState<string | null>(null);\n' + stateInjection);
}

const addPendenciaFn = `
  const handleAddPendencia = () => {
    if (!novaPendencia.etapa_origem || !novaPendencia.etapa_destino || !novaPendencia.motivo) {
      alert("Preencha origem, destino e motivo.");
      return;
    }
    const newP = { ...novaPendencia, id: Math.random().toString(36).substring(7) };
    setFormData(prev => ({
      ...prev,
      pendencias: [...(prev.pendencias || []), newP]
    }));
    setShowPendenciaModal(false);
    setNovaPendencia({
      ...novaPendencia,
      motivo: '',
      justificativa: '',
      data_abertura: new Date().toISOString().split('T')[0]
    });
  };

  const handleConcluirPendencia = (id: string) => {
    setFormData(prev => ({
      ...prev,
      pendencias: prev.pendencias?.map(p => 
        p.id === id ? { ...p, status: 'Concluída', data_conclusao: new Date().toISOString().split('T')[0] } : p
      )
    }));
  };
`;

if (!content.includes('handleAddPendencia')) {
    const fnHook = 'const autoStatus = calcularStatus(formData);';
    content = content.replace(fnHook, addPendenciaFn + '\n  ' + fnHook);
}

const pendenciaUI = `
            {/* Secao de Pendencias */}
            <section className="space-y-4 p-6 bg-white border border-red-200 rounded-xl shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-red-800 uppercase tracking-wider flex items-center gap-2">
                  Pendências e Retornos (Nexa / Fiscal)
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowPendenciaModal(true)} className="gap-2 border-red-200 text-red-700 hover:bg-red-50">
                  <Plus className="w-4 h-4" /> Registrar Retorno
                </Button>
              </div>

              {formData.pendencias && formData.pendencias.length > 0 ? (
                <div className="space-y-3">
                  {formData.pendencias.map(p => (
                    <div key={p.id} className={cn("p-3 border rounded-lg flex justify-between items-center", p.status === 'Concluída' ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200")}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded", p.status === 'Concluída' ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800")}>
                            {p.status}
                          </span>
                          <span className="text-xs font-bold text-zinc-800">{p.etapa_origem} ➔ {p.etapa_destino}</span>
                          <span className="text-xs text-zinc-500">| Data: {p.data_abertura}</span>
                        </div>
                        <div className="mt-1 text-xs text-zinc-700">
                          <strong>Motivo:</strong> {p.motivo} {p.motivo === 'Outros' && p.justificativa ? \`(\${p.justificativa})\` : ''}
                        </div>
                        <div className="mt-1 text-[10px] text-zinc-500">
                          Responsável: {formatUserName(p.responsavel)} | SLA: {p.sla_dias} dia(s) {p.data_conclusao ? \`| Concluída em: \${p.data_conclusao}\` : ''}
                        </div>
                      </div>
                      {p.status === 'Aberta' && (
                        <Button type="button" size="sm" onClick={() => handleConcluirPendencia(p.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs">
                          Concluir
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-zinc-500 text-center py-4 bg-zinc-50 rounded-lg border border-zinc-100">
                  Nenhum retorno ou pendência registrada.
                </div>
              )}
            </section>
`;

const pendenciaModalUI = `
        {showPendenciaModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 animate-in zoom-in-95">
              <h3 className="text-lg font-bold text-red-800 mb-4 border-b pb-2">Registrar Nova Pendência/Retorno</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600">Etapa de Origem</label>
                    <select className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500" value={novaPendencia.etapa_origem} onChange={e => setNovaPendencia({...novaPendencia, etapa_origem: e.target.value})}>
                      <option value="">Selecione...</option>
                      <option value="Nexa">Nexa (Solicitação)</option>
                      <option value="Fiscal">Fiscal (Lançamento)</option>
                      <option value="Pagamento">Pagamento</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600">Etapa de Destino (Retorno)</label>
                    <select className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500" value={novaPendencia.etapa_destino} onChange={e => setNovaPendencia({...novaPendencia, etapa_destino: e.target.value})}>
                      <option value="">Selecione...</option>
                      <option value="Nexa">Nexa</option>
                      <option value="Fiscal">Fiscal</option>
                      <option value="RC/PC">RC/PC</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-600">Motivo</label>
                  <select className="flex h-9 w-full rounded-md border border-zinc-200 bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-500" value={novaPendencia.motivo} onChange={e => setNovaPendencia({...novaPendencia, motivo: e.target.value})}>
                    <option value="">Selecione...</option>
                    <option value="Falta de documento">Falta de documento</option>
                    <option value="Correção de informação">Correção de informação</option>
                    <option value="Divergência de informação">Divergência de informação</option>
                    <option value="Necessidade de aprovação">Necessidade de aprovação</option>
                    <option value="Erro no processo">Erro no processo</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                {novaPendencia.motivo === 'Outros' && (
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600">Justificativa</label>
                    <Input className="h-8 text-xs border-zinc-200" value={novaPendencia.justificativa} onChange={e => setNovaPendencia({...novaPendencia, justificativa: e.target.value})} placeholder="Especifique o motivo..." />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600">SLA (Dias úteis)</label>
                    <Input type="number" min="1" className="h-8 text-xs border-zinc-200" value={novaPendencia.sla_dias} onChange={e => setNovaPendencia({...novaPendencia, sla_dias: parseInt(e.target.value) || 1})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-600">Data Abertura</label>
                    <Input type="date" className="h-8 text-xs border-zinc-200" value={novaPendencia.data_abertura} onChange={e => setNovaPendencia({...novaPendencia, data_abertura: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowPendenciaModal(false)}>Cancelar</Button>
                <Button onClick={handleAddPendencia} className="bg-red-600 hover:bg-red-700 text-white">Salvar Pendência</Button>
              </div>
            </div>
          </div>
        )}
`;

if (!content.includes('Pendências e Retornos')) {
    const endFormIndex = content.lastIndexOf('</form>');
    if (endFormIndex > -1) {
        content = content.substring(0, endFormIndex) + pendenciaUI + '\n            ' + content.substring(endFormIndex);
    }
}

if (!content.includes('showPendenciaModal &&')) {
    const endModalIndex = content.lastIndexOf('</div>\n    </div>');
    if (endModalIndex > -1) {
        content = content.substring(0, endModalIndex) + '\n' + pendenciaModalUI + '\n' + content.substring(endModalIndex);
    }
}

fs.writeFileSync(file, content);
console.log('Successfully injected pendencias!');
