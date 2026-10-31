"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import { StatusBadge } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  DataTable,
  ManagementPanel,
  Notice,
  RowAction,
} from "@/components/dashboard/management-ui";
import { useDemoData } from "@/features/demo/demo-provider";
import { MembershipEditor } from "@/features/members/membership-management";
import { downloadReceipt } from "@/features/members/payment-receipt";
import { PaymentOptions } from "@/features/products/product-pages";
import { demoDate, demoMemberId, fullName } from "@/mocks/dashboard";
import { membershipStatus, money, paymentLabels } from "@/mocks/internal-data";
import type { PaymentMethod } from "@/mocks/internal-data";

function ProfileCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-media border border-line p-5">
      <h2 className="mb-5">{title}</h2>
      {children}
    </section>
  );
}

export function MemberProfile() {
  const { data } = useDemoData();
  const member = data.members.find((item) => item.id === demoMemberId);
  if (!member)
    return (
      <ManagementPanel title="Mi perfil">
        <Notice>El registro de este socio no está disponible en el escenario local.</Notice>
      </ManagementPanel>
    );
  const coach = data.staff.find((item) => item.id === member.trainerId);
  const plan = data.plans.find((item) => item.id === member.planId);
  const payments = data.payments.filter((item) => item.memberId === member.id);
  const attendance = data.attendance
    .filter((item) => item.memberId === member.id)
    .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <ManagementPanel
      title="Mi perfil"
      subtitle="Visualización de mis datos, membresía y asistencia"
    >
      <div className="mt-10 flex items-center gap-10 max-sm:flex-col max-sm:items-start">
        {member.portrait && (
          <Image
            src={`/dashboard/${member.portrait}`}
            alt=""
            width={100}
            height={100}
            className="rounded-full"
          />
        )}
        <div>
          <h2>{fullName(member)}</h2>
          <p className="mt-3 break-all text-line">{member.email}</p>
          <p className="mt-3 text-line">{member.phone}</p>
        </div>
      </div>
      <div className="mt-10 grid grid-cols-2 gap-5 max-md:grid-cols-1">
        <ProfileCard title="Mis datos">
          <dl className="space-y-5 text-sm">
            <div className="flex justify-between gap-5">
              <dt className="text-muted">Objetivo</dt>
              <dd>{member.objective}</dd>
            </div>
            <div className="flex justify-between gap-5">
              <dt className="text-muted">Fecha de registro</dt>
              <dd>{member.joinedOn}</dd>
            </div>
            <div className="flex justify-between gap-5">
              <dt className="text-muted">DNI</dt>
              <dd>{member.dni}</dd>
            </div>
          </dl>
        </ProfileCard>
        <ProfileCard title="Membresía">
          <dl className="space-y-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Plan</dt>
              <dd>{plan?.name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-5">
              <dt className="text-muted">Estado de membresía</dt>
              <dd>
                <StatusBadge status={membershipStatus(member)} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Fecha de inicio</dt>
              <dd>{member.joinedOn}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Vencimiento</dt>
              <dd>{member.expiresOn ?? "—"}</dd>
            </div>
          </dl>
        </ProfileCard>
        <ProfileCard title="Entrenador">
          <div className="flex items-center gap-5">
            {coach?.id === "trainer-pedro" && (
              <Image
                src="/dashboard/avatar-trainer.png"
                alt=""
                width={50}
                height={50}
                className="rounded-full"
              />
            )}
            <p>{coach ? fullName(coach) : "Sin entrenador asignado"}</p>
          </div>
        </ProfileCard>
        <ProfileCard title="Asistencia">
          <p className="flex justify-between text-sm">
            <span className="text-muted">Código</span>
            <strong className="text-status-success">#{member.attendanceCode}</strong>
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-3 text-center text-sm">
            {[
              {
                label: "Este mes",
                value: attendance.filter((item) => item.date.startsWith(demoDate.slice(0, 7)))
                  .length,
              },
              { label: "Total", value: attendance.length },
              { label: "Última visita", value: attendance[0]?.date.slice(5) ?? "—" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-control border border-status-info bg-status-info-surface p-2"
              >
                <dd className="text-status-info">{item.value}</dd>
                <dt className="mt-2 text-xs text-muted">{item.label}</dt>
              </div>
            ))}
          </dl>
        </ProfileCard>
      </div>
      <section className="mt-5 rounded-media border border-line p-5">
        <h2>Pagos y renovación</h2>
        <p className="mt-2 text-sm text-line">Información de tu membresía y pagos</p>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-6 text-sm">
          <div>
            Último registro: {payments.at(-1)?.date ?? "—"}
            <p className="mt-2 text-muted">Próximo vencimiento: {member.expiresOn ?? "—"}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/socio/pagos"
              className="rounded-media bg-brand-start p-3 font-bold text-white"
            >
              Pagar renovación
            </Link>
            <Link
              href="/socio/pagos#historial"
              className="rounded-media border border-brand-end p-3 font-bold text-brand-end"
            >
              Ver historial de pagos
            </Link>
          </div>
        </div>
      </section>
    </ManagementPanel>
  );
}

