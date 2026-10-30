"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { plans } from "../landing-content";
import { confirmationExample } from "./registration-model";
import type { RegistrationPreview } from "./registration-model";

// Esta pantalla es una vista previa local, no una confirmación de backend.
export function RegistrationConfirmation({ preview }: { preview: RegistrationPreview }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const plan = plans.find((item) => item.id === preview.planId);
  const isCashPayment = preview.method === "cash";
  const icon = isCashPayment ? "cash" : "payment";
  const title = isCashPayment ? "Vista previa del registro" : "Vista previa del pago";
  const description = isCashPayment
    ? "El pago presencial quedará pendiente hasta la confirmación en recepción."
    : "Así se verá la confirmación de tu membresía cuando el pago esté validado.";

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  if (!plan) return null;

  return (
    <section
      data-ui="registration-confirmation"
      aria-labelledby="registration-title"
      className="flex min-h-82.5 w-full max-w-registration flex-col items-center
        justify-center gap-2 rounded-media bg-white px-[39px] py-8 text-center
        max-compact:px-6 max-compact:py-7"
    >
      <Image
        src={`/registration/${icon}-confirmed.svg`}
        alt=""
        width={60}
        height={60}
        className="mb-1.75"
      />
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
        <div className="flex justify-between gap-2.5">
          <dt className="text-muted">Plan</dt>
          <dd className="text-right wrap-anywhere">
            {plan.name} — S/{plan.price}
          </dd>
        </div>
        {!isCashPayment && (
          <>
            <div className="mt-2.5 flex justify-between gap-2.5">
              <dt className="text-muted">Vigente hasta</dt>
              <dd className="text-right wrap-anywhere">{confirmationExample.validUntil}</dd>
            </div>
            <div className="mt-2.5 flex justify-between gap-2.5">
              <dt className="text-muted">Código de asistencia</dt>
              <dd className="text-right wrap-anywhere">{confirmationExample.attendanceCode}</dd>
            </div>
          </>
        )}
      </dl>
      <p className="text-xs text-muted">
        Esta vista previa no guarda datos, procesa pagos ni envía correos.
      </p>
    </section>
  );
}
