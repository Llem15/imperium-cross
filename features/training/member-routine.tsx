"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { DashboardPanel, RoutineBadge } from "@/components/dashboard/dashboard-ui";
import { Dialog } from "@/components/ui/dialog";
import { demoMemberId } from "@/mocks/dashboard";
import { useDemoData } from "@/features/demo/demo-provider";
import type { Exercise } from "@/mocks/training";
import { parseApiClients } from "@/features/members/client-api-model";
import { exerciseGuides, levelFromSql } from "./exercise-catalog";

export function ExerciseImage({
  exercise,
  detail = false,
}: {
  exercise: Exercise;
  detail?: boolean;
}) {
  return (
    <div
      className={`relative mx-auto aspect-[108/95] overflow-hidden rounded-lg ${detail ? "w-50" : "w-27 max-w-full"}`}
    >
      {exercise.image ? (
        <div className="absolute" style={exercise.crop}>
          <Image
            src={
              exercise.image.startsWith("data:")
                ? exercise.image
                : `/dashboard/${detail ? exercise.detailImage : exercise.image}`
            }
            alt=""
            fill
            unoptimized
            sizes={detail ? "200px" : "108px"}
            className="object-fill"
          />
        </div>
      ) : (
        <span className="absolute inset-0 grid place-items-center bg-dashboard-canvas text-xs text-muted">
          Sin imagen
        </span>
      )}
    </div>
  );
}

export function LevelBadge({ level = "Medio" }: { level?: Exercise["level"] }) {
  const appearance =
    level === "Alto"
      ? "border-brand-end bg-red-100 text-brand-end"
      : level === "Bajo"
        ? "border-status-pending bg-status-pending-surface text-status-pending"
        : "border-status-info bg-status-info-surface text-status-info";
  return (
    <span
      className={`inline-flex min-w-12 items-center justify-center rounded-control border px-1.25 py-0.5 text-[10px] ${appearance}`}
    >
      {level}
    </span>
  );
}

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

type ApiClientRoutineExercise = {
  idEjercicio: number;
  nombreEjercicio: string;
  descripcionEjercicio: string | null;
  grupoMuscular: string | null;
  dificultad: string | null;
  series: number | null;
  repeticiones: number | null;
  tiempo: number | null;
  descanso: number;
};

type ApiClientRoutine = {
  idRutina: number;
  nombreRutina: string;
  nivel: string;
  objetivo: string;
  descripcionRutina: string | null;
  idEntrenador: number | null;
  nombreEntrenador: string | null;
  ejercicios: ApiClientRoutineExercise[];
};

type RoutineState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready"; routine: ApiClientRoutine };

function guideOf(exercise: ApiClientRoutineExercise) {
  return exerciseGuides[exercise.nombreEjercicio] ?? null;
}

function displayName(exercise: ApiClientRoutineExercise) {
  return guideOf(exercise)?.name ?? exercise.nombreEjercicio;
}

function levelOf(exercise: ApiClientRoutineExercise) {
  return (exercise.dificultad && levelFromSql[exercise.dificultad]) || "Medio";
}

