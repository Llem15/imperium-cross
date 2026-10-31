"use client";

import { useState } from "react";
import { SearchField } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  ConfirmDelete,
  DataTable,
  Details,
  ManagementPanel,
  Notice,
  RowAction,
} from "@/components/dashboard/management-ui";
import { useDemoData } from "@/features/demo/demo-provider";
import { demoDate, demoTrainerId, fullName, matchesMember } from "@/mocks/dashboard";
import { newDemoId } from "@/mocks/internal-data";
import type { Routine } from "@/mocks/internal-data";
import type { Prescription } from "@/mocks/training";

function RoutineEditor({ routine, onClose }: { routine: Routine | null; onClose: () => void }) {
  const { data, setData } = useDemoData();
  const [name, setName] = useState(routine?.name ?? "");
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(routine?.prescriptions ?? []);
  const [exerciseId, setExerciseId] = useState("");
  const [sets, setSets] = useState("4");
  const [repetitions, setRepetitions] = useState("10");
  const [rest, setRest] = useState("60");
  const [assigning, setAssigning] = useState(false);
  const [selected, setSelected] = useState(
    data.members
      .filter(
        (member) =>
          routine && member.routineId === routine.id && member.trainerId === demoTrainerId,
      )
      .map((member) => member.id),
  );
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const control =
    "min-h-10 w-full min-w-0 rounded-control border border-muted bg-white px-3 py-2 text-sm";
  function validate() {
    if (!name.trim() || !prescriptions.length) {
      setError("Escribe el nombre y agrega al menos un ejercicio.");
      return false;
    }
    return true;
  }
  function save() {
    if (!validate()) return;
    const next: Routine = {
      id: routine?.id ?? newDemoId("routine"),
      name: name.trim(),
      trainerId: demoTrainerId,
      updatedOn: demoDate,
      prescriptions,
    };
    setData((current) => ({
      ...current,
      routines: routine
        ? current.routines.map((item) => (item.id === routine.id ? next : item))
        : [...current.routines, next],
      members: assigning
        ? current.members.map((member) =>
            member.trainerId !== demoTrainerId
              ? member
              : selected.includes(member.id)
                ? { ...member, routineId: next.id }
                : member.routineId === next.id
                  ? { ...member, routineId: null }
                  : member,
          )
        : current.members,
    }));
    onClose();
  }
  return (
    <Details title={routine ? "Editar rutina" : "Creación de rutina"} onClose={onClose}>
      <p className="mb-6 text-center text-sm text-line">Crea la rutina para tus clientes</p>
      {!assigning ? (
        <>
          <label className="block text-sm font-bold">
            Rutina
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={`${control} mt-2`}
            />
          </label>
          <form
            className="mt-6"
            onSubmit={(event) => {
              event.preventDefault();
              if (
                !exerciseId ||
                ![sets, repetitions, rest].every((value) => Number.isInteger(Number(value))) ||
                Number(sets) < 1 ||
                Number(repetitions) < 1 ||
                Number(rest) < 0
              ) {
                setError("Selecciona un ejercicio y utiliza valores enteros válidos.");
                return;
              }
              setPrescriptions([
                ...prescriptions,
                {
                  id: newDemoId("prescription"),
                  exerciseId,
                  sets: Number(sets),
                  repetitions: Number(repetitions),
                  restSeconds: Number(rest),
                },
              ]);
              setError("");
            }}
          >
            <p className="mb-3 text-sm text-muted">Agregar ejercicio</p>
            <label className="block text-sm font-bold">
              Ejercicio
              <select
                value={exerciseId}
                onChange={(event) => setExerciseId(event.target.value)}
                required
                className={`${control} mt-2`}
              >
                <option value="">Seleccionar ejercicio</option>
                {data.exercises.map((exercise) => (
                  <option key={exercise.id} value={exercise.id}>
                    {exercise.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-2">
              {[
                { label: "Series", value: sets, update: setSets, min: 1 },
                { label: "Repeticiones", value: repetitions, update: setRepetitions, min: 1 },
                { label: "Descanso (s)", value: rest, update: setRest, min: 0 },
              ].map((field) => (
                <label key={field.label} className="text-[11px]">
                  {field.label}
                  <input
                    type="number"
                    min={field.min}
                    step={1}
                    required
                    value={field.value}
                    onChange={(event) => field.update(event.target.value)}
                    className={control}
                  />
                </label>
              ))}
              <Button type="submit" aria-label="Agregar ejercicio a la rutina">
                +
              </Button>
            </div>
          </form>
          <ol className="my-6 list-inside list-decimal space-y-3 text-sm">
            {prescriptions.map((item) => (
              <li key={item.id}>
                <div className="inline-flex w-[90%] items-center justify-between gap-3">
                  <span>
                    {data.exercises.find((exercise) => exercise.id === item.exerciseId)?.name}{" "}
                    <span className="text-muted">
                      {item.sets}×{item.repetitions} · {item.restSeconds}s
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Quitar bloque ${prescriptions.indexOf(item) + 1}`}
                    className="cursor-pointer px-2 text-brand-end"
                    onClick={() =>
                      setPrescriptions(prescriptions.filter((row) => row.id !== item.id))
                    }
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex gap-3">
            <Button variant="outline" onClick={save}>
              Guardar
            </Button>
            <Button
              onClick={() => {
                if (validate()) {
                  setAssigning(true);
                  setError("");
                }
              }}
            >
              Asignar
            </Button>
          </div>
        </>
      ) : (
        <>
          <h3 className="mb-4 font-bold">Rutina: {name}</h3>
          <h3 className="mb-3 font-bold">Asignar cliente</h3>
          <SearchField value={query} onChange={setQuery} />
          <div className="my-5 max-h-64 space-y-3 overflow-auto">
            {data.members
              .filter(
                (member) => member.trainerId === demoTrainerId && matchesMember(member, query),
              )
              .map((member) => (
                <label key={member.id} className="flex cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={selected.includes(member.id)}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? [...selected, member.id]
                          : selected.filter((id) => id !== member.id),
                      )
                    }
                    className="accent-brand-start"
                  />
                  {fullName(member)}
                </label>
              ))}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setAssigning(false)}>
              Regresar
            </Button>
            <Button onClick={save}>Guardar asignación</Button>
          </div>
        </>
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm text-brand-start">
          {error}
        </p>
      )}
    </Details>
  );
}

export function RoutinesManager() {
  const { data, setData } = useDemoData();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Routine | "new" | null>(null);
  const [viewing, setViewing] = useState<Routine | null>(null);
  const [deleting, setDeleting] = useState<Routine | null>(null);
  return (
    <>
      <ManagementPanel
        title="Rutinas"
        subtitle="Gestión de rutinas de entrenamiento"
        actions={
          <>
            <SearchField value={query} onChange={setQuery} label="Buscar rutina" />
            <Button small onClick={() => setEditing("new")}>
              + Nueva rutina
            </Button>
          </>
        }
      >
        <DataTable
          rows={data.routines.filter(
            (routine) =>
              routine.trainerId === demoTrainerId &&
              routine.name.toLowerCase().includes(query.toLowerCase()),
          )}
          caption="Rutinas"
          columns={[
            { label: "Rutina", render: (row) => row.name },
            { label: "Ejercicios", render: (row) => row.prescriptions.length },
            {
              label: "Clientes asignados",
              render: (row) => data.members.filter((member) => member.routineId === row.id).length,
            },
            { label: "Última edición", render: (row) => row.updatedOn },
            {
              label: "Acciones",
              render: (row) => (
                <div className="flex gap-3">
                  <RowAction
                    kind="view"
                    label={`Ver ${row.name}`}
                    onClick={() => setViewing(row)}
                  />
                  <RowAction
                    kind="edit"
                    label={`Editar ${row.name}`}
                    onClick={() => setEditing(row)}
                  />
                  <RowAction
                    kind="delete"
                    label={`Eliminar ${row.name}`}
                    onClick={() => setDeleting(row)}
                  />
                </div>
              ),
            },
          ]}
        />
      </ManagementPanel>
      {editing && (
        <RoutineEditor
          routine={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {viewing && (
        <Details title={viewing.name} onClose={() => setViewing(null)}>
          <ol className="list-inside list-decimal space-y-4 text-sm">
            {viewing.prescriptions.map((item) => (
              <li key={item.id}>
                {data.exercises.find((exercise) => exercise.id === item.exerciseId)?.name} ·{" "}
                {item.sets}×{item.repetitions} · {item.restSeconds}s
              </li>
            ))}
          </ol>
          <Notice>
            Clientes:{" "}
            {data.members
              .filter((member) => member.routineId === viewing.id)
              .map(fullName)
              .join(", ") || "Sin asignar"}
          </Notice>
          <Button
            onClick={() => {
              setEditing(viewing);
              setViewing(null);
            }}
          >
            Editar o asignar
          </Button>
        </Details>
      )}
      {deleting && (
        <ConfirmDelete
          title={deleting.name}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            setData((current) => ({
              ...current,
              routines: current.routines.filter((routine) => routine.id !== deleting.id),
              members: current.members.map((member) =>
                member.routineId === deleting.id ? { ...member, routineId: null } : member,
              ),
            }));
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}
