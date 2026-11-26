// CÓDIGO DE SECCIÓN NUTRICIONAL
// PANEL IZQUIERDO "DETALLE NUTRICIONAL"; DESACTIVADO HASTA QUE SE SELECCIONA UNA COMIDA.
import { CalorieRing } from "./calorie-ring";
import { formatMealDate, formatMealTime, macroInfo } from "./nutrients";
import { NutrientBar } from "./nutrient-bar";
import type { DailyGoals, Meal } from "./nutrition-types";

export function NutritionDetailPanel({
  meal,
  goals,
}: {
  meal: Meal | null;
  goals: DailyGoals | null;
}) {
  return (
    <section
      aria-labelledby="nutrition-detail-title"
      aria-live="polite"
      className="flex flex-col rounded-media border border-dashboard-line px-6 py-7"
    >
      <div className="text-center">
        <h2
          id="nutrition-detail-title"
          className="text-xs font-bold tracking-wide text-muted uppercase"
        >
          Detalle nutricional
        </h2>
        <p className={`mt-1 font-bold ${meal ? "text-ink" : "text-muted"}`}>
          {meal ? meal.dishName : "Ninguna comida seleccionada"}
        </p>
        {meal && (
          <p className="mt-1 text-caption text-muted">
            {formatMealDate(meal.savedAt)} · {formatMealTime(meal.savedAt)}
          </p>
        )}
      </div>

      <div className="my-7">
        <CalorieRing calories={meal?.nutrients.calories ?? null} goal={goals?.calories ?? null} />
      </div>

      <div className="space-y-4">
        {macroInfo.map((info) => (
          <NutrientBar
            key={info.key}
            info={info}
            value={meal?.nutrients[info.key] ?? null}
            goal={goals?.[info.key] ?? null}
          />
        ))}
      </div>

      {!meal && (
        <p className="mt-7 text-center text-sm text-muted">
          Los nutrientes aparecerán cuando subas y selecciones una comida.
        </p>
      )}
    </section>
  );
}