function ExerciseGif({
  exercise,
  detail = false,
}: {
  exercise: ApiClientRoutineExercise;
  detail?: boolean;
}) {
  const guide = guideOf(exercise);
  return (
    <div
      className={`relative mx-auto aspect-square overflow-hidden rounded-lg bg-dashboard-canvas ${detail ? "w-50" : "w-27 max-w-full"}`}
    >
      {guide ? (
        <Image
          src={`/dashboard/${guide.gif}`}
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

function prescriptionLabel(exercise: ApiClientRoutineExercise) {
  if (exercise.series !== null && exercise.repeticiones !== null) {
    return `${exercise.series} x ${exercise.repeticiones}`;
  }
  if (exercise.tiempo !== null) return `${exercise.tiempo} s`;
  return "—";
}

function ExerciseDetail({ exercise }: { exercise: ApiClientRoutineExercise }) {
  const guide = guideOf(exercise);
  const parameters =
    exercise.series !== null && exercise.repeticiones !== null
      ? [
          { label: "Series", value: String(exercise.series) },
          { label: "Repeticiones", value: String(exercise.repeticiones) },
          { label: "Descanso", value: `${exercise.descanso}s` },
        ]
      : [
          { label: "Tiempo", value: `${exercise.tiempo ?? 0}s` },
          { label: "Descanso", value: `${exercise.descanso}s` },
        ];

  return (
    <div className="flex flex-col gap-2.5 pt-8">
      <ExerciseGif exercise={exercise} detail />
      <h2
        id="exercise-detail-title"
        data-dialog-heading
        tabIndex={-1}
        className="text-center text-xl font-semibold focus:outline-none"
      >
        {displayName(exercise)}
      </h2>
      <div className="text-center">
        <LevelBadge level={levelOf(exercise)} />
      </div>
      <dl
        className={`grid gap-3 max-sm:gap-2 ${parameters.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}
      >
        {parameters.map((parameter) => (
          <div
            key={parameter.label}
            className="flex min-h-14.25 flex-col-reverse items-center justify-center gap-1.25 rounded-md border border-status-info px-1.25 py-0.75"
          >
            <dt className="text-caption text-muted max-sm:text-[11px]">{parameter.label}</dt>
            <dd className="text-status-info">{parameter.value}</dd>
          </div>
        ))}
      </dl>
      {exercise.descripcionEjercicio && (
        <div>
          <h3 className="text-muted">Descripción</h3>
          <p className="mt-1.25 text-caption">{exercise.descripcionEjercicio}</p>
        </div>
      )}
      {guide && (
        <div>
          <h3 className="text-muted">Indicaciones</h3>
          <p className="mt-1.25 text-caption">{guide.instructions}</p>
        </div>
      )}
    </div>
  );
}

export function MemberRoutine() {
  const {
    data: { members },
  } = useDemoData();
  const [state, setState] = useState<RoutineState>({ status: "loading" });
  const [selectedExercise, setSelectedExercise] = useState<ApiClientRoutineExercise | null>(null);
  const member = members.find((item) => item.id === demoMemberId);
  const email = member?.email;

  useEffect(() => {
    if (!email) return;
    const controller = new AbortController();

    async function loadRoutine() {
      try {
        const clientsResponse = await fetch(`${apiBaseUrl}/api/clientes`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!clientsResponse.ok) {
          throw new Error(`No se pudo consultar al cliente (HTTP ${clientsResponse.status}).`);
        }
        const client = parseApiClients(await clientsResponse.json()).find(
          (item) => item.correo === email,
        );
        if (!client) {
          setState({ status: "empty" });
          return;
        }
        const routineResponse = await fetch(
          `${apiBaseUrl}/api/clientes/${client.idCliente}/rutina`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          },
        );
        if (routineResponse.status === 404) {
          setState({ status: "empty" });
          return;
        }
        if (!routineResponse.ok) {
          throw new Error(`No se pudo cargar la rutina (HTTP ${routineResponse.status}).`);
        }
        const routine = (await routineResponse.json()) as ApiClientRoutine;
        if (!routine || !Array.isArray(routine.ejercicios)) {
          throw new Error("La respuesta de la rutina no tiene el formato esperado.");
        }
        setState({ status: "ready", routine });
      } catch (cause) {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: cause instanceof Error ? cause.message : "No se pudo cargar tu rutina.",
        });
      }
    }

    void loadRoutine();
    return () => controller.abort();
  }, [email]);

  const current: RoutineState = email ? state : { status: "empty" };

  return (
    <>
      <DashboardPanel className="min-h-[625px]">
        <h1>Mi rutina</h1>
        <p className="mt-1.25 text-sm text-line">Tu rutina asignada</p>
        {current.status === "loading" && (
          <p role="status" className="mt-10 text-sm text-muted">
            Cargando tu rutina…
          </p>
        )}
        {current.status === "error" && (
          <p role="alert" className="mt-10 text-sm text-brand-start">
            {current.message} Verifica que el servidor esté iniciado.
          </p>
        )}
        {current.status === "empty" && (
          <p className="mt-10 text-sm text-muted">Todavía no tienes una rutina asignada.</p>
        )}
        {current.status === "ready" && (
          <div className="mt-2.5 max-w-[986px]">
            <div className="min-w-0">
              <RoutineBadge>
                {current.routine.nombreRutina} ·{" "}
                {current.routine.nivel === "Basico" ? "Básico" : current.routine.nivel}
              </RoutineBadge>
              {current.routine.nombreEntrenador && (
                <p className="mt-2.5 text-xs text-line">
                  Entrenador: {current.routine.nombreEntrenador}
                </p>
              )}
              <div className="mt-6.75 grid grid-cols-4 gap-x-6.75 gap-y-5 max-md:grid-cols-3 max-sm:grid-cols-2 max-sm:gap-3">
                {current.routine.ejercicios.map((exercise, index) => (
                  <button
                    key={`${exercise.idEjercicio}-${index}`}
                    type="button"
                    aria-label={`Ver ${displayName(exercise)}, bloque ${index + 1}`}
                    aria-haspopup="dialog"
                    onClick={() => setSelectedExercise(exercise)}
                    className="flex min-w-0 cursor-pointer flex-col items-center gap-1.75 rounded-media border border-ink p-2.5 text-center hover:bg-brand-surface"
                  >
                    <ExerciseGif exercise={exercise} />
                    <span className="flex flex-col items-center gap-1.25">
                      <span className="text-caption">{displayName(exercise)}</span>
                      <LevelBadge level={levelOf(exercise)} />
                      <span className="text-xs text-muted">{prescriptionLabel(exercise)}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DashboardPanel>
      <Dialog
        open={selectedExercise !== null}
        onClose={() => setSelectedExercise(null)}
        labelledBy="exercise-detail-title"
      >
        {selectedExercise && <ExerciseDetail exercise={selectedExercise} />}
      </Dialog>
    </>
  );
}
