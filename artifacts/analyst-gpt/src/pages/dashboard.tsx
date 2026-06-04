import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Download, FileSpreadsheet, Database, Table2, Copy, Shield, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataset } from "../hooks/use-dataset";
import { exportToPDF } from "../lib/pdf-export";
import SummaryTab from "../components/dashboard/summary-tab";
import ChartsTab from "../components/dashboard/charts-tab";
import InsightsTab from "../components/dashboard/insights-tab";
import { toast } from "sonner";

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(0);
    const startTime = performance.now();
    let raf: number;
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return count;
}

function QualityDonut({ score }: { score: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="56" height="56" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
      <circle
        cx="28" cy="28" r={r} fill="none"
        stroke={color} strokeWidth="5"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.34,1.56,0.64,1)' }}
      />
    </svg>
  );
}

export default function DashboardPage() {
  const [_, setLocation] = useLocation();
  const { profile, insights } = useDataset();
  const [activeTab, setActiveTab] = useState("summary");

  const rowCount = useCountUp(profile?.rowCount ?? 0);
  const colCount = useCountUp(profile?.colCount ?? 0, 800);
  const missingCount = useCountUp(profile?.missingValues ?? 0, 900);
  const dupCount = useCountUp(profile?.duplicateRows ?? 0, 1000);

  if (!profile) {
    setLocation("/");
    return null;
  }

  const handleExport = () => {
    exportToPDF(profile, insights);
    toast.success("Laporan PDF berhasil diunduh!", {
      description: `${profile.filename} — ${new Date().toLocaleDateString('id-ID')}`,
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const qualityScore = profile.qualityScore;
  const qualityHex = qualityScore >= 80 ? '#10b981' : qualityScore >= 60 ? '#f59e0b' : '#ef4444';
  const qualityLabel = qualityScore >= 80 ? 'Sangat Baik' : qualityScore >= 60 ? 'Baik' : 'Perlu Perhatian';
  const QualityIcon = qualityScore >= 80 ? CheckCircle : qualityScore >= 60 ? Info : AlertTriangle;

  const statCards = [
    {
      label: "Total Baris",
      value: rowCount.toLocaleString('id-ID'),
      subtitle: "Records dalam dataset",
      icon: <Database className="w-4 h-4" />,
      accentColor: '#6366f1',
      delay: 0,
    },
    {
      label: "Total Kolom",
      value: String(colCount),
      subtitle: "Variabel terdeteksi",
      icon: <Table2 className="w-4 h-4" />,
      accentColor: '#06b6d4',
      delay: 80,
    },
    {
      label: "Missing Values",
      value: missingCount.toLocaleString('id-ID'),
      subtitle: "Data tidak lengkap",
      icon: <Info className="w-4 h-4" />,
      accentColor: '#f59e0b',
      delay: 160,
    },
    {
      label: "Baris Duplikat",
      value: dupCount.toLocaleString('id-ID'),
      subtitle: "Baris berulang",
      icon: <Copy className="w-4 h-4" />,
      accentColor: '#f97316',
      delay: 240,
    },
  ];

  return (
    <div className="min-h-screen pb-16 relative" style={{ background: '#0d1526' }}>
      {/* Page ambient glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -15%, rgba(99,102,241,0.12) 0%, transparent 60%)' }}
      />

      {/* Topbar */}
      <header
        className="sticky top-0 z-40 backdrop-blur-xl"
        style={{ background: 'rgba(13,21,38,0.88)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-base flex items-center gap-2 text-white">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                {profile.filename}
              </h1>
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <span>{formatSize(profile.fileSize)}</span>
                <span>·</span>
                <span>Diunggah {new Date().toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleExport}
            className="gradient-accent border-0 shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-opacity font-semibold"
          >
            <Download className="w-4 h-4 mr-2" />
            Ekspor PDF
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8 max-w-7xl relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((card, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 cursor-default select-none"
              style={{
                background: 'linear-gradient(145deg, #1a2540 0%, #111d35 100%)',
                border: '1px solid rgba(255,255,255,0.05)',
                boxShadow: `0 0 0 1px ${card.accentColor}18, 0 8px 32px rgba(0,0,0,0.4)`,
                animationDelay: `${card.delay}ms`,
              }}
            >
              {/* Colored top accent bar */}
              <div
                className="absolute top-0 left-0 right-0 h-[2px]"
                style={{ background: `linear-gradient(90deg, ${card.accentColor} 0%, ${card.accentColor}25 100%)` }}
              />

              <div className="p-5 pt-6">
                {/* Label + Icon */}
                <div className="flex items-center justify-between mb-5">
                  <p
                    className="text-[10px] font-bold uppercase tracking-widest leading-none"
                    style={{ color: 'rgba(148,163,184,0.55)' }}
                  >
                    {card.label}
                  </p>
                  <div
                    className="p-1.5 rounded-lg flex items-center justify-center"
                    style={{
                      background: `${card.accentColor}18`,
                      border: `1px solid ${card.accentColor}28`,
                    }}
                  >
                    <span style={{ color: card.accentColor }}>{card.icon}</span>
                  </div>
                </div>

                {/* Value */}
                <div
                  className="leading-none tracking-tight tabular-nums font-black"
                  style={{ fontSize: '2.25rem', color: '#f1f5f9' }}
                >
                  {card.value}
                </div>

                {/* Subtitle */}
                <p className="mt-2 text-xs" style={{ color: 'rgba(100,116,139,0.65)' }}>
                  {card.subtitle}
                </p>
              </div>
            </div>
          ))}

          {/* Quality Score Card */}
          <div
            className="relative overflow-hidden rounded-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 lg:col-span-1 cursor-default select-none"
            style={{
              background: 'linear-gradient(145deg, #1a2540 0%, #111d35 100%)',
              border: '1px solid rgba(255,255,255,0.05)',
              boxShadow: `0 0 0 1px ${qualityHex}18, 0 8px 32px rgba(0,0,0,0.4)`,
              animationDelay: '320ms',
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, ${qualityHex} 0%, ${qualityHex}25 100%)` }}
            />

            <div className="p-5 pt-6">
              <div className="flex items-center justify-between mb-5">
                <p
                  className="text-[10px] font-bold uppercase tracking-widest leading-none"
                  style={{ color: 'rgba(148,163,184,0.55)' }}
                >
                  Data Quality
                </p>
                <div
                  className="p-1.5 rounded-lg"
                  style={{ background: `${qualityHex}18`, border: `1px solid ${qualityHex}28` }}
                >
                  <Shield className="w-4 h-4" style={{ color: qualityHex }} />
                </div>
              </div>

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <div
                    className="leading-none tracking-tight tabular-nums font-black"
                    style={{ fontSize: '2.25rem', color: qualityHex }}
                  >
                    {profile.qualityScore}
                  </div>
                  <div
                    className="mt-2 flex items-center gap-1 text-xs font-semibold"
                    style={{ color: qualityHex }}
                  >
                    <QualityIcon className="w-3 h-3" />
                    {qualityLabel}
                  </div>
                </div>
                <QualityDonut score={profile.qualityScore} />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="inline-flex mb-8 p-1 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <TabsTrigger
              value="summary"
              className="rounded-lg px-5 py-2 text-sm font-medium text-slate-400 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
              style={{
                ['--tw-data-active-bg' as string]: 'rgba(99,102,241,0.2)',
              }}
            >
              Ringkasan
            </TabsTrigger>
            <TabsTrigger
              value="charts"
              className="rounded-lg px-5 py-2 text-sm font-medium text-slate-400 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              Grafik
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="rounded-lg px-5 py-2 text-sm font-medium text-slate-400 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-0 outline-none">
            <SummaryTab profile={profile} />
          </TabsContent>

          <TabsContent value="charts" className="mt-0 outline-none">
            <ChartsTab profile={profile} />
          </TabsContent>

          <TabsContent value="insights" className="mt-0 outline-none">
            <InsightsTab profile={profile} insights={insights} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
