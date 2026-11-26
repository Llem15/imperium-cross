// CÓDIGO DE SECCIÓN NUTRICIONAL
// BARRA DE PROGRESO HACIA LA META DIARIA; SIN DATOS SE MUESTRA SOLO LA PISTA GRIS.
export function ProgressTrack({
  percent,
  colorClass,
  label,
}: {
  percent: number | null;
  colorClass: string;
  label: string;
}) {
  if (percent === null) {
    return <div aria-hidden="true" className="h-1.5 rounded-full bg-dashboard-canvas" />;
  }
  const width = Math.min(percent, 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={width}
      className="h-1.5 overflow-hidden rounded-full bg-dashboard-canvas"
    >
      <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${width}%` }} />
    </div>
  );
}
