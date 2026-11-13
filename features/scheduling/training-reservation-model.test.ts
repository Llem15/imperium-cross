import { describe, expect, it } from "vitest";
import { parseTrainingAvailability, parseTrainingReservations } from "./training-reservation-model";

describe("training reservation API models", () => {
  it("parses available slots and normalizes SQL times", () => {
    expect(
      parseTrainingAvailability({
        idMembresia: 8,
        fechaInicio: "2026-11-01",
        fechaFin: "2026-11-30",
        horasSemanales: 2,
        reservasActivas: 1,
        reservasDisponibles: 1,
        periodoCambioHorarioDias: 15,
        horarios: [{ diaSemana: 2, horaInicio: "09:00:00" }],
      }),
    ).toMatchObject({
      reservasDisponibles: 1,
      horarios: [{ diaSemana: 2, horaInicio: "09:00" }],
    });
  });

  it("rejects malformed or out-of-range availability slots", () => {
    expect(() =>
      parseTrainingAvailability({
        idMembresia: 8,
        fechaInicio: "2026-11-01",
        fechaFin: "2026-11-30",
        horasSemanales: 2,
        reservasActivas: 0,
        reservasDisponibles: 2,
        periodoCambioHorarioDias: 15,
        horarios: [{ diaSemana: 7, horaInicio: "09:00" }],
      }),
    ).toThrow("La disponibilidad no tiene el formato esperado.");
  });

  it("parses reservations and preserves schedule-change information", () => {
    expect(
      parseTrainingReservations([
        {
          idReserva: 4,
          idMembresia: 8,
          idCliente: 2,
          nombreCliente: "Ana Ruiz",
          idEntrenador: 5,
          nombreEntrenador: "Luis Paz",
          diaSemana: 2,
          horaInicio: "09:00:00",
          fechaInicio: "2026-11-01",
          fechaFin: "2026-11-30",
          estado: "Activa",
          sesionesReservadas: 4,
          periodoCambioHorarioDias: 15,
          fechaUltimoCambio: "2026-11-01",
          fechaSiguienteCambio: "2026-11-16",
          puedeCambiarHorario: false,
        },
      ]),
    ).toMatchObject([
      {
        idReserva: 4,
        horaInicio: "09:00",
        fechaSiguienteCambio: "2026-11-16",
        puedeCambiarHorario: false,
      },
    ]);
  });

  it("rejects malformed reservation records", () => {
    expect(() => parseTrainingReservations([{ idReserva: 1 }])).toThrow(
      "La respuesta de reservas no tiene el formato esperado.",
    );
  });
});
