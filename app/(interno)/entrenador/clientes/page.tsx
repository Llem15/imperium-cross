import type { Metadata } from "next";
import { ClientList } from "@/features/members/client-list";

export const metadata: Metadata = { title: "Mis clientes · Entrenador | Imperium Cross" };

export default function TrainerClientsPage() {
  return <ClientList mode="trainer" />;
}
