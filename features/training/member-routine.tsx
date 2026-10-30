"use client";

import Image from "next/image";
import { useState } from "react";
import { DashboardPanel, RoutineBadge } from "@/components/dashboard/dashboard-ui";
import { Dialog } from "@/components/ui/dialog";
import { demoMemberId, members } from "@/mocks/dashboard";
import { exercises, progressNotes, routines } from "@/mocks/training";
import type { Exercise, Prescription, ProgressNote } from "@/mocks/training";

function ExerciseImage({ exercise, detail = false }: { exercise: Exercise; detail?: boolean }) {
  return (
    <div
      className={`relative mx-auto aspect-[108/95] overflow-hidden rounded-lg ${detail ? "w-50" : "w-27 max-w-full"}`}
    >
      <div className="absolute" style={exercise.crop}>
        <Image
          src={`/dashboard/${detail ? exercise.detailImage : exercise.image}`}
          alt=""
          fill
          unoptimized={exercise.id === "exercise-bench"}
          sizes={detail ? "200px" : "108px"}
          className="object-fill"
        />
      </div>
    </div>
  );
}

function LevelBadge() {
  return (
    <span className="inline-flex min-w-12 items-center justify-center rounded-control border border-status-info bg-status-info-surface px-1.25 py-0.5 text-[10px] text-status-info">
      Medio
    </span>
  );
}

function ExerciseDetail({ prescription }: { prescription: Prescription }) {
  const exercise = exercises.find((item) => item.id === prescription.exerciseId);
  if (!exercise) return null;
  const parameters = [
    { label: "Series", value: prescription.sets },
    { label: "Repeticiones", value: prescription.repetitions },
    { label: "Descanso", value: `${prescription.restSeconds}s` },
  ];

  return (
    <div className="flex flex-col gap-2.5 pt-8">
      <ExerciseImage exercise={exercise} detail />
      <h2
        id="exercise-detail-title"
        data-dialog-heading
        tabIndex={-1}
        className="text-center text-xl font-semibold focus:outline-none"
      >
        {exercise.name}
      </h2>
      <div className="text-center">
        <LevelBadge />
      </div>
      <dl className="grid grid-cols-3 gap-3 max-sm:gap-2">
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
      <div>
        <h3 className="text-muted">Descripción</h3>
        <p className="mt-1.25 text-caption">{exercise.description}</p>
      </div>
      <div>
        <h3 className="text-muted">Indicaciones</h3>
        <p className="mt-1.25 text-caption">{exercise.instructions}</p>
      </div>
    </div>
  );
}

export function MemberRoutine() {
  const [selectedExercise, setSelectedExercise] = useState<Prescription | null>(null);
  const [selectedNote, setSelectedNote] = useState<ProgressNote | null>(null);
  const member = members.find((item) => item.id === demoMemberId);
  const routine = routines.find((item) => item.id === member?.routineId);
  const notes = progressNotes.filter((note) => note.memberId === demoMemberId);

  return (
    <>
      <DashboardPanel className="min-h-[625px]">
        <h1>Mi rutina</h1>
        <p className="mt-1.25 text-sm text-line">Tu rutina asignada</p>
        {routine ? (
          <div className="mt-2.5 grid max-w-[986px] grid-cols-[641fr_302fr] items-start gap-10.75 max-xl:grid-cols-1 max-xl:gap-8">
            <div className="min-w-0">
              <RoutineBadge>{routine.name}</RoutineBadge>
              <div className="mt-6.75 grid grid-cols-4 gap-x-6.75 gap-y-5 max-md:grid-cols-3 max-sm:grid-cols-2 max-sm:gap-3">
                {routine.prescriptions.map((prescription) => {
                  const exercise = exercises.find((item) => item.id === prescription.exerciseId);
                  if (!exercise) return null;
                  return (
                    <button
                      key={prescription.id}
                      type="button"
                      aria-label={`Ver ${exercise.name}, bloque ${prescription.id.split("-").at(-1)}`}
                      aria-haspopup="dialog"
                      onClick={() => setSelectedExercise(prescription)}
                      className="flex min-w-0 cursor-pointer flex-col items-center gap-1.75 rounded-media border border-ink p-2.5 text-center hover:bg-brand-surface"
                    >
                      <ExerciseImage exercise={exercise} />
                      <span className="flex flex-col items-center gap-1.25">
                        <span className="text-caption">{exercise.name}</span>
                        <LevelBadge />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <section
              aria-labelledby="member-progress-title"
              className="mt-0.5 min-h-[461px] min-w-0 rounded-media border border-ink px-5.5 py-7.5"
            >
              <h2 id="member-progress-title" className="text-base font-bold">
                Mi progreso
              </h2>
              <p className="mt-1.25 text-xs text-line">Registrado por tu entrenador</p>
              <ul className="mt-7.5 flex flex-col gap-3.75">
                {notes.map((note, index) => (
                  <li
                    key={note.id}
                    className={`border-l-3 pl-1.25 ${index === 0 ? "border-brand-end" : "border-line"}`}
                  >
                    <button
                      type="button"
                      aria-haspopup="dialog"
                      onClick={() => setSelectedNote(note)}
                      className="block w-full min-w-0 cursor-pointer text-left hover:text-brand-start"
                    >
                      <time dateTime={note.date} className="block text-caption text-line">
                        {note.date}
                      </time>
                      <span className="block truncate text-caption">{note.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {notes.length === 0 && (
                <p className="mt-7.5 text-sm text-muted">Todavía no tienes notas de seguimiento.</p>
              )}
            </section>
          </div>
        ) : (
          <p className="mt-10 text-sm text-muted">Todavía no tienes una rutina asignada.</p>
        )}
      </DashboardPanel>
      <Dialog
        open={selectedExercise !== null}
        onClose={() => setSelectedExercise(null)}
        labelledBy="exercise-detail-title"
      >
        {selectedExercise && <ExerciseDetail prescription={selectedExercise} />}
      </Dialog>
      <Dialog
        open={selectedNote !== null}
        onClose={() => setSelectedNote(null)}
        labelledBy="note-detail-title"
        note
        className="max-w-registration px-4.5 pt-2.5 pb-7.5"
      >
        {selectedNote && (
          <div className="mx-auto max-w-[335px] border-l-3 border-brand-end px-2.5">
            <h2
              id="note-detail-title"
              data-dialog-heading
              tabIndex={-1}
              className="font-bold focus:outline-none"
            >
              Nota
            </h2>
            <time dateTime={selectedNote.date} className="mt-1.25 block text-xs text-line">
              {selectedNote.date}
            </time>
            <p className="mt-1.25 text-caption">{selectedNote.text}</p>
          </div>
        )}
      </Dialog>
    </>
  );
}
