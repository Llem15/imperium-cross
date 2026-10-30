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

// Figma no define las opciones del desplegable: catálogo inicial de demostración.
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
  const normalizedPhone = data.phone.replace(/[\s()-]/g, "");
  const hasValidEmail =
    /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(normalizedEmail) && !data.email.includes("..");
  const hasValidPhone = /^(?:\+51)?9\d{8}$/.test(normalizedPhone);
  const hasValidDni = /^\d{8}$/.test(data.dni);
  const hasValidGoal = (trainingGoals as readonly string[]).includes(data.goal);

  if (!data.firstName.trim()) {
    errors.firstName = "Ingresa tus nombres.";
  }
  if (!data.lastName.trim()) {
    errors.lastName = "Ingresa tus apellidos.";
  }
  if (!hasValidEmail) {
    errors.email = "Ingresa un correo electrónico válido.";
  }
  if (!hasValidPhone) {
    errors.phone = "Ingresa un celular peruano de 9 dígitos; puedes incluir +51.";
  }
  if (!hasValidDni) {
    errors.dni = "El DNI debe tener exactamente 8 dígitos.";
  }
  if (!hasValidGoal) {
    errors.goal = "Selecciona tu objetivo de entrenamiento.";
  }

  return errors;
}

// Estado visual del prototipo: no representa un registro ni un pago persistido.
export type RegistrationPreview = {
  planId: PlanId;
  method: PaymentMethod;
};

// Valores de referencia de Figma, utilizados solo para la vista del frontend.
export const confirmationExample = {
  validUntil: "08/10/2026",
  attendanceCode: "#4821",
} as const;
