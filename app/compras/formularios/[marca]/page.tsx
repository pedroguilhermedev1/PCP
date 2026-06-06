import { FormulariosModuleClient } from "./client";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default async function FormulariosMarcaPage({ params }: { params: Promise<{ marca: string }> }) {
  const resolvedParams = await params;
  return (
    <RoleGuard allowedRoles={['ADMIN', 'OPERACIONAL']}>
      <FormulariosModuleClient marca={resolvedParams.marca} />
    </RoleGuard>
  );
}
