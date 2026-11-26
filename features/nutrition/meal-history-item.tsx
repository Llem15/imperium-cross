// CÓDIGO DE SECCIÓN NUTRICIONAL
// UNA COMIDA DEL HISTORIAL; AL HACER CLIC SE SELECCIONA Y LLENA EL PANEL DE DETALLE.
import Image from "next/image";
import { formatAmount, formatMealDate, formatMealTime } from "./nutrients";
import { TrashIcon } from "./nutrition-icons";
import type { Meal } from "./nutrition-types";

export function MealHistoryItem({
  meal,
  selected,
  onSelect,
  onDelete,
}: {
  meal: Meal;
  selected: boolean;
  onSelect: (meal: Meal) => void;
  onDelete: (meal: Meal) => void;
}) {
  // SELECCIONAR Y ELIMINAR SON BOTONES HERMANOS: UN BOTÓN NO PUEDE IR DENTRO DE OTRO.
  return (
    <div
      className={`flex items-center gap-2 rounded-media border pr-2 ${
        selected
          ? "border-brand-end bg-brand-surface"
          : "border-dashboard-line bg-white hover:bg-dashboard-canvas/50"
      }`}
    >
      <button
        type="button"
        aria-pressed={selected}
        onClick={() => onSelect(meal)}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-4 rounded-media p-3 text-left"
      >
        <Image
          src={meal.imageUrl}
          alt=""
          width={56}
          height={56}
          unoptimized
          className="size-14 shrink-0 rounded-media object-cover"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{meal.dishName}</span>
          <span className="mt-1 block text-caption text-muted">
            {formatMealDate(meal.savedAt)} · {formatMealTime(meal.savedAt)}
          </span>
        </span>
        <span className="shrink-0 text-sm font-bold whitespace-nowrap">
          {formatAmount(meal.nutrients.calories)}{" "}
          <span className="font-normal text-muted">kcal</span>
        </span>
      </button>
      <button
        type="button"
        aria-label={`Eliminar ${meal.dishName}`}
        title="Eliminar"
        onClick={() => onDelete(meal)}
        className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-control text-muted hover:bg-brand-surface hover:text-brand-start"
      >
        <TrashIcon className="size-5" />
      </button>
    </div>
  );
}
