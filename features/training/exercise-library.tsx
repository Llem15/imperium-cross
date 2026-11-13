"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useState } from "react";
import { SearchField } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  CategoryFilters,
  ManagementPanel,
  RecordForm,
  Notice,
} from "@/components/dashboard/management-ui";
import { PhotoPicker } from "@/components/dashboard/photo-picker";
import { Dialog } from "@/components/ui/dialog";
import { exerciseGuides, levelFromSql } from "./exercise-catalog";
import { LevelBadge } from "./member-routine";
import { parseApiExercises } from "./routine-api-model";
import type { ApiExercise } from "./routine-api-model";
import type { FormField } from "@/components/dashboard/management-ui";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

function responseMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null) {
    const detail = (payload as Record<string, unknown>).detail;
    if (typeof detail === "string" && detail) return detail;
  }
  return fallback;
}

const exerciseFields: FormField[] = [
  { name: "nombreEjercicio", label: "Nombre", maxLength: 30, wide: true },
  { name: "grupoMuscular", label: "Grupo muscular", maxLength: 25, allowed: "letters" },
  {
    name: "dificultad",
    label: "Nivel",
    type: "select",
    options: [
      { value: "Basico", label: "Bajo" },
      { value: "Intermedio", label: "Medio" },
      { value: "Avanzado", label: "Alto" },
    ],
  },
  {
    name: "descripcionEjercicio",
    label: "Descripción",
    type: "textarea",
    maxLength: 120,
    wide: true,
    required: false,
  },
  {
    name: "indicaciones",
    label: "Indicaciones",
    type: "textarea",
    maxLength: 300,
    wide: true,
    required: false,
  },
];

function displayName(exercise: ApiExercise) {
  return exerciseGuides[exercise.nombreEjercicio]?.name ?? exercise.nombreEjercicio;
}

function levelOf(exercise: ApiExercise) {
  return (exercise.dificultad && levelFromSql[exercise.dificultad]) || "Medio";
}

function ExerciseGif({ exercise, detail = false }: { exercise: ApiExercise; detail?: boolean }) {
  const guide = exerciseGuides[exercise.nombreEjercicio];
  return (
    <div
      className={`relative mx-auto aspect-square overflow-hidden rounded-lg bg-dashboard-canvas ${detail ? "w-[min(200px,26dvh)]" : "w-27 max-w-full"}`}
    >
      {guide || exercise.tieneImagen ? (
        <Image
          src={
            guide
              ? `/dashboard/${guide.gif}`
              : `${apiBaseUrl}/api/ejercicios/${exercise.idEjercicio}/imagen`
          }
          alt=""
          fill
          unoptimized
          sizes={detail ? "200px" : "108px"}
          className="object-cover"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-xs text-muted">
          Sin imagen
        </span>
      )}
    </div>
  );
}

