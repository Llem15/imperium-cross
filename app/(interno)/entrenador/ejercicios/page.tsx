import type { Metadata } from "next";
import { ExerciseLibrary } from "@/features/training/exercise-library";

export const metadata: Metadata = { title: "Ejercicios | Imperium Cross" };

export default function Page() {
  return <ExerciseLibrary />;
}
