import { LembretesClient } from "./client";
import { Metadata } from "next";
import { RoleGuard } from "@/components/auth/RoleGuard";

export const metadata: Metadata = {
  title: "Lembretes - Compras e Insumos",
  description: "Gerencie seus lembretes e notificações",
};

export default function LembretesPage() {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <LembretesClient />
    </RoleGuard>
  );
}
