// Datos de la inscripción. Para conectar el backend, basta con cambiar este archivo.
import type { PlanSessions, WeeklyAvailability } from "./registration-model";

// TODO: confirmar con el equipo
const availableSessions: WeeklyAvailability = {
  1: ["06:00", "07:00", "18:00", "19:00", "20:00"],
  2: ["06:00", "09:00", "19:00"],
  3: ["07:00", "18:00", "20:00"],
  4: ["06:00", "08:00", "19:00", "20:00"],
  5: ["06:00", "17:00", "18:00"],
};

// TODO: confirmar con el equipo
const weeklySessionsByPlan: PlanSessions = {
  basico: 2,
  premium: 3,
  pro: 5,
};

// Horas de inicio con cupo, de lunes a viernes. No incluye al entrenador.
export async function getAvailableSessions(): Promise<WeeklyAvailability> {
  return availableSessions;
}

export async function getWeeklySessionsByPlan(): Promise<PlanSessions> {
  return weeklySessionsByPlan;
}
