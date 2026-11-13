"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";
import { PhotoPicker } from "@/components/dashboard/photo-picker";
import { Dialog } from "@/components/ui/dialog";
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
import { demoProfiles } from "@/mocks/dashboard";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

function demoAvatarFor(client: ApiClient) {
  return demoProfiles.find((profile) => profile.name === `${client.nombres} ${client.apellidos}`)
    ?.avatar;
}

export function ApiClientList({ mode }: { mode: "admin" | "reception" }) {
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<ApiClient | "new" | null>(null);
  const [viewing, setViewing] = useState<ApiClient | null>(null);
  const [photo, setPhoto] = useState("");
  const [photoChanged, setPhotoChanged] = useState(false);
  const viewTitleId = useId();
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
    { name: "nombres", label: "Nombre", maxLength: 30, allowed: "letters", autoComplete: "off" },
    {
      name: "apellidos",
      label: "Apellido",
      maxLength: 30,
      allowed: "letters",
      autoComplete: "off",
    },
    {
      name: "dni",
      label: "DNI",
      pattern: "[0-9]{8}",
      maxLength: 8,
      allowed: "digits",
      autoComplete: "off",
    },
    {
      name: "telefono",
      label: "Teléfono",
      pattern: "[0-9]{9}",
      maxLength: 9,
      allowed: "digits",
      autoComplete: "off",
      required: false,
    },
    {
      name: "correo",
      label: "Correo electrónico",
      type: "email",
      maxLength: 50,
      wide: true,
      autoComplete: "off",
    },
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
      foto: photoChanged ? photo : undefined,
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
      } catch {}
      throw new Error(detail);
    }

    setEditing(null);
    setReload((current) => current + 1);
  }

  const viewingStatus = viewing ? getApiMembershipStatus(viewing) : null;

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
        subtitle="Registro de clientes"
        actions={
          <>
            <SearchField
              value={query}
              onChange={setQuery}
              label="Buscar por nombre, DNI o correo"
            />
            <Button
              small
              onClick={() => {
                setPhoto("");
                setPhotoChanged(false);
                setEditing("new");
              }}
            >
              + Agregar cliente
            </Button>
          </>
        }
      >
        {error && (
          <Notice>
            {error} Vuelve a intentarlo en unos minutos.
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
            caption="Clientes registrados"
            minWidth={640}
            columns={[
              {
                label: "Cliente",
                render: (client) => (
                  <div className="leading-tight">
                    <p className="font-bold">
                      {client.nombres} {client.apellidos}
                    </p>
                  </div>
                ),
              },
              { label: "DNI", render: (client) => client.dni },
              {
                label: "Objetivo",
                render: (client) =>
                  client.objetivo ?? <span className="text-muted">Sin definir</span>,
              },
              {
                label: "Rutina / entrenador",
                render: (client) =>
                  client.nombreRutina ? (
                    <div className="leading-tight">
                      <p className="font-bold">{client.nombreRutina}</p>
                      <p className="text-caption text-muted">
                        {client.nombreEntrenador ?? "Sin entrenador"}
                      </p>
                    </div>
                  ) : (
                    <span className="text-muted">Sin asignar</span>
                  ),
              },
              {
                label: "Membresía",
                render: (client) =>
                  client.nombrePlan ? (
                    <span className="font-bold">{client.nombrePlan}</span>
                  ) : (
                    <span className="text-muted">—</span>
                  ),
              },
              {
                label: "Vence",
                render: (client) =>
                  client.fechaFinMembresia ? (
                    new Date(`${client.fechaFinMembresia}T00:00:00`).toLocaleDateString("es-PE", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                    })
                  ) : (
                    <span className="text-muted">—</span>
                  ),
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
                  <div className="flex gap-2">
                    <RowAction
                      kind="view"
                      label={`Ver a ${client.nombres} ${client.apellidos}`}
                      onClick={() => setViewing(client)}
                    />
                    <RowAction
                      kind="edit"
                      label={`Editar a ${client.nombres} ${client.apellidos}`}
                      onClick={() => {
                        setPhoto(
                          client.tieneFoto
                            ? `${apiBaseUrl}/api/clientes/${client.idCliente}/foto`
                            : "",
                        );
                        setPhotoChanged(false);
                        setEditing(client);
                      }}
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
          header={
            <PhotoPicker
              value={photo}
              onChange={(value) => {
                setPhoto(value);
                setPhotoChanged(true);
              }}
            />
          }
          compact
          hideCancel
          submitLabel={editing === "new" ? "Agregar" : "Guardar"}
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
      {viewing && viewingStatus && (
        <Dialog open onClose={() => setViewing(null)} labelledBy={viewTitleId} className="py-8">
          <div className="relative mx-auto grid size-28 place-items-center overflow-hidden rounded-full bg-dashboard-canvas text-2xl font-bold text-muted">
            {viewing.tieneFoto || demoAvatarFor(viewing) ? (
              <Image
                src={
                  viewing.tieneFoto
                    ? `${apiBaseUrl}/api/clientes/${viewing.idCliente}/foto`
                    : `/dashboard/${demoAvatarFor(viewing)}`
                }
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <span aria-hidden="true">
                {`${viewing.nombres.charAt(0)}${viewing.apellidos.charAt(0)}`.toUpperCase()}
              </span>
            )}
          </div>
          <h2
            id={viewTitleId}
            data-dialog-heading
            tabIndex={-1}
            className="mt-4 mb-5 text-center text-xl font-bold focus:outline-none"
          >
            {viewing.nombres} {viewing.apellidos}
          </h2>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-4 text-sm">
            <div className="col-span-2">
              <dt className="text-muted">Correo electrónico</dt>
              <dd className="mt-1 break-all">{viewing.correo}</dd>
            </div>
            <div>
              <dt className="text-muted">DNI</dt>
              <dd className="mt-1">{viewing.dni}</dd>
            </div>
            <div>
              <dt className="text-muted">Teléfono</dt>
              <dd className="mt-1">{viewing.telefono ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Objetivo</dt>
              <dd className="mt-1">{viewing.objetivo ?? "Sin definir"}</dd>
            </div>
            <div>
              <dt className="text-muted">Estado</dt>
              <dd className="mt-1">
                <StatusBadge status={viewingStatus.status} label={viewingStatus.label} />
              </dd>
            </div>
            <div>
              <dt className="text-muted">Membresía</dt>
              <dd className="mt-1">{viewing.nombrePlan ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Vence</dt>
              <dd className="mt-1">
                {viewing.fechaFinMembresia
                  ? new Date(`${viewing.fechaFinMembresia}T00:00:00`).toLocaleDateString("es-PE")
                  : "—"}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-muted">Rutina / entrenador</dt>
              <dd className="mt-1">
                {viewing.nombreRutina
                  ? `${viewing.nombreRutina} · ${viewing.nombreEntrenador ?? "Sin entrenador"}`
                  : "Sin asignar"}
              </dd>
            </div>
          </dl>
        </Dialog>
      )}
      {deactivating && (
        <Details
          title={`Desactivar ${deactivating.nombres} ${deactivating.apellidos}`}
          onClose={() => !mutationLoading && setDeactivating(null)}
        >
          <p className="text-sm text-muted">
            Se marcará como inactivo. No se eliminarán sus pagos ni membresías.
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