export function MemberPayments() {
  const { data } = useDemoData();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [open, setOpen] = useState(false);
  const [receiptError, setReceiptError] = useState(false);
  const member = data.members.find((item) => item.id === demoMemberId);
  const plan = data.plans.find((item) => item.id === member?.planId);
  const rows = data.payments.filter((item) => item.memberId === demoMemberId).toReversed();
  return (
    <>
      <ManagementPanel title="Pagos" subtitle="Paga tu membresía y consulta tu historial">
        <PaymentOptions value={method} onChange={setMethod} cash={false} cards />
        <p className="my-5 rounded-control bg-brand-surface p-4 text-sm">
          <strong className="text-status-pending">¿Prefieres pagar en efectivo?</strong> Acércate a
          Recepción.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-5 rounded-media border border-line p-5">
          <div>
            <h2>Monto a pagar</h2>
            <p className="mt-3 text-2xl font-bold">{plan ? money(plan.priceCents) : "—"}</p>
            <p className="mt-2 text-sm text-muted">
              Renovación de membresía {plan?.name ?? "sin plan"} ({plan?.days ?? 0} días)
            </p>
          </div>
          <Button disabled={!member || !plan?.active} onClick={() => setOpen(true)}>
            Pagar ahora
          </Button>
        </div>
        <details id="historial" open className="mt-10 rounded-media border border-line p-5">
          <summary className="cursor-pointer">Historial de pagos</summary>
          <p className="mt-2 text-sm text-line">Consulta el historial y descarga comprobantes.</p>
          {receiptError && <Notice>No se pudo generar el comprobante. Inténtalo de nuevo.</Notice>}
          <DataTable
            rows={rows}
            caption="Historial de pagos"
            minWidth={650}
            columns={[
              { label: "Fecha", render: (row) => row.date },
              {
                label: "Plan",
                render: (row) => data.plans.find((item) => item.id === row.planId)?.name ?? "—",
              },
              { label: "Monto", render: (row) => money(row.cents) },
              { label: "Método", render: (row) => paymentLabels[row.method] },
              {
                label: "Estado",
                render: (row) => (
                  <StatusBadge
                    status={row.status === "paid" ? "active" : "pending"}
                    label={row.status === "paid" ? "Pagado" : "Pendiente"}
                  />
                ),
              },
              {
                label: "Comprobante",
                render: (row) => (
                  <RowAction
                    kind="download"
                    label={`Descargar comprobante del ${row.date}`}
                    disabled={row.status !== "paid"}
                    onClick={() => {
                      setReceiptError(false);
                      downloadReceipt(
                        row,
                        member ? fullName(member) : "Socio",
                        data.plans.find((item) => item.id === row.planId)?.name ?? "—",
                      ).catch(() => setReceiptError(true));
                    }}
                  />
                ),
              },
            ]}
          />
        </details>
      </ManagementPanel>
      {open && member && (
        <MembershipEditor
          key={method}
          memberId={member.id}
          onClose={() => setOpen(false)}
          memberMode
          initialMethod={method}
        />
      )}
    </>
  );
}
