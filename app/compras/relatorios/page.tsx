import { RelatoriosClient } from './client';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function RelatoriosPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN', 'REPORTS_ONLY']}>
      <RelatoriosClient />
    </RoleGuard>
  );
}
