// CÓDIGO DE SECCIÓN NUTRICIONAL
import type { Metadata } from "next";
import { NutritionPage } from "@/features/nutrition/nutrition-page";

export const metadata: Metadata = { title: "Nutricional | Imperium Cross" };

export default function Page() {
  return <NutritionPage />;
}
