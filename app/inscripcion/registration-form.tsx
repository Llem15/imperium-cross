"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { RegistrationConfirmation } from "./registration-confirmation";
import type { PlanId } from "./registration-model";
import { ApplicantStep, PlanPaymentStep } from "./registration-steps";
import { useRegistration } from "./use-registration";

export function RegistrationForm({ initialPlanId }: { initialPlanId: PlanId }) {
  const registration = useRegistration(initialPlanId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isApplicantStep = registration.step === 1;
  const progressAsset = isApplicantStep ? "one" : "two";
  const title = isApplicantStep ? "Tus datos" : "Elige tu plan";

  useEffect(() => {
    headingRef.current?.focus();
  }, [registration.step]);

  if (registration.completed) {
    return (
      <RegistrationConfirmation
        preview={{ planId: registration.planId, method: registration.method }}
      />
    );
  }

  return (
    <section
      data-ui="registration-card"
      aria-labelledby="registration-title"
      className="min-h-[712px] w-full max-w-registration rounded-dialog border border-ink
        bg-white p-[46px] text-ink max-compact:px-6 max-compact:py-8 max-small:px-4.5"
    >
      <header
        data-ui="registration-heading"
        className="flex flex-col items-center gap-3.75 text-center"
      >
        <Image src={`/registration/progress-${progressAsset}.svg`} alt="" width={94} height={4} />
        <p className="text-sm text-muted">Paso {registration.step} de 2</p>
        <h1
          id="registration-title"
          tabIndex={-1}
          ref={headingRef}
          className="text-2xl font-bold focus:outline-none"
        >
          {title}
        </h1>
      </header>
      {isApplicantStep ? (
        <ApplicantStep
          data={registration.data}
          errors={registration.errors}
          onChange={registration.updateField}
          onSubmit={registration.nextStep}
        />
      ) : (
        <PlanPaymentStep
          planId={registration.planId}
          method={registration.method}
          onPlanChange={registration.setPlanId}
          onMethodChange={registration.setMethod}
          onBack={registration.previousStep}
          onSubmit={registration.continueRegistration}
        />
      )}
    </section>
  );
}
