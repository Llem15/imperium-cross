import { describe, expect, it } from "vitest";
import { getApiMembershipStatus, parseApiClients, parseApiPlans } from "./client-api-model";

const client = {
  idCliente: 1,
  idUsuario: 4,
  nombres: "Melani",
  apellidos: "Cliente",
  dni: "42498865",
  telefono: "976648321",
  correo: "melani@gmail.com",
  fechaNacimiento: "2000-03-20",
  fechaRegistro: "2026-09-27",
  estadoCliente: true,
  estadoUsuario: true,
  idMembresia: 1,
  idPlan: 4,
  nombrePlan: "Plan Básico",
  fechaInicioMembresia: "2026-09-27",
  fechaFinMembresia: "2026-10-26",
  estadoMembresia: "Activa",
  objetivo: "Ganancia muscular",
  idRutina: 2,
  nombreRutina: "Ganancia muscular",
  idEntrenador: 3,
  nombreEntrenador: "Pedro Entrenador",
};

describe("API client mapping", () => {
  it("accepts the SQL-backed client response, including nullable membership data", () => {
    expect(parseApiClients([client])).toEqual([client]);
    expect(
      parseApiClients([
        {
          ...client,
          idMembresia: null,
          idPlan: null,
          nombrePlan: null,
          fechaInicioMembresia: null,
          fechaFinMembresia: null,
          estadoMembresia: null,
          objetivo: null,
          idRutina: null,
          nombreRutina: null,
          idEntrenador: null,
          nombreEntrenador: null,
        },
      ]),
    ).toHaveLength(1);
  });

  it("validates the live membership plans used by the client form", () => {
    expect(
      parseApiPlans([
        {
          idPlan: 4,
          nombrePlan: "Plan Básico",
          descripcionPlan: "Acceso por 30 días",
          duracionDias: 30,
          precio: 39.99,
          horasEntrenamientoSemana: 1,
          periodoCambioHorarioDias: 0,
          activo: true,
        },
        {
          idPlan: 5,
          nombrePlan: "Plan Premium",
          descripcionPlan: null,
          duracionDias: 30,
          precio: 69.99,
          horasEntrenamientoSemana: 2,
          periodoCambioHorarioDias: 15,
          activo: true,
        },
        {
          idPlan: 6,
          nombrePlan: "Plan Pro",
          descripcionPlan: null,
          duracionDias: 30,
          precio: 99.99,
          horasEntrenamientoSemana: 4,
          periodoCambioHorarioDias: 7,
          activo: true,
        },
      ]),
    ).toHaveLength(3);
    expect(() => parseApiPlans([{ idPlan: "1" }])).toThrow(
      "La respuesta de planes no tiene el formato esperado.",
    );
  });

  it("rejects malformed API responses", () => {
    expect(() => parseApiClients({ clients: [client] })).toThrow(
      "La respuesta del servicio no tiene el formato esperado.",
    );
    expect(() => parseApiClients([{ ...client, estadoCliente: "true" }])).toThrow(
      "La respuesta del servicio no tiene el formato esperado.",
    );
  });

  it("derives active, expired, pending, and inactive display states", () => {
    expect(getApiMembershipStatus(client, "2026-10-01")).toEqual({
      status: "active",
      label: "Activa",
    });
    expect(getApiMembershipStatus(client, "2026-10-27")).toEqual({
      status: "expired",
      label: "Vencida",
    });
    expect(
      getApiMembershipStatus({ ...client, estadoMembresia: "Pendiente" }, "2026-10-01"),
    ).toEqual({ status: "pending", label: "Pendiente" });
    expect(getApiMembershipStatus({ ...client, estadoUsuario: false })).toEqual({
      status: "pending",
      label: "Inactivo",
    });
  });
});