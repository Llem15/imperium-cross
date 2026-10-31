import type { Metadata } from "next";
import { RoutinesManager } from "@/features/training/routines-manager";

export const metadata: Metadata = { title: "Rutinas | Imperium Cross" };

export default function Page() {
  return <RoutinesManager />;
}
