import type { Metadata } from "next";
import { RoutineManagerApi } from "@/features/training/routine-manager-api";

export const metadata: Metadata = { title: "Rutinas | Imperium Cross" };

export default function Page() {
  return <RoutineManagerApi />;
}
