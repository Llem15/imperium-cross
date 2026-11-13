"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SearchField, StatusBadge } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  DataTable,
  Details,
  ManagementPanel,
  RecordForm,
  RowAction,
} from "@/components/dashboard/management-ui";
import type { FormValues } from "@/components/dashboard/management-ui";
import { money } from "@/mocks/internal-data";
import { parseApiProducts } from "./product-api-model";
import type { ApiProduct } from "./product-api-model";

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(
  /\/+$/,
  "",
);
const categories = ["Suplemento", "Accesorio", "Ropa", "Snack"];

function responseMessage(payload: unknown, fallback: string) {
  if (typeof payload === "object" && payload !== null) {
    const body = payload as Record<string, unknown>;
    if (typeof body.detail === "string") return body.detail;
    if (typeof body.message === "string") return body.message;
  }
  return fallback;
}

export function InventoryManager() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<ApiProduct | "new" | null>(null);
  const [viewing, setViewing] = useState<ApiProduct | null>(null);
  const [deactivating, setDeactivating] = useState<ApiProduct | null>(null);

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    const response = await fetch(`${apiBaseUrl}/api/productos`, {
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(responseMessage(payload, "No se pudieron cargar los productos."));
    }
    return parseApiProducts(await response.json());
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchProducts() {
      try {
        setProducts(await loadProducts(controller.signal));
        setLoadError("");
      } catch (cause) {
        if (!controller.signal.aborted) {
          setLoadError(
            cause instanceof Error ? cause.message : "No se pudieron cargar los productos.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void fetchProducts();
    return () => controller.abort();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return products;
    return products.filter((product) =>
      `${product.nombreProducto} ${product.categoria ?? ""}`
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [products, query]);

  async function saveProduct(values: FormValues) {
    if (!editing) return "Selecciona un producto para guardar.";
    const price = Number(values.price);
    const stock = Number(values.stock);
    const minimum = Number(values.minimum);
    if (
      !Number.isFinite(price) ||
      price < 0 ||
      price > 9999.99 ||
      !/^\d+(\.\d{1,2})?$/.test(values.price)
    ) {
      return "El precio debe estar entre S/ 0.00 y S/ 9999.99, con hasta dos decimales.";
    }
    if (
      ![stock, minimum].every((value) => Number.isInteger(value) && value >= 0 && value <= 32767)
    ) {
      return "El stock y el mínimo deben ser unidades enteras entre 0 y 32767.";
    }
    if (values.name.trim().length > 40) return "El nombre admite hasta 40 caracteres.";
    if (values.description.trim().length > 100)
      return "La descripción admite hasta 100 caracteres.";

    const isNew = editing === "new";
    const response = await fetch(
      isNew ? `${apiBaseUrl}/api/productos` : `${apiBaseUrl}/api/productos/${editing.idProducto}`,
      {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          nombreProducto: values.name.trim(),
          descripcionProducto: values.description.trim() || null,
          precio: Math.round(price * 100) / 100,
          categoria: values.category,
          stock,
          stockMinimo: minimum,
          activo: values.active === "true",
        }),
      },
    );
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      return responseMessage(payload, "No se pudo guardar el producto.");
    }
    setEditing(null);
    setSuccess(isNew ? "Producto creado correctamente." : "Producto actualizado correctamente.");
    try {
      setProducts(await loadProducts());
      setLoadError("");
    } catch (cause) {
      setLoadError(
        `El producto se guardó, pero no se pudo actualizar la lista: ${
          cause instanceof Error ? cause.message : "error desconocido."
        }`,
      );
    }
  }

  async function deactivateProduct() {
    if (!deactivating) return;
    const response = await fetch(`${apiBaseUrl}/api/productos/${deactivating.idProducto}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setLoadError(responseMessage(payload, "No se pudo desactivar el producto."));
      return;
    }
    setSuccess(`Se desactivó ${deactivating.nombreProducto}.`);
    setDeactivating(null);
    try {
      setProducts(await loadProducts());
      setLoadError("");
    } catch (cause) {
      setLoadError(
        cause instanceof Error
          ? cause.message
          : "El producto se desactivó, pero no se pudo actualizar la lista.",
      );
    }
  }

  return (
    <>
      <ManagementPanel
        title="Productos"
        subtitle="Catálogo e inventario guardados en SQL Server"
        actions={
          <>
            <SearchField value={query} onChange={setQuery} label="Buscar producto" />
            <Button
              small
              onClick={() => {
                setSuccess("");
                setEditing("new");
              }}
            >
              + Agregar producto
            </Button>
          </>
        }
      >
        {loadError && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p role="alert" className="text-sm text-red-700">
              {loadError}
            </p>
            <Button
              small
              onClick={() => {
                setLoading(true);
                loadProducts()
                  .then((loadedProducts) => {
                    setProducts(loadedProducts);
                    setLoadError("");
                  })
                  .catch((cause) =>
                    setLoadError(
                      cause instanceof Error
                        ? cause.message
                        : "No se pudieron cargar los productos.",
                    ),
                  )
                  .finally(() => setLoading(false));
              }}
            >
              Reintentar
            </Button>
          </div>
        )}
        {success && (
          <p role="status" className="mb-4 text-sm text-green-700">
            {success}
          </p>
        )}
        {loading ? (
          <p role="status" className="py-8 text-center text-sm text-muted">
            Cargando productos...
          </p>
        ) : !loadError ? (
          <DataTable
            rows={filteredProducts.map((product) => ({
              ...product,
              id: String(product.idProducto),
            }))}
            caption="Inventario de productos"
            columns={[
              { label: "Producto", render: (row) => row.nombreProducto },
              { label: "Categoría", render: (row) => row.categoria ?? "—" },
              { label: "Precio", render: (row) => money(Math.round(row.precio * 100)) },
              { label: "Stock", render: (row) => row.stock },
              {
                label: "Estado",
                render: (row) => (
                  <StatusBadge
                    status={
                      !row.activo || row.stock === 0
                        ? "expired"
                        : row.stock <= row.stockMinimo
                          ? "pending"
                          : "active"
                    }
                    label={
                      !row.activo
                        ? "Inactivo"
                        : row.stock === 0
                          ? "Agotado"
                          : row.stock <= row.stockMinimo
                            ? "Stock bajo"
                            : "Disponible"
                    }
                  />
                ),
              },
              {
                label: "Acciones",
                render: (row) => (
                  <div className="flex gap-3">
                    <RowAction
                      kind="view"
                      label={`Ver ${row.nombreProducto}`}
                      onClick={() => setViewing(row)}
                    />
                    <RowAction
                      kind="edit"
                      label={`Editar ${row.nombreProducto}`}
                      onClick={() => {
                        setSuccess("");
                        setEditing(row);
                      }}
                    />
                    {row.activo && (
                      <RowAction
                        kind="delete"
                        label={`Desactivar ${row.nombreProducto}`}
                        onClick={() => setDeactivating(row)}
                      />
                    )}
                  </div>
                ),
              },
            ]}
          />
        ) : null}
      </ManagementPanel>
      {editing && (
        <RecordForm
          title={editing === "new" ? "Agregar producto" : "Editar producto"}
          fields={[
            { name: "name", label: "Producto (máximo 40 caracteres)", wide: true, maxLength: 40 },
            { name: "price", label: "Precio (S/)", type: "number", min: 0 },
            {
              name: "category",
              label: "Categoría",
              type: "select",
              options: categories.map((value) => ({ value, label: value })),
            },
            {
              name: "description",
              label: "Descripción (máximo 100 caracteres)",
              type: "textarea",
              wide: true,
              maxLength: 100,
              required: false,
            },
            { name: "stock", label: "Stock", type: "number", min: 0 },
            { name: "minimum", label: "Stock mínimo", type: "number", min: 0 },
            {
              name: "active",
              label: "Estado",
              type: "select",
              wide: true,
              options: [
                { value: "true", label: "Activo" },
                { value: "false", label: "Inactivo" },
              ],
            },
          ]}
          initialValues={
            editing === "new"
              ? { stock: "0", minimum: "0", active: "true" }
              : {
                  name: editing.nombreProducto,
                  price: String(editing.precio),
                  category: editing.categoria ?? "",
                  description: editing.descripcionProducto ?? "",
                  stock: String(editing.stock),
                  minimum: String(editing.stockMinimo),
                  active: String(editing.activo),
                }
          }
          onClose={() => setEditing(null)}
          onSubmit={saveProduct}
        />
      )}
      {viewing && (
        <Details title={viewing.nombreProducto} onClose={() => setViewing(null)}>
          <p className="text-xl font-bold">{money(Math.round(viewing.precio * 100))}</p>
          <p className="mt-4 text-sm">Categoría: {viewing.categoria ?? "—"}</p>
          <p className="mt-2 text-sm">Stock: {viewing.stock}</p>
          <p className="mt-2 text-sm">Stock mínimo: {viewing.stockMinimo}</p>
          {viewing.descripcionProducto && (
            <p className="mt-4 text-sm">{viewing.descripcionProducto}</p>
          )}
          <p className="mt-4 text-caption text-muted">
            El esquema SQL actual no almacena imágenes para productos.
          </p>
        </Details>
      )}
      {deactivating && (
        <Details
          title={`Desactivar ${deactivating.nombreProducto}`}
          onClose={() => setDeactivating(null)}
        >
          <p className="text-sm text-muted">
            El producto dejará de estar disponible, pero se conservará para mantener el historial de
            ventas.
          </p>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setDeactivating(null)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => void deactivateProduct()}>
              Desactivar
            </Button>
          </div>
        </Details>
      )}
    </>
  );
}
