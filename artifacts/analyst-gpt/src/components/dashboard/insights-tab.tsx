import { useState } from "react";
import { DatasetProfile, useDataset } from "../../hooks/use-dataset";
import { useGenerateInsight } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import {
  BrainCircuit, RefreshCw, TrendingUp, AlertTriangle, Star,
  ShieldAlert, Info, Zap, ChevronRight, Copy, Check, Target, Sparkles,
} from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────────

const CARD_STYLE: React.CSSProperties = {
  background: 'linear-gradient(145deg, #1a2540 0%, #111d35 100%)',
  border: '1px solid rgba(255,255,255,0.05)',
  boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
};

// ── Category / Priority / Confidence config ───────────────────────────────────

type CatKey = 'trend' | 'anomali' | 'peluang' | 'risiko' | 'informasi';

const CAT: Record<CatKey, { Icon: React.ElementType; color: string; bg: string; border: string }> = {
  trend:     { Icon: TrendingUp,    color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  border: 'rgba(99,102,241,0.2)' },
  anomali:   { Icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.2)' },
  peluang:   { Icon: Star,          color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.2)' },
  risiko:    { Icon: ShieldAlert,   color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.2)' },
  informasi: { Icon: Info,          color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.15)' },
};

const PRI: Record<string, { label: string; color: string; bg: string }> = {
  tinggi: { label: 'Tinggi', color: '#f87171', bg: 'rgba(239,68,68,0.12)' },
  sedang: { label: 'Sedang', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' },
  rendah: { label: 'Rendah', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
};

function confLabel(v: number) {
  if (v >= 0.8) return { label: 'Tinggi', color: '#34d399', bg: 'rgba(16,185,129,0.12)' };
  if (v >= 0.6) return { label: 'Sedang', color: '#fbbf24', bg: 'rgba(245,158,11,0.12)' };
  return { label: 'Rendah', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };
}

function getCat(raw: string) {
  const key = raw.toLowerCase() as CatKey;
  return CAT[key] ?? CAT.informasi;
}

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 2000); }); }}
      className="p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100"
      style={{ color: done ? '#34d399' : '#475569', background: done ? 'rgba(16,185,129,0.1)' : 'transparent' }}
      title="Salin"
    >
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

// ── Pill badge ─────────────────────────────────────────────────────────────────

function Pill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
      style={{ color, background: bg }}
    >
      {label}
    </span>
  );
}

// ── Insight card ───────────────────────────────────────────────────────────────

