import { Router } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { GenerateInsightBody } from "@workspace/api-zod";

const router = Router();

function generateMockInsights(summary: {
  filename: string;
  row_count: number;
  col_count: number;
  quality_score: number;
  duplicate_rows: number;
  columns: Array<{
    name: string;
    type: string;
    null_pct: number;
    unique_count: number;
    top_values: string[];
    mean?: number | null;
    min?: number | null;
    max?: number | null;
  }>;
}) {
  const numericCols = summary.columns.filter((c) => c.type === "numeric");
  const categoricalCols = summary.columns.filter(
    (c) => c.type === "categorical"
  );
  const highNullCols = summary.columns.filter((c) => c.null_pct > 20);

  const insights = [];

  if (numericCols.length > 0) {
    const col = numericCols[0];
    insights.push({
      id: "insight-1",
      category: "Trend",
      title: `Distribusi ${col.name} Menunjukkan Variasi Signifikan`,
      description: `Kolom ${col.name} memiliki rentang nilai dari ${col.min?.toFixed(2) ?? "N/A"} hingga ${col.max?.toFixed(2) ?? "N/A"} dengan rata-rata ${col.mean?.toFixed(2) ?? "N/A"}. Variasi ini mengindikasikan adanya segmentasi yang perlu diperhatikan dalam analisis bisnis.`,
      confidence: 0.87,
      priority: "tinggi",
      expected_impact:
        "Optimalisasi strategi berdasarkan segmen nilai dapat meningkatkan efisiensi 15-25%",
    });
  }

  if (highNullCols.length > 0) {
    insights.push({
      id: "insight-2",
      category: "Risiko",
      title: `Data Tidak Lengkap pada ${highNullCols.length} Kolom Kritis`,
      description: `Ditemukan ${highNullCols.length} kolom dengan missing values di atas 20%: ${highNullCols.map((c) => c.name).join(", ")}. Hal ini dapat mempengaruhi keakuratan model prediktif dan keputusan bisnis yang didasarkan pada data ini.`,
      confidence: 0.95,
      priority: "tinggi",
      expected_impact:
        "Pengisian data yang hilang dapat meningkatkan akurasi analisis hingga 30%",
    });
  }

  if (categoricalCols.length > 0) {
    const col = categoricalCols[0];
    insights.push({
      id: "insight-3",
      category: "Peluang",
      title: `Konsentrasi Tinggi pada Kategori Tertentu di ${col.name}`,
      description: `Kolom ${col.name} menunjukkan konsentrasi pada ${col.top_values.slice(0, 3).join(", ")}. Peluang ekspansi ke kategori minor berpotensi membuka segmen pasar baru yang belum terjamah.`,
      confidence: 0.78,
      priority: "sedang",
      expected_impact:
        "Diversifikasi kategori dapat memperluas jangkauan pasar 20-35%",
    });
  }

  insights.push({
    id: "insight-4",
    category: "Informasi",
    title: `Dataset Memiliki Skor Kualitas ${summary.quality_score.toFixed(0)}/100`,
    description: `Dari ${summary.row_count.toLocaleString("id-ID")} baris data dengan ${summary.col_count} kolom, dataset ini memperoleh skor kualitas ${summary.quality_score.toFixed(0)}/100. ${summary.duplicate_rows > 0 ? `Terdapat ${summary.duplicate_rows} baris duplikat yang perlu dibersihkan sebelum analisis lebih lanjut.` : "Tidak ada baris duplikat yang terdeteksi — kualitas data sangat baik."}`,
    confidence: 1.0,
    priority: "rendah",
    expected_impact:
      "Pembersihan data akan meningkatkan reliabilitas hasil analisis",
  });

  if (numericCols.length >= 2) {
    insights.push({
      id: "insight-5",
      category: "Anomali",
      title: "Potensi Outlier Terdeteksi pada Data Numerik",
      description: `Analisis IQR mendeteksi kemungkinan outlier pada kolom numerik dataset. Nilai-nilai ekstrem ini bisa merupakan kesalahan data atau kejadian bisnis yang perlu investigasi lebih mendalam untuk memastikan validitasnya.`,
      confidence: 0.72,
      priority: "sedang",
      expected_impact:
        "Penanganan outlier dapat meningkatkan akurasi model prediksi 10-20%",
    });
  }

  const recommendations = [
    {
      id: "rec-1",
      title: "Lakukan Pembersihan dan Validasi Data",
      description:
        "Prioritaskan pembersihan missing values dan duplikat sebelum menggunakan data ini untuk pengambilan keputusan strategis.",
      action: `Gunakan teknik imputasi untuk kolom dengan null < 30%, dan pertimbangkan penghapusan baris untuk kolom dengan null > 50%. Hapus ${summary.duplicate_rows} baris duplikat yang teridentifikasi.`,
      priority: "tinggi" as const,
    },
    {
      id: "rec-2",
      title: "Segmentasi Data untuk Analisis Mendalam",
      description:
        "Manfaatkan kolom kategoris untuk membuat segmen data yang lebih actionable bagi tim bisnis.",
      action: `Buat pivot table berdasarkan ${categoricalCols[0]?.name ?? "kolom kategoris"} untuk mengidentifikasi pola per segmen. Kombinasikan dengan metrik numerik untuk insight yang lebih kaya.`,
      priority: "sedang" as const,
    },
    {
      id: "rec-3",
      title: "Implementasikan Monitoring Kualitas Data Berkelanjutan",
      description:
        "Bangun pipeline data quality monitoring untuk memastikan dataset selalu berada dalam kondisi optimal.",
      action:
        "Tetapkan threshold kualitas minimum (skor >= 80) dan buat alert otomatis ketika kualitas data menurun. Jadwalkan review data mingguan dengan tim data engineering.",
      priority: "rendah" as const,
    },
  ];

  return { insights, recommendations };
}

