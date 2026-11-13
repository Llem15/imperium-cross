export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);

export type ApiProduct = {
  idProducto: number;
  nombreProducto: string;
  descripcionProducto: string | null;
  precio: number;
  categoria: string | null;
  stock: number;
  stockMinimo: number;
  activo: boolean;
};

export type SaleReceiptResponse = {
  idVenta: number;
  serie: string;
  numero: number;
  total: number;
};

export async function fetchProducts(signal?: AbortSignal): Promise<ApiProduct[]> {
  const response = await fetch(`${apiBaseUrl}/api/productos`, {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`No se pudieron cargar los productos (HTTP ${response.status}).`);
  }
  const body: unknown = await response.json();
  if (!Array.isArray(body)) throw new Error("Respuesta inesperada del servidor.");
  return body as ApiProduct[];
}

export async function postSale(
  metodoPago: string,
  lineas: { idProducto: number; cantidad: number }[],
): Promise<SaleReceiptResponse> {
  const response = await fetch(`${apiBaseUrl}/api/ventas`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ metodoPago, lineas }),
  });
  if (!response.ok) {
    let detail = `No se pudo registrar la venta (HTTP ${response.status}).`;
    try {
      const body: unknown = await response.json();
      if (typeof body === "object" && body !== null) {
        if ("detail" in body && typeof body.detail === "string") detail = body.detail;
        else if ("message" in body && typeof body.message === "string") detail = body.message;
      }
    } catch {}
    throw new Error(detail);
  }
  return (await response.json()) as SaleReceiptResponse;
}
