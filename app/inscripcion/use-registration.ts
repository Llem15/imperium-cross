"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { validateApplicant } from "./registration-model";
import type { Applicant, ApplicantErrors, PaymentMethod, PlanId } from "./registration-model";

export function useRegistration(initialPlanId: PlanId) {
  const [step, setStep] = useState<1 | 2>(1);
  const [data, setData] = useState<Applicant>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dni: "",
    goal: "",
  });
  const [errors, setErrors] = useState<ApplicantErrors>({});
  const [planId, setPlanId] = useState<PlanId>(initialPlanId);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [completed, setCompleted] = useState(false);

  function updateField(name: keyof Applicant, value: string) {
    setData((current) => ({ ...current, [name]: value }));
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

  function continueRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Solo cambia la vista local
    setCompleted(true);
  }

  function previousStep() {
    setStep(1);
  }

  return {
    step,
    data,
    errors,
    planId,
    method,
    completed,
    updateField,
    nextStep,
    previousStep,
    continueRegistration,
    setPlanId,
    setMethod,
  };
}
