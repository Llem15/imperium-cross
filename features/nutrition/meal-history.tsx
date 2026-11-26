// CÓDIGO DE SECCIÓN NUTRICIONAL
// "HISTORIAL DE COMIDAS" CON FILTRO POR FECHA Y SUS ESTADOS VACÍO / SIN RESULTADOS.
import type { ReactNode } from "react";
import { Button } from "@/components/dashboard/management-ui";
import { MealHistoryItem } from "./meal-history-item";
import { PlateIcon } from "./nutrition-icons";
import type { Meal } from "./nutrition-types";

function HistoryMessage({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <span className="flex size-18 items-center justify-center rounded-full bg-dashboard-canvas text-muted">
        <PlateIcon className="size-8" />
      </span>
      <h3 className="mt-5 text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-82 text-sm text-muted">{children}</p>
      <div className="mt-5">{action}</div>
    </div>
  );
}

export function MealHistory({
  meals,
  hasMeals,
  selectedId,
  onSelect,
  onDelete,
  dateFilter,
  onDateFilterChange,
  onUpload,
}: {
  meals: Meal[] | null;
  hasMeals: boolean;
  selectedId: string | null;
  onSelect: (meal: Meal) => void;
  onDelete: (meal: Meal) => void;
  dateFilter: string;
  onDateFilterChange: (date: string) => void;
  onUpload: () => void;
}) {
  let content: ReactNode;
  if (meals === null) {
    content = (
      <p role="status" className="px-6 py-16 text-center text-sm text-muted">
        Cargando historial…
      </p>
    );
  } else if (!hasMeals) {
    content = (
      <HistoryMessage
        title="Aún no has subido comidas"
        action={
          <Button variant="outline" onClick={onUpload}>
            Subir mi primera foto
          </Button>
        }
      >
        Cuando subas la foto de un plato, aparecerá aquí con su fecha, hora y calorías.
      </HistoryMessage>
    );
  } else if (meals.length === 0) {
    content = (
      <HistoryMessage
        title="No hay comidas en esta fecha"
        action={
          <Button variant="outline" onClick={() => onDateFilterChange("")}>
            Quitar filtro
          </Button>
        }
      >
        Prueba con otra fecha o quita el filtro para ver todo tu historial.
      </HistoryMessage>
    );
  } else {
    content = (
      <ul className="space-y-3 p-3" aria-label="Comidas registradas">
        {meals.map((meal) => (
          <li key={meal.id}>
            <MealHistoryItem
              meal={meal}
              selected={meal.id === selectedId}
              onSelect={onSelect}
              onDelete={onDelete}
            />
          </li>
        ))}
      </ul>
    );
  }

  const isList = Boolean(meals?.length);
  return (
    <section aria-labelledby="meal-history-title" className="flex min-w-0 flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 id="meal-history-title" className="font-bold">
          Historial de comidas
        </h2>
        <div className="flex items-center gap-2.5">
          <label htmlFor="meal-date-filter" className="text-sm text-muted">
            Filtrar por fecha
          </label>
          <input
            id="meal-date-filter"
            type="date"
            value={dateFilter}
            onChange={(event) => onDateFilterChange(event.target.value)}
            className="min-h-10 rounded-control border border-dashboard-line bg-dashboard-canvas/60 px-3 text-sm focus:outline-2 focus:outline-brand-start"
          />
        </div>
      </div>
      <div
        className={`flex-1 rounded-media border ${isList ? "border-dashboard-line" : "flex items-center justify-center border-dashed border-line/60"}`}
      >
        {content}
      </div>
    </section>
  );
}
