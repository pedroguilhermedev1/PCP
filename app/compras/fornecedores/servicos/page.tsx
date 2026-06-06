import { FornecedoresClient } from "../client";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function FornecedoresServicosPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <FornecedoresClient tipo="Serviço" />
    </RoleGuard>
  );
}
