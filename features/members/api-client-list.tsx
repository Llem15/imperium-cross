"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Button,
  DataTable,
  Details,
  ManagementPanel,
  Notice,
  RecordForm,
  RowAction,
} from "@/components/dashboard/management-ui";
import type { FormField, FormValues } from "@/components/dashboard/management-ui";
import { SearchField, StatusBadge } from "@/components/dashboard/dashboard-ui";
import { getApiMembershipStatus, parseApiClients } from "./client-api-model";
import type { ApiClient } from "./client-api-model";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

export function ApiClientList({ mode }: { mode: "admin" | "reception" }) {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<ApiClient | "new" | null>(null);
  const [deactivating, setDeactivating] = useState<ApiClient | null>(null);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [mutationError, setMutationError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadClients() {
      setLoading(true);
      setError("");
      try {
        const clientsResponse = await fetch(`${apiBaseUrl}/api/clientes`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!clientsResponse.ok) {
          throw new Error(`No se pudieron cargar los clientes (HTTP ${clientsResponse.status}).`);
        }
        setClients(parseApiClients(await clientsResponse.json()));
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error
            ? cause.message
            : "No se pudo cargar la lista de clientes desde el servidor.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadClients();
    return () => controller.abort();
  }, [reload]);

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return clients;
    return clients.filter((client) =>
      `${client.nombres} ${client.apellidos} ${client.dni} ${client.correo}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [clients, query]);

  const fields: FormField[] = [
    { name: "nombres", label: "Nombres", maxLength: 30 },
    { name: "apellidos", label: "Apellidos", maxLength: 30 },
    { name: "dni", label: "DNI", pattern: "[0-9]{8}", maxLength: 8 },
    {
      name: "telefono",
      label: "Teléfono",
      pattern: "[0-9]{9}",
      maxLength: 9,
      required: false,
    },
    { name: "correo", label: "Correo electrónico", type: "email", maxLength: 50, wide: true },
    {
      name: "objetivo",
      label: "Objetivo elegido por el cliente",
      type: "select",
      wide: true,
      options: [
        { value: "Adaptacion", label: "Adaptación" },
        { value: "Perdida de peso", label: "Pérdida de peso" },
        { value: "Ganancia muscular", label: "Ganancia muscular" },
        { value: "Definicion", label: "Definición muscular" },
        { value: "Fuerza", label: "Fuerza" },
      ],
    },
  ];

  async function submitClient(values: FormValues) {
    const creating = editing === "new";
    const currentClient = editing && typeof editing !== "string" ? editing : null;
    const clientId = currentClient?.idCliente ?? null;
    if (!creating && clientId === null) {
      throw new Error("No se pudo identificar el cliente que se está editando.");
    }
    const clientRequest = {
      nombres: values.nombres,
      apellidos: values.apellidos,
      dni: values.dni,
      telefono: values.telefono || null,
      correo: values.correo,
      fechaNacimiento: currentClient?.fechaNacimiento ?? null,
      objetivo: values.objetivo,
    };
    const response = await fetch(
      creating ? `${apiBaseUrl}/api/clientes` : `${apiBaseUrl}/api/clientes/${clientId}`,
      {
        method: creating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(clientRequest),
      },
    );
    if (!response.ok) {
      let detail = `No se pudo guardar el cliente (HTTP ${response.status}).`;
      try {
        const body: unknown = await response.json();
        if (typeof body === "object" && body !== null) {
          const message =
            "detail" in body && typeof body.detail === "string"
              ? body.detail
              : "message" in body && typeof body.message === "string"
                ? body.message
                : null;
          if (message) detail = message;
          if ("errors" in body && typeof body.errors === "object" && body.errors !== null) {
            const validationMessages = Object.entries(body.errors)
              .filter((entry): entry is [string, string] => typeof entry[1] === "string")
              .map(([field, fieldMessage]) => `${field}: ${fieldMessage}`);
            if (validationMessages.length > 0) detail = validationMessages.join("; ");
          }
        }
      } catch {
        // Keep the HTTP status message when the server does not return a problem document.
      }
      throw new Error(detail);
    }

    setEditing(null);
    setReload((current) => current + 1);
  }

  async function deactivateClient() {
    if (!deactivating) return;
    setMutationLoading(true);
    setMutationError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/clientes/${deactivating.idCliente}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`No se pudo desactivar el cliente (HTTP ${response.status}).`);
      }
      setDeactivating(null);
      setReload((current) => current + 1);
    } catch (cause) {
      setMutationError(
        cause instanceof Error ? cause.message : "No se pudo desactivar el cliente.",
      );
    } finally {
      setMutationLoading(false);
    }
  }

  return (
    <>
      <ManagementPanel
        title="Clientes"
        subtitle={
          mode === "admin"
            ? "Clientes guardados en SQL Server"
            : "Registro de clientes guardados en SQL Server"
        }
        actions={
          <>
            <SearchField
              value={query}
              onChange={setQuery}
              label="Buscar por nombre, DNI o correo"
            />
            <Button small onClick={() => setEditing("new")}>
              + Agregar cliente
            </Button>
            <button
              type="button"
              onClick={() => setReload((current) => current + 1)}
              disabled={loading}
              className="min-h-9.5 rounded-media border border-brand-end px-3 text-sm text-brand-start disabled:opacity-50"
            >
              Actualizar
            </button>
          </>
        }
      >
        {error && (
          <Notice>
            {error} Verifica que Spring Boot esté iniciado y pueda conectarse a SQL Server.
          </Notice>
        )}
        {loading && (
          <p role="status" className="mt-8 text-sm text-muted">
            Cargando clientes…
          </p>
        )}
        {!loading && !error && (
          <DataTable
            rows={rows.map((client) => ({ ...client, id: String(client.idCliente) }))}
            caption="Clientes registrados en SQL Server"
            columns={[
              { label: "Nombres", render: (client) => client.nombres },
              { label: "Apellidos", render: (client) => client.apellidos },
              { label: "DNI", render: (client) => client.dni },
              { label: "Correo", render: (client) => client.correo },
              { label: "Objetivo", render: (client) => client.objetivo ?? "Pendiente" },
              {
                label: "Rutina / entrenador",
                render: (client) =>
                  client.nombreRutina
                    ? `${client.nombreRutina} / ${client.nombreEntrenador ?? "Sin entrenador"}`
                    : "Pendiente de asignación",
              },
              {
                label: "Membresía",
                render: (client) => client.nombrePlan ?? "Sin membresía",
              },
              {
                label: "Vencimiento",
                render: (client) =>
                  client.fechaFinMembresia
                    ? new Date(`${client.fechaFinMembresia}T00:00:00`).toLocaleDateString("es-PE")
                    : "—",
              },
              {
                label: "Estado",
                render: (client) => {
                  const membership = getApiMembershipStatus(client);
                  return <StatusBadge status={membership.status} label={membership.label} />;
                },
              },
              {
                label: "Acciones",
                render: (client) => (
                  <div className="flex gap-3">
                    <RowAction
                      kind="edit"
                      label={`Editar a ${client.nombres} ${client.apellidos}`}
                      onClick={() => setEditing(client)}
                    />
                    {mode === "admin" && client.estadoCliente && client.estadoUsuario && (
                      <RowAction
                        kind="delete"
                        label={`Desactivar a ${client.nombres} ${client.apellidos}`}
                        onClick={() => {
                          setMutationError("");
                          setDeactivating(client);
                        }}
                      />
                    )}
                  </div>
                ),
              },
            ]}
          />
        )}
      </ManagementPanel>
      {editing && (
        <RecordForm
          title={editing === "new" ? "Agregar cliente" : "Editar cliente"}
          wide
          fields={fields}
          initialValues={
            editing === "new"
              ? {}
              : {
                  nombres: editing.nombres,
                  apellidos: editing.apellidos,
                  dni: editing.dni,
                  telefono: editing.telefono ?? "",
                  correo: editing.correo,
                  objetivo: editing.objetivo ?? "",
                }
          }
          onClose={() => setEditing(null)}
          onSubmit={submitClient}
        />
      )}
      {deactivating && (
        <Details
          title={`Desactivar ${deactivating.nombres} ${deactivating.apellidos}`}
          onClose={() => !mutationLoading && setDeactivating(null)}
        >
          <p className="text-sm text-muted">
            Se marcará como inactivo en la base de datos. No se eliminarán sus pagos ni membresías.
          </p>
          {mutationError && (
            <p role="alert" className="mt-4 text-sm text-brand-start">
              {mutationError}
            </p>
          )}
          <div className="mt-6 flex gap-3">
            <Button
              variant="outline"
              disabled={mutationLoading}
              onClick={() => setDeactivating(null)}
            >
              Cancelar
            </Button>
            <Button variant="danger" disabled={mutationLoading} onClick={deactivateClient}>
              {mutationLoading ? "Desactivando…" : "Desactivar"}
            </Button>
          </div>
        </Details>
      )}
    </>
  );
}
