"use client";

import { useState } from "react";
import { SearchField } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  CategoryFilters,
  Details,
  ManagementPanel,
  RecordForm,
} from "@/components/dashboard/management-ui";
import { useDemoData } from "@/features/demo/demo-provider";
import { ExerciseImage, LevelBadge } from "./member-routine";
import { exerciseCategories, newDemoId } from "@/mocks/internal-data";
import type { TrainingExercise } from "@/mocks/internal-data";

export function ExerciseLibrary() {
  const { data, setData } = useDemoData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [viewing, setViewing] = useState<TrainingExercise | null>(null);
  const [editing, setEditing] = useState<TrainingExercise | "new" | null>(null);
  const rows = data.exercises.filter(
    (exercise) =>
      (category === "Todos" || exercise.category === category) &&
      exercise.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <ManagementPanel
        title="Ejercicios"
        subtitle="Biblioteca de ejercicios"
        actions={
          <Button small onClick={() => setEditing("new")}>
            + Nuevo ejercicio
          </Button>
        }
      >
        <div className="mt-5">
          <SearchField value={query} onChange={setQuery} label="Buscar ejercicios" />
          <CategoryFilters options={exerciseCategories} value={category} onChange={setCategory} />
        </div>
        <div className="grid grid-cols-6 gap-x-6 gap-y-5 max-xl:grid-cols-4 max-md:grid-cols-3 max-sm:grid-cols-2">
          {rows.map((exercise) => (
            <button
              key={exercise.id}
              type="button"
              aria-label={`Ver ${exercise.name}`}
              onClick={() => setViewing(exercise)}
              className="flex min-w-0 cursor-pointer flex-col items-center gap-2 rounded-media border border-ink p-2.5 text-center hover:bg-brand-surface"
            >
              <ExerciseImage exercise={exercise} />
              <span className="text-caption">{exercise.name}</span>
              <LevelBadge level={exercise.level} />
            </button>
          ))}
        </div>
        {rows.length === 0 && (
          <p role="status" className="py-10 text-sm text-muted">
            No se encontraron ejercicios.
          </p>
        )}
      </ManagementPanel>
      {viewing && (
        <Details title={viewing.name} onClose={() => setViewing(null)}>
          <ExerciseImage exercise={viewing} detail />
          <p className="mt-4 text-center text-sm">
            {viewing.muscleGroup} · <LevelBadge level={viewing.level} />
          </p>
          <h3 className="mt-6 text-muted">Descripción</h3>
          <p className="mt-2 text-sm">{viewing.description}</p>
          <h3 className="mt-5 text-muted">Indicaciones</h3>
          <p className="mt-2 text-sm">{viewing.instructions}</p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setViewing(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                setEditing(viewing);
                setViewing(null);
              }}
            >
              Editar
            </Button>
          </div>
        </Details>
      )}
      {editing && (
        <RecordForm
          title={editing === "new" ? "Crear ejercicio" : "Editar ejercicio"}
          fields={[
            {
              name: "image",
              label: "Imagen del ejercicio",
              type: "image",
              wide: true,
              required: false,
            },
            { name: "name", label: "Nombre", wide: true },
            { name: "muscleGroup", label: "Grupo muscular" },
            {
              name: "level",
              label: "Nivel",
              type: "select",
              options: ["Bajo", "Medio", "Alta"].map((value) => ({ value, label: value })),
            },
            {
              name: "category",
              label: "Categoría",
              type: "select",
              wide: true,
              options: exerciseCategories.map((value) => ({ value, label: value })),
            },
            { name: "description", label: "Descripción", type: "textarea", wide: true },
            { name: "instructions", label: "Indicaciones", type: "textarea", wide: true },
          ]}
          initialValues={
            editing === "new"
              ? {}
              : {
                  name: editing.name,
                  image: editing.image,
                  muscleGroup: editing.muscleGroup,
                  level: editing.level,
                  category: editing.category,
                  description: editing.description,
                  instructions: editing.instructions,
                }
          }
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            const exercise: TrainingExercise = {
              id: editing === "new" ? newDemoId("exercise") : editing.id,
              name: values.name.trim(),
              muscleGroup: values.muscleGroup.trim(),
              level: values.level as TrainingExercise["level"],
              category: values.category,
              description: values.description.trim(),
              instructions: values.instructions.trim(),
              image: values.image ?? "",
              detailImage: values.image ?? "",
              crop:
                editing === "new" || values.image?.startsWith("data:")
                  ? { width: "100%", height: "100%", top: "0%", left: "0%" }
                  : editing.crop,
            };
            setData((current) => ({
              ...current,
              exercises:
                editing === "new"
                  ? [...current.exercises, exercise]
                  : current.exercises.map((item) => (item.id === exercise.id ? exercise : item)),
            }));
            setEditing(null);
          }}
        />
      )}
    </>
  );
}
