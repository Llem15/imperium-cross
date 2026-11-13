export type ApiMembership = {
  idMembresia: number;
  idCliente: number;
  nombres: string;
  apellidos: string;
  idPlan: number;
  nombrePlan: string;
  fechaInicio: string;
  fechaFin: string;
  estadoMembresia: "Activa" | "Pendiente" | "Programada" | "Vencida" | "Cancelada";
  idPago: number | null;
  monto: number | null;
  metodoPago: string | null;
  estadoPago: "Pagado" | "Pendiente" | "Anulado" | null;
};

function isDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isApiMembership(value: unknown): value is ApiMembership {
  if (typeof value !== "object" || value === null) return false;
  const membership = value as Record<string, unknown>;
  return (
    Number.isInteger(membership.idMembresia) &&
    Number.isInteger(membership.idCliente) &&
    typeof membership.nombres === "string" &&
    typeof membership.apellidos === "string" &&
    Number.isInteger(membership.idPlan) &&
    typeof membership.nombrePlan === "string" &&
    isDate(membership.fechaInicio) &&
    isDate(membership.fechaFin) &&
    ["Activa", "Pendiente", "Programada", "Vencida", "Cancelada"].includes(
      String(membership.estadoMembresia),
    ) &&
    (membership.idPago === null || Number.isInteger(membership.idPago)) &&
    (membership.monto === null || typeof membership.monto === "number") &&
    (membership.metodoPago === null || typeof membership.metodoPago === "string") &&
    (membership.estadoPago === null ||
      ["Pagado", "Pendiente", "Anulado"].includes(String(membership.estadoPago)))
  );
}

export function parseApiMemberships(value: unknown): ApiMembership[] {
  if (!Array.isArray(value) || !value.every(isApiMembership)) {
    throw new Error("La respuesta de matrículas no tiene el formato esperado.");
  }
  return value;
}