export function ExerciseLibrary({ canCreate = false }: { canCreate?: boolean }) {
  const [exercises, setExercises] = useState<ApiExercise[]>([]);
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [viewing, setViewing] = useState<ApiExercise | null>(null);
  const [creating, setCreating] = useState(false);
  const [photo, setPhoto] = useState("");
  const [notice, setNotice] = useState("");
  const detailTitleId = useId();

  async function createExercise(values: Record<string, string>) {
    const response = await fetch(`${apiBaseUrl}/api/ejercicios`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        nombreEjercicio: values.nombreEjercicio,
        grupoMuscular: values.grupoMuscular,
        dificultad: values.dificultad,
        descripcionEjercicio: values.descripcionEjercicio || null,
        indicaciones: values.indicaciones || null,
        imagen: photo || null,
      }),
    });
    if (!response.ok) {
      const payload: unknown = await response.json().catch(() => null);
      throw new Error(
        responseMessage(payload, `No se pudo crear el ejercicio (HTTP ${response.status}).`),
      );
    }
    setCreating(false);
    setNotice("Ejercicio creado.");
    setReload((current) => current + 1);
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadExercises() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${apiBaseUrl}/api/ejercicios`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          throw new Error(`No se pudieron cargar los ejercicios (HTTP ${response.status}).`);
        }
        setExercises(parseApiExercises(await response.json()));
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(
          cause instanceof Error ? cause.message : "No se pudo cargar la biblioteca de ejercicios.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadExercises();
    return () => controller.abort();
  }, [reload]);

  const groups = useMemo(() => {
    const unique = new Set<string>();
    exercises.forEach((exercise) => {
      if (exercise.grupoMuscular) unique.add(exercise.grupoMuscular);
    });
    return [...Array.from(unique).sort((a, b) => a.localeCompare(b, "es"))];
  }, [exercises]);

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return exercises.filter(
      (exercise) =>
        (group === "Todos" || exercise.grupoMuscular === group) &&
        `${displayName(exercise)} ${exercise.nombreEjercicio}`
          .toLocaleLowerCase()
          .includes(normalizedQuery),
    );
  }, [exercises, group, query]);

  const rank = (level: string) => (level === "Bajo" ? 0 : level === "Medio" ? 1 : 2);
  const ordered = [...rows].sort(
    (a, b) =>
      rank(levelOf(a)) - rank(levelOf(b)) || displayName(a).localeCompare(displayName(b), "es"),
  );
  const viewingGuide = viewing ? exerciseGuides[viewing.nombreEjercicio] : undefined;

  return (
    <>
      <ManagementPanel
        title="Ejercicios"
        subtitle="Biblioteca de ejercicios"
        actions={
          canCreate ? (
            <Button
              small
              onClick={() => {
                setNotice("");
                setPhoto("");
                setCreating(true);
              }}
            >
              + Nuevo ejercicio
            </Button>
          ) : undefined
        }
      >
        {error && (
          <Notice>
            {error} Vuelve a intentarlo en unos minutos.
          </Notice>
        )}
        {notice && <Notice>{notice}</Notice>}
        {loading && (
          <p role="status" className="mt-8 text-sm text-muted">
            Cargando ejercicios…
          </p>
        )}
        {!loading && !error && (
          <>
            <div className="mt-5">
              <SearchField value={query} onChange={setQuery} label="Buscar ejercicios" />
              <CategoryFilters options={groups} value={group} onChange={setGroup} />
            </div>
            <div className="grid grid-cols-6 gap-x-6 gap-y-5 max-xl:grid-cols-4 max-md:grid-cols-3 max-sm:grid-cols-2">
              {ordered.map((exercise) => (
                <button
                  key={exercise.idEjercicio}
                  type="button"
                  aria-label={`Ver ${displayName(exercise)}`}
                  onClick={() => setViewing(exercise)}
                  className="flex min-w-0 cursor-pointer flex-col items-center gap-2 rounded-media border border-ink p-2.5 text-center hover:bg-brand-surface"
                >
                  <ExerciseGif exercise={exercise} />
                  <span className="flex min-h-10 items-center justify-center text-caption">
                    {displayName(exercise)}
                  </span>
                  <LevelBadge level={levelOf(exercise)} />
                </button>
              ))}
            </div>
            {rows.length === 0 && (
              <p role="status" className="py-10 text-sm text-muted">
                No se encontraron ejercicios.
              </p>
            )}
          </>
        )}
      </ManagementPanel>
      {creating && (
        <RecordForm
          title="Agregar ejercicio"
          header={<PhotoPicker value={photo} onChange={setPhoto} />}
          fields={exerciseFields}
          initialValues={{}}
          submitLabel="Agregar"
          onClose={() => setCreating(false)}
          onSubmit={createExercise}
        />
      )}
      {viewing && (
        <Dialog open onClose={() => setViewing(null)} labelledBy={detailTitleId} className="py-8">
          <ExerciseGif exercise={viewing} detail />
          <h2
            id={detailTitleId}
            data-dialog-heading
            tabIndex={-1}
            className="mt-4 mb-4 text-center text-xl font-bold focus:outline-none"
          >
            {displayName(viewing)}
          </h2>
          <div className="grid grid-cols-2 gap-x-3 text-sm">
            <div>
              <h3 className="text-muted">Grupo muscular</h3>
              <p className="mt-2">{viewing.grupoMuscular ?? "—"}</p>
            </div>
            <div>
              <h3 className="text-muted">Nivel</h3>
              <p className="mt-2">
                <LevelBadge level={levelOf(viewing)} />
              </p>
            </div>
          </div>
          {viewing.descripcionEjercicio && (
            <>
              <h3 className="mt-4 text-muted">Descripción</h3>
              <p className="mt-2 text-sm">{viewing.descripcionEjercicio}</p>
            </>
          )}
          {!viewingGuide && viewing.indicaciones && (
            <>
              <h3 className="mt-5 text-muted">Indicaciones</h3>
              <p className="mt-2 text-sm">{viewing.indicaciones}</p>
            </>
          )}
          {viewingGuide && (
            <>
              <h3 className="mt-5 text-muted">Indicaciones</h3>
              <p className="mt-2 text-sm">{viewingGuide.instructions}</p>
            </>
          )}
        </Dialog>
      )}
    </>
  );
}
