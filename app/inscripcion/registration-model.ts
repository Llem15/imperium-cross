import { plans } from "../landing-content";

export type PlanId = (typeof plans)[number]["id"];
export type PaymentMethod = "card" | "yape" | "cash";
export type Applicant = {
  firstName: string;
  lastName: string;
  email: string;
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

// Estado visual del prototipo
export type RegistrationPreview = {
  planId: PlanId;
  method: PaymentMethod;
};

// Valores de referencia
export const confirmationExample = {
  validUntil: "08/10/2026",
  attendanceCode: "#4821",
} as const;
