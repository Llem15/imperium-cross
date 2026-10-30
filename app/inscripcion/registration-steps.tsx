import Image from "next/image";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { plans } from "../landing-content";
import { actionBaseClasses, primaryActionClasses } from "../ui-styles";
import { paymentMethods, trainingGoals } from "./registration-model";
import type { Applicant, ApplicantErrors, PaymentMethod, PlanId } from "./registration-model";

const controlClasses = [
  "min-h-control w-full min-w-0 rounded-control border border-muted bg-white",
  "px-3.75 py-2.5 text-sm placeholder:text-muted placeholder:opacity-100",
  "aria-invalid:border-brand-start max-compact:px-2.5 max-small:px-2",
].join(" ");

const buttonClasses = [
  actionBaseClasses,
  "min-h-control w-form-action cursor-pointer text-base hover:brightness-[.94]",
].join(" ");

const actionsClasses = "mt-auto flex gap-5 pt-7.5 max-small:gap-3";
const fieldsClasses = "flex flex-col gap-3.75";
const rowClasses = "grid grid-cols-2 gap-3.75 max-small:gap-2.5";
const formClasses = "mt-12.5 flex min-h-[490px] flex-col max-compact:mt-10";
const labelClasses = "text-base font-bold max-compact:text-sm";

type FieldProps = {
  name: keyof Applicant;
  label: string;
  error?: string;
  children: ReactNode;
};

function Field({ name, label, error, children }: FieldProps) {
  return (
    <div data-ui="registration-field" className="flex min-w-0 flex-col gap-2.5">
      <label htmlFor={name} className={labelClasses}>
        {label}
        <span className="text-brand-end" aria-hidden="true">
          *
        </span>
      </label>
      {children}
      {error && (
        <p id={`${name}-error`} className="text-caption text-brand-start">
          {error}
        </p>
      )}
    </div>
  );
}

