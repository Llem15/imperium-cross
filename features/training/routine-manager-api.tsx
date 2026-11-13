"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchField, StatusBadge } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  DataTable,
  Details,
  ManagementPanel,
  RowAction,
} from "@/components/dashboard/management-ui";
import { parseApiExercises, parseApiRoutines } from "./routine-api-model";
import type { ApiExercise, ApiRoutine, ApiRoutineExercise } from "./routine-api-model";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);
const objectives = [
  { value: "Adaptacion", label: "Adaptación" },
  { value: "Perdida de peso", label: "Pérdida de peso" },
  { value: "Ganancia muscular", label: "Ganancia muscular" },
  { value: "Definicion", label: "Definición muscular" },
  { value: "Fuerza", label: "Fuerza" },
];
const levels = [
  { value: "Basico", label: "Básico" },
  { value: "Intermedio", label: "Intermedio" },
  { value: "Avanzado", label: "Avanzado" },
];

type RoutineDetailDraft = ApiRoutineExercise & { draftId: string };

function responseMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null) {
    const body = payload as Record<string, unknown>;
    if (typeof body.detail === "string") return body.detail;
    if (typeof body.message === "string") return body.message;
  }
  return fallback;
}

function RoutineEditor({
  routine,
  exercises,
  onClose,
  onSaved,
}: {
  routine: ApiRoutine | null;
  exercises: ApiExercise[];
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(routine?.nombreRutina ?? "");
  const [level, setLevel] = useState(routine?.nivel ?? "Basico");
  const [objective, setObjective] = useState(routine?.objetivo ?? "");
  const [description, setDescription] = useState(routine?.descripcionRutina ?? "");
  const [details, setDetails] = useState<RoutineDetailDraft[]>(
    routine?.ejercicios.map((item) => ({ ...item, draftId: `detail-${item.idDetalle}` })) ?? [],
  );
  const [exerciseId, setExerciseId] = useState("");
  const [prescriptionType, setPrescriptionType] = useState<"repetitions" | "time">("repetitions");
  const [sets, setSets] = useState("3");
  const [repetitions, setRepetitions] = useState("12");
  const [time, setTime] = useState("30");
  const [rest, setRest] = useState("60");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function addExercise(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedExerciseId = Number(exerciseId);
    const parsedSets = Number(sets);
    const parsedRepetitions = Number(repetitions);
    const parsedTime = Number(time);
    const parsedRest = Number(rest);
    if (
      !Number.isInteger(parsedExerciseId) ||
      !Number.isInteger(parsedRest) ||
      parsedRest < 0 ||
      parsedRest > 32767 ||
      (prescriptionType === "repetitions" &&
        (!Number.isInteger(parsedSets) ||
          parsedSets < 1 ||
          parsedSets > 255 ||
          !Number.isInteger(parsedRepetitions) ||
          parsedRepetitions < 1 ||
          parsedRepetitions > 32767)) ||
      (prescriptionType === "time" &&
        (!Number.isInteger(parsedTime) || parsedTime < 1 || parsedTime > 32767))
    ) {
      setError("Ingresa valores enteros dentro de los límites permitidos.");
      return;
    }
    if (details.length >= 255) {
      setError("La base admite hasta 255 ejercicios por rutina.");
      return;
    }
    const selectedExercise = exercises.find((item) => item.idEjercicio === parsedExerciseId);
    if (!selectedExercise) {
      setError("Selecciona un ejercicio activo.");
      return;
    }
    setDetails((current) => [
      ...current,
      {
        draftId: `${selectedExercise.idEjercicio}-${Date.now()}-${current.length}`,
        idDetalle: 0,
        idEjercicio: selectedExercise.idEjercicio,
        nombreEjercicio: selectedExercise.nombreEjercicio,
        series: prescriptionType === "repetitions" ? parsedSets : null,
        repeticiones: prescriptionType === "repetitions" ? parsedRepetitions : null,
        tiempo: prescriptionType === "time" ? parsedTime : null,
        descanso: parsedRest,
      },
    ]);
    setError("");
  }

  async function saveRoutine() {
    if (!name.trim() || name.trim().length > 40 || !objective || !details.length) {
      setError("Completa el nombre, objetivo y agrega al menos un ejercicio.");
      return;
    }
    if (description.trim().length > 100) {
      setError("La descripción admite hasta 100 caracteres.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        routine ? `${apiBaseUrl}/api/rutinas/${routine.idRutina}` : `${apiBaseUrl}/api/rutinas`,
        {
          method: routine ? "PUT" : "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            nombreRutina: name.trim(),
            nivel: level,
            objetivo: objective,
            descripcionRutina: description.trim() || null,
            ejercicios: details.map((item) => ({
              idEjercicio: item.idEjercicio,
              series: item.series,
              repeticiones: item.repeticiones,
              tiempo: item.tiempo,
              descanso: item.descanso,
            })),
          }),
        },
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(responseMessage(payload, "No se pudo guardar la rutina."));
      }
      onSaved(routine ? "Rutina actualizada correctamente." : "Rutina creada correctamente.");
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar la rutina.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Details title={routine ? "Editar rutina" : "Crear rutina"} onClose={onClose}>
      <div className="space-y-4">
        <label className="block text-sm font-bold">
          Nombre (máximo 40 caracteres)
          <input
            value={name}
            maxLength={40}
            onChange={(event) => setName(event.target.value)}
            className="mt-2 min-h-10 w-full rounded-control border border-muted px-3 text-sm"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm font-bold">
            Objetivo
            <select
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              className="mt-2 min-h-10 w-full rounded-control border border-muted px-2 text-sm"
            >
              <option value="">Seleccionar</option>
              {objectives.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            Nivel
            <select
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="mt-2 min-h-10 w-full rounded-control border border-muted px-2 text-sm"
            >
              {levels.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block text-sm font-bold">
          Descripción (máximo 100 caracteres)
          <textarea
            value={description}
            maxLength={100}
            rows={2}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-2 w-full rounded-control border border-muted px-3 py-2 text-sm"
          />
        </label>
        <form onSubmit={addExercise} className="space-y-3 rounded-media bg-dashboard-canvas p-3">
          <h3 className="font-bold">Agregar ejercicio</h3>
          <label className="block text-sm">
            Ejercicio
            <select
              required
              value={exerciseId}
              onChange={(event) => setExerciseId(event.target.value)}
              className="mt-2 min-h-10 w-full rounded-control border border-muted px-2"
            >
              <option value="">Seleccionar</option>
              {exercises.map((item) => (
                <option key={item.idEjercicio} value={item.idEjercicio}>
                  {item.nombreEjercicio}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Tipo de indicación
            <select
              value={prescriptionType}
              onChange={(event) =>
                setPrescriptionType(event.target.value as "repetitions" | "time")
              }
              className="mt-2 min-h-10 w-full rounded-control border border-muted px-2"
            >
              <option value="repetitions">Series y repeticiones</option>
              <option value="time">Duración en segundos</option>
            </select>
          </label>
          {prescriptionType === "repetitions" ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm">
                Series
                <input
                  type="number"
                  min={1}
                  max={255}
                  step={1}
                  value={sets}
                  onChange={(event) => setSets(event.target.value)}
                  className="mt-2 min-h-10 w-full rounded-control border border-muted px-2"
                />
              </label>
              <label className="text-sm">
                Repeticiones
                <input
                  type="number"
                  min={1}
                  max={32767}
                  step={1}
                  value={repetitions}
                  onChange={(event) => setRepetitions(event.target.value)}
                  className="mt-2 min-h-10 w-full rounded-control border border-muted px-2"
                />
              </label>
            </div>
          ) : (
            <label className="block text-sm">
              Duración (segundos)
              <input
                type="number"
                min={1}
                max={32767}
                step={1}
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="mt-2 min-h-10 w-full rounded-control border border-muted px-2"
              />
            </label>
          )}
          <label className="block text-sm">
            Descanso (segundos)
            <input
              type="number"
              min={0}
              max={32767}
              step={1}
              value={rest}
              onChange={(event) => setRest(event.target.value)}
              className="mt-2 min-h-10 w-full rounded-control border border-muted px-2"
            />
          </label>
          <Button type="submit" className="w-full">
            Agregar a la rutina
          </Button>
        </form>
        <ol className="list-inside list-decimal space-y-2 text-sm">
          {details.map((item) => (
            <li key={item.draftId} className="flex items-center justify-between gap-2">
              <span>
                {item.nombreEjercicio} ·{" "}
                {item.tiempo !== null ? `${item.tiempo} s` : `${item.series}×${item.repeticiones}`}{" "}
                · descanso {item.descanso} s
              </span>
              <button
                type="button"
                aria-label={`Quitar ${item.nombreEjercicio}`}
                onClick={() =>
                  setDetails((current) =>
                    current.filter((detail) => detail.draftId !== item.draftId),
                  )
                }
                className="px-2 text-lg text-brand-end"
              >
                ×
              </button>
            </li>
          ))}
        </ol>
        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex gap-3">
          <Button variant="outline" disabled={saving} onClick={onClose}>
            Cancelar
          </Button>
          <Button disabled={saving} onClick={() => void saveRoutine()}>
            {saving ? "Guardando..." : "Guardar rutina"}
          </Button>
        </div>
      </div>
    </Details>
  );
}

export function RoutineManagerApi() {
  const [routines, setRoutines] = useState<ApiRoutine[]>([]);
  const [exercises, setExercises] = useState<ApiExercise[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<ApiRoutine | "new" | null>(null);
  const [viewing, setViewing] = useState<ApiRoutine | null>(null);
  const [deactivating, setDeactivating] = useState<ApiRoutine | null>(null);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    const [routineResponse, exerciseResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/api/rutinas`, { signal, headers: { Accept: "application/json" } }),
      fetch(`${apiBaseUrl}/api/ejercicios`, { signal, headers: { Accept: "application/json" } }),
    ]);
    if (!routineResponse.ok || !exerciseResponse.ok) {
      throw new Error("No se pudieron cargar rutinas y ejercicios.");
    }
    const [routinePayload, exercisePayload] = await Promise.all([
      routineResponse.json(),
      exerciseResponse.json(),
    ]);
    return {
      routines: parseApiRoutines(routinePayload),
      exercises: parseApiExercises(exercisePayload),
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        const result = await loadData(controller.signal);
        if (!controller.signal.aborted) {
          setRoutines(result.routines);
          setExercises(result.exercises);
          setError("");
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "No se pudieron cargar las rutinas.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void fetchData();
    return () => controller.abort();
  }, [loadData]);

  const filteredRoutines = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return routines.filter(
      (routine) =>
        !normalizedQuery ||
        `${routine.nombreRutina} ${routine.objetivo}`.toLocaleLowerCase().includes(normalizedQuery),
    );
  }, [query, routines]);

  async function reload() {
    try {
      const result = await loadData();
      setRoutines(result.routines);
      setExercises(result.exercises);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron actualizar las rutinas.");
    }
  }

  async function deactivateRoutine() {
    if (!deactivating) return;
    const response = await fetch(`${apiBaseUrl}/api/rutinas/${deactivating.idRutina}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setError(responseMessage(payload, "No se pudo desactivar la rutina."));
      return;
    }
    setSuccess(`Se desactivó ${deactivating.nombreRutina}.`);
    setDeactivating(null);
    await reload();
  }

  return (
    <>
      <ManagementPanel
        title="Rutinas"
        subtitle="Rutinas SQL asociadas al objetivo elegido por el cliente"
        actions={
          <>
            <SearchField value={query} onChange={setQuery} label="Buscar rutina u objetivo" />
            <Button
              small
              onClick={() => {
                setSuccess("");
                setEditing("new");
              }}
            >
              + Nueva rutina
            </Button>
          </>
        }
      >
        {error && (
          <p role="alert" className="mb-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {success && (
          <p role="status" className="mb-4 text-sm text-green-700">
            {success}
          </p>
        )}
        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-muted">
            Cargando rutinas...
          </p>
        ) : !error ? (
          <DataTable
            rows={filteredRoutines.map((routine) => ({
              ...routine,
              id: String(routine.idRutina),
            }))}
            caption="Rutinas de entrenamiento"
            columns={[
              { label: "Rutina", render: (row) => row.nombreRutina },
              { label: "Objetivo", render: (row) => row.objetivo },
              { label: "Nivel", render: (row) => row.nivel },
              { label: "Ejercicios", render: (row) => row.ejercicios.length },
              { label: "Clientes", render: (row) => row.clientesAsignados.length },
              {
                label: "Estado",
                render: (row) => (
                  <StatusBadge
                    status={row.activo ? "active" : "expired"}
                    label={row.activo ? "Activa" : "Inactiva"}
                  />
                ),
              },
              {
                label: "Acciones",
                render: (row) => (
                  <div className="flex gap-3">
                    <RowAction
                      kind="view"
                      label={`Ver ${row.nombreRutina}`}
                      onClick={() => setViewing(row)}
                    />
                    {row.activo && (
                      <>
                        <RowAction
                          kind="edit"
                          label={`Editar ${row.nombreRutina}`}
                          onClick={() => setEditing(row)}
                        />
                        <RowAction
                          kind="delete"
                          label={`Desactivar ${row.nombreRutina}`}
                          onClick={() => setDeactivating(row)}
                        />
                      </>
                    )}
                  </div>
                ),
              },
            ]}
          />
        ) : null}
      </ManagementPanel>
      {editing && (
        <RoutineEditor
          routine={editing === "new" ? null : editing}
          exercises={exercises}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setSuccess(message);
            void reload();
          }}
        />
      )}
      {viewing && (
        <Details title={viewing.nombreRutina} onClose={() => setViewing(null)}>
          <p className="mb-3 text-sm">
            Objetivo: {viewing.objetivo} · Nivel: {viewing.nivel}
          </p>
          {viewing.descripcionRutina && <p className="mb-4 text-sm">{viewing.descripcionRutina}</p>}
          <ol className="list-inside list-decimal space-y-3 text-sm">
            {viewing.ejercicios.map((item) => (
              <li key={item.idDetalle}>
                {item.nombreEjercicio} ·{" "}
                {item.tiempo !== null ? `${item.tiempo} s` : `${item.series}×${item.repeticiones}`}{" "}
                · descanso {item.descanso} s
              </li>
            ))}
          </ol>
          <p className="mt-5 text-sm text-muted">
            Clientes con esta rutina: {viewing.clientesAsignados.join(", ") || "Sin asignar"}
          </p>
        </Details>
      )}
      {deactivating && (
        <Details
          title={`Desactivar ${deactivating.nombreRutina}`}
          onClose={() => setDeactivating(null)}
        >
          <p className="text-sm text-muted">
            Las asignaciones actuales se cerrarán y el sistema buscará otra rutina activa del mismo
            objetivo para cada cliente.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setDeactivating(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => void deactivateRoutine()}>
              Desactivar rutina
            </Button>
          </div>
        </Details>
      )}
    </>
  );
}
