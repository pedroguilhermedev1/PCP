import { CronogramaClient } from "./client";
import { RoleGuard } from "@/components/auth/RoleGuard";

export default function CronogramaPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'OPERACIONAL']}>
      <CronogramaClient />
    </RoleGuard>
  );
}
