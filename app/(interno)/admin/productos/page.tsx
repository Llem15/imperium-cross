import type { Metadata } from "next";
import { ProductInventory } from "@/features/products/product-pages";

export const metadata: Metadata = { title: "Inventario | Imperium Cross" };

export default function Page() {
  return <ProductInventory />;
}
