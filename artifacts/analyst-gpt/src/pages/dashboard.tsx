import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Download, FileSpreadsheet, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDataset } from "../hooks/use-dataset";
import { exportToPDF } from "../lib/pdf-export";
import SummaryTab from "../components/dashboard/summary-tab";
import ChartsTab from "../components/dashboard/charts-tab";
import InsightsTab from "../components/dashboard/insights-tab";

export default function DashboardPage() {
  const [_, setLocation] = useLocation();
  const { profile, insights } = useDataset();
  const [activeTab, setActiveTab] = useState("summary");

  if (!profile) {
    setLocation("/");
    return null;
  }

  const handleExport = () => {
    exportToPDF(profile, insights);
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-destructive";
  };

  const getQualityText = (score: number) => {
    if (score >= 80) return "Sangat Baik";
    if (score >= 60) return "Baik";
    return "Perlu Perhatian";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="min-h-screen bg-muted/30 pb-12">
      {/* Topbar */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                {profile.filename}
              </h1>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>{formatSize(profile.fileSize)}</span>
                <span>•</span>
                <span>Diunggah pada {new Date().toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          </div>
          <Button onClick={handleExport} className="shadow-sm">
            <Download className="w-4 h-4 mr-2" />
            Ekspor Laporan
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 mt-8">
        {/* Info Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Baris</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.rowCount.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Kolom</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.colCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Missing Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.missingValues.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Baris Duplikat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.duplicateRows.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">Data Quality</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getQualityColor(profile.qualityScore)}`}>
                  {profile.qualityScore}
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <div className={`text-xs font-medium mt-1 ${getQualityColor(profile.qualityScore)} flex items-center gap-1`}>
                {profile.qualityScore >= 80 ? <CheckCircle className="w-3 h-3" /> : profile.qualityScore >= 60 ? <Info className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                {getQualityText(profile.qualityScore)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
            <TabsTrigger value="summary">Ringkasan</TabsTrigger>
            <TabsTrigger value="charts">Grafik</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
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
