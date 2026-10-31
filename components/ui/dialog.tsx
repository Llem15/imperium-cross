"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type { KeyboardEvent, MouseEvent, ReactNode } from "react";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  className?: string;
  drawer?: boolean;
  note?: boolean;
  narrow?: boolean;
};

export function Dialog({
  open,
  onClose,
  labelledBy,
  children,
  className = "",
  drawer = false,
  note = false,
  narrow = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    dialog.querySelector<HTMLElement>("[data-dialog-heading]")?.focus();

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (opener instanceof HTMLElement && opener.isConnected) {
        opener.focus({ preventScroll: true });
      }
    };
  }, [open]);

  function closeOnBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const outside =
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom;
    if (outside) onClose();
  }

  function containFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex='0']",
      ),
    ).filter((element) => element.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !controls.includes(active as HTMLElement))) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  const placement = drawer
    ? "fixed inset-y-0 left-0 m-0 h-dvh max-h-none w-[min(280px,calc(100%-32px))] border-0 bg-ink p-0 text-white"
    : `fixed m-auto max-h-[calc(100dvh-32px)] w-[calc(100%-24px)] ${note || narrow ? "max-w-registration" : "max-w-[595px]"} rounded-dialog border border-ink bg-white p-[44px] max-sm:p-6`;

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      onKeyDown={containFocus}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={closeOnBackdrop}
      className={`${placement} overflow-auto overscroll-contain backdrop:bg-black/55 ${className}`}
    >
      {note ? (
        <button
          type="button"
          aria-label="Cerrar detalle"
          onClick={onClose}
          className="mb-2.5 block w-full cursor-pointer"
        >
          <Image src="/dashboard/note-close.svg" alt="" width={376} height={25} />
        </button>
      ) : (
        <button
          type="button"
          aria-label={drawer ? "Cerrar navegación" : "Cerrar detalle"}
          onClick={onClose}
          className={`absolute top-8 right-8 flex size-8 cursor-pointer items-center justify-center
            rounded-full bg-white max-sm:top-3 max-sm:right-3 ${drawer ? "top-3 right-3" : ""}`}
        >
          <Image src="/dashboard/close.svg" alt="" width={12} height={12} />
        </button>
      )}
      {children}
    </dialog>
  );
}
