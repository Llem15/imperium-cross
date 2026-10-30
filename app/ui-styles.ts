export const actionBaseClasses = [
  "inline-flex items-center justify-center rounded-card p-2.5",
  "text-center font-bold",
].join(" ");

export const primaryActionClasses = [
  "bg-linear-to-r/srgb from-brand-start to-brand-end text-white",
].join(" ");

export const landingActionSizes = {
  standard: "min-h-12 w-landing-action text-xl",
  header: "min-h-[39px] w-[153px] text-base",
  plan: "min-h-12 w-landing-action text-base max-lg:w-full max-md:w-landing-action",
} as const;
