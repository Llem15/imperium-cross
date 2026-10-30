import type { Metadata } from "next";
import { DemoLogin } from "@/features/access/demo-login";

export const metadata: Metadata = { title: "Acceso de demostración | Imperium Cross" };

export default function LoginPage() {
  return <DemoLogin />;
}
