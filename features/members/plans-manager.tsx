"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  DataTable,
  Details,
  ManagementPanel,
  RecordForm,
  RowAction,
} from "@/components/dashboard/management-ui";
import { useDemoData } from "@/features/demo/demo-provider";
import { money, newDemoId } from "@/mocks/internal-data";
import type { Plan } from "@/mocks/internal-data";

export function PlansManager() {
  const { data, setData } = useDemoData();
  const [editing, setEditing] = useState<Plan | "new" | null>(null);
  const [viewing, setViewing] = useState<Plan | null>(null);
  return (
    <>
      <ManagementPanel
        title="Membresías"
        subtitle="Gestión de planes de membresía"
        actions={
          <Button small onClick={() => setEditing("new")}>
            + Agregar membresía
          </Button>
        }
      >
        <DataTable
          rows={data.plans}
          caption="Planes de membresía"
          columns={[
            { label: "Plan", render: (row) => row.name },
            { label: "Precio", render: (row) => money(row.priceCents) },
            { label: "Duración", render: (row) => `${row.days} días` },
            {
              label: "Estado",
              render: (row) => (
                <StatusBadge
                  status={row.active ? "active" : "expired"}
                  label={row.active ? "Activo" : "Inactivo"}
                />
              ),
            },
            {
              label: "Acciones",
              render: (row) => (
                <div className="flex gap-3">
                  <RowAction
                    kind="view"
                    label={`Ver ${row.name}`}
                    onClick={() => setViewing(row)}
                  />
                  <RowAction
                    kind="edit"
                    label={`Editar ${row.name}`}
                    onClick={() => setEditing(row)}
                  />
                </div>
              ),
            },
          ]}
        />
      </ManagementPanel>
      {editing && (
        <RecordForm
          title={editing === "new" ? "Agregar membresía" : "Editar membresía"}
          fields={[
            { name: "name", label: "Nombre de membresía", wide: true },
            { name: "price", label: "Precio (S/)", type: "number", min: 0 },
            { name: "days", label: "Duración en días", type: "number", min: 1 },
            { name: "benefits", label: "Beneficios (uno por línea)", type: "textarea", wide: true },
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
              ? { days: "30", active: "true" }
              : {
                  name: editing.name,
                  price: String(editing.priceCents / 100),
                  days: String(editing.days),
                  benefits: editing.benefits.join("\n"),
                  active: String(editing.active),
                }
          }
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            if (!Number.isInteger(Number(values.days)))
              return "La duración debe ser un número entero de días.";
            const plan: Plan = {
              id: editing === "new" ? newDemoId("plan") : editing.id,
              name: values.name.trim(),
              priceCents: Math.round(Number(values.price) * 100),
              days: Number(values.days),
              benefits: values.benefits
                .split("\n")
                .map((line) => line.trim())
                .filter(Boolean),
              active: values.active === "true",
              discount: editing === "new" ? 0 : editing.discount,
            };
            setData((current) => ({
              ...current,
              plans:
                editing === "new"
                  ? [...current.plans, plan]
                  : current.plans.map((item) => (item.id === plan.id ? plan : item)),
            }));
            setEditing(null);
          }}
        />
      )}
      {viewing && (
        <Details title={viewing.name} onClose={() => setViewing(null)}>
          <p className="text-xl font-bold">
            {money(viewing.priceCents)} / {viewing.days} días
          </p>
          <ul className="my-6 list-inside list-disc space-y-2 text-sm">
            {viewing.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
          <p className="text-caption text-muted">
            Los planes se pueden desactivar. Los registros asociados se conservan.
          </p>
        </Details>
      )}
    </>
  );
}
