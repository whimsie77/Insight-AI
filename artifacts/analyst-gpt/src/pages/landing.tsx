import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { UploadCloud, FileSpreadsheet, Zap, PieChart, FileText, AlertCircle, Database, X, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDataset } from "../hooks/use-dataset";
import { processFile, generateDemoDataset, DataProcessingError } from "../lib/data-processing";

export default function LandingPage() {
  const [_, setLocation] = useLocation();
  const { setProfile, setRawFile, setInsights, setRawData } = useDataset();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const { profile, rawData } = await processFile(file);
      setRawFile(file);
      setRawData(rawData);
      setProfile(profile);
      setInsights(null);
      setLocation("/dashboard");
    } catch (err) {
      setSelectedFile(null);
      if (err instanceof DataProcessingError) {
        setError(err.message);
      } else {
        setError("Gagal membaca file. Pastikan format file valid dan tidak terenkripsi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setSelectedFile(file);
  };

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleFileSelect(files[0]);
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleFileSelect(files[0]);
    e.target.value = "";
  };

  const handleDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      const { profile: demoProfile, rawData: demoRawData } = generateDemoDataset();
      setRawFile(null);
      setRawData(demoRawData);
      setProfile(demoProfile);
      setInsights(null);
      setLocation("/dashboard");
    }, 800);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="border-b border-border/50 bg-card/40 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <PieChart className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">AnalystGPT</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground hidden sm:block">
            AI Business Intelligence Analyst
          </span>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-16 md:py-28 max-w-6xl">
        {/* Hero */}
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
            <Zap className="w-3.5 h-3.5" />
            Didukung Google Gemini AI
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1]">
            Ubah Data Jadi<br />
            <span className="gradient-text">Business Insight</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Upload CSV atau Excel — dapatkan dashboard interaktif, analisis AI mendalam, dan laporan eksekutif PDF siap cetak dalam hitungan detik.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="w-full sm:w-auto text-base h-12 px-8 font-semibold gradient-accent border-0 shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-opacity"
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <UploadCloud className="w-5 h-5 mr-2" />
              Mulai Analisis Gratis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-base h-12 px-8 font-semibold border-border/60 hover:bg-muted/50"
              onClick={handleDemo}
              disabled={isLoading}
            >
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Coba Dataset Demo
            </Button>
          </div>
        </div>

        {/* Upload Area */}
        <div className="max-w-2xl mx-auto mb-28 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <input
            id="file-upload"
            type="file"
            className="hidden"
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            onChange={onFileInput}
          />

          {/* File Preview State */}
          {selectedFile && !isLoading && !error && (
            <Card className="border-primary/30 bg-primary/5 card-glow animate-in fade-in duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
                    <FileSpreadsheet className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{formatSize(selectedFile.size)} · {selectedFile.name.endsWith('.csv') ? 'CSV' : 'Excel'}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground" onClick={() => setSelectedFile(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-3">
                  <Button
                    className="flex-1 gradient-accent border-0 shadow-md shadow-indigo-500/20 hover:opacity-90"
                    onClick={() => handleProcessFile(selectedFile)}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Mulai Analisis
                  </Button>
                  <Button variant="outline" className="border-border/60" onClick={() => document.getElementById('file-upload')?.click()}>
                    Ganti File
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Drop Zone */}
          {!selectedFile && (
            <Card
              className={`border-2 border-dashed transition-all duration-300 cursor-pointer
                ${isDragging
                  ? 'border-primary bg-primary/5 scale-[1.02] shadow-xl shadow-indigo-500/10'
                  : 'border-border/50 hover:border-primary/40 hover:bg-muted/10'
                }
                ${error ? 'border-destructive/40' : ''}
              `}
            >
              <CardContent
                className="p-12 flex flex-col items-center justify-center text-center min-h-[280px]"
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {isLoading ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-5" />
                    <h3 className="text-xl font-bold text-foreground mb-1">Sedang Memproses Data...</h3>
                    <p className="text-muted-foreground">Menganalisis baris dan kolom</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                      <AlertCircle className="w-7 h-7 text-destructive" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">Terjadi Kesalahan</h3>
                    <p className="text-destructive text-sm font-medium mb-5 max-w-xs">{error}</p>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setError(null); }}>
                      Coba Lagi
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className={`w-18 h-18 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 transition-all duration-300 ${isDragging ? 'scale-125 bg-primary/20' : ''}`} style={{ width: 72, height: 72 }}>
                      <FileUp className={`w-9 h-9 text-primary transition-transform duration-300 ${isDragging ? '-translate-y-1' : ''}`} />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {isDragging ? 'Lepaskan File di Sini' : 'Tarik & Lepas File ke Sini'}
                    </h3>
                    <p className="text-muted-foreground mb-4">atau klik untuk menelusuri file</p>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted/50 px-4 py-2 rounded-full border border-border/40">
                      <span>Mendukung .CSV dan .XLSX</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span>Maks 50MB</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Cara Kerja</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <UploadCloud className="w-6 h-6 text-indigo-400" />,
                color: 'bg-indigo-500/10 border-indigo-500/20',
                title: "1. Unggah Data",
                desc: "Drag & drop file CSV/Excel. Data diproses 100% di browser Anda — tidak ada data yang dikirim ke server.",
              },
              {
                icon: <Zap className="w-6 h-6 text-amber-400" />,
                color: 'bg-amber-500/10 border-amber-500/20',
                title: "2. Analisis Otomatis",
                desc: "AI memetakan tipe data, mendeteksi anomali, menghitung skor kualitas, dan membuat chart bisnis instan.",
              },
              {
                icon: <FileText className="w-6 h-6 text-emerald-400" />,
                color: 'bg-emerald-500/10 border-emerald-500/20',
                title: "3. Insight & Laporan",
                desc: "Dapatkan insight strategis dari Gemini AI dan unduh laporan eksekutif PDF siap presentasi.",
              },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-5 ${step.color}`}>
                  {step.icon}
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats bar */}
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-3 gap-4 p-6 rounded-2xl bg-card border border-border/50 card-glow">
            {[
              { value: "50MB", label: "Ukuran Maks" },
              { value: "CSV & XLSX", label: "Format Didukung" },
              { value: "100% Gratis", label: "Tidak Perlu Kartu Kredit" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-border/30 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} AnalystGPT &mdash; Dibangun untuk kecepatan dan presisi.
      </footer>
    </div>
  );
}
