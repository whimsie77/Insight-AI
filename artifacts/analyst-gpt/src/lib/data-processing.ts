import Papa from "papaparse";
import * as XLSX from "xlsx";
import { ColumnProfile, ColumnType, DatasetProfile } from "../hooks/use-dataset";

export class DataProcessingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataProcessingError";
  }
}

function detectColumnType(values: any[]): ColumnType {
  let hasNumber = false;
  let hasDate = false;
  let hasString = false;
  
  const sampleValues = values.filter(v => v !== null && v !== undefined && v !== "").slice(0, 100);
  if (sampleValues.length === 0) return "unknown";

  for (const v of sampleValues) {
    if (typeof v === "number") {
      hasNumber = true;
    } else if (typeof v === "string") {
      const num = Number(v);
      if (!isNaN(num) && v.trim() !== "") {
        hasNumber = true;
      } else {
        const date = new Date(v);
        if (!isNaN(date.getTime()) && v.length > 5) {
          hasDate = true;
        } else {
          hasString = true;
        }
      }
    }
  }

  if (hasString) return "categorical";
  if (hasDate && !hasNumber) return "date";
  if (hasNumber && !hasString) return "numeric";
  return "unknown";
}

function calculateColumnProfile(name: string, values: any[], type: ColumnType): ColumnProfile {
  const totalCount = values.length;
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== "");
  const nullCount = totalCount - nonNullValues.length;
  const nullPct = totalCount > 0 ? nullCount / totalCount : 0;
  
  const uniqueValues = new Set(nonNullValues);
  const uniqueCount = uniqueValues.size;

  let hasOutlier = false;
  let mean, min, max;
  let topValues: string[] | undefined;

  if (type === "numeric" && nonNullValues.length > 0) {
    const nums = nonNullValues.map(v => Number(v)).filter(n => !isNaN(n)).sort((a, b) => a - b);
    if (nums.length > 0) {
      min = nums[0];
      max = nums[nums.length - 1];
      mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      
      // IQR
      const q1 = nums[Math.floor(nums.length * 0.25)];
      const q3 = nums[Math.floor(nums.length * 0.75)];
      const iqr = q3 - q1;
      const lowerBound = q1 - 1.5 * iqr;
      const upperBound = q3 + 1.5 * iqr;
      
      hasOutlier = nums.some(n => n < lowerBound || n > upperBound);
    }
  } else if (type === "categorical" && nonNullValues.length > 0) {
    const counts = new Map<string, number>();
    for (const v of nonNullValues) {
      const strV = String(v);
      counts.set(strV, (counts.get(strV) || 0) + 1);
    }
    topValues = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  }

  return {
    name,
    type,
    nullCount,
    nullPct,
    uniqueCount,
    hasOutlier,
    mean,
    min,
    max,
    topValues
  };
}

export async function processFile(file: File): Promise<DatasetProfile> {
  if (file.size > 50 * 1024 * 1024) {
    throw new DataProcessingError("Ukuran file melebihi batas 50MB.");
  }

  let data: any[] = [];
  
  if (file.name.endsWith(".csv")) {
    const text = await file.text();
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    if (result.errors.length > 0 && result.data.length === 0) {
      throw new DataProcessingError("Gagal membaca file. Pastikan format file valid.");
    }
    data = result.data;
  } else if (file.name.endsWith(".xlsx")) {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
  } else {
    throw new DataProcessingError("Format tidak didukung. Unggah file .csv atau .xlsx.");
  }

  if (data.length === 0) {
    throw new DataProcessingError("File tidak memiliki data. Pastikan file berisi minimal 1 baris data.");
  }

  const rowCount = data.length;
  const colNames = Object.keys(data[0] || {});
  const colCount = colNames.length;

  let missingValues = 0;
  const rowStrings = new Set<string>();
  let duplicateRows = 0;

  const columns: ColumnProfile[] = [];

  for (const colName of colNames) {
    const values = data.map(row => row[colName]);
    const type = detectColumnType(values);
    const profile = calculateColumnProfile(colName, values, type);
    missingValues += profile.nullCount;
    columns.push(profile);
  }

  for (const row of data) {
    const str = JSON.stringify(row);
    if (rowStrings.has(str)) {
      duplicateRows++;
    } else {
      rowStrings.add(str);
    }
  }

  const totalCells = rowCount * colCount;
  const nullRatio = totalCells > 0 ? missingValues / totalCells : 0;
  const dupRatio = rowCount > 0 ? duplicateRows / rowCount : 0;
  const numericCols = columns.filter(c => c.type === "numeric");
  const outlierCols = numericCols.filter(c => c.hasOutlier).length;
  const outlierPenalty = numericCols.length > 0 ? outlierCols / numericCols.length : 0;

  let qualityScore = 100 - (nullRatio * 40) - (dupRatio * 30) - (outlierPenalty * 30);
  qualityScore = Math.max(0, Math.min(100, Math.round(qualityScore)));

  const preview = data.slice(0, 10).map(row => {
    const newRow: Record<string, string> = {};
    for (const key in row) {
      newRow[key] = String(row[key] ?? "");
    }
    return newRow;
  });

  return {
    filename: file.name,
    fileSize: file.size,
    rowCount,
    colCount,
    missingValues,
    duplicateRows,
    qualityScore,
    columns,
    preview
  };
}

export function generateDemoDataset(): DatasetProfile {
  const rowCount = 200;
  const data: any[] = [];
  const products = ["Laptop Pro X", "Smartphone Y", "Wireless Earbuds", "Smartwatch Z", "Tablet Mini"];
  const categories = ["Elektronik", "Aksesoris", "Gadget"];
  const regions = ["Jakarta", "Surabaya", "Bandung", "Medan"];
  
  for (let i = 0; i < rowCount; i++) {
    const date = new Date(2023, 0, 1);
    date.setDate(date.getDate() + Math.floor(Math.random() * 365));
    data.push({
      "Tanggal": date.toISOString().split("T")[0],
      "Produk": products[Math.floor(Math.random() * products.length)],
      "Kategori": categories[Math.floor(Math.random() * categories.length)],
      "Penjualan": Math.floor(Math.random() * 5000000) + 500000,
      "Stok": Math.floor(Math.random() * 200) + 10,
      "Profit": Math.floor(Math.random() * 1000000) - 50000,
      "Wilayah": regions[Math.floor(Math.random() * regions.length)]
    });
  }
  
  // Create File mock roughly to reuse process file logic or we can just build the profile directly
  const colNames = Object.keys(data[0]);
  const columns: ColumnProfile[] = [];
  for (const colName of colNames) {
    const values = data.map(row => row[colName]);
    const type = detectColumnType(values);
    columns.push(calculateColumnProfile(colName, values, type));
  }

  const preview = data.slice(0, 10).map(row => {
    const newRow: Record<string, string> = {};
    for (const key in row) {
      newRow[key] = String(row[key] ?? "");
    }
    return newRow;
  });

  return {
    filename: "demo-penjualan.csv",
    fileSize: 1024 * 45,
    rowCount,
    colCount: colNames.length,
    missingValues: 0,
    duplicateRows: 0,
    qualityScore: 95,
    columns,
    preview
  };
}
