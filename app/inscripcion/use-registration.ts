"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { plans } from "../landing-content";
import { getAvailableSessions, getWeeklySessionsByPlan } from "./registration-data";
import {
  planForSessions,
  removeSession,
  scheduledSessions,
  sessionsLabel,
  toggleSession,
  validateApplicant,
} from "./registration-model";
import type {
  Applicant,
  ApplicantErrors,
  PaymentMethod,
  PlanId,
  RegistrationOptions,
  Weekday,
  WeeklySchedule,
} from "./registration-model";
import type { PaymentResult } from "./registration-payment-model";

export type RegistrationStep = 1 | 2 | 3 | 4;

export function useRegistration(initialPlanId: PlanId) {
  const [step, setStep] = useState<RegistrationStep>(1);
  const [data, setData] = useState<Applicant>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    dni: "",
    goal: "",
  });
  const [errors, setErrors] = useState<ApplicantErrors>({});
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [options, setOptions] = useState<RegistrationOptions | null>(null);
  const [optionsFailed, setOptionsFailed] = useState(false);
  const [optionsRequest, setOptionsRequest] = useState(0);
  const [planId, setPlanId] = useState<PlanId>(initialPlanId);
  const [planNotice, setPlanNotice] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [payment, setPayment] = useState<PaymentResult | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([getAvailableSessions(), getWeeklySessionsByPlan()])
      .then(([availability, sessionsByPlan]) => {
        if (active) setOptions({ availability, sessionsByPlan });
      })
      .catch(() => {
        if (active) setOptionsFailed(true);
      });

    return () => {
      active = false;
    };
  }, [optionsRequest]);

  function retryOptions() {
    setOptionsFailed(false);
    setOptionsRequest((current) => current + 1);
  }

  function updateField(name: keyof Applicant, value: string) {
    const clean =
      name === "firstName" || name === "lastName"
        ? value
            .replace(/[^\p{L} ]/gu, "")
            .replace(/ {2,}/g, " ")
            .trimStart()
            .slice(0, 30)
        : name === "phone"
          ? value.replace(/\D/g, "").slice(0, 9)
          : name === "dni"
            ? value.replace(/\D/g, "").slice(0, 8)
            : name === "password"
              ? value.slice(0, 64)
              : value;
    setData((current) => ({ ...current, [name]: clean }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }

  function nextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateApplicant(data);
    const firstError = (Object.keys(nextErrors) as (keyof Applicant)[])[0];
    setErrors(nextErrors);

    if (firstError) {
      const control = event.currentTarget.elements.namedItem(firstError);
      if (control instanceof HTMLElement) control.focus();
      return;
    }

    setStep(2);
  }

  function toggleScheduleSession(day: Weekday, start: string) {
    setSchedule((current) => toggleSession(current, day, start));
  }

  function removeScheduleSession(day: Weekday) {
    setSchedule((current) => removeSession(current, day));
  }

  function confirmSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const count = scheduledSessions(schedule).length;
    if (!options || count === 0) return;

    const nextPlanId = planForSessions(planId, options.sessionsByPlan, count);
    const nextPlan = plans.find((plan) => plan.id === nextPlanId);
    setPlanNotice(
      nextPlanId !== planId && nextPlan
        ? `Cambiamos a ${nextPlan.name} porque elegiste ${sessionsLabel(count)}.`
        : null,
    );
    setPlanId(nextPlanId);
    setStep(3);
  }

  function selectPlan(nextPlanId: PlanId) {
    setPlanId(nextPlanId);
    setPlanNotice(null);
  }

  // Efectivo no pasa por la pasarela
  function continueRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (method === "cash") {
      // Solo cambia la vista local
      setCompleted(true);
    } else {
      setStep(4);
    }
  }

  // Solo llega el resultado: método, número de operación y últimos 4 dígitos
  function completePayment(result: PaymentResult) {
    setPayment(result);
    setCompleted(true);
  }

  function goToStep(nextStep: RegistrationStep) {
    setStep(nextStep);
  }

  return {
    step,
    data,
    errors,
    schedule,
    options,
    optionsFailed,
    planId,
    planNotice,
    method,
    payment,
    completed,
    updateField,
    nextStep,
    retryOptions,
    toggleScheduleSession,
    removeScheduleSession,
    confirmSchedule,
    selectPlan,
    setMethod,
    continueRegistration,
    completePayment,
    goToStep,
  };
}
