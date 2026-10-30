"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { plans } from "../landing-content";
import { paymentMethods, trainingGoals, validateApplicant } from "./registration-model";
import type { Applicant, ApplicantErrors, PaymentMethod, PlanId } from "./registration-model";

function Field({ name, label, error, children }: {
  name: keyof Applicant;
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="registration-field">
      <label htmlFor={name}>{label}<span aria-hidden="true">*</span></label>
      {children}
      {error && <p id={`${name}-error`} className="registration-error">{error}</p>}
    </div>
  );
}

export function RegistrationForm({ initialPlanId }: { initialPlanId: PlanId }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [data, setData] = useState<Applicant>({ firstName: "", lastName: "", email: "", phone: "", dni: "", goal: "" });
  const [errors, setErrors] = useState<ApplicantErrors>({});
  const [planId, setPlanId] = useState<PlanId>(initialPlanId);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [notice, setNotice] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const noticeRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => { headingRef.current?.focus(); }, [step]);

  function updateField(name: keyof Applicant, value: string) {
    setData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function inputProps(name: keyof Applicant) {
    return {
      id: name,
      value: data[name],
      required: true,
      "aria-invalid": Boolean(errors[name]),
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => updateField(name, event.target.value),
    };
  }

  function nextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateApplicant(data);
    setErrors(nextErrors);
    const firstError = (Object.keys(nextErrors) as (keyof Applicant)[])[0];
    if (firstError) {
      const control = event.currentTarget.elements.namedItem(firstError);
      if (control instanceof HTMLElement) control.focus();
      return;
    }
    setStep(2);
  }

  function continueRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // No se persiste ni se transmite ningún dato. No existe aún un receptor real.
    setNotice(method === "cash"
      ? "El registro en efectivo aún no está disponible. Tus datos no se han guardado. La membresía solo podrá activarse después de registrar la inscripción y confirmar el pago en recepción."
      : "El pago en línea todavía no está disponible. No se realizó ningún cargo ni se activó una membresía. La integración de Tarjeta y Yape está pendiente.");
    requestAnimationFrame(() => noticeRef.current?.focus());
  }

  return (
    <section className="registration-card" aria-labelledby="registration-title">
      <header className="registration-heading">
        <Image src={`/registration/progress-${step === 1 ? "one" : "two"}.svg`} alt="" width={94} height={4} />
        <p>Paso {step} de 2</p>
        <h1 id="registration-title" tabIndex={-1} ref={headingRef}>{step === 1 ? "Tus datos" : "Elige tu plan"}</h1>
      </header>

      {step === 1 ? (
        <form className="registration-form" noValidate onSubmit={nextStep}>
          <div className="registration-fields">
            <div className="registration-row">
              <Field name="firstName" label="Nombres" error={errors.firstName}><input {...inputProps("firstName")} autoComplete="given-name" placeholder="Ana Maria" maxLength={80} /></Field>
              <Field name="lastName" label="Apellidos" error={errors.lastName}><input {...inputProps("lastName")} autoComplete="family-name" placeholder="Torres Huaman" maxLength={80} /></Field>
            </div>
            <Field name="email" label="Correo electrónico" error={errors.email}><input {...inputProps("email")} type="email" autoComplete="email" placeholder="anatorres@correo.com" maxLength={254} /></Field>
            <div className="registration-row">
              <Field name="phone" label="Teléfono" error={errors.phone}><input {...inputProps("phone")} type="tel" autoComplete="tel" placeholder="999 999 999" maxLength={20} /></Field>
              <Field name="dni" label="DNI" error={errors.dni}><input {...inputProps("dni")} inputMode="numeric" autoComplete="off" placeholder="99999999" maxLength={8} pattern="[0-9]{8}" /></Field>
            </div>
            <Field name="goal" label="¿Cuál es tu objetivo de entrenamiento?" error={errors.goal}>
              <select {...inputProps("goal")}><option value="">Seleccionar</option>{trainingGoals.map((goal) => <option key={goal} value={goal}>{goal}</option>)}</select>
            </Field>
            {Object.values(errors).some(Boolean) && <p className="registration-error" role="alert">Revisa los campos indicados para continuar.</p>}
          </div>
          <div className="registration-actions registration-next"><button className="registration-primary" type="submit">Siguiente</button></div>
        </form>
      ) : (
        <form className="registration-form" onSubmit={continueRegistration}>
          <div className="registration-fields">
            <div className="registration-field">
              <label htmlFor="plan">Planes<span aria-hidden="true">*</span></label>
              <select id="plan" name="plan" required value={planId} onChange={(event) => {
                const selected = plans.find((plan) => plan.id === event.target.value);
                if (selected) setPlanId(selected.id);
                setNotice("");
              }}>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} — S/ {plan.price} mensual</option>)}</select>
            </div>
            <fieldset className="registration-payment">
              <legend>Método de pago<span aria-hidden="true">*</span></legend>
              {paymentMethods.map((payment) => (
                <label className="registration-payment-option" key={payment.id}>
                  <input type="radio" name="payment" value={payment.id} checked={method === payment.id} onChange={() => { setMethod(payment.id); setNotice(""); }} required aria-describedby="payment-availability" />
                  <Image src={`/registration/radio-${method === payment.id ? "selected" : "unselected"}.svg`} alt="" width={15} height={15} />
                  <span><span className="payment-label">{payment.label}</span><span className="payment-description">{payment.description}</span></span>
                </label>
              ))}
            </fieldset>
            <p id="payment-availability" className="registration-availability">{method === "cash" ? "Registro pendiente de implementación. No se guardarán tus datos todavía." : "Pago en línea no disponible todavía. No se solicitarán datos bancarios ni se realizarán cargos."}</p>
            <p className="registration-notice" role="status" tabIndex={-1} ref={noticeRef}>{notice}</p>
          </div>
          <div className="registration-actions">
            <button className="registration-back" type="button" onClick={() => { setNotice(""); setStep(1); }}>Atrás</button>
            <button className="registration-primary" type="submit">{method === "cash" ? "Continuar" : "Pagar"}</button>
          </div>
        </form>
      )}
    </section>
  );
}
