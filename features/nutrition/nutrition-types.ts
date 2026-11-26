// CÓDIGO DE SECCIÓN NUTRICIONAL
// TIPOS COMPARTIDOS ENTRE LA INTERFAZ Y LA CAPA DE DATOS (nutrition-api.ts).

export type NutrientKey = "calories" | "protein" | "carbs" | "fat" | "fiber" | "sodium";

/** Unidades: calories en kcal, sodium en mg, el resto en g. */
export type Nutrients = Record<NutrientKey, number>;

export type DailyGoals = Nutrients;

export interface NutrientInfo {
  key: NutrientKey;
  label: string;
  unit: "kcal" | "g" | "mg";
  /** Clase de fondo para el punto y la barra de progreso. */
  colorClass: string;
}

export interface DetectedIngredient {
  id: string;
  name: string;
  portion: string;
  calories: number;
}

/** Resultado del análisis de una foto, todavía no guardado en el historial. */
export interface MealAnalysis {
  id: string;
  dishName: string;
  portion: string;
  imageUrl: string;
  /** Fecha ISO. */
  analyzedAt: string;
  nutrients: Nutrients;
  ingredients: DetectedIngredient[];
  tip: string;
}

/** Comida guardada con "Guardar en mi día". */
export interface Meal extends MealAnalysis {
  /** Fecha ISO; se usa para el filtro por fecha. */
  savedAt: string;
}

export type AnalysisState =
  | { status: "idle" }
  | { status: "analyzing"; previewUrl: string }
  | { status: "success"; analysis: MealAnalysis }
  | { status: "error"; previewUrl: string; message: string };

export type PhotoValidationError = "invalid-type" | "too-large";
