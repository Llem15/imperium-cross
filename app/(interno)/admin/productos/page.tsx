import type { Metadata } from "next";
import { InventoryManager } from "@/features/products/inventory-manager";

export const metadata: Metadata = { title: "Inventario | Imperium Cross" };

export default function Page() {
  return <InventoryManager />;
}
