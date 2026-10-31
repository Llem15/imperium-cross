"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { SearchField, StatusBadge } from "@/components/dashboard/dashboard-ui";
import {
  Button,
  CategoryFilters,
  ConfirmDelete,
  DataTable,
  Details,
  ManagementPanel,
  RecordForm,
  RowAction,
} from "@/components/dashboard/management-ui";
import { Dialog } from "@/components/ui/dialog";
import { useDemoData } from "@/features/demo/demo-provider";
import { downloadSaleReceipt } from "@/features/products/sale-receipt";
import { demoDate } from "@/mocks/dashboard";
import { money, newDemoId, paymentLabels, productCategories } from "@/mocks/internal-data";
import type { PaymentMethod, Product, Sale } from "@/mocks/internal-data";

function ProductImage({ product }: { product: Product }) {
  const crop =
    product.image === "product-gloves.png"
      ? { width: "117.74%", height: "134.19%", left: "-5.72%", top: "-19.8%" }
      : { width: "87.74%", height: "100%", left: "6.13%", top: "0%" };
  return (
    <div className="relative mx-auto aspect-[147/128] w-full max-w-50 overflow-hidden rounded-lg">
      {product.image ? (
        <div
          className="absolute"
          style={
            product.image.startsWith("data:")
              ? { width: "100%", height: "100%", left: "0%", top: "0%" }
              : crop
          }
        >
          <Image
            src={product.image.startsWith("data:") ? product.image : `/dashboard/${product.image}`}
            alt=""
            fill
            sizes="200px"
            className="object-fill"
          />
        </div>
      ) : (
        <span className="absolute inset-0 grid place-items-center bg-dashboard-canvas text-sm text-muted">
          Sin imagen
        </span>
      )}
    </div>
  );
}

function ProductDetail({ product, onClose }: { product: Product; onClose: () => void }) {
  return (
    <Details title={product.name} onClose={onClose}>
      <ProductImage product={product} />
      <div className="my-4 flex gap-2">
        <span className="rounded-control bg-purple-100 px-2 text-sm">{product.category}</span>
        <StatusBadge
          status={product.stock > 0 ? "active" : "expired"}
          label={product.stock > 0 ? "Disponible" : "Agotado"}
        />
      </div>
      <p className="text-xl font-bold">{money(product.priceCents)}</p>
      <h3 className="mt-8 text-muted">Descripción</h3>
      <p className="mt-2 text-sm">{product.description}</p>
      <p className="mt-4 rounded-control bg-status-info-surface p-3 text-sm text-status-info">
        Acércate a Recepción para adquirirlo.
      </p>
    </Details>
  );
}

