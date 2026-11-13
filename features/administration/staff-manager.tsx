"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";
import { Dialog } from "@/components/ui/dialog";
import { demoProfiles } from "@/mocks/dashboard";
import { PhotoPicker } from "@/components/dashboard/photo-picker";
import { STAFF_PHOTO_EVENT } from "@/components/dashboard/use-staff-photo";
import { SearchField, StatusBadge } from "@/components/dashboard/dashboard-ui";
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

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

type ApiStaff = {
  idUsuario: number;
  nombres: string;
  apellidos: string;
  dni: string;
  telefono: string | null;
  correo: string;
  idRol: number;
  nombreRol: string;
  estado: boolean;
  tieneFoto: boolean;
};

const roles: Record<number, string> = { 1: "Administrador", 2: "Recepción", 3: "Entrenador" };

const fields: FormField[] = [
  { name: "nombres", label: "Nombre", maxLength: 30, allowed: "letters", autoComplete: "off" },
  { name: "apellidos", label: "Apellido", maxLength: 30, allowed: "letters", autoComplete: "off" },
  {
    name: "correo",
    label: "Correo electrónico",
    type: "email",
    maxLength: 50,
    wide: true,
    autoComplete: "off",
  },
  {
    name: "rol",
    label: "Rol",
    type: "select",
    options: Object.entries(roles).map(([value, label]) => ({ value, label })),
  },
  {
    name: "estado",
    label: "Estado",
    type: "select",
    options: [
      { value: "true", label: "Activo" },
      { value: "false", label: "Inactivo" },
    ],
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
];

async function readError(response: Response, fallback: string) {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null) {
      if ("errors" in body && typeof body.errors === "object" && body.errors !== null) {
        const messages = Object.entries(body.errors)
          .filter((entry): entry is [string, string] => typeof entry[1] === "string")
          .map(([field, message]) => `${field}: ${message}`);
        if (messages.length > 0) return messages.join("; ");
      }
      if ("detail" in body && typeof body.detail === "string") return body.detail;
      if ("message" in body && typeof body.message === "string") return body.message;
    }
  } catch {}
  return fallback;
}

function StaffPhoto({
  person,
  size,
  version,
}: {
  person: ApiStaff;
  size: number;
  version: number;
}) {
  const demo = demoProfiles.find(
    (profile) => profile.name === `${person.nombres} ${person.apellidos}`,
  );
  const src = person.tieneFoto
    ? `${apiBaseUrl}/api/usuarios/${person.idUsuario}/foto?v=${version}`
    : demo
      ? `/dashboard/${demo.avatar}`
      : null;
  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="grid shrink-0 place-items-center rounded-full bg-brand-surface text-xs text-brand-start"
      style={{ width: size, height: size }}
    >
      {`${person.nombres[0] ?? ""}${person.apellidos[0] ?? ""}`.toUpperCase()}
    </span>
  );
}

