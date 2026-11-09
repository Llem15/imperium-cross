import type { Metadata } from "next";
import { TrainingReservationManager } from "@/features/scheduling/training-reservation-manager";

export const metadata: Metadata = { title: "Reservas | Imperium Cross" };

export default function Page() {
  return <TrainingReservationManager />;
}
