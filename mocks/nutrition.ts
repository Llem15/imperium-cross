// CÓDIGO DE SECCIÓN NUTRICIONAL
// DATOS DE PRUEBA: SOLO LOS USA nutrition-api.ts MIENTRAS NO EXISTA EL BACKEND.
import type { DailyGoals, MealAnalysis } from "@/features/nutrition/nutrition-types";

export const mockDailyGoals: DailyGoals = {
  calories: 2000,
  protein: 120,
  carbs: 250,
  fat: 65,
  fiber: 30,
  sodium: 2300,
};

// RESULTADOS QUE DEVUELVE EL ANÁLISIS SIMULADO, EN ORDEN ROTATIVO.
export const mockMealSamples: Omit<MealAnalysis, "id" | "imageUrl" | "analyzedAt">[] = [
  {
    dishName: "Lomo saltado con arroz",
    portion: "1 plato (420 g)",
    nutrients: { calories: 680, protein: 38, carbs: 72, fat: 24, fiber: 5, sodium: 1150 },
    ingredients: [
      { id: "beef", name: "Lomo de res", portion: "150 g", calories: 285 },
      { id: "rice", name: "Arroz blanco", portion: "150 g", calories: 195 },
      { id: "fries", name: "Papas fritas", portion: "80 g", calories: 150 },
      { id: "veg", name: "Cebolla y tomate", portion: "40 g", calories: 50 },
    ],
    tip: "Buena fuente de proteína para recuperar tras el entrenamiento. Si buscas reducir calorías, cambia las papas fritas por ensalada y controla la sal de la salsa de soya.",
  },
  {
    dishName: "Ensalada de pollo a la plancha",
    portion: "1 bowl (350 g)",
    nutrients: { calories: 420, protein: 42, carbs: 18, fat: 19, fiber: 7, sodium: 640 },
    ingredients: [
      { id: "chicken", name: "Pechuga de pollo", portion: "160 g", calories: 260 },
      { id: "greens", name: "Lechuga y espinaca", portion: "90 g", calories: 20 },
      { id: "avocado", name: "Palta", portion: "50 g", calories: 80 },
      { id: "dressing", name: "Aderezo de oliva", portion: "15 ml", calories: 60 },
    ],
    tip: "Plato alto en proteína y fibra, ideal para tu meta. Agrega una porción de quinua o camote si entrenas hoy para recargar energía.",
  },
  {
    dishName: "Avena con plátano y mantequilla de maní",
    portion: "1 taza (300 g)",
    nutrients: { calories: 510, protein: 17, carbs: 74, fat: 17, fiber: 9, sodium: 160 },
    ingredients: [
      { id: "oats", name: "Avena", portion: "60 g", calories: 230 },
      { id: "banana", name: "Plátano", portion: "1 unidad", calories: 105 },
      { id: "peanut", name: "Mantequilla de maní", portion: "15 g", calories: 90 },
      { id: "milk", name: "Leche descremada", portion: "200 ml", calories: 85 },
    ],
    tip: "Desayuno con carbohidratos de absorción lenta, perfecto antes de entrenar. Suma claras de huevo o yogur griego para subir la proteína.",
  },
];
