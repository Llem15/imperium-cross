// CÓDIGO DE SECCIÓN NUTRICIONAL
// ESTADOS DEL ANÁLISIS: "ANALIZANDO TU PLATO…" Y ERROR DE RECONOCIMIENTO.
import { Button } from "@/components/dashboard/management-ui";
import { AlertIcon } from "./nutrition-icons";

export function AnalyzingStatus() {
  return (
    <div role="status" className="flex items-center gap-4">
      <span
        aria-hidden="true"
        className="size-9 shrink-0 rounded-full border-4 border-dashboard-canvas border-t-brand-end motion-safe:animate-spin"
      />
      <div>
        <p className="text-2xl font-bold">Analizando tu plato…</p>
        <p className="mt-1 text-sm text-muted">Esto puede tardar unos segundos.</p>
      </div>
    </div>
  );
}

export function AnalysisError({
  message,
  onRetry,
  onBack,
}: {
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div role="alert" className="rounded-media border border-brand-end/40 bg-brand-surface p-6">
      <AlertIcon className="size-9 text-brand-start" />
      <p className="mt-4 text-2xl font-bold">{message}</p>
      <p className="mt-2 text-sm text-muted">
        Prueba con otra foto en la que el plato se vea completo, de cerca y con buena luz.
      </p>
      <div className="mt-6 flex flex-wrap gap-3 max-sm:flex-col">
        <Button onClick={onRetry}>Intentar con otra foto</Button>
        <Button variant="outline" onClick={onBack}>
          Volver a Nutricional
        </Button>
      </div>
    </div>
  );
}
