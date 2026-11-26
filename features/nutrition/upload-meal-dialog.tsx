"use client";

// CÓDIGO DE SECCIÓN NUTRICIONAL
// MODAL "REGISTRAR COMIDA".
import { Dialog } from "@/components/ui/dialog";
import { PhotoDropzone } from "./photo-dropzone";

export function UploadMealDialog({
  open,
  onClose,
  onPhotoSelected,
}: {
  open: boolean;
  onClose: () => void;
  onPhotoSelected: (file: File) => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} labelledBy="upload-meal-title">
      <h2
        id="upload-meal-title"
        data-dialog-heading
        tabIndex={-1}
        className="mb-6 pr-10 text-xl font-bold focus:outline-none"
      >
        Registrar comida
      </h2>
      {/* SE MONTA SOLO CON EL MODAL ABIERTO PARA LIMPIAR ERRORES PREVIOS. */}
      {open && <PhotoDropzone onPhotoSelected={onPhotoSelected} />}
    </Dialog>
  );
}
