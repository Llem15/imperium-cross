"use client";

import { useState } from "react";
import { SearchField, StatusBadge } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  DataTable,
  Details,
  ManagementPanel,
  Notice,
  RowAction,
} from "@/components/dashboard/management-ui";
import { useDemoData } from "@/features/demo/demo-provider";
import { PaymentOptions } from "@/features/products/product-pages";
import { demoDate, fullName, matchesMember } from "@/mocks/dashboard";
import { addDays, membershipStatus, money, newDemoId, paymentLabels } from "@/mocks/internal-data";
import type { Member, Payment, PaymentMethod } from "@/mocks/internal-data";

export function downloadReceipt(payment: Payment, name: string, plan: string) {
  const text = `IMPERIUM CROSS — COMPROBANTE DE EJEMPLO\nSin validez fiscal. No acredita una transacción real.\n\nCliente: ${name}\nPlan: ${plan}\nFecha: ${payment.date}\nImporte: ${money(payment.cents)}\nMétodo: ${paymentLabels[payment.method]}\nEstado de prueba: ${payment.status === "paid" ? "Pagado" : "Pendiente"}\n`;
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `comprobante-ejemplo-${payment.id}.txt`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function MembershipEditor({
  memberId,
  onClose,
  memberMode = false,
  initialMethod,
}: {
  memberId?: string;
  onClose: () => void;
  memberMode?: boolean;
  initialMethod?: PaymentMethod;
}) {
  const { data, setData } = useDemoData();
  const initialMember = data.members.find((member) => member.id === memberId);
  const [selectedId, setSelectedId] = useState(memberId ?? "");
  const [planId, setPlanId] = useState(initialMember?.planId ?? "");
  const [method, setMethod] = useState<PaymentMethod>(
    initialMethod ?? (memberMode ? "card" : "cash"),
  );
  const [saved, setSaved] = useState(false);
  const member = data.members.find((item) => item.id === selectedId);
  const plan = data.plans.find((item) => item.id === planId && item.active);
  const pending = data.payments.findLast(
    (payment) => payment.memberId === member?.id && payment.status === "pending",
  );
  const control =
    "mt-2 min-h-10 w-full rounded-control border border-muted bg-white px-3 py-2 text-sm";
  function save(paid: boolean) {
    if (!member || !plan) return;
    const payment: Payment = {
      id: pending?.id ?? newDemoId("payment"),
      memberId: member.id,
      planId: plan.id,
      cents: plan.priceCents,
      date: demoDate,
      method,
      status: paid ? "paid" : "pending",
    };
    const baseDate = member.expiresOn && member.expiresOn > demoDate ? member.expiresOn : demoDate;
    const expiresOn = paid ? addDays(baseDate, plan.days) : member.expiresOn;
    setData((current) => ({
      ...current,
      payments: pending
        ? current.payments.map((item) => (item.id === pending.id ? payment : item))
        : [...current.payments, payment],
      members: current.members.map((item) =>
        item.id === member.id
          ? { ...item, planId: plan.id, status: paid ? "active" : "pending", expiresOn }
          : item,
      ),
    }));
    setSaved(true);
  }
  return (
    <Details
      title={
        saved
          ? "Registro de prueba actualizado"
          : memberMode
            ? "Renovar membresía"
            : "Registrar membresía"
      }
      onClose={onClose}
    >
      {saved ? (
        <>
          <Notice>
            Se actualizó el escenario local. No se realizó un pago real ni se envió ningún correo.
          </Notice>
          <Button onClick={onClose}>Cerrar</Button>
        </>
      ) : (
        <>
          <p className="mb-5 text-center text-sm text-line">Nueva inscripción o renovación</p>
          <label className="block text-sm font-bold">
            Cliente
            <select
              aria-label="Cliente"
              value={selectedId}
              disabled={memberMode}
              onChange={(event) => {
                setSelectedId(event.target.value);
                setPlanId(
                  data.members.find((item) => item.id === event.target.value)?.planId ?? "",
                );
              }}
              className={control}
            >
              <option value="">Seleccionar cliente</option>
              {data.members.map((item) => (
                <option key={item.id} value={item.id}>
                  {fullName(item)}
                </option>
              ))}
            </select>
          </label>
          <label className="mt-4 block text-sm font-bold">
            Membresía
            <select
              aria-label="Membresía"
              value={planId}
              onChange={(event) => setPlanId(event.target.value)}
              className={control}
            >
              <option value="">Seleccionar plan</option>
              {data.plans
                .filter((item) => item.active)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {money(item.priceCents)}
                  </option>
                ))}
            </select>
          </label>
          <PaymentOptions value={method} onChange={setMethod} cash={!memberMode} />
          <div className="rounded-media bg-dashboard-canvas p-4 text-sm">
            <p>Plan: {plan?.name ?? "—"}</p>
            <p className="mt-3">
              Estado: {member ? <StatusBadge status={membershipStatus(member)} /> : "—"}
            </p>
            <p className="mt-4 border-t border-line pt-3">
              Total: {plan ? money(plan.priceCents) : "—"}
            </p>
          </div>
          <Notice>
            Este formulario es un prototipo. Los botones solo modifican datos de prueba en esta
            página.
          </Notice>
          <div className="flex flex-wrap gap-3">
            {!memberMode && (
              <Button variant="outline" disabled={!member || !plan} onClick={() => save(false)}>
                Guardar pendiente
              </Button>
            )}
            <Button disabled={!member || !plan} onClick={() => save(true)}>
              {memberMode ? "Confirmar prueba" : "Cobrar (prueba)"}
            </Button>
          </div>
        </>
      )}
    </Details>
  );
}

