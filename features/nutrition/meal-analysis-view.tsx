"use client";

// CÓDIGO DE SECCIÓN NUTRICIONAL
// VISTA "ANÁLISIS DE COMIDA": FOTO, TARJETAS, INGREDIENTES Y ACCIONES (CARGANDO / ÉXITO / ERROR).
import Image from "next/image";
import { useEffect, useRef } from "react";
import { DashboardPanel } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/dashboard/management-ui";
import { AnalysisError, AnalyzingStatus } from "./analysis-status";
import { IngredientsTable } from "./ingredients-table";
import { formatMealTime, nutrientInfo } from "./nutrients";
import { NutrientCard } from "./nutrient-card";
import { BulbIcon, ChevronLeftIcon, ImageIcon } from "./nutrition-icons";
import type { AnalysisState, DailyGoals } from "./nutrition-types";

export function MealAnalysisView({
  state,
  goals,
  saving,
  saveError,
  onBack,
  onSave,
  onUploadAnother,
}: {
  state: Exclude<AnalysisState, { status: "idle" }>;
  goals: DailyGoals | null;
  saving: boolean;
  saveError: string;
  onBack: () => void;
  onSave: () => void;
  onUploadAnother: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const analysis = state.status === "success" ? state.analysis : null;
  const imageUrl = state.status === "success" ? state.analysis.imageUrl : state.previewUrl;

  // AL ENTRAR A LA VISTA, EL FOCO VA AL TÍTULO PARA LECTORES DE PANTALLA.
  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <DashboardPanel>
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        Análisis de comida
      </h1>
      <nav aria-label="Ruta de navegación">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <button
              type="button"
              onClick={onBack}
              className="flex cursor-pointer items-center gap-1.5 font-bold hover:underline"
            >
              <ChevronLeftIcon className="size-4" />
              Nutricional
            </button>
          </li>
          <li aria-hidden="true" className="text-line">
            /
          </li>
          <li aria-current="page" className="text-muted">
            Análisis de comida
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,412px)_1fr]">
        <div className="space-y-4">
          <div className="relative flex aspect-[412/280] items-center justify-center overflow-hidden rounded-media border border-dashed border-line/60 bg-dashboard-canvas/50">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt={analysis ? `Foto de ${analysis.dishName}` : "Foto del plato subido"}
                fill
                unoptimized
                sizes="(min-width: 1024px) 412px, 100vw"
                className="object-cover"
              />
            ) : (
              <span className="flex flex-col items-center gap-3 text-sm text-muted">
                <ImageIcon className="size-8" />
                Foto del plato
              </span>
            )}
          </div>
          {state.status !== "error" && (
            <IngredientsTable ingredients={analysis?.ingredients ?? null} />
          )}
        </div>

        <div className="min-w-0">
          {state.status === "error" ? (
            <AnalysisError message={state.message} onRetry={onUploadAnother} onBack={onBack} />
          ) : (
            <>
              {analysis ? (
                <>
                  <h2 className="text-2xl font-bold">{analysis.dishName}</h2>
                  <p className="mt-1 text-muted">
                    {analysis.portion} · {formatMealTime(analysis.analyzedAt)}
                  </p>
                </>
              ) : (
                <AnalyzingStatus />
              )}

              <h3 className="mt-6 mb-3 font-bold">Información nutricional</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-busy={!analysis}>
                {nutrientInfo.map((info) => (
                  <NutrientCard
                    key={info.key}
                    info={info}
                    value={analysis?.nutrients[info.key] ?? null}
                    goal={goals?.[info.key] ?? null}
                  />
                ))}
              </div>

              {analysis && (
                <>
                  <p className="mt-5 flex gap-3 rounded-media border border-dashed border-brand-end/40 px-5 py-4 text-sm">
                    <BulbIcon className="size-5 shrink-0 text-brand-start" />
                    {analysis.tip}
                  </p>
                  {saveError && (
                    <p role="alert" className="mt-4 text-caption text-brand-start">
                      {saveError}
                    </p>
                  )}
                  <div className="mt-5 grid gap-3 sm:grid-cols-[1.4fr_1fr]">
                    <Button onClick={onSave} disabled={saving} className="min-h-12 text-base">
                      {saving ? "Guardando…" : "Guardar en mi día"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={onUploadAnother}
                      disabled={saving}
                      className="min-h-12 text-base"
                    >
                      Subir otra foto
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardPanel>
  );
}
