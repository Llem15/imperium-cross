import type { Metadata } from "next";
import { MembershipManagement } from "@/features/members/membership-management";

export const metadata: Metadata = { title: "Matrículas y pagos | Imperium Cross" };

export default function Page() {
  return <MembershipManagement />;
}
