import type { Metadata } from "next";
import { MemberRoutine } from "@/features/training/member-routine";

export const metadata: Metadata = { title: "Mi rutina | Imperium Cross" };

export default function MemberRoutinePage() {
  return <MemberRoutine />;
}
