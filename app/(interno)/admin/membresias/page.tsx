import type { Metadata } from "next";
import { PlansManager } from "@/features/members/plans-manager";

export const metadata: Metadata = { title: "Membresías | Imperium Cross" };

export default function Page() {
  return <PlansManager />;
}
