// CÓDIGO DE SECCIÓN NUTRICIONAL
// METADATOS DE CADA NUTRIENTE Y CÁLCULOS DE PRESENTACIÓN.
import type { NutrientInfo } from "./nutrition-types";

export const nutrientInfo: NutrientInfo[] = [
  { key: "calories", label: "Calorías", unit: "kcal", colorClass: "bg-brand-end" },
  { key: "protein", label: "Proteína", unit: "g", colorClass: "bg-status-info" },
  { key: "carbs", label: "Carbohidratos (HC)", unit: "g", colorClass: "bg-violet-600" },
  { key: "fat", label: "Grasas", unit: "g", colorClass: "bg-status-pending" },
  { key: "fiber", label: "Fibra", unit: "g", colorClass: "bg-status-success" },
  { key: "sodium", label: "Sodio", unit: "mg", colorClass: "bg-muted" },
];

/** Nutrientes del panel de detalle (las calorías van en el anillo). */
export const macroInfo = nutrientInfo.filter((info) => info.key !== "calories");

export function percentOfGoal(value: number, goal: number) {
  return goal > 0 ? Math.round((value / goal) * 100) : 0;
}

const numberFormat = new Intl.NumberFormat("es-PE", { maximumFractionDigits: 1 });

export function formatAmount(value: number) {
  return numberFormat.format(value);
}

export function formatMealTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

export function formatMealDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
