export type TrainingSlot = {
  diaSemana: number;
  horaInicio: string;
};

export type TrainingAvailability = {
  idMembresia: number;
  fechaInicio: string;
  fechaFin: string;
  horasSemanales: number;
  reservasActivas: number;
  reservasDisponibles: number;
  periodoCambioHorarioDias: number;
  horarios: TrainingSlot[];
};

export type TrainingReservation = {
  idReserva: number;
  idMembresia: number;
  idCliente: number;
  nombreCliente: string;
  idEntrenador: number;
  nombreEntrenador: string;
  diaSemana: number;
  horaInicio: string;
  fechaInicio: string;
  fechaFin: string;
  estado: "Activa" | "Cancelada";
  sesionesReservadas: number;
  periodoCambioHorarioDias: number;
  fechaUltimoCambio: string;
  fechaSiguienteCambio: string | null;
  puedeCambiarHorario: boolean;
};

function isDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isTime(value: unknown): value is string {
  return typeof value === "string" && /^\d{2}:\d{2}(?::\d{2})?$/.test(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value);
}

function isSlot(value: unknown): value is TrainingSlot {
  if (typeof value !== "object" || value === null) return false;
  const slot = value as Record<string, unknown>;
  return (
    Number.isInteger(slot.diaSemana) &&
    Number(slot.diaSemana) >= 1 &&
    Number(slot.diaSemana) <= 6 &&
    isTime(slot.horaInicio)
  );
}

export function parseTrainingAvailability(value: unknown): TrainingAvailability {
  if (typeof value !== "object" || value === null) {
    throw new Error("La disponibilidad no tiene el formato esperado.");
  }
  const item = value as Record<string, unknown>;
  if (
    !isInteger(item.idMembresia) ||
    !isDate(item.fechaInicio) ||
    !isDate(item.fechaFin) ||
    !isInteger(item.horasSemanales) ||
    !isInteger(item.reservasActivas) ||
    !isInteger(item.reservasDisponibles) ||
    !isInteger(item.periodoCambioHorarioDias) ||
    !Array.isArray(item.horarios) ||
    !item.horarios.every(isSlot)
  ) {
    throw new Error("La disponibilidad no tiene el formato esperado.");
  }
  const slots = item.horarios;
  return {
    idMembresia: item.idMembresia,
    fechaInicio: item.fechaInicio,
    fechaFin: item.fechaFin,
    horasSemanales: item.horasSemanales,
    reservasActivas: item.reservasActivas,
    reservasDisponibles: item.reservasDisponibles,
    periodoCambioHorarioDias: item.periodoCambioHorarioDias,
    horarios: slots.map((slot) => ({
      ...slot,
      horaInicio: slot.horaInicio.slice(0, 5),
    })),
  };
}

function isTrainingReservation(value: unknown): value is TrainingReservation {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    isInteger(item.idReserva) &&
    isInteger(item.idMembresia) &&
    isInteger(item.idCliente) &&
    typeof item.nombreCliente === "string" &&
    isInteger(item.idEntrenador) &&
    typeof item.nombreEntrenador === "string" &&
    isInteger(item.diaSemana) &&
    item.diaSemana >= 1 &&
    item.diaSemana <= 6 &&
    isTime(item.horaInicio) &&
    isDate(item.fechaInicio) &&
    isDate(item.fechaFin) &&
    ["Activa", "Cancelada"].includes(String(item.estado)) &&
    isInteger(item.sesionesReservadas) &&
    isInteger(item.periodoCambioHorarioDias) &&
    isDate(item.fechaUltimoCambio) &&
    (item.fechaSiguienteCambio === null || isDate(item.fechaSiguienteCambio)) &&
    typeof item.puedeCambiarHorario === "boolean"
  );
}

export function parseTrainingReservations(value: unknown): TrainingReservation[] {
  if (!Array.isArray(value) || !value.every(isTrainingReservation)) {
    throw new Error("La respuesta de reservas no tiene el formato esperado.");
  }
  return value.map((reservation) => ({
    ...reservation,
    horaInicio: reservation.horaInicio.slice(0, 5),
  }));
}
