/**
 * İçe/Dışa aktarma (IO) — TEK kaynak.
 * Dışa: XLSX / CSV / HTML (markalı sunum raporu). Tüm indirmeler Blob + anchor ile yapılır
 * (sandbox/iframe ortamlarında XLSX.writeFile sessizce başarısız olabildiği için bu yöntem güvenlidir).
 * İçe: XLSX / CSV dosyalarını ayrıştırıp ParsedInventoryRow listesine çevirir.
 */
import * as XLSX from 'xlsx';
import { InventoryItem, ExportFormat, ParsedInventoryRow } from '../types';

/* ----------------------------- İndirme yardımcıları ----------------------------- */

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Bazı tarayıcılarda anında revoke indirmeyi bozabilir; kısa gecikme.
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const stamp = () => new Date().toISOString().slice(0, 10);

/* ----------------------------- Genel satır dışa aktarımı ----------------------------- */

export interface ExportOptions {
  format: ExportFormat;
  /** uzantısız dosya adı tabanı */
  baseName: string;
  sheetName?: string;
  /** HTML için başlık/alt başlık */
  title?: string;
  subtitle?: string;
  /** Kolon sırası (boşsa ilk satırın anahtarları) */
  columns?: string[];
}

/** Anahtar/değer satırlarını seçilen formatta indirir. */
export function exportRows(rows: Record<string, unknown>[], opts: ExportOptions): void {
  const cols = opts.columns && opts.columns.length ? opts.columns : Object.keys(rows[0] ?? {});
  const filename = `${opts.baseName}_${stamp()}.${opts.format}`;

  if (opts.format === 'xlsx') {
    const ws = XLSX.utils.json_to_sheet(rows, { header: cols });
    // Otomatik kolon genişliği
    ws['!cols'] = cols.map((c) => ({
      wch: Math.min(
        40,
        Math.max(c.length + 2, ...rows.map((r) => String(r[c] ?? '').length + 2)),
      ),
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, opts.sheetName || 'Veri');
    const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    downloadBlob(
      new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      filename,
    );
    return;
  }

  if (opts.format === 'csv') {
    const csv = toCSV(rows, cols);
    // Excel'in UTF-8 (Türkçe) algılaması için BOM ekle.
    downloadBlob(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), filename);
    return;
  }

  // html
  const html = buildBrandedHTML({
    title: opts.title || 'Rapor',
    subtitle: opts.subtitle,
    columns: cols,
    rows,
  });
  downloadBlob(new Blob([html], { type: 'text/html;charset=utf-8;' }), filename);
}

/* ----------------------------- CSV ----------------------------- */

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v);
  // Çift tırnak kaçışı + ayraç/yeni satır içeren hücreleri tırnakla.
  if (/[",;\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(rows: Record<string, unknown>[], cols: string[]): string {
  const head = cols.map(csvCell).join(';');
  const body = rows.map((r) => cols.map((c) => csvCell(r[c])).join(';')).join('\r\n');
  return `${head}\r\n${body}`;
}

/* ----------------------------- Markalı HTML rapor ----------------------------- */

export interface BrandedHTMLOptions {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: Record<string, unknown>[];
  /** Üst bilgi satırları (ör. filtre özeti) */
  meta?: { label: string; value: string }[];
}

function escapeHtml(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Sunum kalitesinde, yazdırmaya hazır HTML rapor.
 * Köşede küçük "Precision Logistics" antet imzası (layout'u bozmadan, sabit konumlu).
 */
export function buildBrandedHTML(opts: BrandedHTMLOptions): string {
  const { title, subtitle, columns, rows, meta } = opts;
  const printedAt = new Date().toLocaleString('tr-TR');

  const metaHtml = (meta && meta.length)
    ? `<div class="meta">${meta
        .map((m) => `<span><b>${escapeHtml(m.label)}:</b> ${escapeHtml(m.value)}</span>`)
        .join('')}</div>`
    : '';

  const thead = `<tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr>`;
  const tbody = rows
    .map(
      (r) =>
        `<tr>${columns
          .map((c) => `<td data-label="${escapeHtml(c)}">${escapeHtml(r[c])}</td>`)
          .join('')}</tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@600;700;800&display=swap');
  * { box-sizing: border-box; }
  :root {
    --ink:#2a3439; --muted:#566166; --line:#e1e9ee; --brand:#455f8a; --brand-d:#244069;
    --soft:#f0f4f7; --accent:#d6e3ff;
  }
  html,body { margin:0; padding:0; background:#eef2f6; color:var(--ink);
    font-family:'Inter',system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif; }
  .page { max-width:1000px; margin:24px auto; background:#fff; padding:48px 56px 64px;
    box-shadow:0 10px 40px rgba(42,52,57,.10); border-radius:18px; position:relative; overflow:hidden; }
  /* Köşedeki antet imzası — layout'u bozmaz */
  .letterhead { position:absolute; top:26px; right:30px; display:flex; align-items:center; gap:8px;
    opacity:.92; }
  .letterhead .logo { width:30px; height:30px; border-radius:9px; background:var(--brand);
    display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(69,95,138,.30); }
  .letterhead .logo svg { width:18px; height:18px; }
  .letterhead .brand { line-height:1.05; }
  .letterhead .brand b { font-family:'Manrope',sans-serif; font-size:13px; color:var(--brand-d); display:block; }
  .letterhead .brand span { font-size:9px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  header.doc { border-bottom:3px solid var(--brand); padding-bottom:20px; margin-bottom:8px; max-width:74%; }
  header.doc h1 { font-family:'Manrope',sans-serif; font-size:28px; margin:0 0 6px; color:var(--brand-d); letter-spacing:-.02em; }
  header.doc p { margin:0; color:var(--muted); font-size:13px; }
  .meta { display:flex; flex-wrap:wrap; gap:8px 22px; margin:18px 0 24px; font-size:12px; color:var(--muted); }
  .meta b { color:var(--ink); }
  .table-wrap { width:100%; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  table { width:100%; border-collapse:collapse; font-size:12.5px; }
  thead th { background:var(--soft); color:var(--brand-d); text-align:left; padding:11px 12px;
    font-weight:700; border-bottom:2px solid var(--brand); white-space:nowrap; }
  tbody td { padding:10px 12px; border-bottom:1px solid var(--line); vertical-align:top; }
  tbody tr:nth-child(even) { background:#fafbfc; }
  tbody tr:hover { background:var(--accent); }
  footer.doc { margin-top:28px; padding-top:16px; border-top:1px solid var(--line);
    display:flex; justify-content:space-between; font-size:10.5px; color:var(--muted); }
  .count { display:inline-block; margin-top:6px; background:var(--brand); color:#fff; font-size:11px;
    font-weight:700; padding:3px 10px; border-radius:999px; }
  /* ---- Mobil: tabloyu okunabilir kart düzenine çevir ---- */
  @media (max-width:640px) {
    body { background:#fff; }
    .page { margin:0; border-radius:0; padding:24px 16px 40px; box-shadow:none; }
    .letterhead { position:static; justify-content:flex-end; margin-bottom:14px; }
    header.doc { max-width:none; padding-bottom:16px; }
    header.doc h1 { font-size:21px; }
    .meta { gap:6px 16px; margin:14px 0 18px; }
    .table-wrap { overflow-x:visible; }
    table, thead, tbody, th, td, tr { display:block; }
    thead { position:absolute; width:1px; height:1px; padding:0; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; border:0; }
    tbody tr { margin:0 0 14px; border:1px solid var(--line); border-radius:14px; padding:4px 14px;
      background:#fff; box-shadow:0 1px 4px rgba(42,52,57,.05); }
    tbody tr:nth-child(even) { background:#fff; }
    tbody tr:hover { background:#fff; }
    tbody td { border:none; border-bottom:1px solid #f1f4f7; padding:10px 0; display:flex;
      justify-content:space-between; align-items:baseline; gap:16px; text-align:right; font-size:13px; }
    tbody td:last-child { border-bottom:none; }
    tbody td::before { content:attr(data-label); font-weight:700; color:var(--brand-d); text-align:left;
      flex:0 0 40%; font-size:10.5px; text-transform:uppercase; letter-spacing:.04em; }
    footer.doc { flex-direction:column; gap:4px; }
  }
  @media print {
    body { background:#fff; }
    .page { box-shadow:none; margin:0; border-radius:0; max-width:none; padding:24px 28px; }
    tbody tr:hover { background:transparent; }
  }
</style>
</head>
<body>
  <div class="page">
    <div class="letterhead" aria-label="Precision Logistics">
      <span class="logo"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.5 4.21"/>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg></span>
      <span class="brand"><b>Precision Logistics</b><span>Akıllı Depo ve Envanter Yönetim Sistemi</span></span>
    </div>

    <header class="doc">
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
      <span class="count">${rows.length} kayıt</span>
    </header>

    ${metaHtml}

    <div class="table-wrap">
      <table>
        <thead>${thead}</thead>
        <tbody>${tbody || `<tr><td colspan="${columns.length}" style="text-align:center;color:#999;padding:30px">Kayıt bulunamadı.</td></tr>`}</tbody>
      </table>
    </div>

    <footer class="doc">
      <span>Precision Logistics WMS · Otomatik oluşturulmuş rapor</span>
      <span>Oluşturulma: ${escapeHtml(printedAt)}</span>
    </footer>
  </div>
</body>
</html>`;
}

/* ----------------------------- Stok dışa aktarımı (kısayol) ----------------------------- */

const INV_COLUMNS = [
  'Ürün Adı', 'SKU', 'Kategori', 'Adet', 'Birim', 'Konum', 'Kritik Seviye', 'SKT', 'Son Güncelleme',
];

function inventoryToRows(items: InventoryItem[]): Record<string, unknown>[] {
  return items.map((i) => ({
    'Ürün Adı': i.name,
    'SKU': i.sku,
    'Kategori': i.category,
    'Adet': i.quantity,
    'Birim': i.unit,
    'Konum': i.location,
    'Kritik Seviye': i.criticalLevel,
    'SKT': i.expiryDate || '',
    'Son Güncelleme': i.lastUpdated,
  }));
}

export function exportInventory(items: InventoryItem[], format: ExportFormat): void {
  exportRows(inventoryToRows(items), {
    format,
    baseName: 'stok_envanter',
    sheetName: 'Envanter',
    title: 'Stok Envanter Raporu',
    subtitle: `Toplam ${items.length} ürün kalemi`,
    columns: INV_COLUMNS,
  });
}

/** Boş içe-aktarma şablonu (başlıklar + 2 örnek satır) indirir. */
export function downloadInventoryTemplate(format: ExportFormat): void {
  const sample: Record<string, unknown>[] = [
    { 'Ürün Adı': 'Tişört', 'SKU': 'TS-001', 'Kategori': 'Tişört', 'Adet': 50, 'Birim': 'Adet', 'Konum': 'Depo A - Raf 1', 'Kritik Seviye': 10, 'SKT': '', 'Son Güncelleme': '' },
    { 'Ürün Adı': 'Mont', 'SKU': 'MN-001', 'Kategori': 'Mont', 'Adet': 20, 'Birim': 'Adet', 'Konum': 'Depo B - Raf 2', 'Kritik Seviye': 5, 'SKT': '', 'Son Güncelleme': '' },
  ];
  exportRows(sample, {
    format,
    baseName: 'stok_sablon',
    sheetName: 'Şablon',
    title: 'Stok İçe Aktarma Şablonu',
    subtitle: 'Bu başlıkları koruyun; örnek satırları kendi verinizle değiştirin.',
    columns: INV_COLUMNS,
  });
}

/* ----------------------------- İçe aktarma: dosya ayrıştırma ----------------------------- */

// Esnek başlık eşleme: TR/EN ve büyük/küçük harf toleranslı.
const HEADER_MAP: Record<string, keyof ParsedInventoryRow> = {
  'ürün adı': 'name', 'urun adi': 'name', 'ad': 'name', 'name': 'name', 'ürün': 'name',
  'sku': 'sku', 'stok kodu': 'sku', 'kod': 'sku',
  'kategori': 'category', 'category': 'category',
  'adet': 'quantity', 'miktar': 'quantity', 'quantity': 'quantity', 'stok': 'quantity',
  'birim': 'unit', 'unit': 'unit',
  'konum': 'location', 'location': 'location', 'raf': 'location',
  'kritik seviye': 'criticalLevel', 'kritik': 'criticalLevel', 'criticallevel': 'criticalLevel', 'min': 'criticalLevel',
  'skt': 'expiryDate', 'son kullanma': 'expiryDate', 'expirydate': 'expiryDate', 'expiry': 'expiryDate',
  'son güncelleme': 'lastUpdated' as keyof ParsedInventoryRow, // yok sayılır
};

function normalizeRow(raw: Record<string, unknown>): ParsedInventoryRow | null {
  const out: Partial<ParsedInventoryRow> = {};
  for (const [key, val] of Object.entries(raw)) {
    const norm = key.trim().toLowerCase();
    const field = HEADER_MAP[norm];
    if (!field || field === ('lastUpdated' as keyof ParsedInventoryRow)) continue;
    if (field === 'quantity' || field === 'criticalLevel') {
      const n = Number(String(val).replace(/[^\d.-]/g, ''));
      (out as any)[field] = Number.isFinite(n) ? n : 0;
    } else {
      (out as any)[field] = String(val ?? '').trim();
    }
  }
  if (!out.name) return null; // ad zorunlu
  return {
    name: out.name,
    sku: out.sku || out.name.slice(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000),
    category: out.category || 'Diğer',
    quantity: out.quantity ?? 0,
    unit: out.unit || 'Adet',
    location: out.location || 'Ana Depo',
    criticalLevel: out.criticalLevel ?? 0,
    expiryDate: out.expiryDate || undefined,
  };
}

/** XLSX veya CSV dosyasını ParsedInventoryRow[] listesine çevirir. */
export async function parseInventoryFile(file: File): Promise<ParsedInventoryRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  if (!sheet) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  return raw.map(normalizeRow).filter((r): r is ParsedInventoryRow => r !== null);
}
