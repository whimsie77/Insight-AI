import { useMemo } from "react";
import { DatasetProfile, ColumnProfile } from "../../hooks/use-dataset";
import { useDataset } from "../../hooks/use-dataset";
import {
  AreaChart, Area,
  BarChart, Bar, ScatterChart, Scatter,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import { BarChart2 } from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────────────

const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#ec4899', '#84cc16',
];

const GRID_COLOR = 'rgba(255,255,255,0.04)';
const AXIS_COLOR = '#3f5068';

const TOOLTIP: React.ComponentProps<typeof Tooltip>['contentStyle'] = {
  background: '#1a2540',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '10px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  fontSize: '12px',
  color: '#f1f5f9',
};

const CARD_STYLE: React.CSSProperties = {
  background: 'linear-gradient(145deg, #1a2540 0%, #111d35 100%)',
  border: '1px solid rgba(255,255,255,0.05)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

// ── Column helpers ─────────────────────────────────────────────────────────────

const BUSINESS_KEYWORDS = [
  'sales', 'revenue', 'profit', 'amount', 'quantity', 'price', 'cost',
  'total', 'penjualan', 'pendapatan', 'keuntungan', 'jumlah', 'harga', 'biaya', 'stok', 'omzet',
];
const SKIP_PATTERNS = [
  /\bid\b/i, /\brow[\s_-]?id\b/i, /\bindex\b/i, /\bseq\b/i,
  /\bpostal\b/i, /\bzip\b/i, /\bcode\b/i, /\bphone\b/i,
  /\bkey\b/i, /\brecord\b/i, /\bserial\b/i, /\bnomor\b/i, /\bkode\b/i,
];

function isSkip(name: string): boolean {
  return SKIP_PATTERNS.some(p => p.test(name));
}

function sortByBusiness(cols: ColumnProfile[]): ColumnProfile[] {
  return [...cols].sort((a, b) => {
    if (isSkip(a.name) !== isSkip(b.name)) return isSkip(a.name) ? 1 : -1;
    const aL = a.name.toLowerCase();
    const bL = b.name.toLowerCase();
    const aScore = BUSINESS_KEYWORDS.some(k => aL.includes(k)) ? 1 : 0;
    const bScore = BUSINESS_KEYWORDS.some(k => bL.includes(k)) ? 1 : 0;
    return bScore - aScore;
  });
}

// ── Aggregation helpers ────────────────────────────────────────────────────────

function aggregateByDate(data: Record<string, string>[], dateCol: string, numCol: string) {
  const sums = new Map<string, number>();
  for (const row of data) {
    const raw = row[dateCol];
    if (!raw) continue;
    const d = new Date(raw);
    const key = !isNaN(d.getTime())
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : raw.substring(0, 7);
    const val = parseFloat(row[numCol]);
    if (!isNaN(val)) sums.set(key, (sums.get(key) ?? 0) + val);
  }
  return Array.from(sums.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
}

function aggregateByCategory(data: Record<string, string>[], catCol: string, numCol: string, limit = 10) {
  const sums = new Map<string, number>();
  for (const row of data) {
    const cat = row[catCol]?.substring(0, 20) || '(kosong)';
    const val = parseFloat(row[numCol]);
    if (!isNaN(val)) sums.set(cat, (sums.get(cat) ?? 0) + val);
  }
  return Array.from(sums.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }));
}

function countByCategory(data: Record<string, string>[], catCol: string, limit = 7) {
  const counts = new Map<string, number>();
  for (const row of data) {
    const cat = row[catCol]?.substring(0, 25) || '(kosong)';
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));
}

function sampleForScatter(data: Record<string, string>[], xCol: string, yCol: string, maxPoints = 200) {
  const step = Math.max(1, Math.floor(data.length / maxPoints));
  const result: { x: number; y: number }[] = [];
  for (let i = 0; i < data.length; i += step) {
    const x = parseFloat(data[i][xCol]);
    const y = parseFloat(data[i][yCol]);
    if (!isNaN(x) && !isNaN(y)) result.push({ x, y });
  }
  return result;
}

const fmtNum = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M`
  : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K`
  : String(v);

// ── Chart card wrapper ─────────────────────────────────────────────────────────

