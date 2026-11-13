export type TrainerShift = {
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
};

export type TrainerSchedule = {
  idEntrenador: number;
  nombreEntrenador: string;
  horarios: TrainerShift[];
};

function isTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}(?::\d{2})?$/.test(value);
}

export function parseTrainerSchedules(value: unknown): TrainerSchedule[] {
  if (!Array.isArray(value)) {
    throw new Error("La respuesta de horarios no tiene el formato esperado.");
  }
  const valid = value.every((item) => {
    if (typeof item !== "object" || item === null) return false;
    const trainer = item as Record<string, unknown>;
    return (
      Number.isInteger(trainer.idEntrenador) &&
      typeof trainer.nombreEntrenador === "string" &&
      Array.isArray(trainer.horarios) &&
      trainer.horarios.every((shift) => {
        if (typeof shift !== "object" || shift === null) return false;
        const row = shift as Record<string, unknown>;
        return (
          Number.isInteger(row.diaSemana) &&
          Number(row.diaSemana) >= 1 &&
          Number(row.diaSemana) <= 6 &&
          isTime(row.horaInicio) &&
          isTime(row.horaFin)
        );
      })
    );
  });
  if (!valid) throw new Error("La respuesta de horarios no tiene el formato esperado.");

  return value.map((item) => {
    const trainer = item as TrainerSchedule;
    return {
      ...trainer,
      horarios: trainer.horarios.map((shift) => ({
        ...shift,
        horaInicio: shift.horaInicio.slice(0, 5),
        horaFin: shift.horaFin.slice(0, 5),
      })),
    };
  });
}
