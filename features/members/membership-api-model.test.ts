import { describe, expect, it } from "vitest";
import { parseApiMemberships } from "./membership-api-model";

const membership = {
  idMembresia: 3,
  idCliente: 1,
  nombres: "Melani",
  apellidos: "Cliente",
  idPlan: 4,
  nombrePlan: "Plan Básico",
  fechaInicio: "2026-09-27",
  fechaFin: "2026-10-27",
  estadoMembresia: "Vencida",
  idPago: 3,
  monto: 39.99,
  metodoPago: "Yape",
  estadoPago: "Pagado",
};

describe("API membership mapping", () => {
  it("accepts a SQL-backed membership and payment", () => {
    expect(parseApiMemberships([membership])).toEqual([membership]);
  });

  it("accepts a legacy membership without a payment", () => {
    expect(
      parseApiMemberships([
        {
          ...membership,
          idPago: null,
          monto: null,
          metodoPago: null,
          estadoPago: null,
        },
      ]),
    ).toHaveLength(1);
  });

  it("rejects malformed dates and statuses", () => {
    expect(() => parseApiMemberships([{ ...membership, fechaFin: "27/10/2026" }])).toThrow(
      "La respuesta de matrículas no tiene el formato esperado.",
    );
    expect(() => parseApiMemberships([{ ...membership, estadoPago: "Desconocido" }])).toThrow(
      "La respuesta de matrículas no tiene el formato esperado.",
    );
  });

  it("accepts scheduled and cancelled memberships", () => {
    expect(
      parseApiMemberships([
        { ...membership, estadoMembresia: "Programada" },
        { ...membership, estadoMembresia: "Cancelada" },
      ]),
    ).toHaveLength(2);
  });
});
