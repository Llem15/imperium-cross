"use client";

import Image from "next/image";
import { useId, useState } from "react";

export function PhotoPicker({
  value,
  onChange,
  shape = "circle",
}: {
  value: string;
  onChange: (value: string) => void;
  shape?: "circle" | "rounded";
}) {
  const inputId = useId();
  const [error, setError] = useState("");
  return (
    <div className="mb-4 flex flex-col items-center">
      <label
        htmlFor={inputId}
        className={`relative flex cursor-pointer items-center justify-center overflow-hidden bg-dashboard-canvas focus-within:outline-2 focus-within:outline-brand-start hover:brightness-95 ${shape === "rounded" ? "h-24 w-28 rounded-media" : "size-24 rounded-full"}`}
      >
        {value ? (
          <Image
            src={value}
            alt="Vista previa de la foto"
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <svg
            aria-hidden="true"
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute inset-0 m-auto text-ink"
          >
            <path d="M22 12.5V1.9a1 1 0 0 0-1-1H1.9a1 1 0 0 0-1 1V20.8a1 1 0 0 0 1 1H12.45" />
            <circle cx="16.1" cy="6.6" r="2.3" />
            <path d="M0.9 16L9.1 12.5L15.9 15.5" />
            <path d="M19.6 16.1V22.9M16.2 19.5H23" />
          </svg>
        )}
        <span className="sr-only">Foto</span>
        <input
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
              setError("Selecciona una imagen PNG, JPG, WebP o GIF de hasta 5 MB.");
              event.target.value = "";
              return;
            }
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === "string") {
                onChange(reader.result);
                setError("");
              }
            };
            reader.onerror = () => setError("No se pudo leer la imagen.");
            reader.readAsDataURL(file);
          }}
        />
      </label>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mt-2 cursor-pointer text-caption text-brand-start"
        >
          Quitar foto
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-caption text-brand-start">
          {error}
        </p>
      )}
    </div>
  );
}
