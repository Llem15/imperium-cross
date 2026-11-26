// CÓDIGO DE SECCIÓN NUTRICIONAL
// TABLA "INGREDIENTES DETECTADOS"; SIN DATOS (ANALIZANDO) MUESTRA FILAS DE CARGA.
import { formatAmount } from "./nutrients";
import type { DetectedIngredient } from "./nutrition-types";

const placeholderWidths = ["w-4/5", "w-3/5", "w-11/12", "w-1/2"];

function Placeholder({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block h-2.5 rounded-full bg-dashboard-canvas motion-safe:animate-pulse ${className}`}
    />
  );
}

export function IngredientsTable({ ingredients }: { ingredients: DetectedIngredient[] | null }) {
  return (
    <div className="overflow-hidden rounded-media border border-dashboard-line">
      <table className="w-full text-left text-sm" aria-busy={ingredients === null}>
        <caption className="border-b border-dashboard-line bg-dashboard-canvas/40 px-4 py-3.5 text-left font-bold">
          Ingredientes detectados
        </caption>
        <thead className="text-caption text-muted">
          <tr className="border-b border-dashboard-line">
            <th scope="col" className="px-4 py-2.5 font-normal">
              Ingrediente
            </th>
            <th scope="col" className="px-2 py-2.5 font-normal">
              Porción
            </th>
            <th scope="col" className="px-4 py-2.5 text-right font-normal">
              Calorías
            </th>
          </tr>
        </thead>
        <tbody>
          {ingredients === null
            ? placeholderWidths.map((width) => (
                <tr key={width} className="border-b border-dashboard-line last:border-0">
                  <td className="w-1/2 px-4 py-4">
                    <Placeholder className={width} />
                  </td>
                  <td className="px-2 py-4">
                    <Placeholder className="w-12" />
                  </td>
                  <td className="px-4 py-4">
                    <Placeholder className="ml-auto w-12" />
                  </td>
                </tr>
              ))
            : ingredients.map((ingredient) => (
                <tr key={ingredient.id} className="border-b border-dashboard-line last:border-0">
                  <td className="px-4 py-3">{ingredient.name}</td>
                  <td className="px-2 py-3 text-muted">{ingredient.portion}</td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {formatAmount(ingredient.calories)} kcal
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
