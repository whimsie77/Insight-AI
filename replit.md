# AnalystGPT

Platform SaaS AI untuk mengubah file CSV/Excel menjadi insight bisnis, dashboard otomatis, dan laporan eksekutif — seluruhnya dalam Bahasa Indonesia.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — jalankan API server (port 8080)
- `pnpm --filter @workspace/analyst-gpt run dev` — jalankan frontend (port dari env PORT)
- `pnpm run typecheck` — full typecheck semua package
- `pnpm run build` — typecheck + build semua package
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks dan Zod schemas dari OpenAPI spec

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + shadcn/ui + Recharts
- API: Express 5
- AI: Anthropic Claude (server-side via ANTHROPIC_API_KEY)
- File parsing: papaparse (CSV), xlsx (Excel) — client-side
- PDF export: jsPDF + jspdf-autotable
- Validasi: Zod (`zod/v4`)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — sumber kebenaran API contract
- `lib/api-client-react/src/generated/` — React Query hooks hasil codegen
- `lib/api-zod/src/generated/` — Zod schemas hasil codegen
- `artifacts/analyst-gpt/src/` — frontend React
  - `pages/landing.tsx` — halaman upload
  - `pages/dashboard.tsx` — halaman dashboard utama
  - `hooks/use-dataset.ts` — types + context (tanpa JSX)
  - `hooks/dataset-provider.tsx` — DatasetProvider JSX component
  - `lib/data-processing.ts` — parsing CSV/Excel, profiling kolom, IQR outlier detection
  - `lib/pdf-export.ts` — ekspor PDF profesional
  - `components/dashboard/` — tab Ringkasan, Grafik, AI Insights
- `artifacts/api-server/src/routes/insight.ts` — endpoint /api/generate-insight (Claude + mock fallback)

## Architecture decisions

- File parsing 100% client-side (papaparse + xlsx) — hanya summary yang dikirim ke server
- Insight generation menggunakan Claude API server-side; jika `ANTHROPIC_API_KEY` tidak ada, fallback ke mock insight realistis
- DatasetProvider di JSX `.tsx` terpisah dari types/hooks `.ts` untuk menghindari esbuild error
- Google Fonts @import url() harus menjadi baris PERTAMA di index.css sebelum @import "tailwindcss"

## Product

- Upload CSV/XLSX dengan drag-and-drop, max 50MB
- Auto-profiling: deteksi tipe kolom, null count, unique count, outlier (IQR), Data Quality Score 0-100
- Dashboard 3 tab: Ringkasan (profiling tabel), Grafik (4-6 chart Recharts otomatis), AI Insights
- Tombol "Coba Dataset Demo" memuat dataset penjualan demo 200 baris
- Export PDF laporan eksekutif profesional (jsPDF)
- Seluruh UI, label, dan pesan error dalam Bahasa Indonesia

## User preferences

- Seluruh UI dalam Bahasa Indonesia
- Design: premium SaaS modern, background #F8FAFC, primary blue #2563EB, dark navy #0F172A
- Font Inter, rounded corners 8px, subtle shadows
- Tidak ada emoji di UI

## Gotchas

- Selalu jalankan codegen setelah mengubah openapi.yaml: `pnpm --filter @workspace/api-spec run codegen`
- File JSX harus berekstensi `.tsx`, bukan `.ts` — esbuild akan error jika ada JSX di file `.ts`
- Google Fonts `@import url(...)` WAJIB menjadi baris pertama di index.css (sebelum `@import "tailwindcss"`)
- `ANTHROPIC_API_KEY` env var dibutuhkan di API server untuk Claude; tanpa itu, sistem auto-fallback ke mock insight
- Jangan expose API key ke client — hanya server yang mengakses Claude

## Pointers

- Lihat `pnpm-workspace` skill untuk struktur workspace, TypeScript setup, dan detail package
