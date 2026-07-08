import { faturaRepository } from "@/modules/compras/infra/SupabaseFaturaRepository";
import { FaturasTableClient } from "../client";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const dynamic = 'force-dynamic';

export default async function FaturasComprasPage({ params }: { params: Promise<{ categoria: string }> }) {
  const faturas = await faturaRepository.getFaturas();
  const resParams = await params;
  const categoria = resParams.categoria === 'materiais' ? 'Material' : 'Serviço';

  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <FaturasTableClient initialFaturas={faturas} categoria={categoria} />
    </RoleGuard>
  );
}
