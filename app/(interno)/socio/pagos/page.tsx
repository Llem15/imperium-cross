import type { Metadata } from "next";
import { MemberPayments } from "@/features/members/member-pages";

export const metadata: Metadata = { title: "Pagos | Imperium Cross" };

export default function Page() {
  return <MemberPayments />;
}
