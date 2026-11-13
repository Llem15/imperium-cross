import { describe, expect, it } from "vitest";
import { parseApiProducts } from "./product-api-model";

const product = {
  idProducto: 1,
  nombreProducto: "Whey 3kg Chocolate",
  descripcionProducto: "Proteína whey",
  precio: 90,
  categoria: "Suplemento",
  stock: 11,
  stockMinimo: 5,
  activo: true,
};

describe("API product mapping", () => {
  it("accepts products backed by SQL inventory", () => {
    expect(parseApiProducts([product])).toEqual([product]);
    expect(
      parseApiProducts([{ ...product, descripcionProducto: null, categoria: null, activo: false }]),
    ).toHaveLength(1);
  });

  it("rejects malformed product responses", () => {
    expect(() => parseApiProducts({ products: [product] })).toThrow(
      "La respuesta de productos no tiene el formato esperado.",
    );
    expect(() => parseApiProducts([{ ...product, stock: -1 }])).toThrow(
      "La respuesta de productos no tiene el formato esperado.",
    );
    expect(() => parseApiProducts([{ ...product, stockMinimo: -1 }])).toThrow(
      "La respuesta de productos no tiene el formato esperado.",
    );
    expect(() => parseApiProducts([{ ...product, precio: Number.NaN }])).toThrow(
      "La respuesta de productos no tiene el formato esperado.",
    );
  });
});
