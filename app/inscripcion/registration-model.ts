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
  if (!data.firstName.trim()) errors.firstName = "Ingresa tus nombres.";
  if (!data.lastName.trim()) errors.lastName = "Ingresa tus apellidos.";
  if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(data.email.trim()) || data.email.includes("..")) {
    errors.email = "Ingresa un correo electrónico válido.";
  }
  if (!/^(?:\+51)?9\d{8}$/.test(data.phone.replace(/[\s()-]/g, ""))) {
    errors.phone = "Ingresa un celular peruano de 9 dígitos; puedes incluir +51.";
  }
  if (!/^\d{8}$/.test(data.dni)) errors.dni = "El DNI debe tener exactamente 8 dígitos.";
  if (!(trainingGoals as readonly string[]).includes(data.goal)) {
    errors.goal = "Selecciona tu objetivo de entrenamiento.";
  }
  return errors;
}

// Solo un backend autorizado debe construir estos resultados a partir de datos persistidos.
export type ConfirmedRegistration = {
  registrationId: string;
  planId: PlanId;
} & (
  | { status: "pending-payment"; method: "cash" }
  | {
      status: "active";
      method: "card" | "yape";
      paymentReference: string;
      validUntil: string;
      attendanceCode: string;
      credentialsEmailSent: boolean;
    }
);
