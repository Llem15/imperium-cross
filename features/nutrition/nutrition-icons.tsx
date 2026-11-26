// CÓDIGO DE SECCIÓN NUTRICIONAL
// ICONOS DECORATIVOS (aria-hidden); EL TEXTO ACCESIBLE LO PONE CADA BOTÓN O TÍTULO.
import type { ReactNode } from "react";

function Icon({ children, className = "size-5" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function UploadIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M12 15V4m0 0-4 4m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />
    </Icon>
  );
}

export function ImageIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <circle cx="9" cy="9" r="1.8" />
      <path d="m20.5 15-4.5-4.5L6 20.5" />
    </Icon>
  );
}

export function PlateIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 4v5a2 2 0 0 0 2 2m0-7v16M21 4c-1.5 0-2 2-2 4s.5 3 2 3m0-7v16" />
    </Icon>
  );
}

export function BulbIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M9 18h6m-5 3h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3Z" />
    </Icon>
  );
}

export function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="m15 18-6-6 6-6" />
    </Icon>
  );
}

export function TrashIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l.8 12.2a1.5 1.5 0 0 0 1.5 1.3h6.4a1.5 1.5 0 0 0 1.5-1.3L17.5 7M10 11v6m4-6v6" />
    </Icon>
  );
}

export function AlertIcon({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5m0 3.5h.01" />
    </Icon>
  );
}
