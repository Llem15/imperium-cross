"use client";

import Image from "next/image";
import { useState } from "react";
import { RoutineBadge, SearchField, StatusBadge } from "@/components/dashboard/dashboard-ui";
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
import { demoDate, demoTrainerId, fullName, matchesMember } from "@/mocks/dashboard";
import { membershipStatus, newDemoId } from "@/mocks/internal-data";
import type { Member } from "@/mocks/internal-data";

export function ClientList({ mode }: { mode: "admin" | "reception" | "trainer" }) {
  const { data, setData } = useDemoData();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [editing, setEditing] = useState<Member | "new" | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);
  const isTrainer = mode === "trainer";
  const available = data.members.filter(
    (member) => !isTrainer || member.trainerId === demoTrainerId,
  );
  const rows = available.filter(
    (member) => matchesMember(member, query) || (query.trim() && member.dni.includes(query.trim())),
  );
  const planName = (id: string) => data.plans.find((plan) => plan.id === id)?.name ?? "Sin plan";
  const noteFor = (id: string) =>
    data.notes
      .filter((note) => note.memberId === id)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  const fields: FormField[] = [
    { name: "firstName", label: "Nombre" },
    { name: "lastName", label: "Apellido" },
    { name: "email", label: "Correo electrónico", type: "email", wide: true },
    { name: "dni", label: "DNI", pattern: "[0-9]{8}", maxLength: 8 },
    { name: "phone", label: "Teléfono", pattern: "[0-9]{9}", maxLength: 9 },
    {
      name: "planId",
      label: "Membresía",
      type: "select",
      options: data.plans
        .filter((plan) => plan.active || (editing !== "new" && editing?.planId === plan.id))
        .map((plan) => ({ value: plan.id, label: plan.name })),
    },
    {
      name: "status",
      label: "Estado",
      type: "select",
      options: [
        { value: "active", label: "Activo" },
        { value: "pending", label: "Pendiente" },
        { value: "expired", label: "Vencida" },
      ],
    },
    { name: "expiresOn", label: "Vencimiento", type: "date", wide: true },
    { name: "objective", label: "Objetivo", wide: true },
    ...(mode === "admin"
      ? [
          {
            name: "trainerId",
            label: "Entrenador",
            type: "select" as const,
            wide: true,
            required: false,
            options: data.staff
              .filter((person) => person.role === "trainer")
              .map((person) => ({ value: person.id, label: fullName(person) })),
          },
        ]
      : []),
  ];
  return (
    <>
      <ManagementPanel
        title={isTrainer ? "Mis clientes" : "Clientes"}
        subtitle={
          isTrainer
            ? `Tienes ${available.length} clientes asignados`
            : mode === "admin"
              ? "Gestión de clientes y asignación de entrenadores"
              : "Registro de clientes"
        }
        actions={
          <>
            <SearchField value={query} onChange={setQuery} />
            {!isTrainer && (
              <Button small onClick={() => setEditing("new")}>
                + Agregar cliente
              </Button>
            )}
          </>
        }
      >
        <DataTable
          rows={rows}
          caption={isTrainer ? "Mis clientes" : "Clientes"}
          columns={[
            { label: "Nombres", render: (row) => row.firstName },
            { label: "Apellidos", render: (row) => row.lastName },
            {
              label: isTrainer ? "Rutina actual" : "Membresía",
              render: (row) =>
                isTrainer
                  ? (data.routines.find((routine) => routine.id === row.routineId)?.name ??
                    "Sin asignar")
                  : planName(row.planId),
            },
            {
              label: isTrainer ? "Último seguimiento" : "Vencimiento",
              render: (row) =>
                isTrainer ? (noteFor(row.id)?.date ?? "Sin seguimiento") : (row.expiresOn ?? "—"),
            },
            ...(!isTrainer
              ? [
                  {
                    label: "Estado",
                    render: (row: Member) => <StatusBadge status={membershipStatus(row)} />,
                  },
                ]
              : []),
            {
              label: "Acciones",
              render: (row) => (
                <div className="flex gap-3">
                  <RowAction
                    kind="view"
                    label={`Ver a ${fullName(row)}`}
                    onClick={() => setSelected(row)}
                  />
                  {!isTrainer && (
                    <RowAction
                      kind="edit"
                      label={`Editar a ${fullName(row)}`}
                      onClick={() => setEditing(row)}
                    />
                  )}
                  {mode === "admin" && (
                    <RowAction
                      kind="delete"
                      label={`Eliminar a ${fullName(row)}`}
                      onClick={() => setDeleting(row)}
                    />
                  )}
                </div>
              ),
            },
          ]}
        />
      </ManagementPanel>
      {selected && (
        <Details title={fullName(selected)} onClose={() => setSelected(null)}>
          <div className="flex flex-col items-center gap-4 text-center">
            {selected.portrait && (
              <Image
                src={`/dashboard/${selected.portrait}`}
                alt=""
                width={181}
                height={181}
                className="rounded-full"
              />
            )}
            <RoutineBadge>
              {data.routines.find((routine) => routine.id === selected.routineId)?.name ??
                "Sin rutina asignada"}
            </RoutineBadge>
            <StatusBadge status={membershipStatus(selected)} />
            <p>{selected.objective}</p>
            <p className="text-sm text-muted">{selected.email}</p>
            <p className="text-sm">
              Último seguimiento: {noteFor(selected.id)?.date ?? "Sin seguimiento"}
            </p>
          </div>
        </Details>
      )}
      {editing && (
        <RecordForm
          title={editing === "new" ? "Agregar cliente" : "Editar cliente"}
          fields={fields}
          initialValues={
            editing === "new"
              ? { status: "pending" }
              : {
                  firstName: editing.firstName,
                  lastName: editing.lastName,
                  email: editing.email,
                  dni: editing.dni,
                  phone: editing.phone,
                  planId: editing.planId,
                  status: editing.status,
                  expiresOn: editing.expiresOn ?? "",
                  trainerId: editing.trainerId ?? "",
                  objective: editing.objective,
                }
          }
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            if (
              data.members.some(
                (member) =>
                  member.id !== (editing === "new" ? "" : editing.id) &&
                  (member.dni === values.dni ||
                    member.email.toLowerCase() === values.email.toLowerCase()),
              )
            )
              return "Ya existe un cliente con ese DNI o correo.";
            const member: Member = {
              ...(editing === "new" ? {} : editing),
              id: editing === "new" ? newDemoId("member") : editing.id,
              firstName: values.firstName.trim(),
              lastName: values.lastName.trim(),
              email: values.email.trim(),
              dni: values.dni,
              phone: values.phone,
              planId: values.planId,
              status: values.status as Member["status"],
              expiresOn: values.expiresOn,
              routineId:
                editing === "new" ||
                (mode === "admin" && (values.trainerId || null) !== editing.trainerId)
                  ? null
                  : editing.routineId,
              joinedOn: editing === "new" ? demoDate : editing.joinedOn,
              objective: values.objective.trim(),
              trainerId:
                mode === "admin"
                  ? values.trainerId || null
                  : editing === "new"
                    ? null
                    : editing.trainerId,
              attendanceCode:
                editing === "new"
                  ? String(
                      Math.max(4820, ...data.members.map((item) => Number(item.attendanceCode))) +
                        1,
                    )
                  : editing.attendanceCode,
            };
            setData((current) => ({
              ...current,
              members:
                editing === "new"
                  ? [...current.members, member]
                  : current.members.map((item) => (item.id === member.id ? member : item)),
            }));
            setEditing(null);
          }}
        />
      )}
      {deleting && (
        <ConfirmDelete
          title={fullName(deleting)}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            setData((current) => ({
              ...current,
              members: current.members.filter((member) => member.id !== deleting.id),
              notes: current.notes.filter((note) => note.memberId !== deleting.id),
              payments: current.payments.filter((payment) => payment.memberId !== deleting.id),
              attendance: current.attendance.filter((entry) => entry.memberId !== deleting.id),
            }));
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}
