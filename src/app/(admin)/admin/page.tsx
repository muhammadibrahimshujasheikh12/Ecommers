import { AdminPageHeader } from "@/features/admin/ui";
import { requireAdminPage } from "@/lib/admin/auth";

export default async function AdminDashboardPage() {
  const admin = await requireAdminPage();
  return <AdminPageHeader title="Dashboard" description={`Welcome back, ${admin.name}.`} />;
}
