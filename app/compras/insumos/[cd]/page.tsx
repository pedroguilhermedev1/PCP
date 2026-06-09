import { InsumosModuleClient } from "./client";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default async function InsumosCDPage({ params }: { params: Promise<{ cd: string }> }) {
  const resolvedParams = await params;
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <InsumosModuleClient cd={resolvedParams.cd} />
    </RoleGuard>
  );
}
