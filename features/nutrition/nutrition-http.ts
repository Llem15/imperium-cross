// CÓDIGO DE SECCIÓN NUTRICIONAL
// IMPLEMENTACIÓN REAL CON fetch CONTRA /api/nutricion (MODO NEXT_PUBLIC_NUTRITION_SOURCE=api).
import type { DailyGoals, Meal, MealAnalysis } from "./nutrition-types";

/** "api" usa el backend; cualquier otro valor (o ninguno) usa los datos simulados. */
export const nutritionSource: "mock" | "api" =
  process.env.NEXT_PUBLIC_NUTRITION_SOURCE === "api" ? "api" : "mock";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

/**
 * Headers de autenticación para la API. Por ahora vacío: el frontend todavía usa un login de
 * demostración y no envía HTTP Basic (ver backend/README.md). Se completará al integrar el login
 * real; todas las llamadas de esta sección ya pasan por aquí.
 */
export function authHeaders(): Record<string, string> {
  return {};
}

/** Error HTTP con el código de estado y el mensaje del backend, si lo envió. */
export class NutritionApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "NutritionApiError";
  }
}

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...authHeaders(), ...init.headers },
  });
  if (!response.ok) {
    const payload: unknown = await response.json().catch(() => null);
    throw new NutritionApiError(response.status, errorMessage(payload, response.status));
  }
  return response;
}

function errorMessage(payload: unknown, status: number) {
  if (typeof payload === "object" && payload !== null) {
    const detail = (payload as Record<string, unknown>).detail;
    if (typeof detail === "string" && detail) return detail;
  }
  return `La solicitud falló (${status}).`;
}

/** Ruta relativa → URL absoluta del backend. Las URL blob: o absolutas se dejan igual. */
function absoluteImageUrl(imageUrl: string) {
  return imageUrl.startsWith("/") ? `${apiBaseUrl}${imageUrl}` : imageUrl;
}

export async function fetchDailyGoals(): Promise<DailyGoals> {
  return (await request("/api/nutricion/metas")).json();
}

export async function fetchMeals(date?: string): Promise<Meal[]> {
  const query = date ? `?fecha=${encodeURIComponent(date)}` : "";
  return (await request(`/api/nutricion/comidas${query}`)).json();
}

/** Envía la foto ya reducida. Un 422 indica que no se reconoció comida. */
export async function postMealPhoto(photo: Blob, fileName: string): Promise<MealAnalysis> {
  const form = new FormData();
  form.append("foto", photo, fileName);
  return (await request("/api/nutricion/analisis", { method: "POST", body: form })).json();
}

export async function postSaveMeal(analysisId: string): Promise<Meal> {
  const path = `/api/nutricion/analisis/${encodeURIComponent(analysisId)}/guardar`;
  return (await request(path, { method: "POST" })).json();
}

export async function deleteMealRequest(mealId: string): Promise<void> {
  await request(`/api/nutricion/comidas/${encodeURIComponent(mealId)}`, { method: "DELETE" });
}

/**
 * Descarga una foto protegida. Una etiqueta <img src> no puede enviar credenciales, por eso se
 * pide con fetch y se muestra con URL.createObjectURL.
 */
export async function fetchMealImage(imageUrl: string, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch(absoluteImageUrl(imageUrl), { headers: authHeaders(), signal });
  if (!response.ok) throw new NutritionApiError(response.status, "No se pudo cargar la foto.");
  return response.blob();
}
