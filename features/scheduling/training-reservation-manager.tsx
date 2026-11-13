"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, ManagementPanel } from "@/components/dashboard/management-ui";
import { parseApiMemberships } from "@/features/members/membership-api-model";
import type { ApiMembership } from "@/features/members/membership-api-model";
import { parseTrainingAvailability, parseTrainingReservations } from "./training-reservation-model";
import type {
  TrainingAvailability,
  TrainingReservation,
  TrainingSlot,
} from "./training-reservation-model";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);
const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const control =
  "mt-2 min-h-10 w-full rounded-control border border-muted bg-white px-3 py-2 text-sm";

function messageFrom(payload: unknown, fallback: string) {
  if (typeof payload !== "object" || payload === null) return fallback;
  const body = payload as Record<string, unknown>;
  if (typeof body.detail === "string") return body.detail;
  if (typeof body.message === "string") return body.message;
  return fallback;
}

async function responseError(response: Response, fallback: string) {
  const payload = await response.json().catch(() => null);
  return new Error(messageFrom(payload, `${fallback} (HTTP ${response.status}).`));
}

function dateToday() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function eligibleMembership(membership: ApiMembership) {
  return (
    membership.estadoPago === "Pagado" &&
    (membership.estadoMembresia === "Activa" || membership.estadoMembresia === "Programada") &&
    membership.fechaFin >= dateToday()
  );
}

function fullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function timeText(value: string) {
  return value.slice(0, 5);
}

