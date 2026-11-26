// CÓDIGO DE SECCIÓN NUTRICIONAL
// ÚNICO PUNTO DE ACCESO A DATOS DE LA SECCIÓN. HOY SIMULA EL BACKEND EN MEMORIA;
// PARA CONECTARLO, REEMPLAZAR EL CUERPO DE CADA FUNCIÓN POR UN fetch AL ENDPOINT REAL
// MANTENIENDO LAS MISMAS FIRMAS Y TIPOS.
import { newDemoId } from "@/mocks/internal-data";
import { mockDailyGoals, mockMealSamples } from "@/mocks/nutrition";
import type { DailyGoals, Meal, MealAnalysis } from "./nutrition-types";

export class MealNotRecognizedError extends Error {
  constructor() {
    super("No pudimos reconocer la comida");
    this.name = "MealNotRecognizedError";
  }
}

// ESTADO SIMULADO: SE CONSERVA MIENTRAS NO SE RECARGUE LA PÁGINA.
const savedMeals: Meal[] = [];
const pendingAnalyses = new Map<string, MealAnalysis>();
let nextSample = 0;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Convierte una fecha ISO en "AAAA-MM-DD" según la hora local. */
export function toDateKey(iso: string) {
  const date = new Date(iso);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export async function getDailyGoals(): Promise<DailyGoals> {
  await wait(150);
  return { ...mockDailyGoals };
}

/** Historial de comidas, de la más reciente a la más antigua. `date` usa el formato AAAA-MM-DD. */
export async function getMeals(date?: string): Promise<Meal[]> {
  await wait(150);
  return savedMeals
    .filter((meal) => !date || toDateKey(meal.savedAt) === date)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

/** Sube la foto y devuelve el análisis. Lanza MealNotRecognizedError si no reconoce la comida. */
export async function analyzeMealPhoto(file: File): Promise<MealAnalysis> {
  await wait(1800);
  // DEMO: UN ARCHIVO CON "error" EN EL NOMBRE SIMULA UNA COMIDA NO RECONOCIDA.
  if (file.name.toLowerCase().includes("error")) throw new MealNotRecognizedError();

  const sample = mockMealSamples[nextSample++ % mockMealSamples.length];
  const analysis: MealAnalysis = {
    ...sample,
    id: newDemoId("analysis"),
    imageUrl: URL.createObjectURL(file),
    analyzedAt: new Date().toISOString(),
  };
  pendingAnalyses.set(analysis.id, analysis);
  return analysis;
}

/** Guarda en el historial un análisis devuelto por analyzeMealPhoto. */
export async function saveMeal(analysisId: string): Promise<Meal> {
  await wait(400);
  const analysis = pendingAnalyses.get(analysisId);
  if (!analysis) throw new Error("El análisis ya no está disponible.");

  pendingAnalyses.delete(analysisId);
  const meal: Meal = { ...analysis, savedAt: new Date().toISOString() };
  savedMeals.push(meal);
  return meal;
}

/** Elimina una comida del historial. */
export async function deleteMeal(mealId: string): Promise<void> {
  await wait(300);
  const index = savedMeals.findIndex((meal) => meal.id === mealId);
  if (index === -1) throw new Error("La comida ya no existe.");
  savedMeals.splice(index, 1);
}
