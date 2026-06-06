import { FornecedoresClient } from "../client";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function FornecedoresMateriaisPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <FornecedoresClient tipo="Material" />
    </RoleGuard>
  );
}
