export type ApiExercise = {
  idEjercicio: number;
  nombreEjercicio: string;
  descripcionEjercicio: string | null;
  grupoMuscular: string | null;
  dificultad: string | null;
  indicaciones?: string | null;
  tieneImagen?: boolean;
};

export type ApiRoutineExercise = {
  idDetalle: number;
  idEjercicio: number;
  nombreEjercicio: string;
  series: number | null;
  repeticiones: number | null;
  tiempo: number | null;
  descanso: number;
};

export type ApiRoutine = {
  idRutina: number;
  nombreRutina: string;
  nivel: string;
  objetivo: string;
  descripcionRutina: string | null;
  fechaCreacion: string;
  activo: boolean;
  ejercicios: ApiRoutineExercise[];
  clientesAsignados: string[];
};

function isOptionalString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isApiExercise(value: unknown): value is ApiExercise {
  if (typeof value !== "object" || value === null) return false;
  const exercise = value as Record<string, unknown>;
  return (
    Number.isInteger(exercise.idEjercicio) &&
    typeof exercise.nombreEjercicio === "string" &&
    isOptionalString(exercise.descripcionEjercicio) &&
    isOptionalString(exercise.grupoMuscular) &&
    isOptionalString(exercise.dificultad) &&
    (exercise.indicaciones === undefined || isOptionalString(exercise.indicaciones)) &&
    (exercise.tieneImagen === undefined || typeof exercise.tieneImagen === "boolean")
  );
}

function isApiRoutineExercise(value: unknown): value is ApiRoutineExercise {
  if (typeof value !== "object" || value === null) return false;
  const exercise = value as Record<string, unknown>;
  const nullablePositiveInteger = (item: unknown) =>
    item === null || (typeof item === "number" && Number.isInteger(item) && item > 0);
  const hasRepetitions =
    nullablePositiveInteger(exercise.series) &&
    nullablePositiveInteger(exercise.repeticiones) &&
    ((exercise.series !== null && exercise.repeticiones !== null && exercise.tiempo === null) ||
      (exercise.series === null &&
        exercise.repeticiones === null &&
        typeof exercise.tiempo === "number" &&
        Number.isInteger(exercise.tiempo) &&
        exercise.tiempo > 0));
  return (
    Number.isInteger(exercise.idDetalle) &&
    Number.isInteger(exercise.idEjercicio) &&
    typeof exercise.nombreEjercicio === "string" &&
    hasRepetitions &&
    typeof exercise.descanso === "number" &&
    Number.isInteger(exercise.descanso) &&
    exercise.descanso >= 0
  );
}

function isApiRoutine(value: unknown): value is ApiRoutine {
  if (typeof value !== "object" || value === null) return false;
  const routine = value as Record<string, unknown>;
  return (
    Number.isInteger(routine.idRutina) &&
    typeof routine.nombreRutina === "string" &&
    typeof routine.nivel === "string" &&
    typeof routine.objetivo === "string" &&
    isOptionalString(routine.descripcionRutina) &&
    typeof routine.fechaCreacion === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(routine.fechaCreacion) &&
    typeof routine.activo === "boolean" &&
    Array.isArray(routine.ejercicios) &&
    routine.ejercicios.every(isApiRoutineExercise) &&
    Array.isArray(routine.clientesAsignados) &&
    routine.clientesAsignados.every((client) => typeof client === "string")
  );
}

export function parseApiExercises(value: unknown): ApiExercise[] {
  if (!Array.isArray(value) || !value.every(isApiExercise)) {
    throw new Error("La respuesta de ejercicios no tiene el formato esperado.");
  }
  return value;
}

export function parseApiRoutines(value: unknown): ApiRoutine[] {
  if (!Array.isArray(value) || !value.every(isApiRoutine)) {
    throw new Error("La respuesta de rutinas no tiene el formato esperado.");
  }
  return value;
}
