import type { Metadata } from "next";
import { AdminDashboard } from "@/features/overview/admin-dashboard";

export const metadata: Metadata = { title: "Administrador | Imperium Cross" };

export default function AdminPage() {
  return <AdminDashboard />;
}
