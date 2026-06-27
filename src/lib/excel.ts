/**
 * Client-side Excel (xlsx / SheetJS) export. Backend yok — dosya tarayıcıda üretilir.
 * WP3 (Ajan-Rapor) ReportView'da bu fonksiyonu çağırır.
 */
import * as XLSX from 'xlsx';

export interface ReportRow {
  'Teslim Eden': string;
  'Teslim Alan': string;
  'Proje': string;
  'Alt Tür': string;
  'Ürünler': string;
  'Toplam Adet': number;
  'Teslim Tarihi': string;
  'Kanıt': string;
}

export function exportRowsToExcel(
  rows: Record<string, string | number>[],
  sheetName = 'Rapor',
  filename = `rapor_${new Date().toISOString().slice(0, 10)}.xlsx`,
): void {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}
