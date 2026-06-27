import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, FileUp, PlusCircle, RefreshCw, Replace, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { ImportMode, ParsedInventoryRow, ImportResult } from '../types';
import { parseInventoryFile } from '../lib/io';
import { importInventory } from '../lib/repo';

export interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  userName: string;
  onImported?: (result: ImportResult) => void;
}

const MODES: { mode: ImportMode; title: string; desc: string; icon: React.ReactNode }[] = [
  { mode: 'add', title: 'Üzerine Ekle', desc: 'Eşleşen ürünlerin mevcut adedine ekler; yenileri ekler.', icon: <PlusCircle className="w-5 h-5" /> },
  { mode: 'upsert', title: 'Güncelle (Varsa)', desc: 'Eşleşen ürünlerin adet/bilgilerini gelen değerle değiştirir; yenileri ekler.', icon: <RefreshCw className="w-5 h-5" /> },
  { mode: 'replace', title: 'Tümünü Değiştir', desc: 'TÜM mevcut envanteri siler ve yalnız bu dosyadakileri yükler.', icon: <Replace className="w-5 h-5" /> },
];

/** Stok içe aktarma diyaloğu: dosya → önizleme → mod seçimi → onay. */
export default function ImportDialog({ open, onClose, userName, onImported }: ImportDialogProps) {
  const [rows, setRows] = useState<ParsedInventoryRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [mode, setMode] = useState<ImportMode>('add');
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setRows([]); setFileName(''); setMode('add'); setParsing(false);
    setSubmitting(false); setResult(null); setError(null);
  };

  const close = () => { reset(); onClose(); };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null); setResult(null); setParsing(true); setFileName(file.name);
    try {
      const parsed = await parseInventoryFile(file);
      if (!parsed.length) setError('Dosyada geçerli satır bulunamadı. Başlıklar: Ürün Adı, SKU, Kategori, Adet, Birim, Konum, Kritik Seviye.');
      setRows(parsed);
    } catch (err: any) {
      setError(err?.message || 'Dosya okunamadı.');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = async () => {
    setSubmitting(true); setError(null);
    const res = await importInventory(rows, mode, userName);
    setSubmitting(false);
    if (res.ok) { setResult(res); onImported?.(res); }
    else setError(res.error || 'İçe aktarma başarısız.');
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            className="absolute inset-0 bg-[#244069]/40 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[2rem] p-7 shadow-2xl border border-[#e1e9ee] dark:border-white/10 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-[#d6e3ff] dark:bg-[#455f8a]/30 text-[#455f8a] dark:text-[#d6e3ff] flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </span>
                <h3 className="text-xl font-bold text-[#2a3439] dark:text-white font-headline">Stok İçe Aktar</h3>
              </div>
              <button onClick={close} className="p-2 text-[#717c82] hover:bg-[#f0f4f7] dark:hover:bg-white/5 rounded-xl"><X className="w-5 h-5" /></button>
            </div>

            {/* Sonuç ekranı */}
            {result ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-lg font-bold text-[#2a3439] dark:text-white mb-2">İçe Aktarma Tamamlandı</h4>
                <p className="text-[#566166] dark:text-gray-400 text-sm mb-6">
                  Toplam {result.total} satır işlendi · {result.added} eklendi · {result.updated} güncellendi.
                </p>
                <button onClick={close} className="px-8 py-3 bg-[#455f8a] text-white rounded-xl font-bold text-sm hover:bg-[#38537d]">Kapat</button>
              </div>
            ) : (
              <>
                {/* Dosya seçimi */}
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
                <button
                  onClick={() => inputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 h-28 rounded-2xl border-2 border-dashed border-[#d6e3ff] dark:border-white/15 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-300 hover:border-[#455f8a] transition mb-4"
                >
                  {parsing ? <Loader2 className="w-7 h-7 animate-spin text-[#455f8a]" /> : <FileUp className="w-7 h-7 text-[#455f8a]" />}
                  <span className="text-sm font-bold">{fileName || 'XLSX / CSV dosyası seç'}</span>
                  {rows.length > 0 && <span className="text-xs text-green-600 font-bold">{rows.length} geçerli satır bulundu</span>}
                </button>

                {error && (
                  <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
                  </div>
                )}

                {/* Mod seçimi */}
                {rows.length > 0 && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-wider text-[#717c82] mb-2">İçe Aktarma Modu</p>
                    <div className="space-y-2 mb-5">
                      {MODES.map((m) => (
                        <button
                          key={m.mode}
                          onClick={() => setMode(m.mode)}
                          className={`w-full flex items-start gap-3 p-3 rounded-2xl border text-left transition ${
                            mode === m.mode
                              ? 'border-[#455f8a] bg-[#d6e3ff]/40 dark:bg-[#455f8a]/20'
                              : 'border-[#e1e9ee] dark:border-white/10 hover:bg-[#f0f4f7] dark:hover:bg-white/5'
                          }`}
                        >
                          <span className={`mt-0.5 ${mode === m.mode ? 'text-[#455f8a]' : 'text-[#717c82]'} ${m.mode === 'replace' ? 'text-red-500' : ''}`}>{m.icon}</span>
                          <span>
                            <span className={`block text-sm font-bold ${m.mode === 'replace' ? 'text-red-600 dark:text-red-400' : 'text-[#2a3439] dark:text-white'}`}>{m.title}</span>
                            <span className="block text-[11px] text-[#566166] dark:text-gray-400">{m.desc}</span>
                          </span>
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleConfirm}
                      disabled={submitting}
                      className="w-full py-3.5 bg-[#455f8a] text-white rounded-xl font-bold text-sm hover:bg-[#38537d] transition-colors shadow-lg shadow-[#455f8a]/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> İçe Aktarılıyor…</> : <>İçe Aktar ({rows.length} satır)</>}
                    </button>
                  </>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
