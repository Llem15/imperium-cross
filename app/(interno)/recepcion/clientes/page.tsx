import type { Metadata } from "next";
import { ApiClientList } from "@/features/members/api-client-list";

export const metadata: Metadata = { title: "Clientes · Recepción | Imperium Cross" };

export default function ReceptionClientsPage() {
  return <ApiClientList mode="reception" />;
}
