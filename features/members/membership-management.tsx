"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchField, StatusBadge } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  DataTable,
  Details,
  ManagementPanel,
  Notice,
  RecordForm,
} from "@/components/dashboard/management-ui";
import { useDemoData } from "@/features/demo/demo-provider";
import { PaymentOptions } from "@/features/products/product-pages";
import { demoDate, fullName } from "@/mocks/dashboard";
import { addDays, membershipStatus, money, newDemoId } from "@/mocks/internal-data";
import type { Payment, PaymentMethod } from "@/mocks/internal-data";
import { parseApiClients, parseApiPlans } from "./client-api-model";
import type { ApiClient, ApiPlan } from "./client-api-model";
import { parseApiMemberships } from "./membership-api-model";
import type { ApiMembership } from "./membership-api-model";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

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
        saved ? "Registro actualizado" : memberMode ? "Renovar membresía" : "Registrar membresía"
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
          <div className="flex flex-wrap gap-3">
            {!memberMode && (
              <Button variant="outline" disabled={!member || !plan} onClick={() => save(false)}>
                Guardar pendiente
              </Button>
            )}
            <Button disabled={!member || !plan} onClick={() => save(true)}>
              {memberMode ? "Confirmar pago" : "Cobrar"}
            </Button>
          </div>
        </>
      )}
    </Details>
  );
}

