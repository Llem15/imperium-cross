"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { plans } from "../landing-content";
import { primaryActionClasses } from "../ui-styles";
import { demoPayment, simulatePayment } from "./registration-data";
import { membershipDays, scheduledSessions } from "./registration-model";
import type { PlanId, WeeklySchedule } from "./registration-model";
import {
  cardNameMaxLength,
  cardNumberLength,
  formatCardNumber,
  formatExpiry,
  onlyDigits,
  priceToCents,
  validateCard,
  validateYapeCode,
  yapeCodeLength,
  cvvLength,
} from "./registration-payment-model";
import type {
  CardErrors,
  CardForm,
  OnlinePaymentMethod,
  PaymentRequest,
  PaymentResult,
} from "./registration-payment-model";
import {
  actionsClasses,
  buttonClasses,
  controlClasses,
  fieldsClasses,
  formClasses,
  labelClasses,
  linkButtonClasses,
  rowClasses,
  secondaryButtonClasses,
  wideButtonClasses,
} from "./registration-styles";

const methodLabels: Record<OnlinePaymentMethod, string> = { card: "Tarjeta", yape: "Yape" };
const emptyCard: CardForm = { number: "", name: "", expiry: "", cvv: "" };

type PaymentFieldProps = {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  children: ReactNode;
};

