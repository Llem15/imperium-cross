import { describe, expect, it } from "vitest";
import {
  formatCardNumber,
  formatExpiry,
  isCardNameValid,
  isExpiryValid,
  lastFourDigits,
  priceToCents,
  validateCard,
  validateYapeCode,
} from "./registration-payment-model";
import type { CardForm } from "./registration-payment-model";

const today = new Date(2026, 10, 26);
const validCard: CardForm = {
  number: "1234 5678 9012 3456",
  name: "",
  expiry: "12/30",
  cvv: "123",
};

describe("formato de tarjeta", () => {
  it("agrupa de 4 en 4 y descarta lo que no es dígito", () => {
    expect(formatCardNumber("4111111111111111")).toBe("4111 1111 1111 1111");
    expect(formatCardNumber("4111-11ab11")).toBe("4111 1111");
    expect(formatCardNumber("41111")).toBe("4111 1");
  });

  it("corta en 16 dígitos", () => {
    expect(formatCardNumber("41111111111111119999")).toBe("4111 1111 1111 1111");
  });

  it("es estable si se vuelve a formatear", () => {
    const formatted = formatCardNumber("4111111111111111");
    expect(formatCardNumber(formatted)).toBe(formatted);
  });

  it("pone la barra del vencimiento automáticamente", () => {
    expect(formatExpiry("1")).toBe("1");
    expect(formatExpiry("12")).toBe("12");
    expect(formatExpiry("123")).toBe("12/3");
    expect(formatExpiry("12/30")).toBe("12/30");
    expect(formatExpiry("123099")).toBe("12/30");
  });

  it("conserva solo los últimos 4 dígitos", () => {
    expect(lastFourDigits("4111 1111 1111 1234")).toBe("1234");
  });
});

describe("validación de tarjeta", () => {
  it("acepta cualquier número de 16 dígitos", () => {
    expect(validateCard(validCard, today)).toEqual({});
    expect(validateCard({ ...validCard, number: "0000 0000 0000 0000" }, today)).toEqual({});
  });

  it("marca el número incompleto si tiene menos de 16 dígitos", () => {
    expect(validateCard({ ...validCard, number: "4111 1111" }, today).number).toBe(
      "Número de tarjeta incompleto",
    );
  });

  it("no modifica lo ingresado al validar", () => {
    const card = { ...validCard, number: "4111 1111" };
    validateCard(card, today);
    expect(card.number).toBe("4111 1111");
  });

  it("valida vencimiento MM/AA vigente", () => {
    expect(isExpiryValid("11/26", today)).toBe(true);
    expect(isExpiryValid("10/26", today)).toBe(false);
    expect(isExpiryValid("13/30", today)).toBe(false);
    expect(isExpiryValid("00/30", today)).toBe(false);
    expect(isExpiryValid("1230", today)).toBe(false);
  });

  it("exige CVV de 3 dígitos", () => {
    expect(validateCard({ ...validCard, cvv: "12" }, today).cvv).toBeDefined();
  });

  it("el nombre es opcional, pero si se llena solo admite letras y espacios", () => {
    expect(isCardNameValid("")).toBe(true);
    expect(isCardNameValid("   ")).toBe(true);
    expect(isCardNameValid("José Peña Núñez")).toBe(true);
    expect(isCardNameValid("Ana2")).toBe(false);
    expect(validateCard({ ...validCard, name: "Ana2" }, today).name).toBe(
      "Ingresa el nombre como aparece en la tarjeta",
    );
  });
});

describe("Yape y montos", () => {
  it("exige un código de 6 dígitos", () => {
    expect(validateYapeCode("123456")).toBeUndefined();
    expect(validateYapeCode("12345")).toBeDefined();
  });

  it("convierte el precio a céntimos", () => {
    expect(priceToCents("69.99")).toBe(6999);
    expect(priceToCents("39.99")).toBe(3999);
  });
});
