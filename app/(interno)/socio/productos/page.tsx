import type { Metadata } from "next";
import { ProductCatalog } from "@/features/products/product-pages";

export const metadata: Metadata = { title: "Productos | Imperium Cross" };

export default function Page() {
  return <ProductCatalog />;
}
