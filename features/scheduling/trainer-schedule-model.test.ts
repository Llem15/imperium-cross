import { describe, expect, it } from "vitest";
import { parseTrainerSchedules } from "./trainer-schedule-model";

describe("trainer schedule mapping", () => {
  it("accepts SQL-backed trainer schedules and normalizes SQL times", () => {
    expect(
      parseTrainerSchedules([
        {
          idEntrenador: 3,
          nombreEntrenador: "Pedro Navarro",
          horarios: [{ diaSemana: 1, horaInicio: "06:00:00", horaFin: "14:00:00" }],
        },
      ]),
    ).toEqual([
      {
        idEntrenador: 3,
        nombreEntrenador: "Pedro Navarro",
        horarios: [{ diaSemana: 1, horaInicio: "06:00", horaFin: "14:00" }],
      },
    ]);
  });

  it("rejects malformed or Sunday trainer shifts", () => {
    expect(() => parseTrainerSchedules({ trainers: [] })).toThrow(
      "La respuesta de horarios no tiene el formato esperado.",
    );
    expect(() =>
      parseTrainerSchedules([
        {
          idEntrenador: 3,
          nombreEntrenador: "Pedro Navarro",
          horarios: [{ diaSemana: 7, horaInicio: "06:00", horaFin: "14:00" }],
        },
      ]),
    ).toThrow("La respuesta de horarios no tiene el formato esperado.");
  });
});
