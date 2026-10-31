"use client";

import { createContext, useContext, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { initialDemoData } from "@/mocks/internal-data";
import type { DemoData } from "@/mocks/internal-data";

type DemoContextValue = { data: DemoData; setData: Dispatch<SetStateAction<DemoData>> };
const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState(initialDemoData);
  return <DemoContext.Provider value={{ data, setData }}>{children}</DemoContext.Provider>;
}

export function useDemoData() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("La vista debe estar dentro de DemoProvider.");
  return context;
}
