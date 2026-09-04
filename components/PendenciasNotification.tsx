'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertCircle, FileText, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { getUserRole, getUserCD } from '@/lib/roles';
import { formatUserName } from '@/lib/utils';

export function PendenciasNotification() {
  const [faturasAprovacao, setFaturasAprovacao] = useState(0);
  const [faturasPgto, setFaturasPgto] = useState(0);
  const [solicitacoesInsumos, setSolicitacoesInsumos] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('pcp_user');
    const role = getUserRole(user || '');
    const isAdmin = ['pedro.queiroz', 'felipe.castro', 'debora.mota', 'raphael.ramiro', 'francisco.edson'].some(admin => user?.includes(admin));
    const isLideranca = role === 'LIDERANCA';
    
    if (isAdmin || isLideranca) {
      setHasAccess(true);
      fetchPendencias();
      const interval = setInterval(fetchPendencias, 60000); // 1 minuto
      return () => clearInterval(interval);
    }
  }, []);

  const fetchPendencias = async () => {
    try {
      const user = localStorage.getItem('pcp_user');
      const userNameFormatted = formatUserName(user || '');

      if (!supabase) return;

      // Faturas Aguardando Aprovação (status_pagamento = 'Aguardando Aprovação' ou PC Nexa Concluído sem Programação)
      const { count: countAprovacao } = await supabase
        .from('faturas')
        .select('*', { count: 'exact', head: true })
        .eq('status_pagamento', 'Aguardando Aprovação')
        .eq('responsavel', userNameFormatted);

      // Faturas Aguardando Prog Pgto
      const { count: countPgto } = await supabase
        .from('faturas')
        .select('*', { count: 'exact', head: true })
        .eq('is_sap', true)
        .eq('nexa_lancamento_concluido', true)
        .eq('nexa_pagamento_programado', false)
        .eq('responsavel', userNameFormatted);

      // Insumos Aguardando Aprovação
      const { count: countInsumos } = await supabase
        .from('estoque_movimentacoes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDENTE')
        .eq('usuario', userNameFormatted);

      setFaturasAprovacao(countAprovacao || 0);
      setFaturasPgto(countPgto || 0);
      setSolicitacoesInsumos(countInsumos || 0);
    } catch (e) {
      console.error(e);
    }
  };

  if (!hasAccess) return null;

  const total = faturasAprovacao + faturasPgto + solicitacoesInsumos;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2.5 bg-white/80 backdrop-blur-sm border border-zinc-200 rounded-full text-zinc-600 hover:text-purple-700 hover:bg-purple-50 transition-all shadow-sm focus:outline-none"
        >
          <Bell className="w-5 h-5" />
          {total > 0 && (
            <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border-2 border-white">
              {total > 9 ? '9+' : total}
            </span>
          )}
        </button>

        {isOpen && (
          <div className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-xl border border-zinc-200 overflow-hidden text-sm">
            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
              <span className="font-bold text-zinc-800">Pendências</span>
              <span className="text-xs font-semibold px-2 py-0.5 bg-zinc-200 text-zinc-600 rounded-full">{total}</span>
            </div>
            <div className="p-2 space-y-1">
              {total === 0 ? (
                <div className="px-4 py-6 text-center text-zinc-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-zinc-300" />
                  Nenhuma pendência no momento.
                </div>
              ) : (
                <>
                  {faturasAprovacao > 0 && (
                    <button onClick={() => { setIsOpen(false); router.push('/compras/faturas-sap/todas?status_pagamento=Aguardando%20Aprovação'); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-50 transition-colors text-left">
                      <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-zinc-800">Faturas p/ Aprovação</p>
                        <p className="text-xs text-zinc-500">{faturasAprovacao} aguardando aprovação.</p>
                      </div>
                    </button>
                  )}
                  {faturasPgto > 0 && (
                    <button onClick={() => { setIsOpen(false); router.push('/compras/faturas-sap/todas?etapa_exata=programacao'); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-50 transition-colors text-left">
                      <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-zinc-800">Programação de Pgto</p>
                        <p className="text-xs text-zinc-500">{faturasPgto} prontas para programação.</p>
                      </div>
                    </button>
                  )}
                  {solicitacoesInsumos > 0 && (
                    <button onClick={() => { setIsOpen(false); router.push('/compras/formularios/fortaleza?status=PENDENTES'); }} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-50 transition-colors text-left">
                      <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-zinc-800">Insumos Pendentes</p>
                        <p className="text-xs text-zinc-500">{solicitacoesInsumos} requisições aguardando.</p>
                      </div>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