export function TrainingReservationManager() {
  const [memberships, setMemberships] = useState<ApiMembership[]>([]);
  const [reservations, setReservations] = useState<TrainingReservation[]>([]);
  const [membershipId, setMembershipId] = useState("");
  const [availability, setAvailability] = useState<TrainingAvailability | null>(null);
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [changeTarget, setChangeTarget] = useState<TrainingReservation | null>(null);
  const [changeAvailability, setChangeAvailability] = useState<TrainingAvailability | null>(null);
  const [changeDay, setChangeDay] = useState("");
  const [changeTime, setChangeTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reload, setReload] = useState(0);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    const [membershipResponse, reservationResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/api/membresias`, { signal, headers: { Accept: "application/json" } }),
      fetch(`${apiBaseUrl}/api/reservas`, { signal, headers: { Accept: "application/json" } }),
    ]);
    if (!membershipResponse.ok) {
      throw await responseError(membershipResponse, "No se pudieron cargar las membresías");
    }
    if (!reservationResponse.ok) {
      throw await responseError(reservationResponse, "No se pudieron cargar las reservas");
    }
    const [membershipPayload, reservationPayload] = await Promise.all([
      membershipResponse.json(),
      reservationResponse.json(),
    ]);
    return {
      memberships: parseApiMemberships(membershipPayload),
      reservations: parseTrainingReservations(reservationPayload),
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal)
      .then((loaded) => {
        if (controller.signal.aborted) return;
        setMemberships(loaded.memberships);
        setReservations(loaded.reservations);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "No se pudieron cargar las reservas.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadData, reload]);

  useEffect(() => {
    if (!membershipId) return;
    const controller = new AbortController();
    fetch(`${apiBaseUrl}/api/reservas/disponibilidad/${membershipId}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
      .then(async (response) => {
        if (!response.ok)
          throw await responseError(response, "No se pudo consultar disponibilidad");
        return parseTrainingAvailability(await response.json());
      })
      .then((result) => {
        if (controller.signal.aborted) return;
        setAvailability(result);
        const first = result.horarios[0];
        if (first) {
          setDay(String(first.diaSemana));
          setTime(first.horaInicio);
        }
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "No se pudo consultar disponibilidad.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setAvailabilityLoading(false);
      });
    return () => controller.abort();
  }, [membershipId, reload]);

  const eligibleMemberships = useMemo(() => memberships.filter(eligibleMembership), [memberships]);
  const daySlots = useMemo(
    () =>
      (membershipId ? availability?.horarios : undefined)?.filter(
        (slot) => String(slot.diaSemana) === day,
      ) ?? [],
    [availability, day, membershipId],
  );
  const changeDaySlots = useMemo(
    () => changeAvailability?.horarios.filter((slot) => String(slot.diaSemana) === changeDay) ?? [],
    [changeAvailability, changeDay],
  );

  function setInitialSlot(
    slots: TrainingSlot[],
    setSelectedDay: (value: string) => void,
    setSelectedTime: (value: string) => void,
  ) {
    const first = slots[0];
    if (!first) {
      setSelectedDay("");
      setSelectedTime("");
      return;
    }
    setSelectedDay(String(first.diaSemana));
    setSelectedTime(first.horaInicio);
  }

  async function refresh() {
    setReload((value) => value + 1);
    if (membershipId) {
      setAvailabilityLoading(true);
      try {
        const response = await fetch(`${apiBaseUrl}/api/reservas/disponibilidad/${membershipId}`, {
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          throw await responseError(response, "No se pudo actualizar disponibilidad");
        }
        const result = parseTrainingAvailability(await response.json());
        setAvailability(result);
        const nextDay = result.horarios[0] ? String(result.horarios[0].diaSemana) : "";
        setDay(nextDay);
        setTime(result.horarios[0]?.horaInicio ?? "");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "No se pudo actualizar disponibilidad.");
      } finally {
        setAvailabilityLoading(false);
      }
    }
  }

  async function createReservation() {
    if (!membershipId || !day || !time) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/reservas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          idMembresia: Number(membershipId),
          diaSemana: Number(day),
          horaInicio: time,
        }),
      });
      if (!response.ok) throw await responseError(response, "No se pudo crear la reserva");
      setSuccess("Reserva recurrente creada y entrenador asignado automáticamente.");
      setChangeTarget(null);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo crear la reserva.");
    } finally {
      setBusy(false);
    }
  }

  async function startChange(reservation: TrainingReservation) {
    setError("");
    setSuccess("");
    setChangeTarget(reservation);
    setChangeAvailability(null);
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/reservas/${reservation.idReserva}/disponibilidad-cambio`,
        { headers: { Accept: "application/json" } },
      );
      if (!response.ok) throw await responseError(response, "No se pudo consultar el cambio");
      const result = parseTrainingAvailability(await response.json());
      setChangeAvailability(result);
      setInitialSlot(result.horarios, setChangeDay, setChangeTime);
    } catch (cause) {
      setChangeTarget(null);
      setError(cause instanceof Error ? cause.message : "No se pudo consultar el cambio.");
    }
  }

  async function changeSchedule() {
    if (!changeTarget || !changeDay || !changeTime) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/reservas/${changeTarget.idReserva}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          diaSemana: Number(changeDay),
          horaInicio: changeTime,
        }),
      });
      if (!response.ok) throw await responseError(response, "No se pudo cambiar el horario");
      setSuccess("Horario cambiado; las sesiones pasadas se conservaron.");
      setChangeTarget(null);
      setChangeAvailability(null);
      setReload((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cambiar el horario.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelReservation(reservation: TrainingReservation) {
    if (
      !window.confirm(
        `¿Cancelar la reserva semanal de ${reservation.nombreCliente}? Se conservarán las sesiones pasadas.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/reservas/${reservation.idReserva}`, {
        method: "DELETE",
      });
      if (!response.ok) throw await responseError(response, "No se pudo cancelar la reserva");
      setSuccess("Reserva cancelada; las sesiones pasadas se conservaron.");
      if (changeTarget?.idReserva === reservation.idReserva) setChangeTarget(null);
      setReload((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo cancelar la reserva.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ManagementPanel
      title="Reservas de entrenamiento"
      subtitle="Agenda recurrente de sesiones de 60 minutos. El sistema elige automáticamente al entrenador."
      actions={
        <Button
          small
          variant="outline"
          disabled={loading || busy}
          onClick={() => setReload((n) => n + 1)}
        >
          Actualizar
        </Button>
      }
    >
      <div className="mt-6 rounded-control border border-status-info bg-brand-surface p-4 text-sm">
        Esta gestión es administrativa. El socio aún no puede reservar directamente: el acceso
        requiere autenticación real. Básico mantiene horario fijo; Premium permite cambios cada 15
        días y Pro cada 7 días.
      </div>
      {error && (
        <p role="alert" className="mt-5 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="mt-5 text-sm text-green-700">
          {success}
        </p>
      )}

      <section className="mt-8 rounded-control border border-line p-5">
        <h2 className="text-base font-bold">Crear reserva recurrente</h2>
        <p className="mt-1 text-sm text-muted">
          Elige una membresía pagada y vigente; no se solicita ni se selecciona el entrenador.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <label className="text-sm font-bold">
            Cliente y membresía
            <select
              className={control}
              value={membershipId}
              disabled={loading || busy}
              onChange={(event) => {
                setError("");
                setAvailability(null);
                setDay("");
                setTime("");
                setAvailabilityLoading(Boolean(event.target.value));
                setMembershipId(event.target.value);
              }}
            >
              <option value="">Seleccionar membresía</option>
              {eligibleMemberships.map((membership) => (
                <option key={membership.idMembresia} value={membership.idMembresia}>
                  {fullName(membership.nombres, membership.apellidos)} — {membership.nombrePlan} ·{" "}
                  {membership.fechaInicio} a {membership.fechaFin}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Día semanal
            <select
              className={control}
              value={day}
              disabled={!availability || busy}
              onChange={(event) => {
                setDay(event.target.value);
                const nextSlots =
                  availability?.horarios.filter(
                    (slot) => String(slot.diaSemana) === event.target.value,
                  ) ?? [];
                setTime(nextSlots[0]?.horaInicio ?? "");
              }}
            >
              <option value="">Seleccionar día</option>
              {[...new Set(availability?.horarios.map((slot) => slot.diaSemana) ?? [])].map(
                (weekday) => (
                  <option key={weekday} value={weekday}>
                    {weekdays[weekday - 1]}
                  </option>
                ),
              )}
            </select>
          </label>
          <label className="text-sm font-bold">
            Hora disponible
            <select
              className={control}
              value={time}
              disabled={!daySlots.length || busy}
              onChange={(event) => setTime(event.target.value)}
            >
              <option value="">Seleccionar hora</option>
              {daySlots.map((slot) => (
                <option key={slot.horaInicio} value={slot.horaInicio}>
                  {timeText(slot.horaInicio)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {availabilityLoading && (
          <p role="status" className="mt-4 text-sm text-muted">
            Consultando disponibilidad...
          </p>
        )}
        {availability && (
          <p className="mt-4 text-sm text-muted">
            Sesiones recurrentes: {availability.reservasActivas} de {availability.horasSemanales}.{" "}
            {availability.reservasDisponibles} disponibles. Vigencia: {availability.fechaInicio} a{" "}
            {availability.fechaFin}.
          </p>
        )}
        {membershipId && availability && availability.horarios.length === 0 && (
          <p role="status" className="mt-4 text-sm text-muted">
            No hay turnos libres para todas las semanas restantes de esta membresía.
          </p>
        )}
        <div className="mt-5 flex justify-end">
          <Button
            disabled={
              busy ||
              availabilityLoading ||
              !membershipId ||
              !day ||
              !time ||
              !availability?.reservasDisponibles
            }
            onClick={createReservation}
          >
            {busy ? "Guardando..." : "Crear reserva"}
          </Button>
        </div>
      </section>

      {changeTarget && (
        <section className="mt-6 rounded-control border border-brand-start p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold">Cambiar horario</h2>
              <p className="mt-1 text-sm text-muted">
                {changeTarget.nombreCliente} · {changeTarget.periodoCambioHorarioDias} días entre
                cambios.
              </p>
            </div>
            <Button
              small
              variant="outline"
              onClick={() => {
                setChangeTarget(null);
                setChangeAvailability(null);
              }}
            >
              Cerrar
            </Button>
          </div>
          {changeAvailability && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold">
                Nuevo día
                <select
                  className={control}
                  value={changeDay}
                  onChange={(event) => {
                    setChangeDay(event.target.value);
                    const slots =
                      changeAvailability.horarios.filter(
                        (slot) => String(slot.diaSemana) === event.target.value,
                      ) ?? [];
                    setChangeTime(slots[0]?.horaInicio ?? "");
                  }}
                >
                  <option value="">Seleccionar día</option>
                  {[...new Set(changeAvailability.horarios.map((slot) => slot.diaSemana))].map(
                    (weekday) => (
                      <option key={weekday} value={weekday}>
                        {weekdays[weekday - 1]}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label className="text-sm font-bold">
                Nueva hora
                <select
                  className={control}
                  value={changeTime}
                  onChange={(event) => setChangeTime(event.target.value)}
                  disabled={!changeDaySlots.length}
                >
                  <option value="">Seleccionar hora</option>
                  {changeDaySlots.map((slot) => (
                    <option key={slot.horaInicio} value={slot.horaInicio}>
                      {timeText(slot.horaInicio)}
                    </option>
                  ))}
                </select>
              </label>
              {changeAvailability.horarios.length === 0 && (
                <p role="status" className="text-sm text-muted md:col-span-2">
                  No hay otro horario disponible para las semanas restantes.
                </p>
              )}
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <Button
              disabled={busy || !changeAvailability || !changeDay || !changeTime}
              onClick={changeSchedule}
            >
              Confirmar cambio
            </Button>
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="text-base font-bold">Reservas registradas</h2>
        {loading ? (
          <p role="status" className="py-12 text-center text-sm text-muted">
            Cargando reservas...
          </p>
        ) : reservations.length === 0 ? (
          <p
            role="status"
            className="mt-4 rounded-control border border-line p-5 text-sm text-muted"
          >
            Todavía no hay reservas en SQL Server.
          </p>
        ) : (
          <div className="mt-4 max-w-full overflow-x-auto">
            <table className="w-full min-w-[1050px] border-collapse text-left text-sm">
              <caption className="sr-only">Reservas recurrentes</caption>
              <thead className="border-b border-line">
                <tr>
                  {[
                    "Cliente / plan",
                    "Día y hora",
                    "Entrenador asignado",
                    "Vigencia",
                    "Sesiones",
                    "Cambio de horario",
                    "Acciones",
                  ].map((heading) => (
                    <th key={heading} scope="col" className="px-3 py-3 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservations.map((reservation) => {
                  const membership = memberships.find(
                    (item) => item.idMembresia === reservation.idMembresia,
                  );
                  return (
                    <tr key={reservation.idReserva} className="border-b border-line align-top">
                      <td className="px-3 py-4">
                        <div className="font-semibold">{reservation.nombreCliente}</div>
                        <div className="mt-1 text-muted">
                          {membership?.nombrePlan ?? `Membresía ${reservation.idMembresia}`}
                        </div>
                        <div className="mt-1 text-muted">
                          {reservation.estado === "Activa" ? "Activa" : "Cancelada"}
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        {weekdays[reservation.diaSemana - 1]} · {timeText(reservation.horaInicio)}
                      </td>
                      <td className="px-3 py-4">{reservation.nombreEntrenador}</td>
                      <td className="px-3 py-4">
                        {reservation.fechaInicio} – {reservation.fechaFin}
                      </td>
                      <td className="px-3 py-4">{reservation.sesionesReservadas}</td>
                      <td className="px-3 py-4">
                        {reservation.periodoCambioHorarioDias === 0
                          ? "Fijo por ciclo"
                          : reservation.puedeCambiarHorario
                            ? "Disponible"
                            : `Desde ${reservation.fechaSiguienteCambio ?? "próximo periodo"}`}
                      </td>
                      <td className="px-3 py-4">
                        {reservation.estado === "Activa" ? (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              small
                              variant="outline"
                              disabled={busy || !reservation.puedeCambiarHorario}
                              onClick={() => startChange(reservation)}
                            >
                              Cambiar
                            </Button>
                            <Button
                              small
                              variant="danger"
                              disabled={busy}
                              onClick={() => cancelReservation(reservation)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </ManagementPanel>
  );
}