export function MembershipManagement() {
  const { data } = useDemoData();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [viewing, setViewing] = useState<Member | null>(null);
  const rows = data.members.filter((member) => matchesMember(member, query));
  const paymentFor = (id: string) => data.payments.findLast((payment) => payment.memberId === id);
  const planName = (id: string) => data.plans.find((plan) => plan.id === id)?.name ?? "—";
  return (
    <>
      <ManagementPanel
        title="Matrículas"
        subtitle="Registro de matrículas y planes"
        actions={
          <>
            <SearchField value={query} onChange={setQuery} />
            <Button small onClick={() => setEditing("new")}>
              + Registrar membresía
            </Button>
          </>
        }
      >
        <DataTable
          rows={rows}
          caption="Matrículas"
          columns={[
            { label: "Nombre", render: (row) => row.firstName },
            { label: "Apellidos", render: (row) => row.lastName },
            { label: "Membresía", render: (row) => planName(row.planId) },
            {
              label: "Importe",
              render: (row) => (paymentFor(row.id) ? money(paymentFor(row.id)!.cents) : "—"),
            },
            {
              label: "Método",
              render: (row) =>
                paymentFor(row.id) ? paymentLabels[paymentFor(row.id)!.method] : "—",
            },
            {
              label: "Estado",
              render: (row) => (
                <StatusBadge
                  status={membershipStatus(row)}
                  label={membershipStatus(row) === "active" ? "Pagado" : undefined}
                />
              ),
            },
            {
              label: "Acciones",
              render: (row) => (
                <div className="flex gap-3">
                  <RowAction
                    kind="view"
                    label={`Ver matrícula de ${fullName(row)}`}
                    onClick={() => setViewing(row)}
                  />
                  <RowAction
                    kind="edit"
                    label={`Gestionar matrícula de ${fullName(row)}`}
                    onClick={() => setEditing(row.id)}
                  />
                  <RowAction
                    kind="download"
                    label={`Descargar comprobante de ${fullName(row)}`}
                    disabled={!paymentFor(row.id)}
                    onClick={() => {
                      const payment = paymentFor(row.id);
                      if (payment)
                        downloadReceipt(payment, fullName(row), planName(payment.planId));
                    }}
                  />
                </div>
              ),
            },
          ]}
        />
      </ManagementPanel>
      {editing && (
        <MembershipEditor
          memberId={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {viewing && (
        <Details title="Gestionar membresía" onClose={() => setViewing(null)}>
          <dl className="space-y-4 text-sm">
            <div>Cliente: {fullName(viewing)}</div>
            <div>Plan: {planName(viewing.planId)}</div>
            <div>Vencimiento: {viewing.expiresOn ?? "—"}</div>
            <div>
              Estado: <StatusBadge status={membershipStatus(viewing)} />
            </div>
          </dl>
          <Button
            className="mt-6"
            onClick={() => {
              setEditing(viewing.id);
              setViewing(null);
            }}
          >
            {membershipStatus(viewing) === "pending"
              ? "Gestionar pago pendiente"
              : "Renovar membresía"}
          </Button>
        </Details>
      )}
    </>
  );
}
