import { createContext, useContext } from "react";
import type { InsightResult } from "@workspace/api-client-react";

export type ColumnType = "numeric" | "categorical" | "date" | "unknown";

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  nullCount: number;
  nullPct: number;
  uniqueCount: number;
  hasOutlier: boolean;
  mean?: number;
  min?: number;
  max?: number;
  topValues?: string[];
}

export interface DatasetProfile {
  filename: string;
  fileSize: number;
  rowCount: number;
  colCount: number;
  missingValues: number;
  duplicateRows: number;
  qualityScore: number;
  columns: ColumnProfile[];
  preview: Record<string, string>[];
}

export interface DatasetContextType {
  profile: DatasetProfile | null;
  setProfile: (profile: DatasetProfile | null) => void;
  insights: InsightResult | null;
  setInsights: (insights: InsightResult | null) => void;
  rawFile: File | null;
  setRawFile: (file: File | null) => void;
}

export const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export function useDataset() {
  const context = useContext(DatasetContext);
  if (context === undefined) {
    throw new Error("useDataset must be used within a DatasetProvider");
  }
  return context;
}
