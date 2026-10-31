import type { Metadata } from "next";
import { MemberProfile } from "@/features/members/member-pages";

export const metadata: Metadata = { title: "Mi perfil | Imperium Cross" };

export default function Page() {
  return <MemberProfile />;
}
