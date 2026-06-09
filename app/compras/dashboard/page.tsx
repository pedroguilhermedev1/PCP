import { faturaRepository } from "@/modules/compras/infra/SupabaseFaturaRepository";
import { createClient } from "@supabase/supabase-js";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { DashboardClient } from "./client";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const faturas = await faturaRepository.getFaturas();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zwvajnsmylaebxfeypeo.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3dmFqbnNteWxhZWJ4ZmV5cGVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODEyNzksImV4cCI6MjA5MzY1NzI3OX0.vl359IIHkx-oE4Z1CzenYAPcvlZWYqgAwoX8xa6mVTw';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  // Fetch Insumos
  let insumos: any[] = [];
  const { data: dataInsumos } = await supabase.from('estoque_insumos').select('*');
  if (dataInsumos) insumos = dataInsumos;

  // Fetch Movimentacoes
  let movimentacoes: any[] = [];
  const { data: dataMovs } = await supabase.from('estoque_movimentacoes').select('*');
  if (dataMovs) movimentacoes = dataMovs;

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <DashboardClient 
        faturas={faturas} 
        insumos={insumos} 
        movimentacoes={movimentacoes} 
      />
    </RoleGuard>
  );
}
