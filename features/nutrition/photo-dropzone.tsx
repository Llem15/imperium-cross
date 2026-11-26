"use client";

// CÓDIGO DE SECCIÓN NUTRICIONAL
// ZONA PARA ELEGIR O ARRASTRAR LA FOTO DEL PLATO (JPG/PNG, MÁX. 5 MB).
import { useRef, useState } from "react";
import type { DragEvent } from "react";
import { UploadIcon } from "./nutrition-icons";
import type { PhotoValidationError } from "./nutrition-types";

const ACCEPTED_TYPES = ["image/jpeg", "image/png"];
const MAX_BYTES = 5 * 1024 * 1024;

const errorMessages: Record<PhotoValidationError, string> = {
  "invalid-type": "El archivo debe ser una imagen JPG o PNG.",
  "too-large": "La imagen supera los 5 MB. Elige una más liviana.",
};

function validatePhoto(file: File): PhotoValidationError | null {
  if (!ACCEPTED_TYPES.includes(file.type)) return "invalid-type";
  if (file.size > MAX_BYTES) return "too-large";
  return null;
}

export function PhotoDropzone({ onPhotoSelected }: { onPhotoSelected: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<PhotoValidationError | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) return;
    const problem = validatePhoto(file);
    setError(problem);
    if (!problem) onPhotoSelected(file);
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setDragging(false);
    handleFile(event.dataTransfer.files[0]);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        aria-describedby={error ? "photo-error photo-hint" : "photo-hint"}
        className={`flex w-full cursor-pointer flex-col items-center rounded-media border-2 border-dashed px-6 py-14 text-center max-sm:py-10 ${
          dragging
            ? "border-brand-start bg-routine-surface/40"
            : "border-brand-end/70 bg-brand-surface"
        }`}
      >
        <span className="flex size-16 items-center justify-center rounded-media bg-linear-to-br/srgb from-brand-start to-brand-end text-white">
          <UploadIcon className="size-7" />
        </span>
        <span className="mt-4 text-lg font-bold">Sube la foto de tu plato aquí</span>
        <span id="photo-hint" className="mt-2 text-caption text-muted">
          Haz clic o arrastra un archivo · JPG o PNG, máx. 5 MB
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        hidden
        tabIndex={-1}
        aria-label="Foto del plato"
        onChange={(event) => {
          handleFile(event.target.files?.[0]);
          // PERMITE VOLVER A ELEGIR EL MISMO ARCHIVO.
          event.target.value = "";
        }}
      />
      {error && (
        <p id="photo-error" role="alert" className="mt-3 text-caption text-brand-start">
          {errorMessages[error]}
        </p>
      )}
    </div>
  );
}
