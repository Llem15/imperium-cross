"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { ButtonHTMLAttributes, FormEvent, ReactNode } from "react";
import { DashboardPanel } from "./dashboard-ui";
import { Dialog } from "@/components/ui/dialog";

export function Button({
  children,
  variant = "primary",
  small = false,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "danger";
  small?: boolean;
}) {
  const appearance =
    variant === "outline"
      ? "border border-brand-end bg-white text-brand-start"
      : "bg-linear-to-r/srgb from-brand-start to-brand-end text-white";
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-media px-4 py-2.5 text-sm hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-45 ${small ? "min-h-9.5 font-normal" : "min-h-10 font-bold"} ${appearance} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="my-4 border-l-3 border-brand-start bg-brand-surface px-3 py-2 text-caption"
    >
      {children}
    </p>
  );
}

export function ManagementPanel({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <DashboardPanel className="min-h-[583px]">
      <div className="flex items-start justify-between gap-5 max-xl:flex-col">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="mt-1.25 text-sm text-line">{subtitle}</p>}
        </div>
        {actions && (
          <div className="flex w-full max-w-full flex-wrap items-center gap-3 xl:w-auto xl:flex-nowrap">
            {actions}
          </div>
        )}
      </div>
      {children}
    </DashboardPanel>
  );
}

