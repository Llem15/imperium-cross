// CÓDIGO DE SECCIÓN NUTRICIONAL
// ANILLO DE CALORÍAS DEL PANEL "DETALLE NUTRICIONAL".
import { formatAmount, percentOfGoal } from "./nutrients";

const RADIUS = 72;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function CalorieRing({ calories, goal }: { calories: number | null; goal: number | null }) {
  const percent = calories !== null && goal !== null ? percentOfGoal(calories, goal) : null;
  const label = calories === null ? "Calorías: sin datos" : `${formatAmount(calories)} kcal`;

  return (
    <div role="img" aria-label={label} className="relative mx-auto size-42.5">
      <svg viewBox="0 0 170 170" aria-hidden="true" className="size-full -rotate-90">
        <circle
          cx="85"
          cy="85"
          r={RADIUS}
          fill="none"
          strokeWidth="14"
          className="stroke-dashboard-canvas"
        />
        {percent !== null && (
          <circle
            cx="85"
            cy="85"
            r={RADIUS}
            fill="none"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - Math.min(percent, 100) / 100)}
            className="stroke-brand-end"
          />
        )}
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        aria-hidden="true"
      >
        {calories === null ? (
          <span className="h-1 w-10 rounded-full bg-dashboard-line" />
        ) : (
          <span className="text-3xl font-bold">{formatAmount(calories)}</span>
        )}
        <span className={`mt-2 text-sm ${calories === null ? "text-line" : "text-muted"}`}>
          kcal
        </span>
      </div>
    </div>
  );
}
