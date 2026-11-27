import { actionBaseClasses } from "../ui-styles";

export const controlClasses = [
  "min-h-control w-full min-w-0 rounded-control border border-muted bg-white",
  "px-3.75 py-2.5 text-sm placeholder:text-muted placeholder:opacity-100",
  "aria-invalid:border-brand-start max-compact:px-2.5 max-small:px-2",
].join(" ");

const buttonBaseClasses = [
  actionBaseClasses,
  "min-h-control cursor-pointer text-base hover:brightness-[.94]",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100",
].join(" ");

export const buttonClasses = `${buttonBaseClasses} w-form-action`;
// Para textos largos como "Finalizar inscripción"
export const wideButtonClasses = `${buttonBaseClasses} min-w-form-action px-5`;

export const secondaryButtonClasses = "border border-brand-start bg-white text-brand-start";
export const actionsClasses = "mt-auto flex gap-5 pt-7.5 max-small:gap-3";
export const fieldsClasses = "flex flex-col gap-3.75";
export const rowClasses = "grid grid-cols-2 gap-3.75 max-small:gap-2.5";
export const formClasses = "mt-6 flex min-h-0 flex-col max-compact:mt-10";
export const labelClasses = "text-base font-bold max-compact:text-sm";
export const linkButtonClasses =
  "cursor-pointer text-sm font-medium text-brand-start underline hover:text-brand-end";

export const optionClasses = [
  "relative flex cursor-pointer items-center gap-2.5 rounded-control border px-3.75 py-2.5",
  "focus-within:outline-3 focus-within:outline-solid",
  "focus-within:outline-offset-3 focus-within:outline-brand-start",
].join(" ");
