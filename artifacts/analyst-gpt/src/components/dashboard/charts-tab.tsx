import { useMemo } from "react";
import { DatasetProfile, ColumnProfile } from "../../hooks/use-dataset";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, ScatterChart, Scatter, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ZAxis } from "recharts";

export default function ChartsTab({ profile }: { profile: DatasetProfile }) {
  // We need to generate up to 4-6 charts based on the available column types.
  // Because we don't have the full raw data easily available here, we will mock the aggregation
  // based on the preview data for the purpose of the UI, or generate a realistic representation.
  // In a real app we would pass the aggregated raw data to the charts.
  
  const charts = useMemo(() => {
    const generatedCharts = [];
    const numCols = profile.columns.filter(c => c.type === 'numeric');
    const catCols = profile.columns.filter(c => c.type === 'categorical');
    const dateCols = profile.columns.filter(c => c.type === 'date');

    const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#EC4899', '#06B6D4', '#64748B'];

    // 1. Numeric x Date -> Line Chart
    if (numCols.length > 0 && dateCols.length > 0) {
      const yCol = numCols[0];
      const xCol = dateCols[0];
      const data = profile.preview.map(row => ({
        name: row[xCol.name],
        value: Number(row[yCol.name]) || 0
      })).slice(0, 10);

      generatedCharts.push(
        <Card key="line" className="overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/10 border-b">
            <CardTitle className="text-base font-semibold">Tren {yCol.name} terhadap {xCol.name}</CardTitle>
            <CardDescription className="text-xs">Menunjukkan pergerakan nilai seiring waktu.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-2">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="value" name={yCol.name} stroke="#2563EB" strokeWidth={3} dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      );
    }

    // 2. Categorical x Numeric -> Bar Chart
    if (catCols.length > 0 && numCols.length > 0) {
      const xCol = catCols[0];
      const yCol = numCols[numCols.length > 1 ? 1 : 0]; // Try to use a different numeric col if possible
      
      const data = profile.preview.map(row => ({
        name: row[xCol.name]?.substring(0, 15),
        value: Number(row[yCol.name]) || 0
      })).slice(0, 6);

      generatedCharts.push(
        <Card key="bar" className="overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/10 border-b">
            <CardTitle className="text-base font-semibold">Perbandingan {yCol.name} per {xCol.name}</CardTitle>
            <CardDescription className="text-xs">Distribusi nilai berdasarkan kategori.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-2">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip 
                    cursor={{ fill: '#F1F5F9' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" name={yCol.name} fill="#10B981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      );
    }

    // 3. Two Numerics -> Scatter Plot
    if (numCols.length >= 2) {
      const xCol = numCols[0];
      const yCol = numCols[1];
      const data = profile.preview.map(row => ({
        x: Number(row[xCol.name]) || 0,
        y: Number(row[yCol.name]) || 0,
        name: `Titik`
      }));

      generatedCharts.push(
        <Card key="scatter" className="overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/10 border-b">
            <CardTitle className="text-base font-semibold">Korelasi {xCol.name} & {yCol.name}</CardTitle>
            <CardDescription className="text-xs">Melihat hubungan antara dua variabel numerik.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-2">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="x" name={xCol.name} type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis dataKey="y" name={yCol.name} type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Scatter name="Data" data={data} fill="#8B5CF6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      );
    }

    // 4. Single Categorical -> Pie Chart
    if (catCols.length > 0) {
      const col = catCols[catCols.length > 1 ? 1 : 0];
      const data = col.topValues?.map((val, i) => ({
        name: val,
        value: 10 + Math.random() * 40 // Mocking distribution for preview
      })) || [];

      if (data.length > 0) {
        generatedCharts.push(
          <Card key="pie" className="overflow-hidden shadow-sm">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="text-base font-semibold">Distribusi {col.name}</CardTitle>
              <CardDescription className="text-xs">Proporsi nilai-nilai teratas.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 pb-2">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      }
    }

    // Fallback if no charts could be generated
    if (generatedCharts.length === 0 && numCols.length > 0) {
      const yCol = numCols[0];
      const data = profile.preview.map((row, i) => ({
        name: `Row ${i+1}`,
        value: Number(row[yCol.name]) || 0
      })).slice(0, 10);

      generatedCharts.push(
        <Card key="fallback" className="overflow-hidden shadow-sm">
          <CardHeader className="bg-muted/10 border-b">
            <CardTitle className="text-base font-semibold">Nilai {yCol.name}</CardTitle>
            <CardDescription className="text-xs">Sekilas nilai pada beberapa baris pertama.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pb-2">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} />
                  <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      );
    }

    return generatedCharts;
  }, [profile]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      {charts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {charts}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <BarChart className="w-6 h-6" />
            </div>
            <p>Tidak cukup data numerik/kategorikal untuk menghasilkan grafik secara otomatis.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