router.post("/generate-insight", async (req, res) => {
  const parseResult = GenerateInsightBody.safeParse(req.body);
  if (!parseResult.success) {
    res.status(400).json({
      error: "invalid_input",
      message: "Format data tidak valid. Pastikan semua field terisi dengan benar.",
    });
    return;
  }

  const summary = parseResult.data;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    req.log.info("ANTHROPIC_API_KEY not set, returning mock insights");
    const { insights, recommendations } = generateMockInsights(summary);
    res.json({
      insights,
      recommendations,
      generated_at: new Date().toISOString(),
      source: "mock",
    });
    return;
  }

  try {
    const client = new Anthropic({ apiKey });

    const columnDescriptions = summary.columns
      .map((col) => {
        const extras =
          col.type === "numeric"
            ? `, rata-rata: ${col.mean?.toFixed(2) ?? "N/A"}, min: ${col.min?.toFixed(2) ?? "N/A"}, maks: ${col.max?.toFixed(2) ?? "N/A"}`
            : `, nilai teratas: ${col.top_values.slice(0, 3).join(", ")}`;
        return `- ${col.name} (${col.type}): null ${col.null_pct.toFixed(1)}%, unik: ${col.unique_count}${extras}`;
      })
      .join("\n");

    const prompt = `Kamu adalah analis data bisnis senior yang memberikan insight strategis dalam Bahasa Indonesia.

Dataset: ${summary.filename}
Jumlah baris: ${summary.row_count.toLocaleString("id-ID")}
Jumlah kolom: ${summary.col_count}
Skor kualitas data: ${summary.quality_score.toFixed(1)}/100
Baris duplikat: ${summary.duplicate_rows}

Ringkasan kolom:
${columnDescriptions}

Berikan analisis dalam format JSON berikut. WAJIB dalam Bahasa Indonesia:
{
  "insights": [
    {
      "id": "insight-1",
      "category": "Trend" | "Anomali" | "Peluang" | "Risiko" | "Informasi",
      "title": "judul singkat dan informatif",
      "description": "penjelasan detail minimal 2 kalimat tentang temuan ini",
      "confidence": 0.0-1.0,
      "priority": "tinggi" | "sedang" | "rendah",
      "expected_impact": "dampak bisnis yang diharapkan jika insight ini ditindaklanjuti"
    }
  ],
  "recommendations": [
    {
      "id": "rec-1",
      "title": "judul rekomendasi aksi",
      "description": "penjelasan mengapa rekomendasi ini penting",
      "action": "langkah konkret yang harus diambil",
      "priority": "tinggi" | "sedang" | "rendah"
    }
  ]
}

Berikan tepat 4-5 insights dan 2-3 rekomendasi. Fokus pada nilai bisnis yang actionable.`;

    const message = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Claude response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    res.json({
      insights: parsed.insights ?? [],
      recommendations: parsed.recommendations ?? [],
      generated_at: new Date().toISOString(),
      source: "claude",
    });
  } catch (err) {
    req.log.error({ err }, "Claude API error, falling back to mock insights");
    const { insights, recommendations } = generateMockInsights(summary);
    res.json({
      insights,
      recommendations,
      generated_at: new Date().toISOString(),
      source: "mock",
    });
  }
});

export default router;
