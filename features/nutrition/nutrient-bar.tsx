// CÓDIGO DE SECCIÓN NUTRICIONAL
// FILA DE UN NUTRIENTE EN EL PANEL DE DETALLE: ETIQUETA, VALOR Y BARRA.
import { formatAmount, percentOfGoal } from "./nutrients";
import type { NutrientInfo } from "./nutrition-types";
import { ProgressTrack } from "./progress-track";

export function NutrientBar({
  info,
  value,
  goal,
}: {
  info: NutrientInfo;
  value: number | null;
  goal: number | null;
}) {
  const disabled = value === null;
  return (
    <div>
      <div
        className={`mb-2 flex items-baseline justify-between gap-3 text-sm ${disabled ? "text-muted" : "text-ink"}`}
      >
        <span>{info.label}</span>
        <span className="font-bold whitespace-nowrap">
          {disabled ? "—" : formatAmount(value)} {info.unit}
        </span>
      </div>
      <ProgressTrack
        label={info.label}
        colorClass={info.colorClass}
        percent={value !== null && goal !== null ? percentOfGoal(value, goal) : null}
      />
    </div>
  );
}
