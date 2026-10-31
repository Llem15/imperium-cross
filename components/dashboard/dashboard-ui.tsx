import Image from "next/image";
import type { ReactNode } from "react";

export function StatusBadge({
  status,
  label,
}: {
  status: "active" | "pending" | "expired";
  label?: string;
}) {
  const active = status === "active";
  return (
    <span
      className={`inline-flex min-h-6.25 items-center rounded-media px-2.5 py-0.75 text-sm
      ${active ? "bg-status-success-surface text-status-success" : status === "expired" ? "bg-red-100 text-brand-end" : "bg-status-pending-surface text-status-pending"}`}
    >
      {label ?? (active ? "Activo" : status === "expired" ? "Vencida" : "Pendiente")}
    </span>
  );
}

export function RoutineBadge({ children }: { children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-control border border-brand-end
      bg-routine-surface px-1.25 py-0.5 text-sm text-brand-end"
    >
      {children}
    </span>
  );
}

export function DashboardPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-media bg-white px-14 pt-7.5 pb-10 max-xl:px-8 max-sm:px-5 ${className}`}
    >
      {children}
    </section>
  );
}

export function SearchField({
  value,
  onChange,
  label = "Buscar cliente",
}: {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}) {
  return (
    <label className="flex min-h-8 w-full max-w-[318px] items-center gap-2.5 rounded-control border border-muted px-2.5 py-1.25 focus-within:outline-2 focus-within:outline-brand-start">
      <Image src="/dashboard/search.svg" alt="" width={20} height={20} />
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        className="w-full min-w-0 bg-transparent text-xs outline-none placeholder:text-muted"
      />
    </label>
  );
}
