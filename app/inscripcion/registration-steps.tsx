"use client";

import Image from "next/image";
import { useState } from "react";
import type { ChangeEvent, FormEvent, ReactNode } from "react";
import { plans } from "../landing-content";
import { primaryActionClasses } from "../ui-styles";
import {
  canScheduleDay,
  formatSession,
  paymentMethods,
  planCoversSessions,
  scheduledSessions,
  sessionsLabel,
  trainingGoals,
  weekdays,
} from "./registration-model";
import type {
  Applicant,
  ApplicantErrors,
  PaymentMethod,
  PlanId,
  PlanSessions,
  Weekday,
  WeeklyAvailability,
  WeeklySchedule,
} from "./registration-model";
import {
  actionsClasses,
  buttonClasses,
  controlClasses,
  fieldsClasses,
  formClasses,
  labelClasses,
  linkButtonClasses,
  optionClasses,
  rowClasses,
  secondaryButtonClasses,
  wideButtonClasses,
} from "./registration-styles";

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
        <RequiredMark />
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

function RequiredMark() {
  return (
    <span className="text-brand-end" aria-hidden="true">
      *
    </span>
  );
}

function RadioMark({ selected, disabled = false }: { selected: boolean; disabled?: boolean }) {
  return (
    <Image
      src={`/registration/radio-${selected ? "selected" : "unselected"}.svg`}
      alt=""
      width={15}
      height={15}
      className={`shrink-0 ${disabled ? "opacity-40" : ""}`}
    />
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      data-ui="registration-back"
      className={`${buttonClasses} ${secondaryButtonClasses}`}
      type="button"
      onClick={onClick}
    >
      Atrás
    </button>
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
              autoComplete="off"
              placeholder=""
              maxLength={80}
            />
          </Field>
          <Field name="lastName" label="Apellidos" error={errors.lastName}>
            <input
              {...inputProps("lastName")}
              className={controlClasses}
              autoComplete="off"
              placeholder=""
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
            placeholder="example@correo.com"
            maxLength={254}
          />
        </Field>
        <div data-ui="registration-row" className={rowClasses}>
          <Field name="phone" label="Teléfono" error={errors.phone}>
            <input
              {...inputProps("phone")}
              className={controlClasses}
              type="tel"
              inputMode="numeric"
              autoComplete="off"
              placeholder="999 999 999"
              maxLength={9}
            />
          </Field>
          <Field name="dni" label="DNI" error={errors.dni}>
            <input
              {...inputProps("dni")}
              className={controlClasses}
              inputMode="numeric"
              autoComplete="off"
              placeholder="Nro. Documento"
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

type ScheduleStepProps = {
  availability: WeeklyAvailability;
  limit: number;
  schedule: WeeklySchedule;
  onToggle: (day: Weekday, start: string) => void;
  onRemove: (day: Weekday) => void;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function ScheduleStep({
  availability,
  limit,
  schedule,
  onToggle,
  onRemove,
  onBack,
  onSubmit,
}: ScheduleStepProps) {
  const [activeDay, setActiveDay] = useState<Weekday>(1);
  const sessions = scheduledSessions(schedule);
  const day = weekdays.find((item) => item.id === activeDay) ?? weekdays[0];
  const starts = availability[activeDay];
  const canSchedule = canScheduleDay(schedule, activeDay, limit);

  return (
    <form data-ui="registration-form" className={formClasses} onSubmit={onSubmit}>
      <div data-ui="registration-fields" className={fieldsClasses}>
        <p className="text-caption text-muted">
          Escoge los días y horas en que vas a entrenar. Según cuántas sesiones elijas, te
          mostraremos los planes que las incluyen.
        </p>
        <p
          data-ui="schedule-counter"
          className="flex items-center justify-between gap-2.5 rounded-control bg-brand-surface
            px-3.75 py-2.5 text-sm"
        >
          <span className="text-muted">Sesiones por semana</span>
          <span className="font-bold text-brand-start" aria-live="polite">
            {sessionsLabel(sessions.length)} {sessions.length === 1 ? "elegida" : "elegidas"}
          </span>
        </p>
        <div className="flex flex-col gap-2.5">
          <span id="schedule-days" className={labelClasses}>
            Día
          </span>
          <div role="group" aria-labelledby="schedule-days" className="grid grid-cols-5 gap-1.5">
            {weekdays.map((item) => {
              const isActive = item.id === activeDay;
              const hasSession = Boolean(schedule[item.id]);

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={isActive}
                  aria-label={`${item.name}${hasSession ? ", con horario elegido" : ""}`}
                  onClick={() => setActiveDay(item.id)}
                  className={[
                    "flex min-h-11 cursor-pointer flex-col items-center justify-center gap-1",
                    "rounded-control border text-caption",
                    isActive
                      ? "border-brand-start bg-brand-surface font-bold text-brand-start"
                      : "border-line bg-white font-medium",
                  ].join(" ")}
                >
                  {item.short}
                  <span
                    aria-hidden="true"
                    className={`size-1.5 rounded-full ${hasSession ? "bg-brand-start" : ""}`}
                  />
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-2.5">
          <span id="schedule-sessions" className={labelClasses}>
            Horarios disponibles el {day.name}
          </span>
          {starts.length > 0 ? (
            <div
              role="group"
              aria-labelledby="schedule-sessions"
              className="grid grid-cols-2 gap-2"
            >
              {starts.map((start) => {
                const isSelected = schedule[activeDay] === start;

                return (
                  <button
                    key={start}
                    type="button"
                    aria-pressed={isSelected}
                    disabled={!canSchedule}
                    onClick={() => onToggle(activeDay, start)}
                    className={[
                      "min-h-11 cursor-pointer rounded-control text-sm",
                      "disabled:cursor-not-allowed disabled:border-dashboard-line",
                      "disabled:bg-dashboard-canvas disabled:text-muted",
                      isSelected
                        ? `${primaryActionClasses} font-semibold`
                        : "border border-line bg-white",
                    ].join(" ")}
                  >
                    {formatSession(start)}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-caption text-muted">No hay horarios con cupo este día.</p>
          )}
          <p className="text-xs text-muted">
            {canSchedule
              ? "Máximo 1 sesión por día."
              : `Llegaste al máximo de ${sessionsLabel(limit)} por semana.`}
          </p>
        </div>
        <p className="text-xs text-muted">
          Solo ves horarios con cupo. Cada sesión dura 60 min y se repite cada semana hasta que
          termine tu membresía.
        </p>
        <div className="flex flex-col gap-2.5">
          <span className={labelClasses}>Tus horarios</span>
          {sessions.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {sessions.map((session) => (
                <li
                  key={session.day.id}
                  className="flex items-center justify-between gap-2.5 rounded-control border
                    border-line px-3.75 py-1.5 text-sm"
                >
                  <span>
                    <span className="capitalize">{session.day.name}</span> ·{" "}
                    {formatSession(session.start)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Quitar horario del ${session.day.name}`}
                    onClick={() => onRemove(session.day.id)}
                    className="size-8 shrink-0 cursor-pointer rounded-full text-xl leading-none
                      text-brand-start hover:bg-brand-surface"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-caption text-muted">Aún no eliges ningún horario.</p>
          )}
        </div>
      </div>
      <div data-ui="registration-actions" className={`${actionsClasses} justify-between`}>
        <BackButton onClick={onBack} />
        <button
          className={`${buttonClasses} ${primaryActionClasses}`}
          type="submit"
          disabled={sessions.length === 0}
        >
          Siguiente
        </button>
      </div>
    </form>
  );
}

type PlanPaymentStepProps = {
  planId: PlanId;
  method: PaymentMethod;
  schedule: WeeklySchedule;
  sessionsByPlan: PlanSessions;
  notice: string | null;
  onPlanChange: (planId: PlanId) => void;
  onMethodChange: (method: PaymentMethod) => void;
  onChangeSchedule: () => void;
  onBack: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function PlanPaymentStep({
  planId,
  method,
  schedule,
  sessionsByPlan,
  notice,
  onPlanChange,
  onMethodChange,
  onChangeSchedule,
  onBack,
  onSubmit,
}: PlanPaymentStepProps) {
  const sessions = scheduledSessions(schedule);
  const count = sessions.length;
  const plan = plans.find((item) => item.id === planId);
  const submitLabel = method === "cash" ? "Finalizar inscripción" : `Pagar S/ ${plan?.price}`;

  return (
    <form data-ui="registration-form" className={formClasses} onSubmit={onSubmit}>
      <div data-ui="registration-fields" className={fieldsClasses}>
        <div
          data-ui="registration-schedule-summary"
          className="flex items-center justify-between gap-2.5 rounded-control bg-brand-surface
            px-3.75 py-2.5 text-sm"
        >
          <span className="flex min-w-0 flex-col gap-0.5">
            <strong>Tus horarios · {sessionsLabel(count)}</strong>
            <span className="text-xs text-muted">
              {sessions.map((session) => `${session.day.short} ${session.start}`).join(" · ")}
            </span>
          </span>
          <button type="button" className={linkButtonClasses} onClick={onChangeSchedule}>
            Cambiar
          </button>
        </div>
        <fieldset className="min-w-0 border-0">
          <legend className={`${labelClasses} mb-2.5`}>
            Planes
            <RequiredMark />
          </legend>
          <div className="flex flex-col gap-2.5">
            {plans.map((item) => {
              const isSelected = planId === item.id;
              const sessionsLimit = sessionsByPlan[item.id];
              const isCovered = planCoversSessions(sessionsByPlan, item.id, count);
              const detail = isCovered
                ? `Hasta ${sessionsLimit} sesiones/semana · 30 días`
                : `Hasta ${sessionsLimit} sesiones/semana · no cubre tus ${count}`;

              return (
                <label
                  data-ui="registration-plan-option"
                  key={item.id}
                  className={[
                    optionClasses,
                    "min-h-[58px] justify-between",
                    !isCovered
                      ? "cursor-not-allowed border-dashboard-line bg-dashboard-canvas text-muted"
                      : isSelected
                        ? "border-brand-start bg-brand-surface"
                        : "border-muted",
                  ].join(" ")}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={item.id}
                    checked={isSelected}
                    disabled={!isCovered}
                    onChange={() => onPlanChange(item.id)}
                    className="absolute left-3.75 size-3.75 opacity-0"
                    required
                  />
                  <span className="flex min-w-0 items-center gap-2.5">
                    <RadioMark selected={isSelected} disabled={!isCovered} />
                    <span>
                      <span className="block text-sm font-bold">Plan {item.name}</span>
                      <span className="block text-xs text-muted">{detail}</span>
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold">S/ {item.price}</span>
                </label>
              );
            })}
          </div>
          {notice && (
            <p className="mt-2.5 text-caption text-brand-start" role="status">
              {notice}
            </p>
          )}
        </fieldset>
        <fieldset className="min-w-0 border-0">
          <legend className={`${labelClasses} mb-2.5`}>
            Método de pago
            <RequiredMark />
          </legend>
          {paymentMethods.map((payment, index) => {
            const isSelected = method === payment.id;

            return (
              <label
                data-ui="registration-payment-option"
                key={payment.id}
                className={[
                  optionClasses,
                  "min-h-[54px] border-muted",
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
                <RadioMark selected={isSelected} />
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
        <BackButton onClick={onBack} />
        <button className={`${wideButtonClasses} ${primaryActionClasses}`} type="submit">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