function InsightCard({ insight, idx }: { insight: any; idx: number }) {
  const cat = getCat(insight.category);
  const pri = PRI[(insight.priority as string).toLowerCase()] ?? PRI.rendah;
  const conf = confLabel(insight.confidence);
  const copyText = `${insight.title}\n\n${insight.description}\n\nDampak: ${insight.expected_impact}`;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl transition-all duration-200"
      style={{
        ...CARD_STYLE,
        boxShadow: `0 0 0 1px ${cat.color}10, 0 4px 24px rgba(0,0,0,0.3)`,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${cat.color}25, 0 8px 32px rgba(0,0,0,0.4)`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${cat.color}10, 0 4px 24px rgba(0,0,0,0.3)`; }}
    >
      {/* Thin top accent */}
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, ${cat.color} 0%, ${cat.color}20 100%)` }} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Number + category icon stack */}
          <div className="flex flex-col items-center gap-2 shrink-0 pt-0.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white"
              style={{ background: `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)` }}
            >
              {idx + 1}
            </div>
            <div
              className="p-1.5 rounded-lg flex items-center justify-center"
              style={{ background: cat.bg, border: `1px solid ${cat.border}` }}
            >
              <cat.Icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bold text-sm leading-snug" style={{ color: '#f1f5f9' }}>
                {insight.title}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <Pill label={pri.label} color={pri.color} bg={pri.bg} />
                <CopyBtn text={copyText} />
              </div>
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed mb-3" style={{ color: '#64748b' }}>
              {insight.description}
            </p>

            {/* Footer row */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ color: cat.color, background: cat.bg, border: `1px solid ${cat.border}` }}
              >
                {insight.category}
              </span>
              <Pill label={`${conf.label} ${Math.round(insight.confidence * 100)}%`} color={conf.color} bg={conf.bg} />
              <span className="text-[11px]" style={{ color: '#475569' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Dampak:</span> {insight.expected_impact}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Recommendation card ────────────────────────────────────────────────────────

function RecCard({ rec, idx }: { rec: any; idx: number }) {
  const pri = PRI[(rec.priority as string).toLowerCase()] ?? PRI.rendah;
  const copyText = `${rec.title}\n\n${rec.description}\n\nLangkah: ${rec.action}`;

  return (
    <div
      className="group relative overflow-hidden rounded-2xl transition-all duration-200"
      style={{
        background: 'linear-gradient(145deg, rgba(99,102,241,0.08) 0%, rgba(17,29,53,0.9) 100%)',
        border: '1px solid rgba(99,102,241,0.15)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(99,102,241,0.3)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.border = '1px solid rgba(99,102,241,0.15)'; }}
    >
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: 'linear-gradient(90deg, #8b5cf6 0%, rgba(139,92,246,0.1) 100%)' }} />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)' }}
            >
              {idx + 1}
            </div>
            <h4 className="font-bold text-sm" style={{ color: '#e2e8f0' }}>{rec.title}</h4>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Pill label={pri.label} color={pri.color} bg={pri.bg} />
            <CopyBtn text={copyText} />
          </div>
        </div>

        <p className="text-xs leading-relaxed mb-3 ml-8" style={{ color: '#64748b' }}>
          {rec.description}
        </p>

        <div
          className="ml-8 flex items-start gap-2 rounded-xl p-3"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.12)' }}
        >
          <ChevronRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#818cf8' }} />
          <span className="text-xs font-semibold" style={{ color: '#c7d2fe' }}>{rec.action}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function InsightsTab({ profile, insights }: { profile: DatasetProfile; insights: any }) {
  const { setInsights } = useDataset();
  const generateInsight = useGenerateInsight();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    const summaryInput = {
      filename: profile.filename,
      row_count: profile.rowCount,
      col_count: profile.colCount,
      quality_score: profile.qualityScore,
      duplicate_rows: profile.duplicateRows,
      columns: profile.columns.map(c => ({
        name: c.name, type: c.type, null_pct: c.nullPct,
        unique_count: c.uniqueCount, top_values: c.topValues || [],
        mean: c.mean, min: c.min, max: c.max,
      })),
    };

    generateInsight.mutate({ data: summaryInput as any }, {
      onSuccess: data => { setInsights(data); setIsGenerating(false); },
      onError: err => {
        console.error("Failed to generate insights", err);
        setIsGenerating(false);
        setInsights({
          source: "mock",
          generated_at: new Date().toISOString(),
          insights: [
            { id: "i1", category: "Trend", title: "Pertumbuhan Stabil pada Kategori Utama", description: "Data menunjukkan peningkatan konsisten pada 3 kategori teratas selama periode yang dianalisis. Tren ini mengindikasikan permintaan yang sehat pada segmen unggulan.", confidence: 0.85, priority: "tinggi", expected_impact: "Peningkatan pendapatan 15-20% di Q3" },
            { id: "i2", category: "Anomali", title: "Lonjakan Tidak Wajar di Periode Tertentu", description: "Terdapat nilai ekstrem yang jauh melebihi rata-rata pada beberapa periode. Perlu investigasi apakah ini kesalahan data atau kejadian bisnis aktual.", confidence: 0.72, priority: "sedang", expected_impact: "Validasi data dapat meningkatkan akurasi forecast 10%" },
            { id: "i3", category: "Peluang", title: "Segmen Belum Teroptimalkan Berpotensi Tinggi", description: "Beberapa kategori dengan transaksi rendah memiliki nilai rata-rata transaksi yang lebih tinggi. Peningkatan frekuensi di segmen ini berpotensi menaikkan total revenue signifikan.", confidence: 0.78, priority: "tinggi", expected_impact: "Potensi tambahan revenue 25% dari segmen minor" },
            { id: "i4", category: "Informasi", title: "Kualitas Dataset Mendukung Analisis Lanjutan", description: "Dataset memiliki skor kualitas yang baik dengan missing values minimal. Kondisi ini ideal untuk modeling prediktif lebih lanjut.", confidence: 1.0, priority: "rendah", expected_impact: "Data siap digunakan untuk prediksi jangka menengah" },
          ],
          recommendations: [
            { id: "r1", title: "Fokus Investasi pada Kategori Unggulan", description: "Alokasikan lebih banyak sumber daya marketing pada kategori yang menunjukkan tren positif konsisten.", action: "Tingkatkan budget marketing kategori top 3 sebesar 20% di kuartal berikutnya", priority: "tinggi" },
            { id: "r2", title: "Audit Data Periode Anomali", description: "Lakukan validasi manual pada entri data yang menunjukkan nilai ekstrem untuk memastikan integritas analisis.", action: "Review dan validasi 50 baris teratas berdasarkan nilai outlier sebelum laporan eksekutif", priority: "sedang" },
          ],
        });
      },
    });
  };

  // ── Loading state ────────────────────────────────────────────────────────────

  if (isGenerating) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <div
          className="flex items-center gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <div className="w-5 h-5 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0" />
          <div>
            <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>Sedang Menganalisis Data dengan AI...</p>
            <p className="text-xs mt-0.5" style={{ color: '#475569' }}>Gemini sedang memproses pola dan anomali di dataset Anda</p>
          </div>
        </div>
        <div className="grid gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl p-5 animate-pulse" style={CARD_STYLE}>
              <div className="flex gap-4">
                <div className="flex flex-col gap-2 shrink-0">
                  <div className="w-6 h-6 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <div className="w-7 h-7 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)' }} />
                </div>
                <div className="flex-1 space-y-2.5">
                  <div className="flex justify-between gap-4">
                    <div className="h-3.5 rounded-lg w-2/5" style={{ background: 'rgba(255,255,255,0.07)' }} />
                    <div className="h-3.5 rounded-lg w-16" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                  <div className="h-2.5 rounded w-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                  <div className="h-2.5 rounded w-4/5" style={{ background: 'rgba(255,255,255,0.03)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ──────────────────────────────────────────────────────────────

  if (!insights) {
    return (
      <div
        className="rounded-2xl flex flex-col items-center justify-center py-20 px-8 text-center animate-in fade-in duration-500"
        style={CARD_STYLE}
      >
        {/* Glow ring */}
        <div className="relative mb-7">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <BrainCircuit className="w-10 h-10" style={{ color: '#6366f1' }} />
          </div>
          <div
            className="absolute inset-0 rounded-2xl blur-xl opacity-40"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.6) 0%, transparent 70%)' }}
          />
        </div>

        <h2 className="text-2xl font-black mb-3" style={{ color: '#f1f5f9' }}>AI Siap Menganalisis</h2>
        <p className="text-sm leading-relaxed max-w-md mb-8" style={{ color: '#475569' }}>
          Gemini AI akan mengidentifikasi tren tersembunyi, mendeteksi anomali, dan memberikan
          rekomendasi strategis yang actionable dari dataset Anda.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {[
            { Icon: TrendingUp, label: 'Deteksi Tren', color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
            { Icon: AlertTriangle, label: 'Deteksi Anomali', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
            { Icon: Star, label: 'Peluang Bisnis', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            { Icon: Target, label: 'Rekomendasi Aksi', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
          ].map(({ Icon, label, color, bg }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ color, background: bg, border: `1px solid ${color}25` }}
            >
              <Icon className="w-3 h-3" />
              {label}
            </span>
          ))}
        </div>

        <Button
          size="lg"
          className="gradient-accent border-0 h-12 px-8 text-base font-bold shadow-xl hover:opacity-90 transition-opacity"
          style={{ boxShadow: '0 8px 32px rgba(99,102,241,0.35)' }}
          onClick={handleGenerate}
        >
          <Zap className="w-5 h-5 mr-2" />
          Buat Insight dengan AI
        </Button>
      </div>
    );
  }

  // ── Insights loaded ──────────────────────────────────────────────────────────

  const sourceLabel = insights.source === 'gemini' ? 'Gemini AI'
    : insights.source === 'huggingface' ? 'HuggingFace AI'
    : insights.source === 'claude' ? 'Claude AI'
    : 'Demo';
  const sourceColor = insights.source === 'gemini' ? { color: '#34d399', bg: 'rgba(16,185,129,0.12)' }
    : insights.source === 'huggingface' ? { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' }
    : { color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
              style={sourceColor}
            >
              <Sparkles className="w-3 h-3" />
              {sourceLabel}
            </span>
            <span className="text-xs" style={{ color: '#3f5068' }}>
              {new Date(insights.generated_at).toLocaleTimeString('id-ID')}
            </span>
          </div>
          <h2 className="text-2xl font-black" style={{ color: '#f1f5f9' }}>Insight Eksekutif</h2>
        </div>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
          style={{
            color: '#94a3b8',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#f1f5f9'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#94a3b8'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
        >
          <RefreshCw className="w-4 h-4" />
          Perbarui
        </button>
      </div>

      {/* Insight cards */}
      <div className="grid gap-3">
        {insights.insights.map((insight: any, idx: number) => (
          <InsightCard key={insight.id} insight={insight} idx={idx} />
        ))}
      </div>

      {/* Recommendations */}
      <div>
        <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: '#e2e8f0' }}>
          <div
            className="p-1.5 rounded-lg"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            <Target className="w-4 h-4" style={{ color: '#a78bfa' }} />
          </div>
          Rekomendasi Tindakan
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {insights.recommendations.map((rec: any, idx: number) => (
            <RecCard key={rec.id} rec={rec} idx={idx} />
          ))}
        </div>
      </div>
    </div>
  );
}
