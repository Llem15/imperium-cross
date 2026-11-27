// Formato y validación del pago simulado. El número completo y el CVV solo viven en el
// estado del formulario de pago; fuera de él solo se conservan los últimos 4 dígitos.

export type OnlinePaymentMethod = "card" | "yape";

export type CardForm = {
  number: string;
  // Opcional; no se envía ni se usa en la confirmación
  name: string;
  expiry: string;
  cvv: string;
};
export type CardErrors = Partial<Record<keyof CardForm, string>>;

export type PaymentRequest =
  | { method: "card"; cardNumber: string; amountCents: number }
  | { method: "yape"; approvalCode: string; amountCents: number };

export type PaymentResult =
  | { method: "card"; operationId: string; lastFour: string }
  | { method: "yape"; operationId: string };

export type PaymentResponse =
  { status: "approved"; payment: PaymentResult } | { status: "rejected"; message: string };

export const cardNumberLength = 16;
export const cvvLength = 3;
export const yapeCodeLength = 6;

export function onlyDigits(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

// "4111111111111111" → "4111 1111 1111 1111"
export function formatCardNumber(value: string) {
  return onlyDigits(value, cardNumberLength).replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function cardDigitCount(value: string) {
  return onlyDigits(value, cardNumberLength).length;
}

// "1228" → "12/28"
export function formatExpiry(value: string) {
  const digits = onlyDigits(value, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export const cardNameMaxLength = 26;

// Vacío es válido; si se llena, solo letras (con tildes y ñ) y espacios
export function isCardNameValid(value: string) {
  const name = value.trim();
  return name === "" || /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/.test(name);
}

export function lastFourDigits(value: string) {
  return onlyDigits(value, cardNumberLength).slice(-4);
}

// Vigente hasta el último día del mes indicado
export function isExpiryValid(value: string, today = new Date()) {
  const match = /^(\d{2})\/(\d{2})$/.exec(value);
  if (!match) return false;

  const month = Number(match[1]);
  const year = 2000 + Number(match[2]);
  if (month < 1 || month > 12) return false;

  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  return year > currentYear || (year === currentYear && month >= currentMonth);
}

export function validateCard(card: CardForm, today = new Date()): CardErrors {
  const errors: CardErrors = {};

  if (cardDigitCount(card.number) !== cardNumberLength) {
    errors.number = "Número de tarjeta incompleto";
  }
  if (!isCardNameValid(card.name)) {
    errors.name = "Ingresa el nombre como aparece en la tarjeta";
  }
  if (!isExpiryValid(card.expiry, today)) {
    errors.expiry = "Ingresa un vencimiento válido (MM/AA).";
  }
  if (onlyDigits(card.cvv, cvvLength).length !== cvvLength) {
    errors.cvv = "Ingresa los 3 dígitos del CVV.";
  }

  return errors;
}

export function validateYapeCode(code: string) {
  return onlyDigits(code, yapeCodeLength).length === yapeCodeLength
    ? undefined
    : "Ingresa los 6 dígitos del código de aprobación.";
}

// "69.99" → 6999
export function priceToCents(price: string) {
  return Math.round(Number(price) * 100);
}
