"use client";

// CÓDIGO DE SECCIÓN NUTRICIONAL
// EN MODO api, LAS FOTOS SE DESCARGAN CON fetch (CON authHeaders) Y SE MUESTRAN COMO URL blob:.
import { useEffect, useState } from "react";
import { fetchMealImage, nutritionSource } from "./nutrition-http";

function needsAuthenticatedFetch(imageUrl: string) {
  return nutritionSource === "api" && imageUrl.startsWith("/api/");
}

/** URL lista para <Image src>, o null mientras se descarga o si falló. */
export function useMealImageSrc(imageUrl: string): string | null {
  const shouldFetch = needsAuthenticatedFetch(imageUrl);
  const [loaded, setLoaded] = useState<{ imageUrl: string; src: string } | null>(null);

  useEffect(() => {
    if (!shouldFetch) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;

    fetchMealImage(imageUrl, controller.signal)
      .then((blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setLoaded({ imageUrl, src: objectUrl });
      })
      .catch(() => {
        // SIN FOTO SE MUESTRA EL MARCADOR DE POSICIÓN; EL RESTO DE LA COMIDA SIGUE VISIBLE.
      });

    // SE LIBERA LA URL AL CAMBIAR DE FOTO O DESMONTAR EL COMPONENTE.
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [imageUrl, shouldFetch]);

  if (!shouldFetch) return imageUrl;
  return loaded?.imageUrl === imageUrl ? loaded.src : null;
}
