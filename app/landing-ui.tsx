import Image from "next/image";
import type { ReactNode } from "react";
import type { PhotoCrop } from "./landing-content";
import { actionBaseClasses, landingActionSizes, primaryActionClasses } from "./ui-styles";

type PhotoProps = {
  name: string;
  alt?: string;
  crop?: PhotoCrop;
  preload?: boolean;
};

export function Photo({ name, alt = "", crop, preload = false }: PhotoProps) {
  return (
    <div
      data-ui="photo-frame"
      className="pointer-events-none absolute top-0 left-0 h-full w-full"
      style={crop}
    >
      <Image
        src={`/landing/${name}.png`}
        alt={alt}
        fill
        sizes="(max-width: 767px) 100vw, (max-width: 1100px) 50vw, 1440px"
        className="object-cover"
        preload={preload}
      />
    </div>
  );
}

type LandingActionProps = {
  href: string;
  children: ReactNode;
  outline?: boolean;
  size?: "standard" | "header";
  className?: string;
};

export function LandingAction({
  href,
  children,
  outline = false,
  size = "standard",
  className = "",
}: LandingActionProps) {
  const appearance = outline
    ? "border-2 border-white bg-transparent text-white"
    : primaryActionClasses;

  return (
    <a
      data-ui="landing-button"
      href={href}
      className={[
        actionBaseClasses,
        landingActionSizes[size],
        appearance,
        "hover:brightness-[.93]",
        className,
      ].join(" ")}
    >
      {children}
    </a>
  );
}

const sectionWidths = {
  content: "max-w-content",
  benefits: "max-w-benefits",
  wide: "max-w-wide",
} as const;

type LandingSectionProps = {
  id?: string;
  headingId: string;
  title: string;
  subtitle?: string;
  width?: keyof typeof sectionWidths;
  className: string;
  children: ReactNode;
};

export function LandingSection({
  id,
  headingId,
  title,
  subtitle,
  width = "content",
  className,
  children,
}: LandingSectionProps) {
  const heading = (
    <h2 id={headingId} className="text-center text-2xl font-bold">
      {title}
    </h2>
  );

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={[
        "mx-auto max-wide:mx-6 max-md:mx-5 max-md:mt-22",
        sectionWidths[width],
        className,
      ].join(" ")}
    >
      {subtitle ? (
        <div>
          {heading}
          <p className="mt-2.5 text-center">{subtitle}</p>
        </div>
      ) : (
        heading
      )}
      {children}
    </section>
  );
}
