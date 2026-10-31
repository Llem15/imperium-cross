import type { Metadata } from "next";
import { StaffManager } from "@/features/administration/staff-manager";

export const metadata: Metadata = { title: "Usuarios | Imperium Cross" };

export default function Page() {
  return <StaffManager />;
}