export function MembershipManagement() {
  const [memberships, setMemberships] = useState<ApiMembership[]>([]);
  const [clients, setClients] = useState<ApiClient[]>([]);
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(false);
  const [changeTarget, setChangeTarget] = useState<ApiMembership | null>(null);
  const [busyPaymentId, setBusyPaymentId] = useState<number | null>(null);
  const [busyMembershipId, setBusyMembershipId] = useState<number | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadData() {
      setLoading(true);
      setLoadError("");
      try {
        const [membershipResponse, clientResponse, planResponse] = await Promise.all([
          fetch(`${apiBaseUrl}/api/membresias`, { signal: controller.signal }),
          fetch(`${apiBaseUrl}/api/clientes`, { signal: controller.signal }),
          fetch(`${apiBaseUrl}/api/planes`, { signal: controller.signal }),
        ]);
        if (!membershipResponse.ok) {
          throw new Error(
            `No se pudieron cargar las matrículas (HTTP ${membershipResponse.status}).`,
          );
        }
        if (!clientResponse.ok) {
          throw new Error(`No se pudieron cargar los clientes (HTTP ${clientResponse.status}).`);
        }
        if (!planResponse.ok) {
          throw new Error(`No se pudieron cargar los planes (HTTP ${planResponse.status}).`);
        }
        const [membershipPayload, clientPayload, planPayload] = await Promise.all([
          membershipResponse.json(),
          clientResponse.json(),
          planResponse.json(),
        ]);
        setMemberships(parseApiMemberships(membershipPayload));
        setClients(parseApiClients(clientPayload));
        setPlans(parseApiPlans(planPayload));
      } catch (cause) {
        if (controller.signal.aborted) return;
        setLoadError(
          cause instanceof Error ? cause.message : "No se pudieron cargar las matrículas.",
        );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadData();
    return () => controller.abort();
  }, [reload]);

  const rows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return memberships;
    return memberships.filter((membership) =>
      `${membership.nombres} ${membership.apellidos} ${membership.nombrePlan} ${membership.estadoPago}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [memberships, query]);
  const activeClients = clients.filter((client) => client.estadoCliente && client.estadoUsuario);
  const activePlans = plans.filter((plan) => plan.activo);
  const fields = [
    {
      name: "idCliente",
      label: "Cliente",
      type: "select" as const,
      options: activeClients.map((client) => ({
        value: String(client.idCliente),
        label: `${client.nombres} ${client.apellidos} · DNI ${client.dni}`,
      })),
    },
    {
      name: "idPlan",
      label: "Plan mensual",
      type: "select" as const,
      options: activePlans.map((plan) => ({
        value: String(plan.idPlan),
        label: `${plan.nombrePlan} · ${money(Math.round(plan.precio * 100))} · ${plan.duracionDias} días`,
      })),
    },
    {
      name: "metodoPago",
      label: "Método de pago",
      type: "select" as const,
      options: [
        { value: "Yape", label: "Yape" },
        { value: "Tarjeta", label: "Tarjeta" },
        { value: "Efectivo", label: "Efectivo" },
      ],
    },
  ];

  function changeFields(membership: ApiMembership) {
    const paid = membership.estadoPago === "Pagado";
    return [
      {
        name: "idPlan",
        label: "Nuevo plan",
        type: "select" as const,
        options: activePlans
          .filter((plan) => plan.idPlan !== membership.idPlan)
          .map((plan) => ({
            value: String(plan.idPlan),
            label: `${plan.nombrePlan} · ${money(Math.round(plan.precio * 100))} · ${plan.duracionDias} días`,
          })),
      },
      {
        name: "vigencia",
        label: "Cuándo aplica",
        type: "select" as const,
        options: paid
          ? [{ value: "AlVencimiento", label: `Después del ${membership.fechaFin}` }]
          : [
              { value: "Inmediato", label: "Inmediatamente" },
              { value: "AlVencimiento", label: `Después del ${membership.fechaFin}` },
            ],
      },
      {
        name: "metodoPago",
        label: "Método de pago",
        type: "select" as const,
        options: [
          { value: "Yape", label: "Yape" },
          { value: "Tarjeta", label: "Tarjeta" },
          { value: "Efectivo", label: "Efectivo" },
        ],
      },
    ];
  }

  async function createMembership(values: Record<string, string>) {
    const response = await fetch(`${apiBaseUrl}/api/membresias`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        idCliente: Number(values.idCliente),
        idPlan: Number(values.idPlan),
        metodoPago: values.metodoPago,
      }),
    });
    if (!response.ok) {
      throw new Error(`No se pudo registrar la matrícula (HTTP ${response.status}).`);
    }
    setEditing(false);
    setMutationError("");
    setSuccess("Matrícula y pago pendiente registrados. Confirma el pago cuando recibas el cobro.");
    setReload((current) => current + 1);
  }

  async function changePlan(membership: ApiMembership, values: Record<string, string>) {
    const response = await fetch(
      `${apiBaseUrl}/api/membresias/${membership.idMembresia}/cambiar-plan`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          idPlan: Number(values.idPlan),
          metodoPago: values.metodoPago,
          vigencia: values.vigencia,
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`No se pudo cambiar el plan (HTTP ${response.status}).`);
    }
    setChangeTarget(null);
    setMutationError("");
    setSuccess(
      values.vigencia === "AlVencimiento"
        ? "Cambio programado para después del vencimiento. Confirma el pago cuando lo recibas."
        : "Nuevo plan registrado con pago pendiente. El registro anterior quedó en el historial.",
    );
    setReload((current) => current + 1);
  }

  async function cancelMembership(membershipId: number) {
    setBusyMembershipId(membershipId);
    setMutationError("");
    setSuccess("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/membresias/${membershipId}/cancelar`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`No se pudo cancelar la membresía (HTTP ${response.status}).`);
      }
      setSuccess("Membresía pendiente cancelada y pago pendiente anulado.");
      setReload((current) => current + 1);
    } catch (cause) {
      setMutationError(
        cause instanceof Error ? cause.message : "No se pudo cancelar la membresía.",
      );
    } finally {
      setBusyMembershipId(null);
    }
  }

  async function confirmPayment(paymentId: number) {
    setBusyPaymentId(paymentId);
    setMutationError("");
    setSuccess("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/pagos/${paymentId}/confirmar`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`No se pudo confirmar el pago (HTTP ${response.status}).`);
      }
      setSuccess(
        "Pago confirmado; la membresía queda activa o programada según su fecha de inicio.",
      );
      setReload((current) => current + 1);
    } catch (cause) {
      setMutationError(cause instanceof Error ? cause.message : "No se pudo confirmar el pago.");
    } finally {
      setBusyPaymentId(null);
    }
  }

  function membershipBadge(membership: ApiMembership) {
    if (membership.estadoMembresia === "Cancelada") {
      return <StatusBadge status="expired" label="Cancelada" />;
    }
    if (membership.estadoMembresia === "Programada") {
      return <StatusBadge status="pending" label="Programada" />;
    }
    if (
      membership.estadoMembresia === "Vencida" ||
      membership.fechaFin < new Date().toISOString().slice(0, 10)
    ) {
      return <StatusBadge status="expired" label="Vencida" />;
    }
    if (membership.estadoMembresia === "Pendiente") {
      return <StatusBadge status="pending" label="Pendiente" />;
    }
    return <StatusBadge status="active" label="Activa" />;
  }

  return (
    <>
      <ManagementPanel
        title="Matrículas"
        subtitle="Membresías y pagos guardados en SQL Server"
        actions={
          <>
            <SearchField value={query} onChange={setQuery} />
            <Button
              small
              disabled={loading || activeClients.length === 0 || activePlans.length === 0}
              onClick={() => {
                setMutationError("");
                setSuccess("");
                setEditing(true);
              }}
            >
              + Registrar membresía
            </Button>
          </>
        }
      >
        {loadError && (
          <Notice>
            {loadError} Verifica que Spring Boot esté iniciado y conectado a SQL Server.
          </Notice>
        )}
        {mutationError && <Notice>{mutationError}</Notice>}
        {success && <Notice>{success}</Notice>}
        {loading && (
          <p role="status" className="mt-8 text-sm text-muted">
            Cargando matrículas…
          </p>
        )}
        <DataTable
          rows={rows.map((membership) => ({
            ...membership,
            id: String(membership.idMembresia),
          }))}
          caption="Matrículas"
          columns={[
            { label: "Cliente", render: (row) => `${row.nombres} ${row.apellidos}` },
            { label: "Membresía", render: (row) => row.nombrePlan },
            {
              label: "Inicio",
              render: (row) => new Date(`${row.fechaInicio}T00:00:00`).toLocaleDateString("es-PE"),
            },
            {
              label: "Vencimiento",
              render: (row) => new Date(`${row.fechaFin}T00:00:00`).toLocaleDateString("es-PE"),
            },
            {
              label: "Importe",
              render: (row) => (row.monto === null ? "—" : money(Math.round(row.monto * 100))),
            },
            { label: "Método", render: (row) => row.metodoPago ?? "—" },
            {
              label: "Pago",
              render: (row) => row.estadoPago ?? "Sin pago registrado",
            },
            { label: "Estado de membresía", render: membershipBadge },
            {
              label: "Acciones",
              render: (row) => (
                <div className="flex flex-wrap gap-2">
                  {row.idPago !== null && row.estadoPago === "Pendiente" && (
                    <Button
                      small
                      disabled={busyPaymentId !== null}
                      onClick={() => {
                        if (row.idPago !== null) void confirmPayment(row.idPago);
                      }}
                    >
                      {busyPaymentId === row.idPago ? "Confirmando…" : "Confirmar pago"}
                    </Button>
                  )}
                  {row.estadoMembresia !== "Cancelada" && row.estadoMembresia !== "Programada" && (
                    <Button
                      small
                      variant="outline"
                      disabled={busyMembershipId !== null || busyPaymentId !== null}
                      onClick={() => setChangeTarget(row)}
                    >
                      Cambiar plan
                    </Button>
                  )}
                  {row.estadoMembresia === "Pendiente" && row.estadoPago !== "Pagado" && (
                    <Button
                      small
                      variant="outline"
                      disabled={busyMembershipId !== null}
                      onClick={() => {
                        if (
                          window.confirm(
                            "¿Cancelar esta membresía pendiente y anular su pago pendiente?",
                          )
                        ) {
                          void cancelMembership(row.idMembresia);
                        }
                      }}
                    >
                      {busyMembershipId === row.idMembresia ? "Cancelando…" : "Cancelar"}
                    </Button>
                  )}
                  {row.estadoMembresia === "Activa" && row.estadoPago === "Pagado" && (
                    <span className="text-xs text-muted">Baja sujeta a gestión de reembolso</span>
                  )}
                </div>
              ),
            },
          ]}
        />
      </ManagementPanel>
      {editing && (
        <RecordForm
          title="Registrar membresía"
          subtitle="La vigencia se calcula automáticamente por los días del plan."
          fields={fields}
          initialValues={{}}
          submitLabel="Registrar pago pendiente"
          onClose={() => setEditing(false)}
          onSubmit={createMembership}
        />
      )}
      {changeTarget && (
        <RecordForm
          title={`Cambiar plan · ${changeTarget.nombres} ${changeTarget.apellidos}`}
          subtitle={
            changeTarget.estadoPago === "Pagado"
              ? "Como el plan actual ya está pagado, el nuevo plan iniciará después de su vencimiento."
              : "El plan anterior se conservará en el historial. El nuevo pago quedará pendiente."
          }
          fields={changeFields(changeTarget)}
          initialValues={{
            vigencia: changeTarget.estadoPago === "Pagado" ? "AlVencimiento" : "Inmediato",
            metodoPago: "Efectivo",
          }}
          submitLabel="Registrar cambio"
          onClose={() => setChangeTarget(null)}
          onSubmit={(values) => changePlan(changeTarget, values)}
        />
      )}
    </>
  );
}
