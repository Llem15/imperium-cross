export type ApiProduct = {
  idProducto: number;
  nombreProducto: string;
  descripcionProducto: string | null;
  precio: number;
  categoria: string | null;
  stock: number;
  stockMinimo: number;
  activo: boolean;
  tieneImagen?: boolean;
};

function isApiProduct(value: unknown): value is ApiProduct {
  if (typeof value !== "object" || value === null) return false;
  const product = value as Record<string, unknown>;
  return (
    Number.isInteger(product.idProducto) &&
    typeof product.nombreProducto === "string" &&
    (product.descripcionProducto === null || typeof product.descripcionProducto === "string") &&
    typeof product.precio === "number" &&
    Number.isFinite(product.precio) &&
    product.precio >= 0 &&
    product.precio <= 9999.99 &&
    (product.categoria === null || typeof product.categoria === "string") &&
    typeof product.stock === "number" &&
    Number.isInteger(product.stock) &&
    product.stock >= 0 &&
    product.stock <= 32767 &&
    typeof product.stockMinimo === "number" &&
    Number.isInteger(product.stockMinimo) &&
    product.stockMinimo >= 0 &&
    product.stockMinimo <= 32767 &&
    typeof product.activo === "boolean" &&
    (product.tieneImagen === undefined || typeof product.tieneImagen === "boolean")
  );
}

export function parseApiProducts(value: unknown): ApiProduct[] {
  if (!Array.isArray(value) || !value.every(isApiProduct)) {
    throw new Error("La respuesta de productos no tiene el formato esperado.");
  }
  return value;
}
