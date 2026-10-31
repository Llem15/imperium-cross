import type { Metadata } from "next";
import { ClientList } from "@/features/members/client-list";

export const metadata: Metadata = { title: "Clientes | Imperium Cross" };

export default function Page() {
  return <ClientList mode="admin" />;
}
