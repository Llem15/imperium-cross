export type ApiAttendance = {
  idAsistencia: number;
  idCliente: number;
  nombres: string;
  apellidos: string;
  nombrePlan: string | null;
  fechaHora: string;
};

function isApiAttendance(value: unknown): value is ApiAttendance {
  if (typeof value !== "object" || value === null) return false;
  const attendance = value as Record<string, unknown>;
  return (
    Number.isInteger(attendance.idAsistencia) &&
    Number.isInteger(attendance.idCliente) &&
    typeof attendance.nombres === "string" &&
    typeof attendance.apellidos === "string" &&
    (attendance.nombrePlan === null || typeof attendance.nombrePlan === "string") &&
    typeof attendance.fechaHora === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(attendance.fechaHora)
  );
}

export function parseApiAttendances(value: unknown): ApiAttendance[] {
  if (!Array.isArray(value) || !value.every(isApiAttendance)) {
    throw new Error("La respuesta de asistencias no tiene el formato esperado.");
  }
  return value;
}

export function parseApiAttendance(value: unknown): ApiAttendance {
  if (!isApiAttendance(value)) {
    throw new Error("La respuesta de asistencia no tiene el formato esperado.");
  }
  return value;
}
