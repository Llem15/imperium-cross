import type { Metadata } from "next";
import { ApiClientList } from "@/features/members/api-client-list";

export const metadata: Metadata = { title: "Clientes | Imperium Cross" };

export default function Page() {
  return <ApiClientList mode="admin" />;
}
