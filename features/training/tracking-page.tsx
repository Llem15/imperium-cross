"use client";

import { useState } from "react";
import { SearchField, StatusBadge } from "@/components/dashboard/dashboard-ui";
import {
  DataTable,
  Details,
  ManagementPanel,
  RecordForm,
  RowAction,
} from "@/components/dashboard/management-ui";
import { useDemoData } from "@/features/demo/demo-provider";
import { demoDate, demoTrainerId, fullName, matchesMember } from "@/mocks/dashboard";
import { newDemoId } from "@/mocks/internal-data";
import type { Member } from "@/mocks/internal-data";

export function TrackingPage() {
  const { data, setData } = useDemoData();
  const [query, setQuery] = useState("");
  const [viewing, setViewing] = useState<Member | null>(null);
  const [editing, setEditing] = useState<{ member: Member; noteId?: string } | null>(null);
  const latest = (id: string) =>
    data.notes
      .filter((note) => note.memberId === id)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
  const note = editing?.noteId ? data.notes.find((item) => item.id === editing.noteId) : undefined;
  return (
    <>
      <ManagementPanel
        title="Seguimiento"
        subtitle="Progreso y observaciones de tus clientes"
        actions={<SearchField value={query} onChange={setQuery} />}
      >
        <DataTable
          rows={data.members.filter(
            (member) => member.trainerId === demoTrainerId && matchesMember(member, query),
          )}
          caption="Seguimiento de clientes"
          columns={[
            { label: "Cliente", render: (row) => fullName(row) },
            {
              label: "Rutina actual",
              render: (row) =>
                data.routines.find((routine) => routine.id === row.routineId)?.name ??
                "Sin asignar",
            },
            {
              label: "Última nota",
              render: (row) => (
                <p className="max-w-48 truncate">{latest(row.id)?.text ?? "Sin notas"}</p>
              ),
            },
            { label: "Fecha", render: (row) => latest(row.id)?.date ?? "—" },
            {
              label: "Estado",
              render: (row) => (
                <StatusBadge
                  status={latest(row.id)?.date === demoDate ? "active" : "pending"}
                  label={
                    !latest(row.id)
                      ? "Sin iniciar"
                      : latest(row.id)?.date === demoDate
                        ? "Al día"
                        : "Pendiente"
                  }
                />
              ),
            },
            {
              label: "Acciones",
              render: (row) => (
                <div className="flex gap-3">
                  <RowAction
                    kind="view"
                    label={`Ver seguimiento de ${fullName(row)}`}
                    onClick={() => setViewing(row)}
                  />
                  <RowAction
                    kind="add"
                    label={`Agregar nota a ${fullName(row)}`}
                    onClick={() => setEditing({ member: row })}
                  />
                  <RowAction
                    kind="edit"
                    label={`Editar última nota de ${fullName(row)}`}
                    disabled={!latest(row.id)}
                    onClick={() => setEditing({ member: row, noteId: latest(row.id)?.id })}
                  />
                </div>
              ),
            },
          ]}
        />
      </ManagementPanel>
      {viewing && (
        <Details title={`Seguimiento de ${fullName(viewing)}`} onClose={() => setViewing(null)}>
          <ul className="space-y-5">
            {data.notes
              .filter((item) => item.memberId === viewing.id)
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((item) => (
                <li key={item.id} className="border-l-3 border-brand-end pl-3">
                  <time className="text-xs text-muted">{item.date}</time>
                  <p className="mt-2 text-sm">{item.text}</p>
                </li>
              ))}
          </ul>
          {!latest(viewing.id) && <p className="text-sm text-muted">Sin notas de seguimiento.</p>}
        </Details>
      )}
      {editing && (
        <RecordForm
          title="Seguimiento"
          subtitle={fullName(editing.member)}
          fields={[
            { name: "date", label: "Fecha", type: "date", wide: true },
            { name: "text", label: "Nota", type: "textarea", wide: true },
          ]}
          initialValues={{ date: note?.date ?? demoDate, text: note?.text ?? "" }}
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            if (values.date > demoDate) return "La fecha no puede ser posterior a la fecha actual.";
            const next = {
              id: note?.id ?? newDemoId("note"),
              memberId: editing.member.id,
              date: values.date,
              text: values.text.trim(),
            };
            setData((current) => ({
              ...current,
              notes: note
                ? current.notes.map((item) => (item.id === note.id ? next : item))
                : [next, ...current.notes],
            }));
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
