"use client";

// CÓDIGO DE SECCIÓN NUTRICIONAL
// ESTADO DE LA PANTALLA: HISTORIAL, FILTRO, COMIDA SELECCIONADA Y ANÁLISIS EN CURSO.
import { useEffect, useRef, useState } from "react";
import {
  analyzeMealPhoto,
  deleteMeal,
  getDailyGoals,
  getMeals,
  MealNotRecognizedError,
  saveMeal,
} from "./nutrition-api";
import type { AnalysisState, DailyGoals, Meal } from "./nutrition-types";

function releasePreview(state: AnalysisState) {
  if (state.status === "analyzing" || state.status === "error") {
    URL.revokeObjectURL(state.previewUrl);
  }
}

export function useNutrition() {
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [hasMeals, setHasMeals] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [historyVersion, setHistoryVersion] = useState(0);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [goals, setGoals] = useState<DailyGoals | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: "idle" });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  // IDENTIFICA EL ANÁLISIS VIGENTE PARA DESCARTAR RESPUESTAS QUE LLEGUEN TARDE.
  const requestRef = useRef(0);

  useEffect(() => {
    let ignore = false;
    getDailyGoals().then((result) => {
      if (!ignore) setGoals(result);
    });
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    getMeals(dateFilter || undefined).then((result) => {
      if (ignore) return;
      setMeals(result);
      if (!dateFilter) setHasMeals(result.length > 0);
    });
    return () => {
      ignore = true;
    };
  }, [dateFilter, historyVersion]);

  async function analyzePhoto(file: File) {
    const request = ++requestRef.current;
    const previewUrl = URL.createObjectURL(file);
    releasePreview(analysis);
    setNotice("");
    setSaveError("");
    setAnalysis({ status: "analyzing", previewUrl });

    try {
      const result = await analyzeMealPhoto(file);
      if (request === requestRef.current) setAnalysis({ status: "success", analysis: result });
      URL.revokeObjectURL(previewUrl);
    } catch (error) {
      if (request !== requestRef.current) {
        URL.revokeObjectURL(previewUrl);
        return;
      }
      setAnalysis({
        status: "error",
        previewUrl,
        message:
          error instanceof MealNotRecognizedError ? error.message : "No pudimos analizar la foto",
      });
    }
  }

  function resetAnalysis() {
    requestRef.current++;
    releasePreview(analysis);
    setAnalysis({ status: "idle" });
    setSaveError("");
  }

  async function saveAnalysis() {
    if (analysis.status !== "success" || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const meal = await saveMeal(analysis.analysis.id);
      // LA COMIDA GUARDADA PASA AL HISTORIAL Y QUEDA SELECCIONADA.
      setSelectedMeal(meal);
      setHasMeals(true);
      setDateFilter("");
      setHistoryVersion((version) => version + 1);
      setAnalysis({ status: "idle" });
      setNotice(`"${meal.dishName}" se guardó en tu historial.`);
    } catch {
      setSaveError("No pudimos guardar la comida. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMeal(meal: Meal) {
    try {
      await deleteMeal(meal.id);
    } catch {
      setNotice("No pudimos eliminar la comida. Inténtalo de nuevo.");
      return;
    }
    if (selectedMeal?.id === meal.id) setSelectedMeal(null);
    // SE CONSULTA EL HISTORIAL COMPLETO PARA SABER SI QUEDÓ VACÍO, AUNQUE HAYA UN FILTRO ACTIVO.
    const remaining = await getMeals();
    setHasMeals(remaining.length > 0);
    setHistoryVersion((version) => version + 1);
    setNotice(`"${meal.dishName}" se eliminó de tu historial.`);
  }

  return {
    meals,
    hasMeals,
    dateFilter,
    setDateFilter,
    selectedMeal,
    setSelectedMeal,
    goals,
    analysis,
    analyzePhoto,
    resetAnalysis,
    saveAnalysis,
    saving,
    saveError,
    notice,
    removeMeal,
  };
}
