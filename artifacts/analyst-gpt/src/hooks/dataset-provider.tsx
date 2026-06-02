import { useState } from "react";
import type { ReactNode } from "react";
import type { InsightResult } from "@workspace/api-client-react";
import { DatasetContext, DatasetProfile } from "./use-dataset";

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<DatasetProfile | null>(null);
  const [insights, setInsights] = useState<InsightResult | null>(null);
  const [rawFile, setRawFile] = useState<File | null>(null);

  return (
    <DatasetContext.Provider
      value={{
        profile,
        setProfile,
        insights,
        setInsights,
        rawFile,
        setRawFile,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}
