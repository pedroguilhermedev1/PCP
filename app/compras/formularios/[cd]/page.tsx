import { FormulariosModuleClient } from "./client";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default async function FormulariosCDPage({ params }: { params: Promise<{ cd: string }> }) {
  const resolvedParams = await params;
  return (
    <RoleGuard allowedRoles={['ADMIN', 'OPERACIONAL']}>
      <FormulariosModuleClient cd={resolvedParams.cd} />
    </RoleGuard>
  );
}
