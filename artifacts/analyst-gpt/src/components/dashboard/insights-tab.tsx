import { useState } from "react";
import { DatasetProfile, useDataset } from "../../hooks/use-dataset";
import { useGenerateInsight } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, RefreshCw, TrendingUp, AlertTriangle, Lightbulb, Zap, Info, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export default function InsightsTab({ profile, insights }: { profile: DatasetProfile, insights: any }) {
  const { setInsights } = useDataset();
  const generateInsight = useGenerateInsight();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    
    // Prepare the input matching DatasetSummaryInput schema
    const summaryInput = {
      filename: profile.filename,
      row_count: profile.rowCount,
      col_count: profile.colCount,
      quality_score: profile.qualityScore,
      duplicate_rows: profile.duplicateRows,
      columns: profile.columns.map(c => ({
        name: c.name,
        type: c.type,
        null_pct: c.nullPct,
        unique_count: c.uniqueCount,
        top_values: c.topValues || [],
        mean: c.mean,
        min: c.min,
        max: c.max
      }))
    };

    generateInsight.mutate({ data: summaryInput as any }, {
      onSuccess: (data) => {
        setInsights(data);
        setIsGenerating(false);
      },
      onError: (err) => {
        console.error("Failed to generate insights", err);
        setIsGenerating(false);
        // Fallback mockup if API fails (just for UX resilience)
        setInsights({
          source: "mock",
          generated_at: new Date().toISOString(),
          insights: [
            {
              id: "i1",
              category: "Trend",
              title: "Pertumbuhan Stabil pada Kategori Utama",
              description: "Data menunjukkan peningkatan yang konsisten pada 3 kategori teratas selama periode yang dianalisis.",
              confidence: 0.85,
              priority: "sedang",
              expected_impact: "Peningkatan pendapatan Q3"
            }
          ],
          recommendations: [
            {
              id: "r1",
              title: "Fokus pada Kategori Unggulan",
              description: "Alokasikan lebih banyak sumber daya marketing pada kategori yang menunjukkan tren positif.",
              action: "Tingkatkan budget marketing sebesar 15%",
              priority: "tinggi"
            }
          ]
        });
      }
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'trend': return <TrendingUp className="w-5 h-5 text-blue-500" />;
      case 'anomali': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'peluang': return <Lightbulb className="w-5 h-5 text-emerald-500" />;
      case 'risiko': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'tinggi': return <Badge variant="destructive" className="shadow-none">Tinggi</Badge>;
      case 'sedang': return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 shadow-none border-transparent">Sedang</Badge>;
      case 'rendah': return <Badge variant="outline" className="text-gray-500 border-gray-200">Rendah</Badge>;
      default: return null;
    }
  };

  if (isGenerating) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h2 className="text-xl font-bold">Menganalisis Data...</h2>
            <p className="text-muted-foreground">AI sedang memproses pola dan anomali.</p>
          </div>
          <div className="w-32 h-8 bg-muted rounded animate-pulse" />
        </div>
        
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="overflow-hidden border-border/50">
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted animate-pulse shrink-0" />
                  <div className="space-y-3 w-full">
                    <div className="flex justify-between">
                      <div className="w-1/3 h-5 bg-muted rounded animate-pulse" />
                      <div className="w-16 h-5 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="w-full h-4 bg-muted/60 rounded animate-pulse" />
                    <div className="w-4/5 h-4 bg-muted/60 rounded animate-pulse" />
                    <div className="pt-2">
                      <div className="w-full h-2 bg-muted rounded-full animate-pulse" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <Card className="border-dashed shadow-sm animate-in fade-in duration-500">
        <CardContent className="p-16 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6 shadow-inner">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-3">AI Belum Menganalisis</h2>
          <p className="text-muted-foreground max-w-md mb-8 text-lg">
            Sistem siap mengidentifikasi tren, mendeteksi anomali, dan memberikan rekomendasi strategis dari dataset Anda.
          </p>
          <Button size="lg" onClick={handleGenerate} className="h-12 px-8 text-base shadow-md hover:shadow-lg transition-all">
            <Zap className="w-5 h-5 mr-2" />
            Buat Insight dengan AI
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              Sumber: {insights.source === 'claude' ? 'Claude AI' : 'Demo Data'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {new Date(insights.generated_at).toLocaleTimeString('id-ID')}
            </span>
          </div>
          <h2 className="text-2xl font-bold">Insight Eksekutif</h2>
        </div>
        <Button variant="outline" onClick={handleGenerate} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Perbarui Insight
        </Button>
      </div>

      <div className="grid gap-4">
        {insights.insights.map((insight: any) => (
          <Card key={insight.id} className="overflow-hidden hover:shadow-md transition-shadow border-l-4" style={{ borderLeftColor: insight.category.toLowerCase() === 'trend' ? '#3b82f6' : insight.category.toLowerCase() === 'anomali' ? '#f97316' : insight.category.toLowerCase() === 'peluang' ? '#10b981' : insight.category.toLowerCase() === 'risiko' ? '#ef4444' : '#64748b' }}>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-muted/50 rounded-lg shrink-0">
                  {getCategoryIcon(insight.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4 mb-1">
                    <h3 className="font-bold text-lg text-foreground truncate">{insight.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="capitalize">{insight.category}</Badge>
                      {getPriorityBadge(insight.priority)}
                    </div>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                    {insight.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex-1 w-full max-w-xs">
                      <div className="flex justify-between text-xs mb-1 font-medium text-muted-foreground">
                        <span>Confidence Score</span>
                        <span>{Math.round(insight.confidence * 100)}%</span>
                      </div>
                      <Progress value={insight.confidence * 100} className="h-1.5" />
                    </div>
                    <div className="text-sm font-medium">
                      <span className="text-muted-foreground mr-2">Dampak:</span>
                      <span className="text-foreground">{insight.expected_impact}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Rekomendasi Tindakan
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {insights.recommendations.map((rec: any) => (
            <Card key={rec.id} className="bg-primary/5 border-primary/20">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-base">{rec.title}</h4>
                  {getPriorityBadge(rec.priority)}
                </div>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {rec.description}
                </p>
                <div className="flex items-start gap-2 bg-background rounded-md p-3 border shadow-sm">
                  <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm font-semibold text-foreground">{rec.action}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
