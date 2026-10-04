import React, { useState, useMemo, useRef } from 'react';
import {
  History,
  Trash2,
  ArrowRight,
  Download,
  FileJson,
  FileSpreadsheet,
  Check,
  Database,
  Search,
  Sparkles,
  BarChart3,
  TrendingUp,
  Share2,
  Image as ImageIcon,
  Copy,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ProductData, EvaluationData } from './ProductResultCard.tsx';
import { SAMPLE_PRODUCTS, analyzeIngredientsLocally } from '../data/halalRules.ts';

export interface HistoryItem {
  id: string;
  timestamp: number;
  product: ProductData;
  evaluation: EvaluationData;
}

interface ScanHistoryProps {
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onClearHistory: () => void;
  onPopulateSampleHistory?: (items: HistoryItem[]) => void;
  cachedReportsCount?: number;
}

type StatusFilter = 'ALL' | 'HALAL' | 'MUSHBOOH' | 'HARAM';
type ChartViewMode = 'bar' | 'area';

interface TimeBucket {
  period: string;
  fullLabel: string;
  Halal: number;
  Mushbooh: number;
  Haram: number;
  total: number;
}

export const ScanHistory: React.FC<ScanHistoryProps> = ({
  history,
  onSelectHistoryItem,
  onClearHistory,
  onPopulateSampleHistory,
  cachedReportsCount,
}) => {
  const [exportedFormat, setExportedFormat] = useState<'csv' | 'json' | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [chartMode, setChartMode] = useState<ChartViewMode>('bar');

  // HTML-to-Canvas Shareable Chart Image state
  const rechartsContainerRef = useRef<HTMLDivElement | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [shareImageDataUrl, setShareImageDataUrl] = useState<string | null>(null);
  const [shareImageBlob, setShareImageBlob] = useState<Blob | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [imageCopied, setImageCopied] = useState<boolean>(false);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'HALAL'
          ? item.evaluation.status === 'HALAL' || item.evaluation.status === 'HALAL_CERTIFIED'
          : item.evaluation.status === statusFilter;

      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.product.product_name.toLowerCase().includes(q) ||
        (item.product.brands || '').toLowerCase().includes(q) ||
        item.product.code.toLowerCase().includes(q);

      return matchesStatus && matchesQuery;
    });
  }, [history, statusFilter, searchQuery]);

  // Compute shopping habit metrics and time-series chart data
  const { chartData, habitSummary } = useMemo(() => {
    const total = history.length;
    const halalCount = history.filter(
      (i) => i.evaluation.status === 'HALAL' || i.evaluation.status === 'HALAL_CERTIFIED'
    ).length;
    const mushboohCount = history.filter((i) => i.evaluation.status === 'MUSHBOOH').length;
    const haramCount = history.filter((i) => i.evaluation.status === 'HARAM').length;
    const halalRate = total > 0 ? Math.round((halalCount / total) * 100) : 0;

    let habitTakeaway = 'Scan more grocery items to uncover your dietary shopping patterns.';
    if (total > 0) {
      if (halalRate >= 75) {
        habitTakeaway = `${halalRate}% of your scanned items are Halal-compliant — strong clean-label shopping habits.`;
      } else if (haramCount >= halalCount && haramCount > 0) {
        habitTakeaway = `${haramCount} of ${total} scanned items contained prohibited (Haram) ingredients caught before purchase.`;
      } else if (mushboohCount > 0) {
        habitTakeaway = `${mushboohCount} scanned products had doubtful (Mushbooh) additives requiring source verification.`;
      } else {
        habitTakeaway = `You have audited ${total} grocery items across your recent shopping sessions.`;
      }
    }

    if (total === 0) {
      return {
        chartData: [] as TimeBucket[],
        habitSummary: { total, halalCount, mushboohCount, haramCount, halalRate, habitTakeaway },
      };
    }

    const chronological = [...history].sort((a, b) => a.timestamp - b.timestamp);
    const uniqueDayKeys = new Set(
      chronological.map((item) => new Date(item.timestamp).toISOString().slice(0, 10))
    );

    const bucketMap = new Map<string, TimeBucket>();
    const groupByDay = uniqueDayKeys.size >= 2;

    chronological.forEach((item) => {
      const d = new Date(item.timestamp);
      const dayLabel = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const key = groupByDay
        ? d.toISOString().slice(0, 10)
        : `${d.toISOString().slice(0, 13)}:${String(Math.floor(d.getMinutes() / 15) * 15).padStart(2, '0')}`;

      const period = groupByDay ? dayLabel : `${dayLabel} ${timeLabel}`;
      const fullLabel = groupByDay
        ? d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        : `${dayLabel} at ${timeLabel}`;

      const existing = bucketMap.get(key) || {
        period,
        fullLabel,
        Halal: 0,
        Mushbooh: 0,
        Haram: 0,
        total: 0,
      };

      if (item.evaluation.status === 'HALAL' || item.evaluation.status === 'HALAL_CERTIFIED') {
        existing.Halal += 1;
      } else if (item.evaluation.status === 'HARAM') {
        existing.Haram += 1;
      } else {
        existing.Mushbooh += 1;
      }
      existing.total += 1;
      bucketMap.set(key, existing);
    });

    return {
      chartData: Array.from(bucketMap.values()),
      habitSummary: { total, halalCount, mushboohCount, haramCount, halalRate, habitTakeaway },
    };
  }, [history]);

  const escapeCsv = (str: string | number | boolean | undefined | null): string => {
    if (str === null || str === undefined) return '""';
    const text = String(str).replace(/"/g, '""');
    return `"${text}"`;
  };

  const triggerFileDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  // Export as CSV file
  const handleExportCsv = () => {
    const targetRecords = filteredHistory.length > 0 ? filteredHistory : history;
    if (targetRecords.length === 0) return;

    const headers = [
      'Scanned Timestamp (ISO)',
      'Barcode / UPC',
      'Product Name',
      'Brand',
      'Category',
      'Islamic Dietary Status',
      'Halal Certified',
      'Certification Authority',
      'Confidence',
      'Verdict Summary',
      'Ingredients Text',
      'Flagged Critical Ingredients',
      'Hanafi Jurisprudence',
      'Shafii / Maliki / Hanbali Jurisprudence',
      'Recommendations & Guidance',
      'Deep Link URL',
      'Open Food Facts URL',
    ];

    const origin =
      typeof window !== 'undefined'
        ? window.location.origin + window.location.pathname
        : 'https://halalcheck.app/';

    const rows = targetRecords.map((item) => {
      const critical = (item.evaluation.criticalIngredients || [])
        .map((c) => `${c.name} [${c.status}]: ${c.reason} (${c.source})`)
        .join('; ');

      const recs = (item.evaluation.recommendations || []).join('; ');
      const deepLinkUrl = `${origin}?barcode=${encodeURIComponent(item.product.code)}`;
      const openFoodFactsUrl = `https://world.openfoodfacts.org/product/${item.product.code}`;

      return [
        escapeCsv(new Date(item.timestamp).toISOString()),
        escapeCsv(item.product.code),
        escapeCsv(item.product.product_name),
        escapeCsv(item.product.brands || ''),
        escapeCsv(item.product.categories || ''),
        escapeCsv(item.evaluation.status),
        escapeCsv(item.evaluation.isHalalCertified ? 'Yes' : 'No'),
        escapeCsv(item.evaluation.certificationAuthority || ''),
        escapeCsv(item.evaluation.confidence || 'HIGH'),
        escapeCsv(item.evaluation.summary),
        escapeCsv(item.product.ingredients_text || ''),
        escapeCsv(critical),
        escapeCsv(item.evaluation.madhhabNotes?.hanafi || ''),
        escapeCsv(item.evaluation.madhhabNotes?.shafii_general || ''),
        escapeCsv(recs),
        escapeCsv(deepLinkUrl),
        escapeCsv(openFoodFactsUrl),
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerFileDownload(
      csvContent,
      `halalcheck-scan-history-${dateStr}.csv`,
      'text/csv;charset=utf-8;'
    );

    setExportedFormat('csv');
    setTimeout(() => setExportedFormat(null), 2500);
  };

  // Export as JSON file
  const handleExportJson = () => {
    const targetRecords = filteredHistory.length > 0 ? filteredHistory : history;
    if (targetRecords.length === 0) return;

    const origin =
      typeof window !== 'undefined'
        ? window.location.origin + window.location.pathname
        : 'https://halalcheck.app/';

    const payload = {
      schemaVersion: '1.0',
      application: 'HalalCheck — Islamic Dietary Verification',
      exportedAt: new Date().toISOString(),
      filterApplied: statusFilter,
      totalRecords: targetRecords.length,
      summaryCounts: {
        halalCertified: targetRecords.filter((i) => i.evaluation.status === 'HALAL_CERTIFIED').length,
        halalPermissible: targetRecords.filter((i) => i.evaluation.status === 'HALAL').length,
        mushboohDoubtful: targetRecords.filter((i) => i.evaluation.status === 'MUSHBOOH').length,
        haramProhibited: targetRecords.filter((i) => i.evaluation.status === 'HARAM').length,
      },
      records: targetRecords.map((item) => ({
        id: item.id,
        scannedAt: new Date(item.timestamp).toISOString(),
        timestamp: item.timestamp,
        deepLink: `${origin}?barcode=${encodeURIComponent(item.product.code)}`,
        openFoodFactsUrl: `https://world.openfoodfacts.org/product/${item.product.code}`,
        product: {
          barcode: item.product.code,
          name: item.product.product_name,
          brand: item.product.brands || 'Unspecified Brand',
          category: item.product.categories || '',
          servingSize: item.product.serving_size || '100g',
          ingredientsText: item.product.ingredients_text || '',
          imageUrl: item.product.image_url || '',
          nutriments: item.product.nutriments || {},
        },
        halalEvaluation: {
          status: item.evaluation.status,
          isHalalCertified: item.evaluation.isHalalCertified,
          certificationAuthority: item.evaluation.certificationAuthority || null,
          confidence: item.evaluation.confidence,
          summary: item.evaluation.summary,
          criticalIngredients: item.evaluation.criticalIngredients || [],
          madhhabNotes: item.evaluation.madhhabNotes || {},
          recommendations: item.evaluation.recommendations || [],
        },
      })),
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const dateStr = new Date().toISOString().slice(0, 10);
    triggerFileDownload(
      jsonString,
      `halalcheck-scan-history-${dateStr}.json`,
      'application/json;charset=utf-8;'
    );

    setExportedFormat('json');
    setTimeout(() => setExportedFormat(null), 2500);
  };

  // Seed multi-day sample records so users can test the time-series chart & exports immediately
  const handleLoadSampleRecords = () => {
    if (!onPopulateSampleHistory) return;
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    // Spread sample scans across the last 5 days
    const dayOffsets = [4, 4, 3, 2, 1, 0];

    const samples: HistoryItem[] = SAMPLE_PRODUCTS.map((sample, idx) => {
      const evalRes = analyzeIngredientsLocally(
        sample.name,
        sample.ingredients,
        sample.isHalalCertified ? ['halal'] : [],
        []
      );
      const daysAgo = dayOffsets[idx % dayOffsets.length];
      return {
        id: `${sample.barcode}-${now - idx * 60000}`,
        timestamp: now - daysAgo * dayMs - idx * 1800000,
        product: {
          code: sample.barcode,
          product_name: sample.name,
          brands: sample.brand,
          ingredients_text: sample.ingredients,
          image_url: sample.imageUrl,
          categories: sample.category,
          serving_size: sample.serving_size || '100g',
          nutriments: sample.nutriments || {},
        },
        evaluation: {
          ...evalRes,
          status: (sample.status === 'HALAL' && sample.isHalalCertified
            ? 'HALAL_CERTIFIED'
            : sample.status) as EvaluationData['status'],
          summary: sample.summary,
          certificationAuthority: sample.certificationAuthority,
        },
      };
    });
    onPopulateSampleHistory(samples);
  };

  // Generate a shareable PNG image of the Halal Consumption Summary chart via HTML5 Canvas + Recharts SVG serialization
  const handleGenerateShareableImage = async () => {
    if (!rechartsContainerRef.current) return;
    setIsGeneratingImage(true);
    setImageCopied(false);

    try {
      const svgElement = rechartsContainerRef.current.querySelector('svg.recharts-surface') as SVGSVGElement | null;
      const width = 1200;
      const height = 740;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsGeneratingImage(false);
        return;
      }

      // 1. Background card surface
      ctx.fillStyle = '#fafaf9';
      ctx.fillRect(0, 0, width, height);

      // 2. Top Emerald Header Banner
      const headerGrad = ctx.createLinearGradient(0, 0, width, 130);
      headerGrad.addColorStop(0, '#065f46');
      headerGrad.addColorStop(0.6, '#047857');
      headerGrad.addColorStop(1, '#115e59');
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, width, 130);

      // Header text
      ctx.fillStyle = '#a7f3d0';
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.fillText('HALALCHECK · ISLAMIC DIETARY AWARENESS REPORT', 44, 42);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 30px Outfit, Inter, system-ui, sans-serif';
      ctx.fillText('Halal Consumption Summary', 44, 80);

      ctx.fillStyle = '#d1fae5';
      ctx.font = '15px Inter, system-ui, sans-serif';
      ctx.fillText(habitSummary.habitTakeaway, 44, 108);

      // Date badge on right of header
      const dateLabel = new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ecfdf5';
      ctx.font = 'bold 15px JetBrains Mono, monospace';
      ctx.fillText(`${habitSummary.total} Products Audited · ${dateLabel}`, width - 44, 52);
      ctx.textAlign = 'left';

      // 3. Draw 4 KPI Metric Boxes
      const kpis = [
        {
          label: 'Halal Basket Rate',
          value: `${habitSummary.halalRate}%`,
          bg: '#f5f5f4',
          border: '#e7e5e4',
          textColor: '#047857',
          labelColor: '#57534e',
        },
        {
          label: 'Halal / Certified',
          value: String(habitSummary.halalCount),
          bg: '#ecfdf5',
          border: '#a7f3d0',
          textColor: '#065f46',
          labelColor: '#047857',
        },
        {
          label: 'Mushbooh (Doubtful)',
          value: String(habitSummary.mushboohCount),
          bg: '#fffbeb',
          border: '#fde68a',
          textColor: '#b45309',
          labelColor: '#b45309',
        },
        {
          label: 'Haram (Flagged)',
          value: String(habitSummary.haramCount),
          bg: '#fff1f2',
          border: '#fecdd3',
          textColor: '#be123c',
          labelColor: '#be123c',
        },
      ];

      const cardGap = 20;
      const totalInnerWidth = width - 88;
      const kpiWidth = (totalInnerWidth - cardGap * 3) / 4;
      const kpiTop = 154;
      const kpiHeight = 92;

      kpis.forEach((kpi, index) => {
        const x = 44 + index * (kpiWidth + cardGap);
        ctx.fillStyle = kpi.bg;
        ctx.strokeStyle = kpi.border;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(x, kpiTop, kpiWidth, kpiHeight, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = kpi.labelColor;
        ctx.font = '600 13px Inter, system-ui, sans-serif';
        ctx.fillText(kpi.label, x + 18, kpiTop + 30);

        ctx.fillStyle = kpi.textColor;
        ctx.font = 'bold 30px JetBrains Mono, monospace';
        ctx.fillText(kpi.value, x + 18, kpiTop + 70);
      });

      // 4. Chart Surface Frame
      const chartBoxX = 44;
      const chartBoxY = 268;
      const chartBoxW = width - 88;
      const chartBoxH = 395;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e7e5e4';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(chartBoxX, chartBoxY, chartBoxW, chartBoxH, 20);
      ctx.fill();
      ctx.stroke();

      // Render the live Recharts SVG onto the canvas
      if (svgElement) {
        const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement;
        const rect = svgElement.getBoundingClientRect();
        const svgW = rect.width || 800;
        const svgH = rect.height || 260;
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        clonedSvg.setAttribute('width', String(svgW));
        clonedSvg.setAttribute('height', String(svgH));
        clonedSvg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);

        const svgString = new XMLSerializer().serializeToString(clonedSvg);
        const svgDataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;

        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, chartBoxX + 24, chartBoxY + 24, chartBoxW - 48, chartBoxH - 72);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = svgDataUrl;
        });
      }

      // Draw Legend row inside the bottom of the chart frame
      const legendItems = [
        { label: 'Halal / Certified', color: '#059669' },
        { label: 'Mushbooh (Doubtful)', color: '#d97706' },
        { label: 'Haram (Prohibited)', color: '#e11d48' },
      ];
      let legendX = chartBoxX + chartBoxW / 2 - 210;
      const legendY = chartBoxY + chartBoxH - 22;

      legendItems.forEach((leg) => {
        ctx.fillStyle = leg.color;
        ctx.beginPath();
        ctx.roundRect(legendX, legendY - 11, 14, 14, 4);
        ctx.fill();

        ctx.fillStyle = '#44403c';
        ctx.font = '600 13px Inter, system-ui, sans-serif';
        ctx.fillText(leg.label, legendX + 20, legendY);
        legendX += 155;
      });

      // 5. Footer Watermark
      ctx.fillStyle = '#78716c';
      ctx.font = '500 13px Inter, system-ui, sans-serif';
      ctx.fillText(
        'Generated with HalalCheck — Barcode, QR & Ingredient Halal Scanner',
        44,
        height - 28
      );

      const dataUrl = canvas.toDataURL('image/png');
      setShareImageDataUrl(dataUrl);

      canvas.toBlob((blob) => {
        if (blob) setShareImageBlob(blob);
      }, 'image/png');

      setIsShareModalOpen(true);
    } catch (err) {
      console.warn('Error generating shareable chart image:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleDownloadSummaryPng = () => {
    if (!shareImageDataUrl) return;
    const dateStr = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = shareImageDataUrl;
    link.download = `halalcheck-consumption-summary-${dateStr}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCopySummaryImage = async () => {
    if (!shareImageBlob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': shareImageBlob }),
      ]);
      setImageCopied(true);
      setTimeout(() => setImageCopied(false), 2500);
    } catch {
      handleDownloadSummaryPng();
    }
  };

  const handleNativeSocialShare = async () => {
    if (!shareImageBlob) {
      handleDownloadSummaryPng();
      return;
    }
    const file = new File([shareImageBlob], 'halalcheck-consumption-summary.png', {
      type: 'image/png',
    });
    const shareText = `My Halal Consumption Summary on HalalCheck: ${habitSummary.halalRate}% Halal Basket Rate across ${habitSummary.total} scanned products (${habitSummary.halalCount} Halal, ${habitSummary.mushboohCount} Mushbooh, ${habitSummary.haramCount} Haram).`;

    if (navigator.share) {
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'My Halal Consumption Summary — HalalCheck',
            text: shareText,
            files: [file],
          });
          return;
        }
        await navigator.share({
          title: 'My Halal Consumption Summary — HalalCheck',
          text: shareText,
          url: window.location.origin,
        });
        return;
      } catch {
        // user canceled or share unsupported in iframe, fallback to download
      }
    }
    handleDownloadSummaryPng();
  };

  return (
    <div className="space-y-6">
      {/* Shopping Habits & Scan Frequency Over Time Chart Card */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white font-display">
                  Shopping Habits & Status Frequency Over Time
                </h3>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                {habitSummary.habitTakeaway}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center shrink-0">
              {/* Shareable Halal Consumption Summary Image Generator Button */}
              <button
                type="button"
                onClick={handleGenerateShareableImage}
                disabled={isGeneratingImage}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                title="Generate a shareable PNG image of your Halal Consumption Summary chart for social media"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-100" />
                <span>{isGeneratingImage ? 'Rendering Image...' : 'Share Summary Image'}</span>
              </button>

              {/* Chart Type Toggle (Stacked Bar vs Area Trend) */}
              <div className="inline-flex items-center p-0.5 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs">
                <button
                  type="button"
                  onClick={() => setChartMode('bar')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    chartMode === 'bar'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Stacked Bars</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartMode('area')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                    chartMode === 'area'
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Trend Area</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4 Shopping Habit Summary KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-800">
              <div className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
                Halal Basket Rate
              </div>
              <div className="text-xl font-bold font-display font-mono-numbers text-emerald-700 dark:text-emerald-400 mt-0.5">
                {habitSummary.halalRate}%
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60">
              <div className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                Halal Products
              </div>
              <div className="text-xl font-bold font-display font-mono-numbers text-emerald-800 dark:text-emerald-300 mt-0.5">
                {habitSummary.halalCount}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/60">
              <div className="text-[11px] font-medium text-amber-800 dark:text-amber-300">
                Mushbooh (Doubtful)
              </div>
              <div className="text-xl font-bold font-display font-mono-numbers text-amber-800 dark:text-amber-300 mt-0.5">
                {habitSummary.mushboohCount}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/70 dark:border-rose-900/60">
              <div className="text-[11px] font-medium text-rose-800 dark:text-rose-300">
                Haram (Flagged)
              </div>
              <div className="text-xl font-bold font-display font-mono-numbers text-rose-800 dark:text-rose-300 mt-0.5">
                {habitSummary.haramCount}
              </div>
            </div>
          </div>

          {/* Recharts Visualization */}
          <div ref={rechartsContainerRef} className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" opacity={0.5} />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderColor: '#44403c',
                      borderRadius: '12px',
                      color: '#f5f5f4',
                      fontSize: '12px',
                    }}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullLabel || ''
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar
                    dataKey="Halal"
                    name="Halal / Certified"
                    stackId="status"
                    fill="#059669"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Mushbooh"
                    name="Mushbooh (Doubtful)"
                    stackId="status"
                    fill="#d97706"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Haram"
                    name="Haram (Prohibited)"
                    stackId="status"
                    fill="#e11d48"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 4 }}>
                  <defs>
                    <linearGradient id="halalGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="mushboohGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d97706" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#d97706" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="haramGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#e11d48" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#e11d48" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" opacity={0.5} />
                  <XAxis
                    dataKey="period"
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    axisLine={{ stroke: '#d6d3d1' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#78716c' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderColor: '#44403c',
                      borderRadius: '12px',
                      color: '#f5f5f4',
                      fontSize: '12px',
                    }}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullLabel || ''
                    }
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Area
                    type="monotone"
                    dataKey="Halal"
                    name="Halal / Certified"
                    stroke="#059669"
                    strokeWidth={2}
                    fill="url(#halalGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Mushbooh"
                    name="Mushbooh (Doubtful)"
                    stroke="#d97706"
                    strokeWidth={2}
                    fill="url(#mushboohGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="Haram"
                    name="Haram (Prohibited)"
                    stroke="#e11d48"
                    strokeWidth={2}
                    fill="url(#haramGrad)"
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Personal Verified Product Records List Card */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-sm">
        {/* Header & Personal Records Export Controls */}
        <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <History className="w-5 h-5 text-emerald-700 dark:text-emerald-400" />
              <h2 className="text-lg font-bold text-stone-900 dark:text-white font-display">
                Personal Verified Product Records ({history.length})
              </h2>
              {typeof cachedReportsCount === 'number' && cachedReportsCount > 0 && (
                <span className="text-xs text-stone-500 dark:text-stone-400 font-medium flex items-center gap-1">
                  <span>·</span>
                  <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{cachedReportsCount} Offline Cached</span>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
              Maintain and export your personal log of verified Halal, Mushbooh, and Haram food products as JSON or CSV
            </p>
          </div>

          {history.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Export JSON Button */}
              <button
                onClick={handleExportJson}
                className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                  exportedFormat === 'json'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700 dark:border-emerald-600'
                }`}
                title="Export scanned product history as a structured JSON file"
              >
                {exportedFormat === 'json' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>JSON Exported!</span>
                  </>
                ) : (
                  <>
                    <FileJson className="w-3.5 h-3.5 text-white" />
                    <span>Export JSON</span>
                  </>
                )}
              </button>

              {/* Export CSV Button */}
              <button
                onClick={handleExportCsv}
                className={`text-xs font-semibold px-3.5 py-2 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 ${
                  exportedFormat === 'csv'
                    ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-200'
                }`}
                title="Export scanned product history as a spreadsheet-ready CSV file"
              >
                {exportedFormat === 'csv' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>CSV Exported!</span>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                    <span>Export CSV</span>
                  </>
                )}
              </button>

              <button
                onClick={onClearHistory}
                className="text-xs font-medium text-rose-700 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 px-2.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter & Search Bar when history has items */}
        {history.length > 0 && (
          <div className="px-5 py-3 bg-stone-50/70 dark:bg-stone-900/60 border-b border-stone-100 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Segmented Status Filter */}
            <div className="inline-flex items-center p-0.5 rounded-lg bg-stone-200/70 dark:bg-stone-800 text-xs w-fit">
              {(['ALL', 'HALAL', 'MUSHBOOH', 'HARAM'] as StatusFilter[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    statusFilter === status
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                  }`}
                >
                  {status === 'ALL'
                    ? `All (${history.length})`
                    : status === 'HALAL'
                    ? `Halal (${habitSummary.halalCount})`
                    : status === 'MUSHBOOH'
                    ? `Mushbooh (${habitSummary.mushboohCount})`
                    : `Haram (${habitSummary.haramCount})`}
                </button>
              ))}
            </div>

            {/* Search within history */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter records by name or barcode..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-stone-900 dark:text-white"
              />
            </div>
          </div>
        )}

        <div className="divide-y divide-stone-100 dark:divide-stone-800">
          {history.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1">
                No Scanned Products Yet
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mb-4">
                Scan product barcodes or QR codes to visualize your shopping habits over time and export your personal records as JSON or CSV files.
              </p>
              {onPopulateSampleHistory && (
                <button
                  type="button"
                  onClick={handleLoadSampleRecords}
                  className="px-4 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Load Sample Verified Records to View Chart & Export</span>
                </button>
              )}
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 dark:text-stone-400">
              No history records match your current filter.
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectHistoryItem(item)}
                className="p-4 sm:p-5 hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 shrink-0 overflow-hidden flex items-center justify-center p-1">
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt={item.product.product_name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-[10px] text-stone-400">Photo</span>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-stone-900 dark:text-white group-hover:text-emerald-900 dark:group-hover:text-emerald-300 truncate">
                        {item.product.product_name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ${
                          item.evaluation.status === 'HALAL' || item.evaluation.status === 'HALAL_CERTIFIED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                            : item.evaluation.status === 'HARAM'
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        {item.evaluation.status === 'HALAL_CERTIFIED' ? 'HALAL CERT' : item.evaluation.status}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                      {item.product.brands || 'Brand'} · <span className="font-mono-numbers">{item.product.code}</span>
                    </p>

                    <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-stone-400 dark:text-stone-500">
                      <span>
                        Scanned {new Date(item.timestamp).toLocaleDateString()} at{' '}
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>·</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        Offline Cached
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center text-stone-400 dark:text-stone-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 shrink-0">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Shareable Halal Consumption Summary Image Modal */}
      {isShareModalOpen && shareImageDataUrl && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setIsShareModalOpen(false)}
        >
          <div
            className="relative bg-white dark:bg-stone-900 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-stone-200 dark:border-stone-800 transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-400">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-white font-display">
                    Share Your Halal Consumption Summary
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    High-resolution social card generated from your Recharts shopping history
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsShareModalOpen(false)}
                className="p-2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Generated Canvas PNG Preview */}
              <div className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-950 shadow-inner">
                <img
                  src={shareImageDataUrl}
                  alt="Halal Consumption Summary Chart"
                  className="w-full h-auto block"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleNativeSocialShare}
                  className="py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share on Social</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopySummaryImage}
                  className="py-3 px-4 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold text-xs sm:text-sm rounded-xl border border-stone-200 dark:border-stone-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  {imageCopied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Image Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                      <span>Copy Image</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadSummaryPng}
                  className="py-3 px-4 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800 text-emerald-800 dark:text-emerald-300 font-semibold text-xs sm:text-sm rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PNG</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
