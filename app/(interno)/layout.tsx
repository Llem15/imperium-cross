import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function InternalLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>;
}
