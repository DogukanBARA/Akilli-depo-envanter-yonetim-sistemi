import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, TrendingUp, AlertTriangle, Package,
  Eye, Filter, Calendar, Search, X, Truck,
  FileSpreadsheet, Boxes, ArrowDownToLine, ArrowUpFromLine,
} from 'lucide-react';
import { InventoryItem, Shipment, Delivery, PROJECT_LABELS, ProjectType, ExportFormat } from '../types';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid,
} from 'recharts';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import { exportRows } from '../lib/io';
import ExportMenu from './ExportMenu';

/** Birleşik mod teslimat satırı. */
type ReportRow = Record<string, string | number>;

/** Rapor türü. */
type ReportKind = 'deliveries' | 'movements' | 'inventory';

/** tr-TR "GG.AA.YYYY SS:DD" → ISO tarih kısmı "YYYY-MM-DD". */
function trDateToISO(s: string): string {
  const datePart = (s || '').trim().split(' ')[0]; // "GG.AA.YYYY"
  const [d, m, y] = datePart.split('.');
  if (!d || !m || !y) return '';
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** tr-TR tarih dizesinden saat kısmı "SS:DD" (yoksa "-"). */
function trTime(s: string): string {
  const parts = (s || '').trim().split(' ');
  return parts[1] || '-';
}

/** Bugünün ISO (yerel) tarihi "YYYY-MM-DD". */
function todayISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

interface ReportViewProps {
  inventory: InventoryItem[];
  shipments: Shipment[];
  onBack: () => void;
  onLog: (action: string, details: string, type: 'security' | 'inventory' | 'system') => void;
}

const COLORS = ['#455f8a', '#506076', '#a9b4b9', '#d6e3ff', '#244069'];

/** Teslimat ürünlerini "Tişört x2, Pantolon x1" şeklinde birleştirir. */
function joinItems(items: { name: string; quantity: number }[]): string {
  return items.map((i) => `${i.name} x${i.quantity}`).join(', ');
}

function totalQty(items: { name: string; quantity: number }[]): number {
  return items.reduce((acc, i) => acc + i.quantity, 0);
}

export default function ReportView({ inventory, shipments, onBack, onLog }: ReportViewProps) {
  // ---- Teslimatlar (Dexie, reaktif) ----
  const deliveries = useLiveQuery(
    () => db.deliveries.orderBy('ts').reverse().toArray(),
    [],
    [] as Delivery[],
  );

  // ---- Rapor türü ----
  const [reportKind, setReportKind] = useState<ReportKind>('deliveries');

  // ---- Günlük hareketler tarih seçici (varsayılan bugün) ----
  const [movementDate, setMovementDate] = useState(todayISO());

  // ---- Filtre durumu ----
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [projectFilter, setProjectFilter] = useState<'all' | ProjectType>('all');
  const [nameQuery, setNameQuery] = useState('');
  const [detailed, setDetailed] = useState(false);
  const [proofDelivery, setProofDelivery] = useState<Delivery | null>(null);

  // ---- İstatistikler (envanter) ----
  const totalItems = inventory.length;
  const totalStock = inventory.reduce((acc, item) => acc + item.quantity, 0);
  const criticalItems = inventory.filter((item) => item.quantity <= item.criticalLevel);

  const entries = shipments.filter((s) => s.type === 'Giriş');
  const exits = shipments.filter((s) => s.type === 'Çıkış');

  // Kategori bazlı stok özeti (toplam adet)
  const categoryStockData = useMemo(
    () =>
      Object.entries(
        inventory.reduce((acc: Record<string, number>, item) => {
          acc[item.category] = (acc[item.category] || 0) + item.quantity;
          return acc;
        }, {}),
      ).map(([name, value]) => ({ name, value })),
    [inventory],
  );

  const activityData = [
    { name: 'Girişler', miktar: entries.reduce((acc, s) => acc + s.quantity, 0) },
    { name: 'Çıkışlar', miktar: exits.reduce((acc, s) => acc + s.quantity, 0) },
  ];

  const locationData = Object.entries(
    inventory.reduce((acc: Record<string, number>, item) => {
      acc[item.location] = (acc[item.location] || 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const rawStockData = Object.entries(
    inventory.reduce((acc: Record<string, number>, item) => {
      const date = item.lastUpdated.split(' ')[0];
      acc[date] = (acc[date] || 0) + item.quantity;
      return acc;
    }, {}),
  ).sort((a, b) => a[0].localeCompare(b[0]));

  let runningTotal = 0;
  const stockTrendData = rawStockData.map(([date, amount]) => {
    runningTotal += amount;
    return { date, total: runningTotal };
  });

  // ---- Teslimat filtreleme (client-side) ----
  const filteredDeliveries = useMemo(() => {
    const startTs = startDate ? new Date(startDate + 'T00:00:00').getTime() : null;
    const endTs = endDate ? new Date(endDate + 'T23:59:59').getTime() : null;
    const q = nameQuery.trim().toLocaleLowerCase('tr-TR');

    return deliveries.filter((d) => {
      if (projectFilter !== 'all' && d.project !== projectFilter) return false;
      if (startTs !== null && d.ts < startTs) return false;
      if (endTs !== null && d.ts > endTs) return false;
      if (q) {
        const hay = `${d.receiverName} ${d.deliveredBy}`.toLocaleLowerCase('tr-TR');
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [deliveries, startDate, endDate, projectFilter, nameQuery]);

  const filteredTotalQty = useMemo(
    () => filteredDeliveries.reduce((acc, d) => acc + totalQty(d.items), 0),
    [filteredDeliveries],
  );

  // ---- Aktif filtre özeti (HTML alt başlığı için) ----
  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    if (startDate || endDate) {
      parts.push(`Tarih: ${startDate || '…'} – ${endDate || '…'}`);
    }
    if (projectFilter !== 'all') {
      parts.push(`Proje: ${PROJECT_LABELS[projectFilter]}`);
    }
    if (nameQuery.trim()) {
      parts.push(`Personel: "${nameQuery.trim()}"`);
    }
    parts.push(detailed ? 'Detaylı (ürün başına satır)' : 'Birleşik');
    return parts.length ? parts.join(' · ') : 'Tüm teslimatlar';
  }, [startDate, endDate, projectFilter, nameQuery, detailed]);

  // ---- Günlük hareketler (seçili güne ait shipments) ----
  const dayMovements = useMemo(
    () =>
      shipments
        .filter((s) => trDateToISO(s.date) === movementDate)
        .slice()
        .sort((a, b) => trTime(a.date).localeCompare(trTime(b.date))),
    [shipments, movementDate],
  );

  const dayEntries = dayMovements.filter((s) => s.type === 'Giriş');
  const dayExits = dayMovements.filter((s) => s.type === 'Çıkış');
  const dayEntryQty = dayEntries.reduce((acc, s) => acc + s.quantity, 0);
  const dayExitQty = dayExits.reduce((acc, s) => acc + s.quantity, 0);

  const movementDateLabel = useMemo(() => {
    const [y, m, d] = movementDate.split('-');
    return d && m && y ? `${d}.${m}.${y}` : movementDate;
  }, [movementDate]);

  // ---- Günlük hareket satırları (tablo + dışa aktarım ortak) ----
  const movementRows = useMemo<ReportRow[]>(
    () =>
      dayMovements.map((s) => ({
        'Saat': trTime(s.date),
        'Tip': s.type,
        'Ürün': s.item,
        'Kategori': s.category,
        'Adet': s.quantity,
        'Personel': s.personnel,
        'Alıcı': s.recipient || s.supplier || '-',
        'Konum': s.location,
        'Not': s.note || '-',
      })),
    [dayMovements],
  );

  const movementColumns = ['Saat', 'Tip', 'Ürün', 'Kategori', 'Adet', 'Personel', 'Alıcı', 'Konum', 'Not'];

  // ---- Stok envanteri satırları ----
  const inventoryRows = useMemo<ReportRow[]>(
    () =>
      inventory.map((i) => ({
        'Ürün': i.name,
        'SKU': i.sku,
        'Kategori': i.category,
        'Adet': i.quantity,
        'Birim': i.unit,
        'Konum': i.location,
        'Kritik Seviye': i.criticalLevel,
      })),
    [inventory],
  );

  const inventoryColumns = ['Ürün', 'SKU', 'Kategori', 'Adet', 'Birim', 'Konum', 'Kritik Seviye'];

  // ---- Aktif türe göre satır sayısı (ExportMenu disabled mantığı) ----
  const activeRowCount =
    reportKind === 'deliveries'
      ? filteredDeliveries.length
      : reportKind === 'movements'
      ? movementRows.length
      : inventoryRows.length;

  // ---- Dışa aktar (XLSX / CSV / HTML — aktif türe göre) ----
  const handleExport = (format: ExportFormat) => {
    const formatLabel = format === 'xlsx' ? 'Excel' : format === 'csv' ? 'CSV' : 'HTML';

    // --- Günlük Hareketler ---
    if (reportKind === 'movements') {
      if (movementRows.length === 0) {
        onLog('Rapor Dışa Aktarım', `${movementDateLabel} için hareket bulunamadı; boş indirme atlandı.`, 'system');
        return;
      }
      exportRows(movementRows, {
        format,
        baseName: 'gunluk_hareket_raporu',
        sheetName: 'Günlük Hareketler',
        title: 'Günlük Hareket Raporu',
        subtitle: `${movementDateLabel} · ${dayEntries.length} giriş (${dayEntryQty} adet), ${dayExits.length} çıkış (${dayExitQty} adet)`,
        columns: movementColumns,
      });
      onLog(
        'Rapor Dışa Aktarım',
        `${movementRows.length} satır günlük hareket (${movementDateLabel}) ${formatLabel} olarak indirildi.`,
        'system',
      );
      return;
    }

    // --- Stok Envanteri ---
    if (reportKind === 'inventory') {
      if (inventoryRows.length === 0) {
        onLog('Rapor Dışa Aktarım', 'Envanter boş; indirme atlandı.', 'system');
        return;
      }
      exportRows(inventoryRows, {
        format,
        baseName: 'stok_envanter_raporu',
        sheetName: 'Envanter',
        title: 'Stok Envanter Raporu',
        subtitle: `Toplam ${inventoryRows.length} ürün kalemi · ${totalStock} adet · ${criticalItems.length} kritik`,
        columns: inventoryColumns,
      });
      onLog(
        'Rapor Dışa Aktarım',
        `${inventoryRows.length} satır stok envanteri ${formatLabel} olarak indirildi.`,
        'system',
      );
      return;
    }

    // --- Teslimatlar (mevcut mantık) ---
    let rows: ReportRow[];
    let columns: string[];

    if (detailed) {
      // Seçenek 1: ürün-başına-satır
      columns = [
        'Teslimat ID', 'Teslim Eden', 'Teslim Alan', 'Proje', 'Alt Tür',
        'Ürün', 'Adet', 'Teslim Tarihi', 'Kanıt',
      ];
      rows = filteredDeliveries.flatMap((d) =>
        d.items.map((it) => ({
          'Teslimat ID': d.id,
          'Teslim Eden': d.deliveredBy,
          'Teslim Alan': d.receiverName,
          'Proje': d.projectLabel,
          'Alt Tür': d.subType,
          'Ürün': it.name,
          'Adet': it.quantity,
          'Teslim Tarihi': d.deliveryDate,
          'Kanıt': d.photoDataUrl || d.signatureDataUrl ? 'Uygulamada Görüntüle' : '-',
        })),
      );
    } else {
      // Seçenek 2 (varsayılan): tek satırda birleşik ürünler
      columns = [
        'Teslim Eden', 'Teslim Alan', 'Proje', 'Alt Tür',
        'Ürünler', 'Toplam Adet', 'Teslim Tarihi', 'Kanıt',
      ];
      rows = filteredDeliveries.map(
        (d): ReportRow => ({
          'Teslim Eden': d.deliveredBy,
          'Teslim Alan': d.receiverName,
          'Proje': d.projectLabel,
          'Alt Tür': d.subType,
          'Ürünler': joinItems(d.items),
          'Toplam Adet': totalQty(d.items),
          'Teslim Tarihi': d.deliveryDate,
          'Kanıt': d.photoDataUrl || d.signatureDataUrl ? 'Uygulamada Görüntüle' : '-',
        }),
      );
    }

    if (rows.length === 0) {
      onLog('Rapor Dışa Aktarım', 'Filtreye uyan teslimat bulunamadı; boş indirme atlandı.', 'system');
      return;
    }

    exportRows(rows, {
      format,
      baseName: 'teslimat_raporu',
      sheetName: 'Teslimatlar',
      title: 'Teslimat Raporu',
      subtitle: filterSummary,
      columns,
    });

    onLog(
      'Rapor Dışa Aktarım',
      `${rows.length} satır teslimat verisi ${formatLabel} olarak indirildi (${detailed ? 'detaylı' : 'birleşik'}).`,
      'system',
    );
  };

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setProjectFilter('all');
    setNameQuery('');
  };

  const hasActiveFilter = startDate || endDate || projectFilter !== 'all' || nameQuery;

  const inputCls =
    'px-3 py-2 rounded-xl bg-[#f0f4f7] dark:bg-white/5 border border-[#e1e9ee] dark:border-white/10 text-sm text-[#2a3439] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#455f8a]/40';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-12"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors text-[#455f8a] dark:text-[#d6e3ff]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline">Genel Rapor</h2>
        </div>
        <ExportMenu onExport={handleExport} label="Raporu İndir" disabled={activeRowCount === 0} />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <div className="w-12 h-12 bg-[#d6e3ff] dark:bg-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
            <Package className="w-6 h-6 text-[#455f8a] dark:text-blue-300" />
          </div>
          <p className="text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Toplam Ürün</p>
          <h3 className="text-3xl font-bold text-[#2a3439] dark:text-white mt-1">{totalItems}</h3>
        </div>

        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-500/20 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Toplam Stok</p>
          <h3 className="text-3xl font-bold text-[#2a3439] dark:text-white mt-1">{totalStock}</h3>
        </div>

        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <div className="w-12 h-12 bg-[#f0f4f7] dark:bg-white/5 rounded-2xl flex items-center justify-center mb-4">
            <Truck className="w-6 h-6 text-[#455f8a] dark:text-gray-400" />
          </div>
          <p className="text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Teslimat</p>
          <h3 className="text-3xl font-bold text-[#2a3439] dark:text-white mt-1">{deliveries.length}</h3>
        </div>

        <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Kritik Stok</p>
          <h3 className="text-3xl font-bold text-[#2a3439] dark:text-white mt-1">{criticalItems.length}</h3>
        </div>
      </div>

      {/* Rapor türü seçici (segment) */}
      <div className="bg-white dark:bg-[#1e293b] p-2 rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 flex flex-col sm:flex-row gap-2">
        {([
          { kind: 'deliveries' as ReportKind, label: 'Teslimatlar', icon: Truck, count: filteredDeliveries.length },
          { kind: 'movements' as ReportKind, label: 'Günlük Hareketler', icon: FileSpreadsheet, count: movementRows.length },
          { kind: 'inventory' as ReportKind, label: 'Stok Envanteri', icon: Boxes, count: inventoryRows.length },
        ]).map(({ kind, label, icon: Icon, count }) => {
          const active = reportKind === kind;
          return (
            <button
              key={kind}
              onClick={() => setReportKind(kind)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[1.5rem] text-sm font-bold transition-colors ${
                active
                  ? 'bg-[#455f8a] text-white shadow-lg shadow-[#455f8a]/20'
                  : 'text-[#566166] dark:text-gray-300 hover:bg-[#f0f4f7] dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  active ? 'bg-white/20 text-white' : 'bg-[#f0f4f7] dark:bg-white/10 text-[#717c82] dark:text-gray-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ===================== GÜNLÜK HAREKETLER ===================== */}
      {reportKind === 'movements' && (
        <>
          <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#566166] dark:text-gray-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Gün Seç
                </label>
                <input
                  type="date"
                  value={movementDate}
                  onChange={(e) => setMovementDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20">
                  <ArrowDownToLine className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-bold text-green-700 dark:text-green-400">
                    {dayEntries.length} giriş · {dayEntryQty} adet
                  </span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                  <ArrowUpFromLine className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-bold text-red-700 dark:text-red-400">
                    {dayExits.length} çıkış · {dayExitQty} adet
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 overflow-hidden">
            <div className="p-6 border-b border-[#e1e9ee] dark:border-white/10 flex items-center justify-between gap-4">
              <h3 className="text-lg font-bold text-[#2a3439] dark:text-white font-headline">
                Günlük Hareketler · {movementDateLabel}
              </h3>
              <span className="text-sm text-[#566166] dark:text-gray-300">{movementRows.length} hareket</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#f7f9fb] dark:bg-white/5">
                    {movementColumns.map((c) => (
                      <th key={c} className="px-5 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e1e9ee] dark:divide-white/10">
                  {dayMovements.map((s) => (
                    <tr key={s.id} className="hover:bg-[#f7f9fb] dark:hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 text-[#566166] dark:text-gray-300 whitespace-nowrap">{trTime(s.date)}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            s.type === 'Giriş'
                              ? 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400'
                              : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                          }`}
                        >
                          {s.type}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-[#2a3439] dark:text-white whitespace-nowrap">{s.item}</td>
                      <td className="px-5 py-4 text-[#566166] dark:text-gray-300 whitespace-nowrap">{s.category}</td>
                      <td className="px-5 py-4 font-bold text-[#455f8a] dark:text-[#d6e3ff]">{s.quantity}</td>
                      <td className="px-5 py-4 text-[#566166] dark:text-gray-300 whitespace-nowrap">{s.personnel}</td>
                      <td className="px-5 py-4 text-[#566166] dark:text-gray-300 whitespace-nowrap">{s.recipient || s.supplier || '-'}</td>
                      <td className="px-5 py-4 text-[#566166] dark:text-gray-300 whitespace-nowrap">{s.location}</td>
                      <td className="px-5 py-4 text-[#566166] dark:text-gray-300 min-w-[140px]">{s.note || '-'}</td>
                    </tr>
                  ))}
                  {dayMovements.length === 0 && (
                    <tr>
                      <td colSpan={movementColumns.length} className="px-6 py-10 text-center text-[#717c82] dark:text-gray-500">
                        Seçili güne ({movementDateLabel}) ait hareket bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ===================== STOK ENVANTERİ ===================== */}
      {reportKind === 'inventory' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 overflow-hidden">
          <div className="p-6 border-b border-[#e1e9ee] dark:border-white/10 flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-[#2a3439] dark:text-white font-headline">Stok Envanteri</h3>
            <span className="text-sm text-[#566166] dark:text-gray-300">
              {inventoryRows.length} kalem · {totalStock} adet
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#f7f9fb] dark:bg-white/5">
                  {inventoryColumns.map((c) => (
                    <th key={c} className="px-5 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest whitespace-nowrap">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e1e9ee] dark:divide-white/10">
                {inventory.map((i) => {
                  const critical = i.quantity <= i.criticalLevel;
                  return (
                    <tr key={i.id} className="hover:bg-[#f7f9fb] dark:hover:bg-white/5 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#2a3439] dark:text-white whitespace-nowrap">{i.name}</td>
                      <td className="px-5 py-4 text-[#566166] dark:text-gray-300 whitespace-nowrap">{i.sku}</td>
                      <td className="px-5 py-4 text-[#566166] dark:text-gray-300 whitespace-nowrap">{i.category}</td>
                      <td className={`px-5 py-4 font-bold whitespace-nowrap ${critical ? 'text-red-600 dark:text-red-400' : 'text-[#455f8a] dark:text-[#d6e3ff]'}`}>
                        {i.quantity}
                      </td>
                      <td className="px-5 py-4 text-[#566166] dark:text-gray-300 whitespace-nowrap">{i.unit}</td>
                      <td className="px-5 py-4 text-[#566166] dark:text-gray-300 whitespace-nowrap">{i.location}</td>
                      <td className="px-5 py-4 text-[#566166] dark:text-gray-300 whitespace-nowrap">{i.criticalLevel}</td>
                    </tr>
                  );
                })}
                {inventory.length === 0 && (
                  <tr>
                    <td colSpan={inventoryColumns.length} className="px-6 py-10 text-center text-[#717c82] dark:text-gray-500">
                      Envanterde ürün bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===================== TESLİMATLAR ===================== */}
      {reportKind === 'deliveries' && (
        <>
      {/* Filtreler */}
      <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-[#455f8a] dark:text-[#d6e3ff]" />
          <h3 className="text-lg font-bold text-[#2a3439] dark:text-white font-headline">Teslimat Filtreleri</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#566166] dark:text-gray-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Başlangıç
            </label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#566166] dark:text-gray-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Bitiş
            </label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#566166] dark:text-gray-300">Proje</label>
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value as 'all' | ProjectType)}
              className={inputCls}
            >
              <option value="all">Tümü</option>
              <option value="temizlik">{PROJECT_LABELS.temizlik}</option>
              <option value="tum_ve_cay">{PROJECT_LABELS.tum_ve_cay}</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#566166] dark:text-gray-300 flex items-center gap-1">
              <Search className="w-3.5 h-3.5" /> Personel Ara
            </label>
            <input
              type="text"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Teslim alan / eden"
              className={inputCls}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
          <label className="flex items-center gap-2 text-sm text-[#566166] dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={detailed}
              onChange={(e) => setDetailed(e.target.checked)}
              className="w-4 h-4 accent-[#455f8a]"
            />
            Dışa aktarım: ürün başına ayrı satır (detaylı)
          </label>
          {hasActiveFilter ? (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-bold text-[#455f8a] dark:text-[#d6e3ff] hover:bg-[#f0f4f7] dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" /> Filtreleri Temizle
            </button>
          ) : null}
        </div>
      </div>

      {/* Teslimat Tablosu */}
      <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-[#e1e9ee] dark:border-white/10 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-[#2a3439] dark:text-white font-headline">Teslimat Kayıtları</h3>
          <span className="text-sm text-[#566166] dark:text-gray-300">
            {filteredDeliveries.length} kayıt · {filteredTotalQty} adet
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f7f9fb] dark:bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Teslim Eden</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Teslim Alan</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Proje</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Alt Tür</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Ürünler</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Toplam</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Tarih</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Kanıt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e9ee] dark:divide-white/10">
              {filteredDeliveries.map((d) => (
                <tr key={d.id} className="hover:bg-[#f7f9fb] dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-bold text-[#2a3439] dark:text-white whitespace-nowrap">{d.deliveredBy}</td>
                  <td className="px-6 py-4 text-[#2a3439] dark:text-white whitespace-nowrap">{d.receiverName}</td>
                  <td className="px-6 py-4 text-[#566166] dark:text-gray-300 whitespace-nowrap">{d.projectLabel}</td>
                  <td className="px-6 py-4 text-[#566166] dark:text-gray-300 whitespace-nowrap">{d.subType}</td>
                  <td className="px-6 py-4 text-[#566166] dark:text-gray-300 min-w-[180px]">{joinItems(d.items)}</td>
                  <td className="px-6 py-4 font-bold text-[#455f8a] dark:text-[#d6e3ff]">{totalQty(d.items)}</td>
                  <td className="px-6 py-4 text-[#566166] dark:text-gray-300 whitespace-nowrap">{d.deliveryDate}</td>
                  <td className="px-6 py-4">
                    {d.photoDataUrl || d.signatureDataUrl ? (
                      <button
                        onClick={() => setProofDelivery(d)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-[#455f8a] dark:text-[#d6e3ff] bg-[#d6e3ff]/40 dark:bg-white/10 hover:bg-[#d6e3ff] dark:hover:bg-white/20 transition-colors"
                      >
                        <Eye className="w-4 h-4" /> Görüntüle
                      </button>
                    ) : (
                      <span className="text-xs text-[#717c82] dark:text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredDeliveries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-[#717c82] dark:text-gray-500">
                    {deliveries.length === 0 ? 'Henüz teslimat kaydı yok.' : 'Filtreye uyan teslimat bulunamadı.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Kategori Bazlı Stok Özeti */}
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <h3 className="text-lg font-bold text-[#2a3439] dark:text-white mb-6 font-headline">Kategori Bazlı Stok (Adet)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryStockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e9ee" vertical={false} />
                <XAxis dataKey="name" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Bar dataKey="value" name="Adet" fill="#455f8a" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stok Değişim Trendi */}
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <h3 className="text-lg font-bold text-[#2a3439] dark:text-white mb-6 font-headline">Stok Değişim Trendi</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e9ee" vertical={false} />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#455f8a"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#455f8a' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Konum Dağılımı */}
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <h3 className="text-lg font-bold text-[#2a3439] dark:text-white mb-6 font-headline">Konum Bazlı Dağılım</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={locationData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {locationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Giriş / Çıkış Hacmi */}
        <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <h3 className="text-lg font-bold text-[#2a3439] dark:text-white mb-6 font-headline">Giriş / Çıkış Hacmi</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="miktar" fill="#455f8a" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Kritik Stok */}
      <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-[#e1e9ee] dark:border-white/10">
          <h3 className="text-lg font-bold text-[#2a3439] dark:text-white font-headline">Kritik Stok Uyarıları</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f7f9fb] dark:bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Ürün</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Mevcut</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Kritik Seviye</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Durum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e9ee] dark:divide-white/10">
              {criticalItems.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 font-bold text-[#2a3439] dark:text-white">{item.name}</td>
                  <td className="px-6 py-4 text-red-600 dark:text-red-400 font-bold">{item.quantity} {item.unit}</td>
                  <td className="px-6 py-4 text-[#566166] dark:text-gray-300">{item.criticalLevel} {item.unit}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      Acil Tedarik
                    </span>
                  </td>
                </tr>
              ))}
              {criticalItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[#717c82] dark:text-gray-500">Kritik seviyede ürün bulunmuyor.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kanıt Modalı */}
      <AnimatePresence>
        {proofDelivery && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setProofDelivery(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-2xl border border-[#e1e9ee] dark:border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-[#e1e9ee] dark:border-white/10">
                <div>
                  <h3 className="text-lg font-bold text-[#2a3439] dark:text-white font-headline">Teslimat Kanıtı</h3>
                  <p className="text-sm text-[#566166] dark:text-gray-300 mt-0.5">
                    {proofDelivery.receiverName} · {proofDelivery.deliveryDate}
                  </p>
                </div>
                <button
                  onClick={() => setProofDelivery(null)}
                  className="p-2 rounded-xl hover:bg-[#f0f4f7] dark:hover:bg-white/10 text-[#566166] dark:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="text-sm text-[#566166] dark:text-gray-300">
                  <span className="font-bold text-[#2a3439] dark:text-white">{proofDelivery.projectLabel}</span>
                  {proofDelivery.subType !== '-' ? ` · ${proofDelivery.subType}` : ''} ·{' '}
                  {joinItems(proofDelivery.items)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest mb-2">Fotoğraf</p>
                    {proofDelivery.photoDataUrl ? (
                      <img
                        src={proofDelivery.photoDataUrl}
                        alt="Teslimat fotoğrafı"
                        className="w-full rounded-2xl border border-[#e1e9ee] dark:border-white/10 object-contain bg-[#f0f4f7] dark:bg-white/5"
                      />
                    ) : (
                      <div className="h-40 rounded-2xl bg-[#f0f4f7] dark:bg-white/5 flex items-center justify-center text-sm text-[#717c82] dark:text-gray-500">
                        Yok
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest mb-2">İmza</p>
                    {proofDelivery.signatureDataUrl ? (
                      <img
                        src={proofDelivery.signatureDataUrl}
                        alt="Teslimat imzası"
                        className="w-full rounded-2xl border border-[#e1e9ee] dark:border-white/10 object-contain bg-white"
                      />
                    ) : (
                      <div className="h-40 rounded-2xl bg-[#f0f4f7] dark:bg-white/5 flex items-center justify-center text-sm text-[#717c82] dark:text-gray-500">
                        Yok
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
