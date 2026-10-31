import type { Metadata } from "next";
import { AttendancePage } from "@/features/members/attendance-page";

export const metadata: Metadata = { title: "Asistencia | Imperium Cross" };

export default function Page() {
  return <AttendancePage />;
}
