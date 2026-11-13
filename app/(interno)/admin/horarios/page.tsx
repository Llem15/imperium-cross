import type { Metadata } from "next";
import { TrainerScheduleManager } from "@/features/scheduling/trainer-schedule-manager";

export const metadata: Metadata = { title: "Horarios | Imperium Cross" };

export default function Page() {
  return <TrainerScheduleManager />;
}