function PaymentField({ id, label, error, hint, optional = false, children }: PaymentFieldProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2.5">
      <label htmlFor={id} className={labelClasses}>
        {label}
        {!optional && (
          <span className="text-brand-end" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-caption text-brand-start">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hasHint = false) {
  const ids = [hasHint ? `${id}-hint` : "", error ? `${id}-error` : ""].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

type PaymentStepProps = {
  planId: PlanId;
  method: OnlinePaymentMethod;
  schedule: WeeklySchedule;
  onChangeMethod: () => void;
  onBack: () => void;
  onApproved: (payment: PaymentResult) => void;
};

export function PaymentStep({
  planId,
  method,
  schedule,
  onChangeMethod,
  onBack,
  onApproved,
}: PaymentStepProps) {
  // Los datos de la tarjeta solo viven aquí y se descartan al salir del paso
  const [card, setCard] = useState<CardForm>(emptyCard);
  const [cardErrors, setCardErrors] = useState<CardErrors>({});
  const [yapeCode, setYapeCode] = useState("");
  const [yapeError, setYapeError] = useState<string>();
  const [paymentError, setPaymentError] = useState<string>();
  const [processing, setProcessing] = useState(false);
  const mountedRef = useRef(true);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const plan = plans.find((item) => item.id === planId);
  const sessions = scheduledSessions(schedule);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (paymentError) errorRef.current?.focus();
  }, [paymentError]);

  if (!plan) return null;
  const amountLabel = `S/ ${plan.price}`;

  function updateCard(name: keyof CardForm, value: string) {
    const clean =
      name === "number"
        ? formatCardNumber(value)
        : name === "expiry"
          ? formatExpiry(value)
          : name === "cvv"
            ? onlyDigits(value, cvvLength)
            : value.slice(0, cardNameMaxLength);
    setCard((current) => ({ ...current, [name]: clean }));
    setCardErrors((current) => ({ ...current, [name]: undefined }));
    setPaymentError(undefined);
  }

  function updateYapeCode(value: string) {
    setYapeCode(onlyDigits(value, yapeCodeLength));
    setYapeError(undefined);
    setPaymentError(undefined);
  }

  async function pay(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (processing || !plan) return;

    const form = event.currentTarget;
    const amountCents = priceToCents(plan.price);
    let request: PaymentRequest;

    if (method === "card") {
      const errors = validateCard(card);
      const firstError = (Object.keys(errors) as (keyof CardForm)[])[0];
      setCardErrors(errors);
      if (firstError) {
        const control = form.elements.namedItem(`card-${firstError}`);
        if (control instanceof HTMLElement) control.focus();
        return;
      }
      // El CVV no sale del formulario
      request = {
        method: "card",
        cardNumber: onlyDigits(card.number, cardNumberLength),
        amountCents,
      };
    } else {
      const error = validateYapeCode(yapeCode);
      setYapeError(error);
      if (error) {
        const control = form.elements.namedItem("yape-code");
        if (control instanceof HTMLElement) control.focus();
        return;
      }
      request = { method: "yape", approvalCode: yapeCode, amountCents };
    }

    setProcessing(true);
    setPaymentError(undefined);
    try {
      const response = await simulatePayment(request);
      if (!mountedRef.current) return;
      if (response.status === "approved") {
        onApproved(response.payment);
        return;
      }
      setPaymentError(response.message);
    } catch {
      if (mountedRef.current) setPaymentError("No pudimos procesar el pago. Intenta de nuevo.");
    } finally {
      if (mountedRef.current) setProcessing(false);
    }
  }

  return (
    <form data-ui="registration-form" className={formClasses} noValidate onSubmit={pay}>
      <div data-ui="registration-fields" className={fieldsClasses}>
        <div
          data-ui="payment-summary"
          className="flex flex-col gap-2 rounded-control bg-brand-surface px-3.75 py-2.5 text-sm"
        >
          <div className="flex min-w-0 flex-col gap-0.5">
            <strong>Plan {plan.name}</strong>
            <span className="text-xs text-muted">
              {[
                `${membershipDays} días`,
                ...sessions.map(({ day, start }) => `${day.short} ${start}`),
              ].join(" · ")}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2.5 border-t border-line pt-2">
            <span className="text-muted">Total a pagar</span>
            <strong className="text-base text-brand-start">{amountLabel}</strong>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2.5 text-sm">
          <span>
            Método de pago: <strong>{methodLabels[method]}</strong>
          </span>
          <button
            type="button"
            className={linkButtonClasses}
            onClick={onChangeMethod}
            disabled={processing}
          >
            Cambiar
          </button>
        </div>

        {method === "card" ? (
          <>
            <PaymentField id="card-number" label="Número de tarjeta" error={cardErrors.number}>
              <input
                id="card-number"
                name="card-number"
                value={card.number}
                onChange={(event) => updateCard("number", event.target.value)}
                aria-invalid={Boolean(cardErrors.number)}
                aria-describedby={describedBy("card-number", cardErrors.number)}
                className={controlClasses}
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                maxLength={19}
                required
              />
            </PaymentField>
            <PaymentField
              id="card-name"
              label="Nombre en la tarjeta (opcional)"
              error={cardErrors.name}
              optional
            >
              <input
                id="card-name"
                name="card-name"
                value={card.name}
                onChange={(event) => updateCard("name", event.target.value)}
                aria-invalid={Boolean(cardErrors.name)}
                aria-describedby={describedBy("card-name", cardErrors.name)}
                className={controlClasses}
                autoComplete="cc-name"
                placeholder="Como aparece en la tarjeta"
                maxLength={cardNameMaxLength}
              />
            </PaymentField>
            <div className={rowClasses}>
              <PaymentField id="card-expiry" label="Vencimiento" error={cardErrors.expiry}>
                <input
                  id="card-expiry"
                  name="card-expiry"
                  value={card.expiry}
                  onChange={(event) => updateCard("expiry", event.target.value)}
                  aria-invalid={Boolean(cardErrors.expiry)}
                  aria-describedby={describedBy("card-expiry", cardErrors.expiry)}
                  className={controlClasses}
                  inputMode="numeric"
                  autoComplete="cc-exp"
                  placeholder="MM/AA"
                  maxLength={5}
                  required
                />
              </PaymentField>
              <PaymentField id="card-cvv" label="CVV" error={cardErrors.cvv}>
                <input
                  id="card-cvv"
                  name="card-cvv"
                  value={card.cvv}
                  onChange={(event) => updateCard("cvv", event.target.value)}
                  aria-invalid={Boolean(cardErrors.cvv)}
                  aria-describedby={describedBy("card-cvv", cardErrors.cvv)}
                  className={controlClasses}
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="123"
                  maxLength={cvvLength}
                  required
                />
              </PaymentField>
            </div>
            <p className="text-xs text-muted">
              No guardamos el número completo ni el CVV de tu tarjeta.
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <Image
                src="/registration/payment-qr-example.svg"
                alt="QR de ejemplo para el pago"
                width={160}
                height={183}
              />
              <p className="text-sm">
                Monto: <strong className="text-brand-start">{amountLabel}</strong>
              </p>
              <p className="text-xs text-muted">
                Escanea el QR desde tu app y escribe el código de aprobación que recibes.
              </p>
            </div>
            <PaymentField
              id="yape-code"
              label="Código de aprobación"
              error={yapeError}
              hint={`Código de prueba: ${demoPayment.yapeCode}`}
            >
              <input
                id="yape-code"
                name="yape-code"
                value={yapeCode}
                onChange={(event) => updateYapeCode(event.target.value)}
                aria-invalid={Boolean(yapeError)}
                aria-describedby={describedBy("yape-code", yapeError, true)}
                className={controlClasses}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                maxLength={yapeCodeLength}
                required
              />
            </PaymentField>
          </>
        )}

        {paymentError && (
          <p
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="rounded-control border border-brand-start bg-brand-surface px-3.75 py-2
              text-caption text-brand-start focus:outline-none"
          >
            {paymentError} Puedes corregir los datos e intentarlo de nuevo.
          </p>
        )}
      </div>
      <div data-ui="registration-actions" className={`${actionsClasses} justify-between`}>
        <button
          data-ui="registration-back"
          className={`${buttonClasses} ${secondaryButtonClasses}`}
          type="button"
          onClick={onBack}
          disabled={processing}
        >
          Atrás
        </button>
        <button
          className={`${wideButtonClasses} ${primaryActionClasses}`}
          type="submit"
          disabled={processing}
          aria-busy={processing}
        >
          {processing ? "Procesando…" : `Pagar ${amountLabel}`}
        </button>
      </div>
    </form>
  );
}
