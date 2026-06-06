import { InsumosModuleClient } from "./client";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default async function InsumosMarcaPage({ params }: { params: Promise<{ marca: string }> }) {
  const resolvedParams = await params;
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <InsumosModuleClient marca={resolvedParams.marca} />
    </RoleGuard>
  );
}