type ApplicantStepProps = {
  data: Applicant;
  errors: ApplicantErrors;
  onChange: (name: keyof Applicant, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ApplicantStep({ data, errors, onChange, onSubmit }: ApplicantStepProps) {
  const hasErrors = Object.values(errors).some(Boolean);

  function inputProps(name: keyof Applicant) {
    return {
      id: name,
      value: data[name],
      required: true,
      "aria-invalid": Boolean(errors[name]),
      "aria-describedby": errors[name] ? `${name}-error` : undefined,
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        onChange(name, event.target.value);
      },
    };
  }

  return (
    <form data-ui="registration-form" className={formClasses} noValidate onSubmit={onSubmit}>
      <div data-ui="registration-fields" className={fieldsClasses}>
        <div data-ui="registration-row" className={rowClasses}>
          <Field name="firstName" label="Nombres" error={errors.firstName}>
            <input
              {...inputProps("firstName")}
              className={controlClasses}
              autoComplete="given-name"
              placeholder="Ana Maria"
              maxLength={80}
            />
          </Field>
          <Field name="lastName" label="Apellidos" error={errors.lastName}>
            <input
              {...inputProps("lastName")}
              className={controlClasses}
              autoComplete="family-name"
              placeholder="Torres Huaman"
              maxLength={80}
            />
          </Field>
        </div>
        <Field name="email" label="Correo electrónico" error={errors.email}>
          <input
            {...inputProps("email")}
            className={controlClasses}
            type="email"
            autoComplete="email"
            placeholder="anatorres@correo.com"
            maxLength={254}
          />
        </Field>
        <div data-ui="registration-row" className={rowClasses}>
          <Field name="phone" label="Teléfono" error={errors.phone}>
            <input
              {...inputProps("phone")}
              className={controlClasses}
              type="tel"
              autoComplete="tel"
              placeholder="999 999 999"
              maxLength={20}
            />
          </Field>
          <Field name="dni" label="DNI" error={errors.dni}>
            <input
              {...inputProps("dni")}
              className={controlClasses}
              inputMode="numeric"
              autoComplete="off"
              placeholder="99999999"
              maxLength={8}
              pattern="[0-9]{8}"
            />
          </Field>
        </div>
        <Field name="goal" label="¿Cuál es tu objetivo de entrenamiento?" error={errors.goal}>
          <select {...inputProps("goal")} className={`${controlClasses} pr-2`}>
            <option value="">Seleccionar</option>
            {trainingGoals.map((goal) => (
              <option key={goal} value={goal}>
                {goal}
              </option>
            ))}
          </select>
        </Field>
        {hasErrors && (
          <p className="text-caption text-brand-start" role="alert">
            Revisa los campos indicados para continuar.
          </p>
        )}
      </div>
      <div data-ui="registration-actions" className={`${actionsClasses} justify-end`}>
        <button className={`${buttonClasses} ${primaryActionClasses}`} type="submit">
          Siguiente
        </button>
      </div>
    </form>
  );
}

type PlanPaymentStepProps = {
  planId: PlanId;
  method: PaymentMethod;
  onPlanChange: (planId: PlanId) => void;
  onMethodChange: (method: PaymentMethod) => void;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PlanPaymentStep({
  planId,
  method,
  onPlanChange,
  onMethodChange,
  onBack,
  onSubmit,
}: PlanPaymentStepProps) {
  function handlePlanChange(event: ChangeEvent<HTMLSelectElement>) {
    const selected = plans.find((plan) => plan.id === event.target.value);
    if (selected) onPlanChange(selected.id);
  }

  return (
    <form data-ui="registration-form" className={formClasses} onSubmit={onSubmit}>
      <div data-ui="registration-fields" className={fieldsClasses}>
        <div data-ui="registration-field" className="flex min-w-0 flex-col gap-2.5">
          <label htmlFor="plan" className={labelClasses}>
            Planes
            <span className="text-brand-end" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="plan"
            name="plan"
            required
            value={planId}
            onChange={handlePlanChange}
            className={`${controlClasses} pr-2`}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} — S/ {plan.price} mensual
              </option>
            ))}
          </select>
        </div>
        <fieldset className="min-w-0 border-0">
          <legend className={`${labelClasses} mb-2.5`}>
            Método de pago
            <span className="text-brand-end" aria-hidden="true">
              *
            </span>
          </legend>
          {paymentMethods.map((payment, index) => {
            const isSelected = method === payment.id;
            const radioAsset = isSelected ? "selected" : "unselected";

            return (
              <label
                data-ui="registration-payment-option"
                key={payment.id}
                className={[
                  "relative flex min-h-[54px] cursor-pointer items-center gap-2.5",
                  "rounded-control border border-muted px-3.75 py-2.5",
                  "focus-within:outline-3 focus-within:outline-solid",
                  "focus-within:outline-offset-3 focus-within:outline-brand-start",
                  index > 0 ? "mt-2.5" : "",
                ].join(" ")}
              >
                <input
                  type="radio"
                  name="payment"
                  value={payment.id}
                  checked={isSelected}
                  onChange={() => onMethodChange(payment.id)}
                  className="absolute left-3.75 size-3.75 opacity-0"
                  required
                />
                <Image
                  src={`/registration/radio-${radioAsset}.svg`}
                  alt=""
                  width={15}
                  height={15}
                  className="shrink-0"
                />
                <span>
                  <span className="block text-sm font-medium">{payment.label}</span>
                  <span className="block text-xs text-muted">{payment.description}</span>
                </span>
              </label>
            );
          })}
        </fieldset>
      </div>
      <div data-ui="registration-actions" className={`${actionsClasses} justify-between`}>
        <button
          data-ui="registration-back"
          className={`${buttonClasses} border border-brand-start bg-white text-brand-start`}
          type="button"
          onClick={onBack}
        >
          Atrás
        </button>
        <button className={`${buttonClasses} ${primaryActionClasses}`} type="submit">
          {method === "cash" ? "Continuar" : "Pagar"}
        </button>
      </div>
    </form>
  );
}
