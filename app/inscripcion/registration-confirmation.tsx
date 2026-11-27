"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { plans } from "../landing-content";
import { actionBaseClasses, primaryActionClasses } from "../ui-styles";
import { attendanceCodeExample, cashPaymentDeadline } from "./registration-data";
import {
  formatSession,
  membershipDays,
  membershipEndDate,
  scheduledSessions,
} from "./registration-model";
import type { PaymentMethod, PlanId, WeeklySchedule } from "./registration-model";
import { priceToCents } from "./registration-payment-model";
import type { PaymentResult } from "./registration-payment-model";

export type RegistrationSummary = {
  planId: PlanId;
  method: PaymentMethod;
  schedule: WeeklySchedule;
  applicantName: string;
  payment: PaymentResult | null;
};

function paymentMethodLabel(payment: PaymentResult) {
  return payment.method === "card" ? `Tarjeta •••• ${payment.lastFour}` : "Yape";
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2.5 not-first:mt-2.5">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right wrap-anywhere">{value}</dd>
    </div>
  );
}

// Reloj de pago pendiente
function PendingIcon() {
  return (
    <svg
      width="60"
      height="60"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mb-1.75 text-status-pending"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6.5V12l3.5 2" />
    </svg>
  );
}

type RegistrationConfirmationProps = {
  summary: RegistrationSummary;
  onClose: () => void;
};

export function RegistrationConfirmation({ summary, onClose }: RegistrationConfirmationProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadFailed, setDownloadFailed] = useState(false);
  const plan = plans.find((item) => item.id === summary.planId);
  const { payment } = summary;
  // Con efectivo la cuenta no se activa hasta que paga en el local
  const isCashPayment = summary.method === "cash" || !payment;
  const sessions = scheduledSessions(summary.schedule);
  const title = isCashPayment ? "Tu registro fue guardado" : "¡Inscripción completa!";
  const description = isCashPayment
    ? "Tu cuenta se activará cuando realices el pago en Imperium Cross (Chosica)."
    : "Tu pago fue aprobado. Estos son los horarios que elegiste.";
  const actionClasses = [
    actionBaseClasses,
    "mt-1.75 min-h-control w-full max-w-75 cursor-pointer text-base hover:brightness-[.94]",
  ].join(" ");

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (!plan) return null;
  const amountLabel = `S/ ${plan.price}`;

  async function downloadReceipt() {
    if (!plan || !payment) return;

    setDownloading(true);
    setDownloadFailed(false);
    try {
      const { downloadRegistrationReceipt } = await import("./registration-receipt");
      await downloadRegistrationReceipt({
        operationId: payment.operationId,
        name: summary.applicantName,
        plan: `Plan ${plan.name} · ${membershipDays} días`,
        method: paymentMethodLabel(payment),
        cents: priceToCents(plan.price),
        schedule: summary.schedule,
      });
    } catch {
      setDownloadFailed(true);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section
      data-ui="registration-confirmation"
      aria-labelledby="registration-title"
      className="flex min-h-82.5 w-full max-w-registration flex-col items-center
        justify-center gap-2 rounded-media bg-white px-[39px] py-8 text-center
        max-compact:px-6 max-compact:py-7"
    >
      {isCashPayment ? (
        <PendingIcon />
      ) : (
        <Image
          src="/registration/payment-confirmed.svg"
          alt=""
          width={60}
          height={60}
          className="mb-1.75"
        />
      )}
      <h1
        id="registration-title"
        tabIndex={-1}
        ref={headingRef}
        className="text-base font-bold focus:outline-none"
      >
        {title}
      </h1>
      <p className="text-caption">{description}</p>
      <dl
        data-ui="confirmation-summary"
        className="mt-1.75 w-full max-w-75 rounded-control border border-muted
          px-3.75 py-2.5 text-left text-sm"
      >
        {isCashPayment ? (
          <>
            <SummaryRow label="Plan" value={`${plan.name} · ${membershipDays} días`} />
            <SummaryRow label="Monto a pagar" value={amountLabel} />
            <SummaryRow label="Paga antes del" value={cashPaymentDeadline} />
          </>
        ) : (
          <>
            <SummaryRow label="Plan" value={`${plan.name} · ${membershipDays} días`} />
            <SummaryRow label="Monto" value={amountLabel} />
            <SummaryRow label="Método" value={paymentMethodLabel(payment)} />
            <SummaryRow label="N.° de operación" value={payment.operationId} />
            <SummaryRow label="Código de asistencia" value={attendanceCodeExample} />
          </>
        )}
      </dl>
      <div data-ui="confirmation-week" className="mt-1.75 w-full max-w-75 text-left">
        <h2 className="text-sm font-bold">
          {isCashPayment ? "Horarios que elegiste" : "Tu semana"}
        </h2>
        <ul className="mt-1.5 flex flex-col gap-1.5">
          {sessions.map(({ day, start }) => (
            <li
              key={day.id}
              className="flex justify-between gap-2.5 rounded-control bg-brand-surface px-3.75
                py-1.5 text-sm"
            >
              <strong className="capitalize">{day.name}</strong>
              <span>{formatSession(start)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-xs text-muted">
          Se repiten cada semana hasta el {membershipEndDate()}. Te asignamos un entrenador
          automáticamente.
        </p>
      </div>
      {isCashPayment ? (
        <button
          type="button"
          onClick={onClose}
          className={`${actionClasses} ${primaryActionClasses}`}
        >
          Entendido
        </button>
      ) : (
        <>
          <Link href="/login" className={`${actionClasses} ${primaryActionClasses}`}>
            Ingresar a mi cuenta
          </Link>
          <button
            type="button"
            onClick={downloadReceipt}
            disabled={downloading}
            aria-busy={downloading}
            className={[
              actionClasses,
              "border border-brand-start bg-white text-brand-start",
              "disabled:cursor-wait disabled:opacity-70",
            ].join(" ")}
          >
            {downloading ? "Generando comprobante…" : "Descargar comprobante"}
          </button>
          {downloadFailed && (
            <p className="text-caption text-brand-start" role="alert">
              No pudimos generar el comprobante. Intenta de nuevo.
            </p>
          )}
        </>
      )}
      <p className="text-xs text-muted">
        {isCashPayment
          ? "Cuando pagues, te enviaremos a tu correo el comprobante y la confirmación de tu cuenta."
          : "Te enviamos un correo con tus credenciales de acceso al sistema."}
      </p>
    </section>
  );
}
