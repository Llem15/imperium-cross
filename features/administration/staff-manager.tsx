"use client";

import { useState } from "react";
import { SearchField, StatusBadge } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  ConfirmDelete,
  DataTable,
  Details,
  ManagementPanel,
  RecordForm,
  RowAction,
} from "@/components/dashboard/management-ui";
import type { FormField } from "@/components/dashboard/management-ui";
import { useDemoData } from "@/features/demo/demo-provider";
import { fullName } from "@/mocks/dashboard";
import { newDemoId } from "@/mocks/internal-data";
import type { Staff } from "@/mocks/internal-data";

const roles = { admin: "Administrador", reception: "Recepción", trainer: "Entrenador" };
const fields: FormField[] = [
  { name: "firstName", label: "Nombre" },
  { name: "lastName", label: "Apellido" },
  { name: "email", label: "Correo electrónico", type: "email", wide: true },
  {
    name: "role",
    label: "Rol",
    type: "select",
    options: Object.entries(roles).map(([value, label]) => ({ value, label })),
  },
  {
    name: "active",
    label: "Estado",
    type: "select",
    options: [
      { value: "true", label: "Activo" },
      { value: "false", label: "Inactivo" },
    ],
  },
  { name: "dni", label: "DNI", pattern: "[0-9]{8}", maxLength: 8 },
  { name: "phone", label: "Teléfono", pattern: "[0-9]{9}", maxLength: 9 },
];

export function StaffManager() {
  const { data, setData } = useDemoData();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const [viewing, setViewing] = useState<Staff | null>(null);
  const [deleting, setDeleting] = useState<Staff | null>(null);
  const rows = data.staff.filter((person) =>
    `${fullName(person)} ${person.email}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  return (
    <>
      <ManagementPanel
        title="Usuarios"
        subtitle="Personal interno del gimnasio"
        actions={
          <>
            <SearchField value={query} onChange={setQuery} label="Buscar usuario" />
            <Button small onClick={() => setEditing("new")}>
              + Agregar usuario
            </Button>
          </>
        }
      >
        <DataTable
          rows={rows}
          caption="Usuarios"
          columns={[
            { label: "Nombres", render: (row) => row.firstName },
            { label: "Apellidos", render: (row) => row.lastName },
            { label: "Correo", render: (row) => row.email },
            { label: "Rol", render: (row) => roles[row.role] },
            {
              label: "Estado",
              render: (row) => (
                <StatusBadge
                  status={row.active ? "active" : "expired"}
                  label={row.active ? "Activo" : "Inactivo"}
                />
              ),
            },
            {
              label: "Acciones",
              render: (row) => (
                <div className="flex gap-3">
                  <RowAction
                    kind="view"
                    label={`Ver a ${fullName(row)}`}
                    onClick={() => setViewing(row)}
                  />
                  <RowAction
                    kind="edit"
                    label={`Editar a ${fullName(row)}`}
                    onClick={() => setEditing(row)}
                  />
                  <RowAction
                    kind="delete"
                    label={`Eliminar a ${fullName(row)}`}
                    onClick={() => setDeleting(row)}
                  />
                </div>
              ),
            },
          ]}
        />
      </ManagementPanel>
      {editing && (
        <RecordForm
          title={editing === "new" ? "Agregar usuario" : "Editar usuario"}
          subtitle="Personal interno del gimnasio"
          fields={fields}
          initialValues={
            editing === "new"
              ? { active: "true" }
              : {
                  firstName: editing.firstName,
                  lastName: editing.lastName,
                  email: editing.email,
                  role: editing.role,
                  dni: editing.dni,
                  phone: editing.phone,
                  active: String(editing.active),
                }
          }
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            if (
              data.staff.some(
                (person) =>
                  person.id !== (editing === "new" ? "" : editing.id) &&
                  (person.email.toLowerCase() === values.email.toLowerCase() ||
                    person.dni === values.dni),
              )
            )
              return "Ya existe un usuario con ese correo o DNI.";
            const person: Staff = {
              id: editing === "new" ? newDemoId("staff") : editing.id,
              firstName: values.firstName.trim(),
              lastName: values.lastName.trim(),
              email: values.email.trim(),
              dni: values.dni,
              phone: values.phone,
              active: values.active === "true",
              role: values.role as Staff["role"],
            };
            setData((current) => ({
              ...current,
              staff:
                editing === "new"
                  ? [...current.staff, person]
                  : current.staff.map((item) => (item.id === person.id ? person : item)),
            }));
            setEditing(null);
          }}
        />
      )}
      {viewing && (
        <Details title={fullName(viewing)} onClose={() => setViewing(null)}>
          <dl className="space-y-3 text-sm">
            <div>Correo: {viewing.email}</div>
            <div>Rol: {roles[viewing.role]}</div>
            <div>DNI: {viewing.dni}</div>
            <div>Teléfono: {viewing.phone}</div>
          </dl>
          <p className="mt-5 text-caption text-muted">
            Este registro local no crea credenciales de acceso.
          </p>
        </Details>
      )}
      {deleting && (
        <ConfirmDelete
          title={fullName(deleting)}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            setData((current) => ({
              ...current,
              staff: current.staff.filter((person) => person.id !== deleting.id),
              members: current.members.map((member) =>
                member.trainerId === deleting.id
                  ? { ...member, trainerId: null, routineId: null }
                  : member,
              ),
            }));
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}