function ChartCard({
  title, description, accentColor = CHART_COLORS[0], children,
}: {
  title: string;
  description: string;
  accentColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl" style={CARD_STYLE}>
      {/* Thin top accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{ background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}20 100%)` }}
      />
      <div className="px-6 pt-5 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs mt-0.5" style={{ color: '#475569' }}>{description}</p>
      </div>
      <div className="p-6 pt-4">
        <div className="h-[240px] w-full">{children}</div>
      </div>
    </div>
  );
}

// ── Custom label for Pie ───────────────────────────────────────────────────────

function PieLabel({ cx, cy, midAngle, outerRadius, percent }: any) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.18;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#94a3b8" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={11}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function ChartsTab({ profile }: { profile: DatasetProfile }) {
  const { rawData } = useDataset();

  const charts = useMemo(() => {
    const result: React.ReactNode[] = [];
    const data = rawData ?? profile.preview;

    const numCols = sortByBusiness(
      profile.columns.filter(c => c.type === 'numeric' && !isSkip(c.name))
    );
    const catCols = sortByBusiness(
      profile.columns.filter(c => c.type === 'categorical' && !isSkip(c.name))
    );
    const dateCols = profile.columns.filter(c => c.type === 'date');

    // 1. Area chart: Date × Numeric (monthly trend)
    if (dateCols.length > 0 && numCols.length > 0) {
      const xCol = dateCols[0];
      const yCol = numCols[0];
      const chartData = aggregateByDate(data, xCol.name, yCol.name);

      if (chartData.length > 1) {
        const gradId = 'areaGrad';
        result.push(
          <ChartCard
            key="area"
            title={`Tren ${yCol.name} per Bulan`}
            description={`Total ${yCol.name} bulanan · ${data.length.toLocaleString('id-ID')} baris`}
            accentColor="#6366f1"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} width={56} tickFormatter={fmtNum} />
                <Tooltip
                  contentStyle={TOOLTIP}
                  labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(v: number) => [v.toLocaleString('id-ID'), yCol.name]}
                />
                <Area
                  type="monotone" dataKey="value" name={yCol.name}
                  stroke="#6366f1" strokeWidth={2.5}
                  fill={`url(#${gradId})`}
                  dot={chartData.length <= 24 ? { r: 3.5, fill: '#6366f1', stroke: '#1a2540', strokeWidth: 2 } : false}
                  activeDot={{ r: 5, fill: '#6366f1', stroke: '#1a2540', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }

    // 2. Bar chart: Category × Numeric (aggregated sum)
    if (catCols.length > 0 && numCols.length > 0) {
      const xCol = catCols[0];
      const yCol = numCols[0];
      const chartData = aggregateByCategory(data, xCol.name, yCol.name);

      if (chartData.length > 0) {
        result.push(
          <ChartCard
            key="bar"
            title={`Total ${yCol.name} per ${xCol.name}`}
            description={`Agregasi ${data.length.toLocaleString('id-ID')} baris · diurutkan terbesar`}
            accentColor="#8b5cf6"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} width={56} tickFormatter={fmtNum} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  contentStyle={TOOLTIP}
                  labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(v: number) => [v.toLocaleString('id-ID'), yCol.name]}
                />
                <Bar dataKey="value" name={yCol.name} radius={[5, 5, 0, 0]} maxBarSize={48}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }

    // 3. Pie chart: Category distribution
    if (catCols.length > 0) {
      const col = catCols.length > 1 ? catCols[1] : catCols[0];
      const chartData = countByCategory(data, col.name);

      if (chartData.length > 1) {
        result.push(
          <ChartCard
            key="pie"
            title={`Distribusi ${col.name}`}
            description={`Jumlah baris per kategori · data aktual`}
            accentColor="#10b981"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData} cx="50%" cy="50%"
                  innerRadius={58} outerRadius={82}
                  paddingAngle={3} dataKey="value"
                  labelLine={false}
                  label={PieLabel}
                >
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={TOOLTIP}
                  labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(v: number) => [v.toLocaleString('id-ID'), 'Jumlah']}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '12px', color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }

    // 4. Scatter plot: two numeric columns
    if (numCols.length >= 2) {
      const xCol = numCols[0];
      const yCol = numCols[1];
      const chartData = sampleForScatter(data, xCol.name, yCol.name);

      if (chartData.length > 1) {
        result.push(
          <ChartCard
            key="scatter"
            title={`Korelasi ${xCol.name} & ${yCol.name}`}
            description={`${chartData.length.toLocaleString('id-ID')} sampel dari ${data.length.toLocaleString('id-ID')} baris`}
            accentColor="#f59e0b"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                <XAxis
                  dataKey="x" name={xCol.name} type="number"
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                  tickFormatter={fmtNum}
                />
                <YAxis
                  dataKey="y" name={yCol.name} type="number"
                  axisLine={false} tickLine={false}
                  tick={{ fontSize: 11, fill: AXIS_COLOR }}
                  width={56} tickFormatter={fmtNum}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: 'rgba(255,255,255,0.1)' }}
                  contentStyle={TOOLTIP}
                  labelStyle={{ color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: '#e2e8f0' }}
                  formatter={(v: number, name) => [v.toLocaleString('id-ID'), name]}
                />
                <Scatter name="Data" data={chartData} fill="#f59e0b" fillOpacity={0.65} />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }

    // Fallback: single numeric bar
    if (result.length === 0 && numCols.length > 0) {
      const yCol = numCols[0];
      const chartData = data.slice(0, 20).map((row, i) => ({
        name: `#${i + 1}`,
        value: parseFloat(row[yCol.name]) || 0,
      }));

      result.push(
        <ChartCard
          key="fallback"
          title={`Nilai ${yCol.name} (20 Baris Pertama)`}
          description="Tidak cukup kolom kategorikal/tanggal untuk agregasi."
          accentColor="#6366f1"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={GRID_COLOR} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: AXIS_COLOR }} />
              <Tooltip contentStyle={TOOLTIP} itemStyle={{ color: '#e2e8f0' }} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="value" fill="#6366f1" fillOpacity={0.9} radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      );
    }

    return result;
  }, [profile, rawData]);

  if (charts.length === 0) {
    return (
      <div
        className="rounded-2xl flex flex-col items-center justify-center p-16 text-center"
        style={CARD_STYLE}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <BarChart2 className="w-7 h-7" style={{ color: '#6366f1' }} />
        </div>
        <p className="font-semibold text-white mb-1">Tidak Cukup Data untuk Grafik</p>
        <p className="text-sm" style={{ color: '#475569', maxWidth: 360 }}>
          Coba dataset dengan kolom seperti Sales, Profit, atau Revenue dan minimal satu kolom tanggal atau kategori.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {charts}
    </div>
  );
}
