"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchField, StatusBadge } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  DataTable,
  Details,
  ManagementPanel,
  Notice,
} from "@/components/dashboard/management-ui";
import { getApiMembershipStatus, parseApiClients } from "./client-api-model";
import type { ApiClient } from "./client-api-model";
import { parseApiAttendance, parseApiAttendances } from "./attendance-api-model";
import type { ApiAttendance } from "./attendance-api-model";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

function localDateValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fullName(client: ApiClient) {
  return `${client.nombres} ${client.apellidos}`;
}

function responseMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null) {
    const body = payload as Record<string, unknown>;
    if (typeof body.detail === "string") return body.detail;
    if (typeof body.message === "string") return body.message;
  }
  return fallback;
}

export function AttendancePage() {
  const [today, setToday] = useState("");
  const [date, setDate] = useState("");
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [attendance, setAttendance] = useState<ApiAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reload, setReload] = useState(0);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [memberId, setMemberId] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function initializeDate() {
      await Promise.resolve();
      if (controller.signal.aborted) return;
      const currentDate = localDateValue();
      setToday(currentDate);
      setDate(currentDate);
    }
    void initializeDate();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    async function loadData() {
      setLoading(true);
      setLoadError("");
      try {
        const [clientResponse, attendanceResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/clientes`, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          }),
          fetch(`${apiBaseUrl}/api/asistencias?fecha=${encodeURIComponent(date)}`, {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          }),
        ]);
        if (!clientResponse.ok) {
          throw new Error(`No se pudieron cargar los clientes (HTTP ${clientResponse.status}).`);
        }
        if (!attendanceResponse.ok) {
          throw new Error(
            `No se pudieron cargar las asistencias (HTTP ${attendanceResponse.status}).`,
          );
        }
        const [clientPayload, attendancePayload] = await Promise.all([
          clientResponse.json(),
          attendanceResponse.json(),
        ]);
        setClients(parseApiClients(clientPayload));
        setAttendance(parseApiAttendances(attendancePayload));
      } catch (cause) {
        if (controller.signal.aborted) return;
        setLoadError(cause instanceof Error ? cause.message : "No se pudieron cargar los datos.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void loadData();
    return () => controller.abort();
  }, [date, reload]);

  const selectedClient = clients.find((client) => String(client.idCliente) === memberId);
  const todayAttendances = useMemo(
    () => new Set(attendance.map((entry) => entry.idCliente)),
    [attendance],
  );
  const matchingClients = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return clients;
    return clients.filter((client) =>
      `${client.nombres} ${client.apellidos} ${client.dni}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [clients, query]);
  const duplicate = selectedClient ? todayAttendances.has(selectedClient.idCliente) : false;
  const membership = selectedClient ? getApiMembershipStatus(selectedClient, today) : null;
  const canRegister =
    Boolean(selectedClient) &&
    date === today &&
    membership?.status === "active" &&
    !duplicate &&
    !submitting;

  async function registerAttendance() {
    if (!selectedClient || !canRegister) return;
    setSubmitting(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/asistencias`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ idCliente: selectedClient.idCliente }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(
          responseMessage(payload, `No se pudo registrar la asistencia (HTTP ${response.status}).`),
        );
      }
      const savedAttendance = parseApiAttendance(await response.json());
      setAttendance((current) => [savedAttendance, ...current]);
      setNotice(`Asistencia registrada para ${fullName(selectedClient)}.`);
      setOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo registrar la asistencia.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <ManagementPanel
        title="Asistencia"
        subtitle="Registro de ingresos validado con membresías activas en SQL Server"
        actions={
          <>
            <label className="text-sm">
              Fecha
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="ml-3 rounded-control border border-muted p-2"
              />
            </label>
            <Button
              small
              onClick={() => {
                setOpen(true);
                setQuery("");
                setMemberId("");
                setError("");
              }}
            >
              + Marcar asistencia
            </Button>
          </>
        }
      >
        {notice && <Notice>{notice}</Notice>}
        {loadError && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p role="alert" className="text-sm text-red-700">
              {loadError}
            </p>
            <Button small onClick={() => setReload((value) => value + 1)}>
              Reintentar
            </Button>
          </div>
        )}
        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-muted">
            Cargando asistencias...
          </p>
        ) : !loadError ? (
          <DataTable
            rows={attendance.map((entry) => ({ ...entry, id: String(entry.idAsistencia) }))}
            caption="Registro de asistencias"
            columns={[
              { label: "Nombre", render: (row) => row.nombres },
              { label: "Apellidos", render: (row) => row.apellidos },
              { label: "Membresía", render: (row) => row.nombrePlan ?? "—" },
              { label: "Fecha", render: (row) => row.fechaHora.slice(0, 10) },
              { label: "Hora", render: (row) => row.fechaHora.slice(11, 16) },
              {
                label: "Estado",
                render: () => <StatusBadge status="active" label="Ingreso registrado" />,
              },
            ]}
          />
        ) : null}
      </ManagementPanel>
      {open && (
        <Details title="Marcar asistencia" onClose={() => setOpen(false)}>
          <p className="mb-5 text-sm text-line">Registro de ingreso · fecha de hoy: {today}</p>
          <SearchField
            value={query}
            onChange={(value) => {
              setQuery(value);
              setMemberId("");
              setError("");
            }}
            label="Buscar por nombre o DNI"
          />
          {!selectedClient && (
            <ul className="mt-4 max-h-44 overflow-auto">
              {matchingClients.map((client) => (
                <li key={client.idCliente}>
                  <button
                    type="button"
                    onClick={() => setMemberId(String(client.idCliente))}
                    className="w-full cursor-pointer border-b border-dashboard-line p-3 text-left text-sm hover:bg-brand-surface"
                  >
                    {fullName(client)} · {client.dni}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {matchingClients.length === 0 && (
            <p role="status" className="my-5 text-sm">
              No se encontraron clientes.
            </p>
          )}
          {selectedClient && membership && (
            <>
              <div className="my-5 space-y-3 rounded-media bg-dashboard-canvas p-4 text-sm">
                <h3 className="font-bold">Información del socio</h3>
                <p>Cliente: {fullName(selectedClient)}</p>
                <p>DNI: {selectedClient.dni}</p>
                <p>
                  Estado: <StatusBadge status={membership.status} label={membership.label} />
                </p>
                <p>Plan: {selectedClient.nombrePlan ?? "—"}</p>
                <p>Vencimiento: {selectedClient.fechaFinMembresia ?? "—"}</p>
              </div>
              <Notice>
                {date !== today
                  ? "Solo se pueden registrar ingresos para la fecha actual."
                  : duplicate
                    ? "Este socio ya tiene un ingreso registrado para hoy."
                    : membership.status === "active"
                      ? "Membresía vigente. Puede continuar con el registro de ingreso."
                      : membership.status === "pending"
                        ? "La membresía no está activa o el pago está pendiente."
                        : "Membresía vencida. Renueva la membresía antes de registrar el ingreso."}
              </Notice>
            </>
          )}
          {error && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {error}
            </p>
          )}
          <Button
            className="mt-5 w-full"
            disabled={!canRegister}
            onClick={() => void registerAttendance()}
          >
            {submitting ? "Registrando..." : "Confirmar asistencia"}
          </Button>
        </Details>
      )}
    </>
  );
}