export type Column<T> = { label: string; render: (row: T) => ReactNode };

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  caption,
  minWidth = 800,
}: {
  rows: readonly T[];
  columns: readonly Column<T>[];
  caption: string;
  minWidth?: number;
}) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / 6));
  const currentPage = Math.min(page, pageCount);
  const visible = rows.slice((currentPage - 1) * 6, currentPage * 6);
  return (
    <>
      <div
        role="region"
        aria-label={caption}
        tabIndex={0}
        className="mt-18.75 max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-brand-start max-md:mt-10"
      >
        <table className="w-full border-collapse text-left" style={{ minWidth }}>
          <caption className="sr-only">{caption}</caption>
          <thead className="border-b border-line">
            <tr>
              {columns.map((column) => (
                <th key={column.label} scope="col" className="pr-4 pb-1 font-normal">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.id} className="h-12 text-sm">
                {columns.map((column) => (
                  <td key={column.label} className="pr-4">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p role="status" className="py-12 text-center text-sm text-muted">
            No se encontraron registros.
          </p>
        )}
      </div>
      {pageCount > 1 && (
        <nav
          aria-label={`Paginación de ${caption}`}
          className="mt-5 flex items-center justify-end gap-3 text-sm"
        >
          <Button
            variant="outline"
            small
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Anterior
          </Button>
          <span>
            Página {currentPage} de {pageCount}
          </span>
          <Button
            variant="outline"
            small
            disabled={currentPage === pageCount}
            onClick={() => setPage(currentPage + 1)}
          >
            Siguiente
          </Button>
        </nav>
      )}
    </>
  );
}

export function RowAction({
  kind,
  label,
  onClick,
  disabled,
}: {
  kind: "view" | "edit" | "delete" | "download" | "add";
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const color =
    kind === "edit"
      ? "border-status-pending"
      : kind === "delete"
        ? "border-brand-end"
        : kind === "add"
          ? "border-status-success"
          : kind === "download"
            ? "border-ink"
            : "border-status-info";
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-9.75 cursor-pointer items-center justify-center rounded-control border-[1.5px] hover:bg-brand-surface disabled:cursor-not-allowed disabled:opacity-40 ${color}`}
    >
      {kind === "add" ? (
        <span className="text-xl text-status-success">+</span>
      ) : (
        <Image
          src={`/dashboard/${kind}.svg`}
          alt=""
          width={kind === "view" ? 17 : kind === "download" ? 19.5 : 20}
          height={kind === "view" ? 10 : kind === "download" ? 19.5 : 20}
        />
      )}
    </button>
  );
}

export function CategoryFilters({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="my-4 flex flex-wrap gap-2.5">
      {["Todos", ...options].map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={`cursor-pointer rounded-control border px-2 py-0.5 text-sm ${value === option ? "border-brand-end bg-routine-surface text-brand-end" : "border-ink bg-white"}`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export type FormValues = Record<string, string>;
export type FormField = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "date" | "select" | "textarea" | "image";
  options?: readonly { value: string; label: string }[];
  required?: boolean;
  wide?: boolean;
  min?: number;
  maxLength?: number;
  pattern?: string;
};

export function RecordForm({
  title,
  subtitle,
  fields,
  initialValues,
  onClose,
  onSubmit,
  submitLabel = "Guardar",
  extra,
}: {
  title: string;
  subtitle?: string;
  fields: readonly FormField[];
  initialValues: FormValues;
  onClose: () => void;
  onSubmit: (values: FormValues) => string | void;
  submitLabel?: string;
  extra?: ReactNode;
}) {
  const id = useId();
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value.trim()]),
    );
    if (fields.some((field) => field.required !== false && !cleaned[field.name])) {
      setError("Completa los campos obligatorios sin dejar solo espacios.");
      return;
    }
    const result = onSubmit(cleaned);
    if (result) setError(result);
  }
  const control =
    "mt-2 min-h-10 w-full min-w-0 rounded-control border border-muted bg-white px-3 py-2.5 text-sm focus:outline-2 focus:outline-brand-start";
  return (
    <Dialog
      open
      onClose={onClose}
      labelledBy={`${id}-title`}
      narrow
      className="px-11.5 py-10 max-sm:px-6"
    >
      <h2
        id={`${id}-title`}
        data-dialog-heading
        tabIndex={-1}
        className="text-center text-base font-bold focus:outline-none"
      >
        {title}
      </h2>
      {subtitle && <p className="mt-1.25 text-center text-sm text-line">{subtitle}</p>}
      <form onSubmit={submit} className="mt-8">
        <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
          {fields.map((field) => {
            const fieldId = `${id}-${field.name}`;
            const common = {
              id: fieldId,
              value: values[field.name] ?? "",
              onChange: (event: { target: { value: string } }) => {
                setValues({ ...values, [field.name]: event.target.value });
                setError("");
              },
              required: field.required !== false,
              className: control,
            };
            return (
              <label
                key={field.name}
                htmlFor={fieldId}
                className={`min-w-0 text-sm font-bold ${field.wide ? "col-span-2" : ""}`}
              >
                {field.label}
                {field.type === "image" ? (
                  <>
                    <input
                      id={fieldId}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className={control}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        if (
                          !/^image\/(png|jpeg|webp|gif)$/.test(file.type) ||
                          file.size > 5 * 1024 * 1024
                        ) {
                          setError("Selecciona una imagen PNG, JPG, WebP o GIF de hasta 5 MB.");
                          event.target.value = "";
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") {
                            const image = reader.result;
                            setValues((current) => ({ ...current, [field.name]: image }));
                            setError("");
                          }
                        };
                        reader.onerror = () => setError("No se pudo leer la imagen.");
                        reader.readAsDataURL(file);
                      }}
                    />
                    {values[field.name] && (
                      <Image
                        src={
                          values[field.name].startsWith("data:")
                            ? values[field.name]
                            : `/dashboard/${values[field.name]}`
                        }
                        alt="Vista previa"
                        width={100}
                        height={100}
                        unoptimized
                        className="mx-auto mt-3 size-25 rounded-media object-cover"
                      />
                    )}
                  </>
                ) : field.type === "select" ? (
                  <select {...common}>
                    <option value="">Seleccionar</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea {...common} rows={3} />
                ) : (
                  <input
                    {...common}
                    type={field.type ?? "text"}
                    min={field.min}
                    step={field.type === "number" ? "any" : undefined}
                    maxLength={field.maxLength}
                    pattern={field.pattern}
                  />
                )}
              </label>
            );
          })}
        </div>
        {extra}
        {error && (
          <p role="alert" className="mt-4 text-sm text-brand-start">
            {error}
          </p>
        )}
        <div className="mt-7 flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1">
            {submitLabel}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

export function Details({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const id = useId();
  return (
    <Dialog open onClose={onClose} labelledBy={id}>
      <h2
        id={id}
        data-dialog-heading
        tabIndex={-1}
        className="mb-6 px-6 text-center text-xl font-bold focus:outline-none"
      >
        {title}
      </h2>
      {children}
    </Dialog>
  );
}

export function ConfirmDelete({
  title,
  onClose,
  onConfirm,
}: {
  title: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Details title={`Eliminar ${title}`} onClose={onClose}>
      <p className="text-sm text-muted">
        Se quitará del escenario local de demostración. Puedes recuperar el escenario inicial
        recargando la página.
      </p>
      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Eliminar
        </Button>
      </div>
    </Details>
  );
}
