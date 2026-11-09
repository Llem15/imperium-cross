import { describe, expect, it } from "vitest";
import { parseApiAttendance, parseApiAttendances } from "./attendance-api-model";

const attendance = {
  idAsistencia: 9,
  idCliente: 3,
  nombres: "María",
  apellidos: "Pérez",
  nombrePlan: "Plan Básico",
  fechaHora: "2026-11-08T07:30:00",
};

describe("API attendance mapping", () => {
  it("accepts attendance records with an optional plan name", () => {
    expect(parseApiAttendances([attendance])).toEqual([attendance]);
    expect(parseApiAttendances([{ ...attendance, nombrePlan: null }])).toHaveLength(1);
    expect(parseApiAttendance(attendance)).toEqual(attendance);
  });

  it("rejects malformed attendance responses", () => {
    expect(() => parseApiAttendances({ entries: [attendance] })).toThrow(
      "La respuesta de asistencias no tiene el formato esperado.",
    );
    expect(() => parseApiAttendances([{ ...attendance, idCliente: "3" }])).toThrow(
      "La respuesta de asistencias no tiene el formato esperado.",
    );
    expect(() => parseApiAttendance({ ...attendance, fechaHora: "today" })).toThrow(
      "La respuesta de asistencia no tiene el formato esperado.",
    );
  });
});
