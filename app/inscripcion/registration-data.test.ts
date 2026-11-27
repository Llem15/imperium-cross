import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAvailableSessions, simulatePayment } from "./registration-data";
import type { PaymentRequest } from "./registration-payment-model";

async function pay(request: PaymentRequest) {
  const response = simulatePayment(request);
  await vi.runAllTimersAsync();
  return response;
}

describe("pago simulado", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("aprueba cualquier tarjeta de 16 dígitos y solo devuelve los últimos 4", async () => {
    const response = await pay({
      method: "card",
      cardNumber: "1234567890123456",
      amountCents: 6999,
    });

    expect(response).toMatchObject({
      status: "approved",
      payment: { method: "card", lastFour: "3456" },
    });
    expect(JSON.stringify(response)).not.toContain("1234567890123456");
  });

  it("rechaza la tarjeta de prueba de rechazo", async () => {
    const response = await pay({
      method: "card",
      cardNumber: "4000000000000002",
      amountCents: 6999,
    });

    expect(response.status).toBe("rejected");
  });

  it("aprueba Yape solo con el código 123456", async () => {
    const approved = await pay({ method: "yape", approvalCode: "123456", amountCents: 6999 });
    const rejected = await pay({ method: "yape", approvalCode: "654321", amountCents: 6999 });

    expect(approved).toMatchObject({ status: "approved", payment: { method: "yape" } });
    expect(rejected.status).toBe("rejected");
  });
});

describe("horarios disponibles", () => {
  it("solo ofrece lunes a viernes, sin entrenador", async () => {
    const availability = await getAvailableSessions();

    expect(Object.keys(availability)).toEqual(["1", "2", "3", "4", "5"]);
    for (const starts of Object.values(availability)) {
      for (const start of starts) expect(start).toMatch(/^\d{2}:\d{2}$/);
    }
  });
});
