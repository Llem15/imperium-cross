import type { Metadata } from "next";
import { ClientList } from "@/features/members/client-list";

export const metadata: Metadata = { title: "Clientes · Recepción | Imperium Cross" };

export default function ReceptionClientsPage() {
  return <ClientList mode="reception" />;
}