export function StaffManager() {
  const [staff, setStaff] = useState<ApiStaff[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [editing, setEditing] = useState<ApiStaff | "new" | null>(null);
  const [viewing, setViewing] = useState<ApiStaff | null>(null);
  const [deactivating, setDeactivating] = useState<ApiStaff | null>(null);
  const [photo, setPhoto] = useState("");
  const [photoChanged, setPhotoChanged] = useState(false);
  const [mutationLoading, setMutationLoading] = useState(false);
  const [mutationError, setMutationError] = useState("");
  const viewTitleId = useId();

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${apiBaseUrl}/api/usuarios`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          throw new Error(`No se pudieron cargar los usuarios (HTTP ${response.status}).`);
        }
        const body: unknown = await response.json();
        if (!Array.isArray(body)) throw new Error("Respuesta inesperada del servidor.");
        setStaff(body as ApiStaff[]);
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "No se pudo cargar los usuarios.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [reload]);

  const rows = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return staff
      .filter((person) =>
        `${person.nombres} ${person.apellidos} ${person.correo}`.toLocaleLowerCase().includes(q),
      )
      .map((person) => ({ ...person, id: String(person.idUsuario) }));
  }, [staff, query]);

  async function submitStaff(values: FormValues) {
    const creating = editing === "new";
    const current = editing && editing !== "new" ? editing : null;
    if (!creating && !current) throw new Error("No se pudo identificar al usuario.");
    const response = await fetch(
      creating ? `${apiBaseUrl}/api/usuarios` : `${apiBaseUrl}/api/usuarios/${current?.idUsuario}`,
      {
        method: creating ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          nombres: values.nombres,
          apellidos: values.apellidos,
          dni: values.dni,
          telefono: values.telefono || null,
          correo: values.correo,
          idRol: Number(values.rol),
          activo: values.estado === "true",
          foto: photoChanged ? photo : undefined,
        }),
      },
    );
    if (!response.ok) {
      throw new Error(
        await readError(response, `No se pudo guardar el usuario (HTTP ${response.status}).`),
      );
    }
    setEditing(null);
    setReload((value) => value + 1);
    window.dispatchEvent(new Event(STAFF_PHOTO_EVENT));
  }

  async function deactivateUser() {
    if (!deactivating) return;
    setMutationLoading(true);
    setMutationError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/usuarios/${deactivating.idUsuario}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`No se pudo desactivar al usuario (HTTP ${response.status}).`);
      }
      setDeactivating(null);
      setReload((value) => value + 1);
    } catch (cause) {
      setMutationError(
        cause instanceof Error ? cause.message : "No se pudo desactivar al usuario.",
      );
    } finally {
      setMutationLoading(false);
    }
  }

  return (
    <>
      <ManagementPanel
        title="Usuarios"
        subtitle="Personal interno del gimnasio"
        actions={
          <>
            <SearchField value={query} onChange={setQuery} label="Buscar usuario" />
            <Button
              small
              onClick={() => {
                setPhoto("");
                setPhotoChanged(false);
                setEditing("new");
              }}
            >
              + Agregar usuario
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
            Cargando usuarios…
          </p>
        )}
        {!loading && !error && (
          <DataTable
            rows={rows}
            caption="Usuarios"
            columns={[
              {
                label: "Nombres",
                render: (row) => row.nombres,
              },
              { label: "Apellidos", render: (row) => row.apellidos },
              { label: "Correo", render: (row) => row.correo },
              { label: "Rol", render: (row) => roles[row.idRol] ?? row.nombreRol },
              {
                label: "Estado",
                render: (row) => (
                  <StatusBadge
                    status={row.estado ? "active" : "expired"}
                    label={row.estado ? "Activo" : "Inactivo"}
                  />
                ),
              },
              {
                label: "Acciones",
                render: (row) => (
                  <div className="flex gap-3">
                    <RowAction
                      kind="view"
                      label={`Ver a ${row.nombres} ${row.apellidos}`}
                      onClick={() => setViewing(row)}
                    />
                    <RowAction
                      kind="edit"
                      label={`Editar a ${row.nombres} ${row.apellidos}`}
                      onClick={() => {
                        setPhoto(
                          row.tieneFoto ? `${apiBaseUrl}/api/usuarios/${row.idUsuario}/foto` : "",
                        );
                        setPhotoChanged(false);
                        setEditing(row);
                      }}
                    />
                    {row.estado && (
                      <RowAction
                        kind="delete"
                        label={`Desactivar a ${row.nombres} ${row.apellidos}`}
                        onClick={() => {
                          setMutationError("");
                          setDeactivating(row);
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
          title={editing === "new" ? "Agregar usuario" : "Editar usuario"}
          subtitle="Personal interno del gimnasio"
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
              ? { estado: "true" }
              : {
                  nombres: editing.nombres,
                  apellidos: editing.apellidos,
                  correo: editing.correo,
                  rol: String(editing.idRol),
                  dni: editing.dni,
                  telefono: editing.telefono ?? "",
                  estado: String(editing.estado),
                }
          }
          onClose={() => setEditing(null)}
          onSubmit={submitStaff}
        />
      )}
      {viewing && (
        <Dialog
          open
          onClose={() => setViewing(null)}
          labelledBy={viewTitleId}
          className="w-90! max-w-[calc(100vw-32px)]! py-8"
        >
          <div className="mx-auto w-fit">
            <StaffPhoto person={viewing} size={96} version={reload} />
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
              <dt className="text-muted">Rol</dt>
              <dd className="mt-1">{roles[viewing.idRol] ?? viewing.nombreRol}</dd>
            </div>
            <div>
              <dt className="text-muted">Estado</dt>
              <dd className="mt-1">
                <StatusBadge
                  status={viewing.estado ? "active" : "expired"}
                  label={viewing.estado ? "Activo" : "Inactivo"}
                />
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
          <p className="text-sm text-muted">Se marcará como inactivo.</p>
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
            <Button variant="danger" disabled={mutationLoading} onClick={deactivateUser}>
              {mutationLoading ? "Desactivando…" : "Desactivar"}
            </Button>
          </div>
        </Details>
      )}
    </>
  );
}