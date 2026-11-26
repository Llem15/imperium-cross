"use client";

// CÓDIGO DE SECCIÓN NUTRICIONAL
// PANTALLA /socio/nutricional: ALTERNA ENTRE LA VISTA PRINCIPAL Y EL RESULTADO DEL ANÁLISIS.
import { useState } from "react";
import { DashboardPanel } from "@/components/dashboard/dashboard-ui";
import { Button, ConfirmDelete, Notice } from "@/components/dashboard/management-ui";
import { MealAnalysisView } from "./meal-analysis-view";
import { MealHistory } from "./meal-history";
import { UploadIcon } from "./nutrition-icons";
import { NutritionDetailPanel } from "./nutrition-detail-panel";
import type { Meal } from "./nutrition-types";
import { UploadMealDialog } from "./upload-meal-dialog";
import { useNutrition } from "./use-nutrition";

export function NutritionPage() {
  const nutrition = useNutrition();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState<Meal | null>(null);
  const openUpload = () => setUploadOpen(true);

  function handlePhotoSelected(file: File) {
    setUploadOpen(false);
    nutrition.analyzePhoto(file);
  }

  return (
    <>
      {nutrition.analysis.status === "idle" ? (
        <DashboardPanel className="min-h-[583px]">
          <div className="flex items-start justify-between gap-5 max-sm:flex-col">
            <div>
              <h1 className="text-2xl font-bold">Nutricional</h1>
              <p className="mt-1.25 text-sm text-muted">
                Sube una foto de tu comida y te decimos sus calorías y nutrientes.
              </p>
            </div>
            <Button onClick={openUpload} className="max-sm:w-full">
              <UploadIcon className="size-4.5" />
              Subir foto
            </Button>
          </div>

          {nutrition.notice && <Notice>{nutrition.notice}</Notice>}

          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,396px)_1fr]">
            <NutritionDetailPanel meal={nutrition.selectedMeal} goals={nutrition.goals} />
            <MealHistory
              meals={nutrition.meals}
              hasMeals={nutrition.hasMeals}
              selectedId={nutrition.selectedMeal?.id ?? null}
              onSelect={nutrition.setSelectedMeal}
              onDelete={setDeleting}
              dateFilter={nutrition.dateFilter}
              onDateFilterChange={nutrition.setDateFilter}
              onUpload={openUpload}
            />
          </div>
        </DashboardPanel>
      ) : (
        <MealAnalysisView
          state={nutrition.analysis}
          goals={nutrition.goals}
          saving={nutrition.saving}
          saveError={nutrition.saveError}
          onBack={nutrition.resetAnalysis}
          onSave={nutrition.saveAnalysis}
          onUploadAnother={openUpload}
        />
      )}
      <UploadMealDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onPhotoSelected={handlePhotoSelected}
      />
      {/* CONFIRMACIÓN ANTES DE ELIMINAR UNA COMIDA DEL HISTORIAL. */}
      {deleting && (
        <ConfirmDelete
          title={`"${deleting.dishName}"`}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            nutrition.removeMeal(deleting);
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}
