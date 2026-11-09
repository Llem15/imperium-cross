"use client";

import { useCallback, useEffect, useState } from "react";
import { StatusBadge } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  DataTable,
  Details,
  ManagementPanel,
  RecordForm,
  RowAction,
} from "@/components/dashboard/management-ui";
import { money } from "@/mocks/internal-data";
import type { ApiPlan } from "./client-api-model";
import { parseApiPlans } from "./client-api-model";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

function responseMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null) {
    const body = payload as Record<string, unknown>;
    if (typeof body.detail === "string") return body.detail;
    if (typeof body.message === "string") return body.message;
  }
  return fallback;
}

export function PlansManager() {
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<ApiPlan | "new" | null>(null);
  const [viewing, setViewing] = useState<ApiPlan | null>(null);

  const loadPlans = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`${apiBaseUrl}/api/planes`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(responseMessage(payload, "No se pudieron cargar los planes."));
    }
    return parseApiPlans(await response.json());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchPlans() {
      try {
        const loadedPlans = await loadPlans(controller.signal);
        if (!controller.signal.aborted) {
          setPlans(loadedPlans);
          setLoadError("");
        }
      } catch (cause) {
        if (!controller.signal.aborted) {
          setLoadError(
            cause instanceof Error ? cause.message : "No se pudieron cargar los planes.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void fetchPlans();
    return () => controller.abort();
  }, [loadPlans]);

  async function savePlan(values: Record<string, string>) {
    if (!editing) return "Selecciona un plan para guardar.";
    const days = Number(values.days);
    const price = Number(values.price);
    const trainingHours = Number(values.trainingHours);
    const scheduleChangeDays = Number(values.scheduleChangeDays);
    if (!Number.isInteger(days) || days < 1 || days > 32767) {
      return "La duración debe ser un número entero entre 1 y 32767 días.";
    }
    if (
      !Number.isFinite(price) ||
      price < 0 ||
      price > 9999.99 ||
      !/^\d+(\.\d{1,2})?$/.test(values.price)
    ) {
      return "El precio debe estar entre S/ 0.00 y S/ 9999.99, con hasta dos decimales.";
    }
    if (values.name.trim().length > 20) return "El nombre admite hasta 20 caracteres.";
    if (values.description.trim().length > 100)
      return "La descripción admite hasta 100 caracteres.";
    if (!Number.isInteger(trainingHours) || trainingHours < 0 || trainingHours > 7) {
      return "Las horas de entrenamiento deben ser un número entero entre 0 y 7 por semana.";
    }
    if (
      !Number.isInteger(scheduleChangeDays) ||
      scheduleChangeDays < 0 ||
      scheduleChangeDays > 30
    ) {
      return "El periodo de cambio debe ser un número entero entre 0 y 30 días.";
    }

    const isNew = editing === "new";
    const planId = isNew ? null : editing.idPlan;
    const response = await fetch(
      isNew ? `${apiBaseUrl}/api/planes` : `${apiBaseUrl}/api/planes/${planId}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          nombrePlan: values.name.trim(),
          descripcionPlan: values.description.trim() || null,
          duracionDias: days,
          precio: Math.round(price * 100) / 100,
          horasEntrenamientoSemana: trainingHours,
          periodoCambioHorarioDias: scheduleChangeDays,
          activo: values.active === "true",
        }),
      },
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return responseMessage(payload, "No se pudo guardar el plan.");
    }
    setEditing(null);
    setSuccess(isNew ? "Plan creado correctamente." : "Plan actualizado correctamente.");
    try {
      setPlans(await loadPlans());
      setLoadError("");
    } catch (cause) {
      setLoadError(
        `El plan se guardó, pero no se pudo actualizar la lista: ${
          cause instanceof Error ? cause.message : "error desconocido."
        }`,
      );
    }
    return;
  }

  return (
    <>
      <ManagementPanel
        title="Membresías"
        subtitle="Gestión de planes guardados en SQL Server"
        actions={
          <Button
            small
            onClick={() => {
              setSuccess("");
              setEditing("new");
            }}
          >
            + Agregar membresía
          </Button>
        }
      >
        {loadError && (
          <p role="alert" className="mb-4 text-sm text-red-700">
            {loadError}
          </p>
        )}
        {success && (
          <p role="status" className="mb-4 text-sm text-green-700">
            {success}
          </p>
        )}
        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-muted">
            Cargando planes...
          </p>
        ) : loadError ? (
          <Button
            small
            onClick={() => {
              setLoading(true);
              loadPlans()
                .then((loadedPlans) => {
                  setPlans(loadedPlans);
                  setLoadError("");
                })
                .catch((cause) =>
                  setLoadError(
                    cause instanceof Error ? cause.message : "No se pudieron cargar los planes.",
                  ),
                )
                .finally(() => setLoading(false));
            }}
          >
            Reintentar
          </Button>
        ) : (
          <DataTable
            rows={plans.map((plan) => ({ ...plan, id: String(plan.idPlan) }))}
            caption="Planes de membresía"
            columns={[
              { label: "Plan", render: (row) => row.nombrePlan },
              { label: "Precio", render: (row) => money(Math.round(row.precio * 100)) },
              { label: "Duración", render: (row) => `${row.duracionDias} días` },
              {
                label: "Entrenamiento",
                render: (row) => `${row.horasEntrenamientoSemana} h/semana`,
              },
              {
                label: "Cambio horario",
                render: (row) =>
                  row.periodoCambioHorarioDias === 0
                    ? "Fijo durante el ciclo"
                    : `Cada ${row.periodoCambioHorarioDias} días`,
              },
              {
                label: "Estado",
                render: (row) => (
                  <StatusBadge
                    status={row.activo ? "active" : "expired"}
                    label={row.activo ? "Activo" : "Inactivo"}
                  />
                ),
              },
              {
                label: "Acciones",
                render: (row) => (
                  <div className="flex gap-3">
                    <RowAction
                      kind="view"
                      label={`Ver ${row.nombrePlan}`}
                      onClick={() => setViewing(row)}
                    />
                    <RowAction
                      kind="edit"
                      label={`Editar ${row.nombrePlan}`}
                      onClick={() => {
                        setSuccess("");
                        setEditing(row);
                      }}
                    />
                  </div>
                ),
              },
            ]}
          />
        )}
      </ManagementPanel>
      {editing && (
        <RecordForm
          title={editing === "new" ? "Agregar membresía" : "Editar membresía"}
          fields={[
            { name: "name", label: "Nombre de membresía", wide: true, maxLength: 20 },
            { name: "price", label: "Precio (S/)", type: "number", min: 0 },
            { name: "days", label: "Duración en días", type: "number", min: 1 },
            {
              name: "trainingHours",
              label: "Horas de entrenamiento por semana",
              type: "number",
              min: 0,
            },
            {
              name: "scheduleChangeDays",
              label: "Cambio de horario cada (días; 0 = fijo)",
              type: "number",
              min: 0,
            },
            {
              name: "description",
              label: "Descripción (máximo 100 caracteres)",
              type: "textarea",
              wide: true,
              maxLength: 100,
              required: false,
            },
            {
              name: "active",
              label: "Estado",
              type: "select",
              wide: true,
              options: [
                { value: "true", label: "Activo" },
                { value: "false", label: "Inactivo" },
              ],
            },
          ]}
          initialValues={
            editing === "new"
              ? {
                  days: "30",
                  trainingHours: "0",
                  scheduleChangeDays: "0",
                  active: "true",
                  description: "",
                }
              : {
                  name: editing.nombrePlan,
                  price: String(editing.precio),
                  days: String(editing.duracionDias),
                  trainingHours: String(editing.horasEntrenamientoSemana),
                  scheduleChangeDays: String(editing.periodoCambioHorarioDias),
                  description: editing.descripcionPlan ?? "",
                  active: String(editing.activo),
                }
          }
          onClose={() => setEditing(null)}
          onSubmit={savePlan}
        />
      )}
      {viewing && (
        <Details title={viewing.nombrePlan} onClose={() => setViewing(null)}>
          <p className="text-xl font-bold">
            {money(Math.round(viewing.precio * 100))} / {viewing.duracionDias} días
          </p>
          <p className="my-3 text-sm">
            {viewing.horasEntrenamientoSemana} horas semanales; horario{" "}
            {viewing.periodoCambioHorarioDias === 0
              ? "fijo durante el ciclo"
              : `modificable cada ${viewing.periodoCambioHorarioDias} días`}
          </p>
          {viewing.descripcionPlan && <p className="my-6 text-sm">{viewing.descripcionPlan}</p>}
          <p className="text-caption text-muted">
            Los planes se pueden desactivar. Las matrículas y pagos registrados se conservan.
          </p>
        </Details>
      )}
    </>
  );
}
