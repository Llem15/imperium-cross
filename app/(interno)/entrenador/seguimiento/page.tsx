import type { Metadata } from "next";
import { TrackingPage } from "@/features/training/tracking-page";

export const metadata: Metadata = { title: "Seguimiento | Imperium Cross" };

export default function Page() {
  return <TrackingPage />;
}
