import { useState } from "react";
import { DatasetProfile, ColumnProfile } from "../../hooks/use-dataset";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SummaryTab({ profile }: { profile: DatasetProfile }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof ColumnProfile | null; direction: 'asc' | 'desc' }>({
    key: null,
    direction: 'asc'
  });

  const handleSort = (key: keyof ColumnProfile) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getFilteredAndSortedColumns = () => {
    let cols = profile.columns.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      cols.sort((a, b) => {
        const aVal = a[sortConfig.key as keyof ColumnProfile];
        const bVal = b[sortConfig.key as keyof ColumnProfile];
        
        if (aVal === undefined || bVal === undefined) return 0;
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return cols;
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'numeric':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Numerik</Badge>;
      case 'categorical':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Kategorikal</Badge>;
      case 'date':
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Tanggal</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card>
        <CardHeader>
          <CardTitle>Preview Data (10 Baris Pertama)</CardTitle>
          <CardDescription>Gambaran sekilas data yang telah diunggah.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  {profile.columns.map((col, i) => (
                    <TableHead key={i} className="font-semibold whitespace-nowrap">{col.name}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {profile.preview.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                    {profile.columns.map((col, colIndex) => (
                      <TableCell key={colIndex} className="max-w-[200px] truncate" title={row[col.name]}>
                        {row[col.name]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Profil Kolom</CardTitle>
              <CardDescription>Analisis struktur dan kualitas setiap kolom.</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kolom..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1">Nama Kolom <ArrowUpDown className="w-3 h-3" /></div>
                  </TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort('type')}>
                    <div className="flex items-center gap-1">Tipe Data <ArrowUpDown className="w-3 h-3" /></div>
                  </TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort('nullCount')}>
                    <div className="flex items-center gap-1">Null Count <ArrowUpDown className="w-3 h-3" /></div>
                  </TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort('nullPct')}>
                    <div className="flex items-center gap-1">Null % <ArrowUpDown className="w-3 h-3" /></div>
                  </TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort('uniqueCount')}>
                    <div className="flex items-center gap-1">Unique Count <ArrowUpDown className="w-3 h-3" /></div>
                  </TableHead>
                  <TableHead className="font-semibold cursor-pointer select-none" onClick={() => handleSort('hasOutlier')}>
                    <div className="flex items-center gap-1">Status Outlier <ArrowUpDown className="w-3 h-3" /></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getFilteredAndSortedColumns().map((col, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{col.name}</TableCell>
                    <TableCell>{getTypeBadge(col.type)}</TableCell>
                    <TableCell>{col.nullCount.toLocaleString('id-ID')}</TableCell>
                    <TableCell>{(col.nullPct * 100).toFixed(1)}%</TableCell>
                    <TableCell>{col.uniqueCount.toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      {col.type === 'numeric' ? (
                        col.hasOutlier ? (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Terdeteksi</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Normal</Badge>
                        )
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {getFilteredAndSortedColumns().length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Tidak ada kolom yang cocok dengan pencarian.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
