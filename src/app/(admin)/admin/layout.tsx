import type { Metadata } from "next";
import { AdminGate } from "@/features/admin/gate";
import { AdminShell } from "@/features/admin/shell";
import { getAdminUser } from "@/lib/admin/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin | AURAQ" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const admin = await getAdminUser();
  if (!admin) return <AdminGate />;
  return <AdminShell admin={{ name: admin.name, email: admin.email, demo: admin.demo }}>{children}</AdminShell>;
}