export function ProductInventory() {
  const { data, setData } = useDemoData();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  return (
    <>
      <ManagementPanel
        title="Productos"
        subtitle="Control de productos e inventario"
        actions={
          <>
            <SearchField value={query} onChange={setQuery} label="Buscar producto" />
            <Button small onClick={() => setEditing("new")}>
              + Agregar producto
            </Button>
          </>
        }
      >
        <DataTable
          rows={data.products.filter((product) =>
            product.name.toLowerCase().includes(query.toLowerCase()),
          )}
          caption="Inventario de productos"
          columns={[
            { label: "Producto", render: (row) => row.name },
            { label: "Categoría", render: (row) => row.category },
            { label: "Precio", render: (row) => money(row.priceCents) },
            { label: "Stock", render: (row) => row.stock },
            {
              label: "Estado",
              render: (row) => (
                <StatusBadge
                  status={
                    row.stock === 0 ? "expired" : row.stock <= row.minimum ? "pending" : "active"
                  }
                  label={
                    row.stock === 0
                      ? "Agotado"
                      : row.stock <= row.minimum
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
                    label={`Ver ${row.name}`}
                    onClick={() => setViewing(row)}
                  />
                  <RowAction
                    kind="edit"
                    label={`Editar ${row.name}`}
                    onClick={() => setEditing(row)}
                  />
                  <RowAction
                    kind="delete"
                    label={`Eliminar ${row.name}`}
                    onClick={() => setDeleting(row)}
                  />
                </div>
              ),
            },
          ]}
        />
      </ManagementPanel>
      {editing && (
        <RecordForm
          title={editing === "new" ? "Agregar producto" : "Editar producto"}
          fields={[
            {
              name: "image",
              label: "Imagen del producto",
              type: "image",
              wide: true,
              required: false,
            },
            { name: "name", label: "Producto", wide: true },
            { name: "price", label: "Precio (S/)", type: "number", min: 0 },
            {
              name: "category",
              label: "Categoría",
              type: "select",
              options: productCategories.map((value) => ({ value, label: value })),
            },
            { name: "description", label: "Descripción", type: "textarea", wide: true },
            { name: "stock", label: "Stock", type: "number", min: 0 },
            { name: "minimum", label: "Stock mínimo", type: "number", min: 0 },
          ]}
          initialValues={
            editing === "new"
              ? { stock: "0", minimum: "0" }
              : {
                  name: editing.name,
                  image: editing.image,
                  price: String(editing.priceCents / 100),
                  category: editing.category,
                  description: editing.description,
                  stock: String(editing.stock),
                  minimum: String(editing.minimum),
                }
          }
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            if (![values.stock, values.minimum].every((value) => Number.isInteger(Number(value))))
              return "El stock debe expresarse en unidades enteras.";
            const product: Product = {
              id: editing === "new" ? newDemoId("product") : editing.id,
              name: values.name.trim(),
              priceCents: Math.round(Number(values.price) * 100),
              category: values.category,
              description: values.description.trim(),
              stock: Number(values.stock),
              minimum: Number(values.minimum),
              image: values.image ?? "",
            };
            setData((current) => ({
              ...current,
              products:
                editing === "new"
                  ? [...current.products, product]
                  : current.products.map((item) => (item.id === product.id ? product : item)),
            }));
            setEditing(null);
          }}
        />
      )}
      {viewing && <ProductDetail product={viewing} onClose={() => setViewing(null)} />}
      {deleting && (
        <ConfirmDelete
          title={deleting.name}
          onClose={() => setDeleting(null)}
          onConfirm={() => {
            setData((current) => ({
              ...current,
              products: current.products.filter((product) => product.id !== deleting.id),
            }));
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}

function SaleConfirmation({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  const titleId = useId();
  const [downloadError, setDownloadError] = useState(false);
  return (
    <Dialog open onClose={onClose} labelledBy={titleId}>
      <Image
        src="/registration/payment-confirmed.svg"
        alt=""
        width={60}
        height={60}
        className="mx-auto mb-4"
      />
      <h2
        id={titleId}
        data-dialog-heading
        tabIndex={-1}
        className="px-6 text-center text-xl font-bold focus:outline-none"
      >
        Venta registrada correctamente
      </h2>
      <div className="my-5 space-y-3 rounded-media bg-dashboard-canvas p-4 text-sm">
        {sale.lines.map((line) => (
          <p key={line.productId} className="flex justify-between gap-3">
            <span>
              {line.name} × {line.quantity}
            </span>
            <span>{money(line.cents * line.quantity)}</span>
          </p>
        ))}
        <p className="flex justify-between gap-3 border-t border-line pt-3">
          <span>Método de pago</span>
          <span>{paymentLabels[sale.method]}</span>
        </p>
        <p className="flex justify-between gap-3 font-bold">
          <span>Total</span>
          <span>{money(sale.total)}</span>
        </p>
      </div>
      {downloadError && (
        <p role="alert" className="mb-3 text-caption text-brand-start">
          No se pudo generar la constancia. Inténtalo de nuevo.
        </p>
      )}
      <Button
        className="w-full"
        onClick={() => {
          setDownloadError(false);
          downloadSaleReceipt(sale).catch(() => setDownloadError(true));
        }}
      >
        Descargar constancia
      </Button>
    </Dialog>
  );
}

export function ProductCatalog({ reception = false }: { reception?: boolean }) {
  const { data, setData } = useDemoData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [viewing, setViewing] = useState<Product | null>(null);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [checkout, setCheckout] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const products = data.products.filter(
    (product) =>
      (category === "Todos" || product.category === category) &&
      product.name.toLowerCase().includes(query.toLowerCase()),
  );
  const lines = data.products
    .filter((product) => cart[product.id] > 0)
    .map((product) => ({ product, quantity: Math.min(cart[product.id], product.stock) }))
    .filter((line) => line.quantity > 0);
  const total = lines.reduce((sum, line) => sum + line.product.priceCents * line.quantity, 0);
  function changeQuantity(product: Product, amount: number) {
    setCart((current) => ({
      ...current,
      [product.id]: Math.max(0, Math.min(product.stock, (current[product.id] ?? 0) + amount)),
    }));
  }
  return (
    <>
      <ManagementPanel
        title="Productos"
        subtitle={reception ? "Punto de venta de productos" : undefined}
      >
        {!reception && (
          <div className="mt-4 flex max-w-[526px] items-center gap-3 rounded-control bg-status-info-surface p-3 text-sm text-status-info">
            <Image src="/dashboard/shop.svg" alt="" width={21.9132} height={20.25} />
            <p>
              <strong>Compra presencial en recepción</strong>
              <br />
              Todos los productos se adquieren en el gimnasio.
            </p>
          </div>
        )}
        <div
          className={`mt-5 grid gap-10 ${reception ? "grid-cols-[526fr_342fr] max-xl:grid-cols-1" : "grid-cols-1"}`}
        >
          <div className="min-w-0">
            <SearchField value={query} onChange={setQuery} label="Buscar productos" />
            <CategoryFilters options={productCategories} value={category} onChange={setCategory} />
            <div
              className={`grid gap-x-6 gap-y-7 max-sm:grid-cols-2 ${reception ? "grid-cols-3" : "grid-cols-5 max-xl:grid-cols-3"}`}
            >
              {products.map((product) => (
                <article key={product.id} className="min-w-0">
                  <button
                    type="button"
                    aria-label={`Ver ${product.name}`}
                    onClick={() => setViewing(product)}
                    className="relative block w-full cursor-pointer text-left"
                  >
                    <ProductImage product={product} />
                    <span
                      className={`absolute top-1 right-0 rounded-control px-1 text-[10px] ${product.stock ? "bg-status-success-surface text-status-success" : "bg-red-100 text-brand-end"}`}
                    >
                      {reception
                        ? `Stock: ${product.stock}`
                        : product.stock
                          ? "Disponible"
                          : "Agotado"}
                    </span>
                    <h2 className="mt-3 text-caption">{product.name}</h2>
                  </button>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-sm font-bold">{money(product.priceCents)}</p>
                    {reception && (
                      <Button
                        small
                        disabled={!product.stock || (cart[product.id] ?? 0) >= product.stock}
                        aria-label={`Agregar ${product.name} a la venta`}
                        onClick={() => changeQuantity(product, 1)}
                        className="min-h-6 rounded-control px-3 py-0 text-xl"
                      >
                        +
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
            {products.length === 0 && (
              <p role="status" className="py-10 text-sm text-muted">
                No se encontraron productos.
              </p>
            )}
          </div>
          {reception && (
            <section
              aria-labelledby="current-sale-title"
              className="flex min-h-[490px] min-w-0 flex-col rounded-control border border-ink p-6"
            >
              <h2 id="current-sale-title" className="text-center font-bold">
                Venta actual
              </h2>
              <div className="my-6 flex-1 space-y-5">
                {lines.length === 0 && (
                  <p className="text-sm text-muted">Agrega productos para preparar la venta.</p>
                )}
                {lines.map(({ product, quantity }) => (
                  <div key={product.id} className="text-sm">
                    <p>{product.name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          small
                          aria-label={`Quitar una unidad de ${product.name}`}
                          onClick={() => changeQuantity(product, -1)}
                        >
                          −
                        </Button>
                        <span>{quantity}</span>
                        <Button
                          variant="outline"
                          small
                          disabled={quantity >= product.stock}
                          aria-label={`Sumar una unidad de ${product.name}`}
                          onClick={() => changeQuantity(product, 1)}
                        >
                          +
                        </Button>
                      </div>
                      <span>{money(product.priceCents * quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mb-4 flex justify-between text-sm">
                <span>Total a pagar</span>
                <strong>{money(total)}</strong>
              </p>
              <Button disabled={!lines.length} onClick={() => setCheckout(true)}>
                Cobrar {money(total)}
              </Button>
            </section>
          )}
        </div>
      </ManagementPanel>
      {viewing && <ProductDetail product={viewing} onClose={() => setViewing(null)} />}
      {checkout && (
        <Details title="Registro de venta" onClose={() => setCheckout(false)}>
          <p className="text-center text-sm text-line">Punto de venta de productos</p>
          <div className="my-5 space-y-3 rounded-media bg-dashboard-canvas p-4 text-sm">
            {lines.map(({ product, quantity }) => (
              <p key={product.id} className="flex justify-between gap-3">
                <span>
                  {product.name} × {quantity}
                </span>
                <span>{money(product.priceCents * quantity)}</span>
              </p>
            ))}
            <p className="border-t border-line pt-3 font-bold">Total a pagar: {money(total)}</p>
          </div>
          <PaymentOptions value={method} onChange={setMethod} />
          <Button
            disabled={!lines.length}
            className="w-full"
            onClick={() => {
              const sale = {
                id: newDemoId("sale"),
                date: demoDate,
                method,
                lines: lines.map(({ product, quantity }) => ({
                  productId: product.id,
                  name: product.name,
                  quantity,
                  cents: product.priceCents,
                })),
                total,
              };
              setData((current) => ({
                ...current,
                sales: [...current.sales, sale],
                products: current.products.map((product) => ({
                  ...product,
                  stock:
                    product.stock -
                    (lines.find((line) => line.product.id === product.id)?.quantity ?? 0),
                })),
              }));
              setCart({});
              setCheckout(false);
              setCompletedSale(sale);
            }}
          >
            Confirmar venta
          </Button>
        </Details>
      )}
      {completedSale && (
        <SaleConfirmation sale={completedSale} onClose={() => setCompletedSale(null)} />
      )}
    </>
  );
}

export function PaymentOptions({
  value,
  onChange,
  cash = true,
  cards = false,
}: {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  cash?: boolean;
  cards?: boolean;
}) {
  return (
    <fieldset className="my-5">
      <legend className={cards ? "sr-only" : "font-bold"}>Método de pago</legend>
      <div
        className={
          cards ? "grid grid-cols-2 gap-3.5 max-md:grid-cols-1" : "mt-3 flex flex-col gap-3"
        }
      >
        {(Object.keys(paymentLabels) as PaymentMethod[])
          .filter((method) => cash || method !== "cash")
          .map((method) => (
            <label
              key={method}
              className={`flex cursor-pointer gap-3 border text-sm ${cards ? "min-h-30 items-start rounded-statistic border-brand-start px-7 py-5" : "min-h-11 items-center rounded-control p-3"} ${method === value ? "border-brand-end bg-[#fde0df]" : "border-line bg-white"}`}
            >
              <input
                type="radio"
                name="payment-method"
                value={method}
                checked={value === method}
                onChange={() => onChange(method)}
                className={
                  cards ? "mt-0.5 size-5 shrink-0 accent-brand-start" : "accent-brand-start"
                }
              />
              {cards ? (
                <span className="mx-auto flex max-w-57 flex-col gap-3">
                  <span className="flex min-h-6 items-center gap-3">
                    <Image
                      src={`/dashboard/payment-${method}.svg`}
                      alt=""
                      width={method === "card" ? 22 : 18}
                      height={method === "card" ? 16 : 22}
                    />
                    {paymentLabels[method]}
                  </span>
                  <span className="text-muted">
                    {method === "card" ? "Tarjeta de crédito o débito" : "Pago con Yape"}
                  </span>
                </span>
              ) : (
                paymentLabels[method]
              )}
            </label>
          ))}
      </div>
    </fieldset>
  );
}
