import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { DatasetProfile } from "../hooks/use-dataset";
import { InsightResult } from "@workspace/api-client-react";

export async function exportToPDF(profile: DatasetProfile, insights: InsightResult | null) {
  const doc = new jsPDF();
  const dateStr = new Date().toISOString().split('T')[0];
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
  
  let yPos = 20;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(37, 99, 235); // Primary blue
  doc.text("AnalystGPT", 14, yPos);
  
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Foreground navy
  doc.text("Laporan Analisis Data", 14, yPos + 8);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Muted foreground
  doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, yPos + 14);
  
  yPos += 30;

  // Executive Summary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Ringkasan Eksekutif", 14, yPos);
  
  yPos += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  
  const getGradeText = (score: number) => {
    if (score >= 80) return "Sangat Baik";
    if (score >= 60) return "Baik";
    return "Perlu Perhatian";
  };

  const summaryData = [
    ["Nama Dataset", profile.filename],
    ["Total Baris", profile.rowCount.toLocaleString('id-ID')],
    ["Total Kolom", profile.colCount.toString()],
    ["Kualitas Data", `${profile.qualityScore}/100 (${getGradeText(profile.qualityScore)})`],
    ["Baris Duplikat", profile.duplicateRows.toLocaleString('id-ID')],
    ["Missing Values", profile.missingValues.toLocaleString('id-ID')]
  ];

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: 'plain',
    styles: { fontSize: 11, textColor: [71, 85, 105] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
    margin: { left: 14 }
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Data Quality Assessment
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text("Penilaian Kualitas Kolom", 14, yPos);
  
  const colData = profile.columns.map(c => [
    c.name,
    c.type === 'numeric' ? 'Numerik' : c.type === 'categorical' ? 'Kategorikal' : c.type === 'date' ? 'Tanggal' : 'Unknown',
    `${(c.nullPct * 100).toFixed(1)}%`,
    c.hasOutlier ? 'Terdeteksi' : 'Normal'
  ]);

  autoTable(doc, {
    startY: yPos + 8,
    head: [['Nama Kolom', 'Tipe Data', 'Missing %', 'Outlier']],
    body: colData,
    theme: 'striped',
    headStyles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' },
    styles: { fontSize: 10 },
    alternateRowStyles: { fillColor: [250, 250, 250] }
  });

  yPos = (doc as any).lastAutoTable.finalY + 20;

  // Insights (if available)
  if (insights && insights.insights && insights.insights.length > 0) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Key Insights (AI)", 14, yPos);
    yPos += 12;

    insights.insights.forEach(insight => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(37, 99, 235);
      doc.text(`• ${insight.title} [${insight.category}]`, 14, yPos);
      
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      
      const splitDesc = doc.splitTextToSize(insight.description, pageWidth - 28);
      doc.text(splitDesc, 18, yPos);
      yPos += (splitDesc.length * 5) + 4;
      
      doc.setFont("helvetica", "italic");
      doc.text(`Dampak yang Diharapkan: ${insight.expected_impact}`, 18, yPos);
      yPos += 12;
    });
  }

  // Recommendations (if available)
  if (insights && insights.recommendations && insights.recommendations.length > 0) {
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Rekomendasi Bisnis", 14, yPos);
    yPos += 12;

    insights.recommendations.forEach(rec => {
      if (yPos > pageHeight - 40) {
        doc.addPage();
        yPos = 20;
      }
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text(`${rec.title}`, 14, yPos);
      
      yPos += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      
      const splitDesc = doc.splitTextToSize(rec.description, pageWidth - 28);
      doc.text(splitDesc, 14, yPos);
      yPos += (splitDesc.length * 5) + 4;
      
      doc.setFont("helvetica", "bold");
      doc.setTextColor(16, 185, 129); // Green
      doc.text(`Action: ${rec.action}`, 14, yPos);
      yPos += 12;
    });
  }

  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(156, 163, 175);
    doc.text(
      `Dihasilkan oleh AnalystGPT pada ${new Date().toLocaleString('id-ID')} | Halaman ${i} dari ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  doc.save(`analystgpt-report-${dateStr}.pdf`);
}
