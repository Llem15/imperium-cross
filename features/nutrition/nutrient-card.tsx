// CÓDIGO DE SECCIÓN NUTRICIONAL
// TARJETA DE UN NUTRIENTE EN LA VISTA DE RESULTADO, CON SU % DE LA META DIARIA.
import { formatAmount, percentOfGoal } from "./nutrients";
import type { NutrientInfo } from "./nutrition-types";
import { ProgressTrack } from "./progress-track";

export function NutrientCard({
  info,
  value,
  goal,
}: {
  info: NutrientInfo;
  value: number | null;
  goal: number | null;
}) {
  const percent = value !== null && goal !== null ? percentOfGoal(value, goal) : null;
  return (
    <div className="flex flex-col rounded-media border border-dashboard-line p-4">
      <p className="flex items-start gap-2 text-sm font-bold">
        <span
          aria-hidden="true"
          className={`mt-1.25 size-2 shrink-0 rounded-full ${info.colorClass}`}
        />
        {info.label}
      </p>
      <p className="mt-3 mb-3 text-sm text-muted">
        {value === null ? (
          <>
            <span
              aria-hidden="true"
              className="mr-1 inline-block h-0.75 w-6 rounded-full bg-line align-middle"
            />
            <span className="sr-only">Sin datos</span>
          </>
        ) : (
          <span className="mr-1 text-xl font-bold text-ink">{formatAmount(value)}</span>
        )}
        {info.unit}
      </p>
      <div className="mt-auto">
        <ProgressTrack percent={percent} colorClass={info.colorClass} label={info.label} />
      </div>
    </div>
  );
}
