import type { Metadata } from "next";
import { ProductCatalog } from "@/features/products/product-pages";

export const metadata: Metadata = { title: "Punto de venta | Imperium Cross" };

export default function Page() {
  return <ProductCatalog reception />;
}
