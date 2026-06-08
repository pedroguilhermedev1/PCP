import { LayoutDashboard, FileText, AlertTriangle, CheckCircle, Package } from "lucide-react";
import { faturaRepository } from "@/modules/compras/infra/SupabaseFaturaRepository";
import { createClient } from "@supabase/supabase-js";
import { calcularStatus } from "@/modules/compras/domain/Fatura";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const faturas = await faturaRepository.getFaturas();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let insumos: any[] = [];
  
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data } = await supabase.from('estoque_insumos').select('*');
    if (data) insumos = data;
  }

  // Calculate Faturas Stas
  const now = new Date();
  const next7Days = new Date(now);
  next7Days.setDate(now.getDate() + 7);

  const faturasPendentes = faturas.filter(f => calcularStatus(f) !== 'Pago');
  const totalPendentes = faturasPendentes.reduce((acc, f) => acc + (f.valor || 0), 0);

  const faturasVencendo7Dias = faturasPendentes.filter(f => {
    if (!f.data_vencimento) return false;
    const venc = new Date(f.data_vencimento);
    return venc >= now && venc <= next7Days;
  });
  const totalVencendo7Dias = faturasVencendo7Dias.reduce((acc, f) => acc + (f.valor || 0), 0);

  const faturasVencidas = faturasPendentes.filter(f => {
    if (!f.data_vencimento) return false;
    return new Date(f.data_vencimento) < now;
  });
  const totalVencidas = faturasVencidas.reduce((acc, f) => acc + (f.valor || 0), 0);

  // Calculate Insumos Stats
  let criticos = 0, alertas = 0, confortaveis = 0;

  insumos.forEach(i => {
    const cmd = parseFloat(i.cmd) || 10;
    const lt = parseFloat(i.lead_time) || 0;
    const real = i.estoque_real || 0;

    const cobertura = cmd > 0 ? (real / cmd) : Infinity;

    if (cobertura <= lt) criticos++;
    else if (cobertura > lt && cobertura <= (lt + 3)) alertas++;
    else confortaveis++;
  });

  const formatBRL = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="flex-1 flex flex-col h-full overflow-hidden w-full bg-zinc-50/30">
        <header className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-purple-200 p-2 rounded-lg text-purple-900">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-zinc-900 leading-tight">Dashboard</h1>
              <p className="text-sm text-zinc-500">Visão geral e indicadores do sistema.</p>
            </div>
          </div>
        </header>
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-12">
            
            {/* Sessão Faturas */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-zinc-400" />
                <h2 className="text-lg font-bold text-zinc-800">Faturas</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                  <p className="text-sm font-medium text-zinc-500 mb-2">Valor Total Pendente</p>
                  <div className="text-3xl font-bold text-zinc-900">{formatBRL(totalPendentes)}</div>
                  <p className="text-sm text-zinc-400 mt-2">{faturasPendentes.length} faturas abertas</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6 bg-orange-50/30">
                  <p className="text-sm font-medium text-orange-600 mb-2">Vencendo em 7 Dias</p>
                  <div className="text-3xl font-bold text-orange-700">{formatBRL(totalVencendo7Dias)}</div>
                  <p className="text-sm text-orange-600/70 mt-2">{faturasVencendo7Dias.length} faturas</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 bg-red-50/30">
                  <p className="text-sm font-medium text-red-600 mb-2">Faturas Vencidas</p>
                  <div className="text-3xl font-bold text-red-700">{formatBRL(totalVencidas)}</div>
                  <p className="text-sm text-red-600/70 mt-2">{faturasVencidas.length} faturas</p>
                </div>
              </div>
            </div>

            <div className="border-t-2 border-dashed border-zinc-200"></div>

            {/* Sessão Insumos */}
            <div>
              <div className="flex items-center gap-2 mb-6">
                <Package className="w-5 h-5 text-zinc-400" />
                <h2 className="text-lg font-bold text-zinc-800">Insumos em Estoque</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 bg-red-50/30 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-2">Crítico</p>
                    <div className="text-4xl font-bold text-red-700">{criticos}</div>
                    <p className="text-sm text-red-600/70 mt-2">Cobertura não atende tempo de entrega</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-red-500 opacity-20" />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-6 bg-orange-50/30 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 mb-2">Em Alerta</p>
                    <div className="text-4xl font-bold text-orange-700">{alertas}</div>
                    <p className="text-sm text-orange-600/70 mt-2">Margem de segurança curta (até 3 dias)</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-500 opacity-20" />
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-6 bg-emerald-50/30 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 mb-2">Confortável</p>
                    <div className="text-4xl font-bold text-emerald-700">{confortaveis}</div>
                    <p className="text-sm text-emerald-600/70 mt-2">Margem de segurança folgada</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-500 opacity-20" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
