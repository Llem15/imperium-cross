"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, ManagementPanel } from "@/components/dashboard/management-ui";
import {
  parseTrainerSchedules,
  type TrainerSchedule,
  type TrainerShift,
} from "./trainer-schedule-model";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);
const weekdays = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function errorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null) {
    const body = payload as Record<string, unknown>;
    if (typeof body.detail === "string") return body.detail;
    if (typeof body.message === "string") return body.message;
  }
  return fallback;
}

export function TrainerScheduleManager() {
  const [trainers, setTrainers] = useState<TrainerSchedule[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<TrainerShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSchedules = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`${apiBaseUrl}/api/horarios/entrenadores`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(errorMessage(payload, "No se pudieron cargar los entrenadores."));
    }
    return parseTrainerSchedules(await response.json());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadSchedules(controller.signal)
      .then((loaded) => {
        if (controller.signal.aborted) return;
        setTrainers(loaded);
        setSelectedId(loaded[0]?.idEntrenador ?? null);
        setDraft(loaded[0]?.horarios ?? []);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "No se pudieron cargar los horarios.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [loadSchedules]);

  const selectedTrainer = useMemo(
    () => trainers.find((trainer) => trainer.idEntrenador === selectedId) ?? null,
    [selectedId, trainers],
  );

  function selectTrainer(trainerId: number) {
    const trainer = trainers.find((item) => item.idEntrenador === trainerId);
    setSelectedId(trainerId);
    setDraft(trainer?.horarios ?? []);
    setError("");
    setSuccess("");
  }

  function updateShift(index: number, patch: Partial<TrainerShift>) {
    setDraft((current) =>
      current.map((shift, rowIndex) => (rowIndex === index ? { ...shift, ...patch } : shift)),
    );
  }

  async function saveSchedule() {
    if (selectedId === null) return;
    if (
      draft.some(
        (shift) => !shift.horaInicio || !shift.horaFin || shift.horaInicio >= shift.horaFin,
      )
    ) {
      setError("Completa cada turno y verifica que la hora de inicio sea anterior al fin.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/horarios/entrenadores/${selectedId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ horarios: draft }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(errorMessage(payload, "No se pudo guardar el horario."));
      }
      const updated = await loadSchedules();
      setTrainers(updated);
      const saved = updated.find((trainer) => trainer.idEntrenador === selectedId);
      setDraft(saved?.horarios ?? []);
      setSuccess("Horario semanal guardado.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo guardar el horario.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ManagementPanel
      title="Horarios de entrenadores"
      subtitle="Configura turnos recurrentes de lunes a sábado. El domingo queda libre."
    >
      {error && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
          {trainers.length === 0 && !loading && (
            <Button
              small
              variant="outline"
              onClick={() => {
                setLoading(true);
                loadSchedules()
                  .then((loaded) => {
                    setTrainers(loaded);
                    setSelectedId(loaded[0]?.idEntrenador ?? null);
                    setDraft(loaded[0]?.horarios ?? []);
                    setError("");
                  })
                  .catch((cause) =>
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : "No se pudieron cargar los horarios.",
                    ),
                  )
                  .finally(() => setLoading(false));
              }}
            >
              Reintentar
            </Button>
          )}
        </div>
      )}
      {success && (
        <p role="status" className="mt-5 text-sm text-green-700">
          {success}
        </p>
      )}
      {loading ? (
        <p role="status" className="py-12 text-center text-sm text-muted">
          Cargando horarios...
        </p>
      ) : trainers.length === 0 ? (
        <p role="status" className="mt-8 rounded-control bg-brand-surface p-5 text-sm">
          No hay entrenadores activos. Registra o activa al personal con rol
          Entrenador antes de configurar sus turnos.
        </p>
      ) : (
        <section className="mt-8">
          <label className="block max-w-xl text-sm font-bold" htmlFor="trainer-select">
            Entrenador
          </label>
          <select
            id="trainer-select"
            className="mt-2 min-h-10 w-full max-w-xl rounded-control border border-muted bg-white px-3 text-sm"
            value={selectedId ?? ""}
            onChange={(event) => selectTrainer(Number(event.target.value))}
          >
            {trainers.map((trainer) => (
              <option key={trainer.idEntrenador} value={trainer.idEntrenador}>
                {trainer.nombreEntrenador}
              </option>
            ))}
          </select>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-start">
              <div>
                <h2 className="text-base font-bold">Turnos semanales</h2>
                <p className="mt-1 text-sm text-muted">
                  Añade uno o más periodos por día; cada sesión reservable durará 60 minutos.
                </p>
              </div>
              <Button
                small
                variant="outline"
                onClick={() =>
                  setDraft((current) => [...current, { diaSemana: 1, horaInicio: "", horaFin: "" }])
                }
              >
                + Agregar turno
              </Button>
            </div>

            {draft.length === 0 ? (
              <p className="rounded-control border border-line p-4 text-sm text-muted">
                No hay turnos definidos para {selectedTrainer?.nombreEntrenador}.
              </p>
            ) : (
              <div className="space-y-3">
                {draft.map((shift, index) => (
                  <div
                    key={`${index}-${shift.diaSemana}`}
                    className="grid gap-3 rounded-control border border-line p-4 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end"
                  >
                    <label className="text-sm font-bold">
                      Día
                      <select
                        className="mt-2 min-h-10 w-full rounded-control border border-muted bg-white px-3 font-normal"
                        value={shift.diaSemana}
                        onChange={(event) =>
                          updateShift(index, { diaSemana: Number(event.target.value) })
                        }
                      >
                        {weekdays.map((day, dayIndex) => (
                          <option key={day} value={dayIndex + 1}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm font-bold">
                      Desde
                      <input
                        type="time"
                        required
                        className="mt-2 min-h-10 w-full rounded-control border border-muted px-3 font-normal"
                        value={shift.horaInicio}
                        onChange={(event) => updateShift(index, { horaInicio: event.target.value })}
                      />
                    </label>
                    <label className="text-sm font-bold">
                      Hasta
                      <input
                        type="time"
                        required
                        className="mt-2 min-h-10 w-full rounded-control border border-muted px-3 font-normal"
                        value={shift.horaFin}
                        onChange={(event) => updateShift(index, { horaFin: event.target.value })}
                      />
                    </label>
                    <Button
                      variant="danger"
                      small
                      aria-label={`Eliminar turno ${index + 1}`}
                      onClick={() =>
                        setDraft((current) => current.filter((_, rowIndex) => rowIndex !== index))
                      }
                    >
                      Quitar
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button disabled={saving} onClick={saveSchedule}>
                {saving ? "Guardando..." : "Guardar horario"}
              </Button>
            </div>
          </div>
        </section>
      )}
    </ManagementPanel>
  );
}
