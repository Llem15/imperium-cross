export type ApiClient = {
  idCliente: number;
  idUsuario: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string | null;
  correo: string;
  fechaNacimiento: string | null;
  fechaRegistro: string | null;
  estadoCliente: boolean;
  estadoUsuario: boolean;
  idMembresia: number | null;
  idPlan: number | null;
  nombrePlan: string | null;
  fechaInicioMembresia: string | null;
  fechaFinMembresia: string | null;
  estadoMembresia: string | null;
  objetivo: string | null;
  idRutina: number | null;
  nombreRutina: string | null;
  idEntrenador: number | null;
  nombreEntrenador: string | null;
};

export type ApiPlan = {
  idPlan: number;
  nombrePlan: string;
  descripcionPlan: string | null;
  duracionDias: number;
  precio: number;
  horasEntrenamientoSemana: number;
  periodoCambioHorarioDias: number;
  activo: boolean;
};

export type ApiMembershipStatus = "active" | "pending" | "expired";

function isOptionalString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isOptionalDate(value: unknown): value is string | null {
  return value === null || (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isApiClient(value: unknown): value is ApiClient {
  if (typeof value !== "object" || value === null) return false;
  const client = value as Record<string, unknown>;
  return (
    Number.isInteger(client.idCliente) &&
    Number.isInteger(client.idUsuario) &&
    typeof client.nombres === "string" &&
    typeof client.apellidos === "string" &&
    typeof client.dni === "string" &&
    isOptionalString(client.telefono) &&
    typeof client.correo === "string" &&
    isOptionalDate(client.fechaNacimiento) &&
    isOptionalDate(client.fechaRegistro) &&
    typeof client.estadoCliente === "boolean" &&
    typeof client.estadoUsuario === "boolean" &&
    (client.idMembresia === null || Number.isInteger(client.idMembresia)) &&
    (client.idPlan === null || Number.isInteger(client.idPlan)) &&
    isOptionalString(client.nombrePlan) &&
    isOptionalDate(client.fechaInicioMembresia) &&
    isOptionalDate(client.fechaFinMembresia) &&
    isOptionalString(client.estadoMembresia) &&
    isOptionalString(client.objetivo) &&
    (client.idRutina === null || Number.isInteger(client.idRutina)) &&
    isOptionalString(client.nombreRutina) &&
    (client.idEntrenador === null || Number.isInteger(client.idEntrenador)) &&
    isOptionalString(client.nombreEntrenador)
  );
}

export function parseApiClients(value: unknown): ApiClient[] {
  if (!Array.isArray(value) || !value.every(isApiClient)) {
    throw new Error("La respuesta del servicio no tiene el formato esperado.");
  }
  return value;
}

export function parseApiPlans(value: unknown): ApiPlan[] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (plan) =>
        typeof plan === "object" &&
        plan !== null &&
        Number.isInteger(plan.idPlan) &&
        typeof plan.nombrePlan === "string" &&
        (plan.descripcionPlan === null || typeof plan.descripcionPlan === "string") &&
        Number.isInteger(plan.duracionDias) &&
        typeof plan.precio === "number" &&
        Number.isInteger(plan.horasEntrenamientoSemana) &&
        Number(plan.horasEntrenamientoSemana) >= 0 &&
        Number(plan.horasEntrenamientoSemana) <= 7 &&
        Number.isInteger(plan.periodoCambioHorarioDias) &&
        Number(plan.periodoCambioHorarioDias) >= 0 &&
        Number(plan.periodoCambioHorarioDias) <= 30 &&
        typeof plan.activo === "boolean",
    )
  ) {
    throw new Error("La respuesta de planes no tiene el formato esperado.");
  }
  return value;
}

export function getApiMembershipStatus(
  client: Pick<
    ApiClient,
    "estadoCliente" | "estadoUsuario" | "estadoMembresia" | "fechaFinMembresia"
  >,
  today = new Date().toISOString().slice(0, 10),
): { status: ApiMembershipStatus; label: string } {
  if (!client.estadoCliente || !client.estadoUsuario) {
    return { status: "pending", label: "Inactivo" };
  }

  const membershipStatus = client.estadoMembresia?.toLocaleLowerCase();
  if (!membershipStatus) return { status: "pending", label: "Sin membresía" };
  if (membershipStatus === "activa") {
    if (client.fechaFinMembresia && client.fechaFinMembresia < today) {
      return { status: "expired", label: "Vencida" };
    }
    return { status: "active", label: "Activa" };
  }
  if (membershipStatus === "vencida") return { status: "expired", label: "Vencida" };
  return { status: "pending", label: client.estadoMembresia ?? "Sin membresía" };
}
