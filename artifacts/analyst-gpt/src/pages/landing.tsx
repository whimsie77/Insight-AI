import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { UploadCloud, FileSpreadsheet, ArrowRight, Zap, PieChart, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDataset } from "../hooks/use-dataset";
import { processFile, generateDemoDataset, DataProcessingError } from "../lib/data-processing";

export default function LandingPage() {
  const [_, setLocation] = useLocation();
  const { setProfile, setRawFile, setInsights } = useDataset();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const profile = await processFile(file);
      setRawFile(file);
      setProfile(profile);
      setInsights(null); // Reset previous insights
      setLocation("/dashboard");
    } catch (err) {
      if (err instanceof DataProcessingError) {
        setError(err.message);
      } else {
        setError("Gagal membaca file. Pastikan format file valid dan tidak terenkripsi.");
      }
    } finally {
      setIsLoading(false);
    }
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
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      const demoProfile = generateDemoDataset();
      setRawFile(null); // No actual file for demo
      setProfile(demoProfile);
      setInsights(null);
      setLocation("/dashboard");
    }, 800); // Simulate processing time
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <PieChart className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">AnalystGPT</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground hidden sm:block">
            Analis Data AI Instan
          </span>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-12 md:py-24 max-w-5xl">
        <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            Ubah Data Menjadi Insight <br className="hidden md:block" />
            <span className="text-primary">Dalam Hitungan Detik</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Unggah file CSV atau Excel dan dapatkan dashboard interaktif, insight AI, dan laporan bisnis profesional secara otomatis.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 font-semibold shadow-lg hover:shadow-xl transition-all" onClick={() => document.getElementById('file-upload')?.click()}>
              <UploadCloud className="w-5 h-5 mr-2" />
              Mulai Analisis
            </Button>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 font-semibold bg-background" onClick={handleDemo} disabled={isLoading}>
              <FileSpreadsheet className="w-5 h-5 mr-2" />
              Coba Dataset Demo
            </Button>
          </div>
        </div>

        {/* Upload Area */}
        <div className="max-w-3xl mx-auto mb-24 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <Card className={`border-2 border-dashed transition-all duration-300 ${isDragging ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-border hover:border-primary/50'}`}>
            <CardContent 
              className="p-12 flex flex-col items-center justify-center text-center cursor-pointer min-h-[300px]"
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv" 
                onChange={onFileInput}
              />
              
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                  <h3 className="text-xl font-semibold text-foreground">Sedang Memproses Data...</h3>
                  <p className="text-muted-foreground mt-2">Menganalisis baris dan kolom secara lokal</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Terjadi Kesalahan</h3>
                  <p className="text-destructive font-medium mb-6 text-center">{error}</p>
                  <Button variant="outline" onClick={(e) => { e.stopPropagation(); setError(null); }}>
                    Unggah Ulang
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className={`w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 transition-transform duration-300 ${isDragging ? 'scale-110' : ''}`}>
                    <UploadCloud className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">Tarik & Lepas File ke Sini</h3>
                  <p className="text-muted-foreground mb-2 text-lg">atau klik untuk menelusuri file</p>
                  <div className="flex items-center gap-2 mt-4 text-sm font-medium text-muted-foreground bg-muted px-4 py-2 rounded-full">
                    <span>Mendukung .CSV dan .XLSX</span>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span>Max 50MB</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">Cara Kerja</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <UploadCloud className="w-6 h-6 text-blue-500" />, title: "1. Unggah Data", desc: "Drag & drop file CSV/Excel Anda. Data diproses 100% aman di browser Anda." },
              { icon: <Zap className="w-6 h-6 text-amber-500" />, title: "2. Analisis Otomatis", desc: "Sistem memetakan tipe data, mendeteksi anomali, dan membuat chart instan." },
              { icon: <FileText className="w-6 h-6 text-emerald-500" />, title: "3. Ekspor Laporan", desc: "Dapatkan AI insight dan unduh laporan eksekutif PDF siap saji." },
            ].map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-card border shadow-sm flex items-center justify-center mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      
      <footer className="py-8 border-t text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} AnalystGPT. Dibuat untuk kecepatan dan presisi.
      </footer>
    </div>
  );
}
