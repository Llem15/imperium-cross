// Datos de la inscripción. Para conectar el backend, basta con cambiar este archivo.
import type { PlanSessions, WeeklyAvailability } from "./registration-model";
import { lastFourDigits } from "./registration-payment-model";
import type { PaymentRequest, PaymentResponse } from "./registration-payment-model";

// Valores de prueba del modo demostración. Se aprueba cualquier tarjeta de 16 dígitos,
// salvo rejectedCard.
export const demoPayment = {
  rejectedCard: "4000000000000002",
  yapeCode: "123456",
} as const;

const simulatedDelay = 800;

// Valor de referencia que se mostraba antes en la confirmación.
// TODO: confirmar con el equipo (debería venir del backend)
export const attendanceCodeExample = "#4821";

// Fecha límite para pagar en efectivo en el local
// TODO: confirmar con el equipo
export const cashPaymentDeadline = "[PLAZO]";

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

function operationId() {
  return `OP-${String(Math.floor(Math.random() * 100000000)).padStart(8, "0")}`;
}

// Pago simulado: no hay cobro real y no se guarda ni se envía nada.
// Con una pasarela real, los datos de la tarjeta irían directo a ella (tokenizados),
// nunca a nuestro backend, y el CVV no sale del formulario.
export async function simulatePayment(request: PaymentRequest): Promise<PaymentResponse> {
  await new Promise((resolve) => setTimeout(resolve, simulatedDelay));

  if (request.method === "yape") {
    return request.approvalCode === demoPayment.yapeCode
      ? { status: "approved", payment: { method: "yape", operationId: operationId() } }
      : { status: "rejected", message: "El código de aprobación no es válido. Revísalo en Yape." };
  }

  // Simula un rechazo del banco
  if (request.cardNumber === demoPayment.rejectedCard) {
    return {
      status: "rejected",
      message: "Tu banco rechazó el pago. Revisa los datos o usa otra tarjeta.",
    };
  }

  return {
    status: "approved",
    payment: {
      method: "card",
      operationId: operationId(),
      lastFour: lastFourDigits(request.cardNumber),
    },
  };
}
