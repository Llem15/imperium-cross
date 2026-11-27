import { plans } from "../landing-content";

export type PlanId = (typeof plans)[number]["id"];
export type PaymentMethod = "card" | "yape" | "cash";
export type Applicant = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  dni: string;
  goal: string;
};
export type ApplicantErrors = Partial<Record<keyof Applicant, string>>;

export const trainingGoals = [
  "Mejorar mi condición física",
  "Ganar fuerza",
  "Mejorar mi resistencia",
  "Otro",
] as const;

export const paymentMethods = [
  { id: "card", label: "Tarjeta", description: "Pago online inmediato" },
  { id: "yape", label: "Yape", description: "Pago online inmediato" },
  { id: "cash", label: "Efectivo", description: "Pago presencialmente" },
] as const;

export function validateApplicant(data: Applicant): ApplicantErrors {
  const errors: ApplicantErrors = {};
  const normalizedEmail = data.email.trim();
  const normalizedPhone = data.phone.trim();
  const hasValidEmail =
    /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(normalizedEmail) && !data.email.includes("..");
  const hasValidPhone = /^9\d{8}$/.test(normalizedPhone);
  const hasValidDni = /^\d{8}$/.test(data.dni);
  const hasValidPassword = /^(?=.*\p{L})(?=.*\d).{8,64}$/u.test(data.password);
  const hasValidGoal = (trainingGoals as readonly string[]).includes(data.goal);

  if (!data.firstName.trim()) {
    errors.firstName = "Completa este campo con tus nombres.";
  }
  if (!data.lastName.trim()) {
    errors.lastName = "Completa este campo con tus apellidos.";
  }
  if (!hasValidEmail) {
    errors.email = "Completa este campo con un correo válido.";
  }
  if (!hasValidPassword) {
    errors.password = "Usa al menos 8 caracteres, con letras y números.";
  }
  if (!hasValidPhone) {
    errors.phone = "Completa este campo con 9 dígitos, empezando en 9.";
  }
  if (!hasValidDni) {
    errors.dni = "Completa este campo con los 8 dígitos de tu DNI.";
  }
  if (!hasValidGoal) {
    errors.goal = "Selecciona una opción de la lista.";
  }

  return errors;
}

export const weekdays = [
  { id: 1, short: "Lun", name: "lunes" },
  { id: 2, short: "Mar", name: "martes" },
  { id: 3, short: "Mié", name: "miércoles" },
  { id: 4, short: "Jue", name: "jueves" },
  { id: 5, short: "Vie", name: "viernes" },
] as const;

export type Weekday = (typeof weekdays)[number]["id"];
// Horas de inicio ("HH:MM") con cupo por día
export type WeeklyAvailability = Record<Weekday, readonly string[]>;
// Una hora de inicio como máximo por día
export type WeeklySchedule = Partial<Record<Weekday, string>>;
export type PlanSessions = Record<PlanId, number>;
export type RegistrationOptions = {
  availability: WeeklyAvailability;
  sessionsByPlan: PlanSessions;
};

// Las sesiones duran 60 minutos
export function sessionEnd(start: string) {
  const [hours, minutes] = start.split(":");
  return `${String(Number(hours) + 1).padStart(2, "0")}:${minutes}`;
}

export function formatSession(start: string) {
  return `${start} – ${sessionEnd(start)}`;
}

export function sessionsLabel(count: number) {
  return count === 1 ? "1 sesión" : `${count} sesiones`;
}

export function scheduledSessions(schedule: WeeklySchedule) {
  return weekdays.flatMap((day) => {
    const start = schedule[day.id];
    return start ? [{ day, start }] : [];
  });
}

// Elegir otra hora del mismo día la reemplaza; elegir la misma la quita.
export function toggleSession(schedule: WeeklySchedule, day: Weekday, start: string) {
  if (schedule[day] === start) return removeSession(schedule, day);
  return { ...schedule, [day]: start };
}

export function removeSession(schedule: WeeklySchedule, day: Weekday) {
  const next = { ...schedule };
  delete next[day];
  return next;
}

export function maxWeeklySessions(sessionsByPlan: PlanSessions) {
  return Math.max(...Object.values(sessionsByPlan));
}

export function canScheduleDay(schedule: WeeklySchedule, day: Weekday, limit: number) {
  return Boolean(schedule[day]) || scheduledSessions(schedule).length < limit;
}

export function planCoversSessions(sessionsByPlan: PlanSessions, planId: PlanId, count: number) {
  return sessionsByPlan[planId] >= count;
}

// Conserva el plan si cubre las sesiones; si no, usa el más barato que sí las cubra.
export function planForSessions(current: PlanId, sessionsByPlan: PlanSessions, count: number) {
  if (planCoversSessions(sessionsByPlan, current, count)) return current;

  const cheapest = plans
    .filter((plan) => planCoversSessions(sessionsByPlan, plan.id, count))
    .sort((first, second) => Number(first.price) - Number(second.price))[0];
  return cheapest?.id ?? current;
}

// La membresía dura 30 días desde hoy; devuelve "DD/MM/AAAA"
export const membershipDays = 30;

export function membershipEndDate(today = new Date()) {
  const end = new Date(today);
  end.setDate(end.getDate() + membershipDays);
  return end.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
