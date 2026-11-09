import { describe, expect, it } from "vitest";
import { parseApiExercises, parseApiRoutines } from "./routine-api-model";

const exercise = {
  idEjercicio: 4,
  nombreEjercicio: "Plancha",
  descripcionEjercicio: "Mantener posición estable",
  grupoMuscular: "Core",
  dificultad: "Basico",
};

const routine = {
  idRutina: 2,
  nombreRutina: "Definicion Muscular",
  nivel: "Avanzado",
  objetivo: "Definicion",
  descripcionRutina: "Rutina de definición",
  fechaCreacion: "2026-09-30",
  activo: true,
  ejercicios: [
    {
      idDetalle: 1,
      idEjercicio: 4,
      nombreEjercicio: "Plancha",
      series: null,
      repeticiones: null,
      tiempo: 60,
      descanso: 75,
    },
  ],
  clientesAsignados: ["María Pérez"],
};

describe("API routine mapping", () => {
  it("accepts the SQL exercise and time-based routine contract", () => {
    expect(parseApiExercises([exercise])).toEqual([exercise]);
    expect(parseApiRoutines([routine])).toEqual([routine]);
  });

  it("rejects malformed or incomplete routine details", () => {
    expect(() => parseApiExercises([{ ...exercise, idEjercicio: "4" }])).toThrow(
      "La respuesta de ejercicios no tiene el formato esperado.",
    );
    expect(() =>
      parseApiRoutines([
        {
          ...routine,
          ejercicios: [{ ...routine.ejercicios[0], tiempo: null }],
        },
      ]),
    ).toThrow("La respuesta de rutinas no tiene el formato esperado.");
  });
});
