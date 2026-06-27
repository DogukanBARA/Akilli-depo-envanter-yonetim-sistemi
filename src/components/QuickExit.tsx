import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Zap,
  Package,
  Plus,
  Trash2,
  Camera,
  AlertTriangle,
  CheckCircle2,
  User,
  Search,
  StickyNote,
  FileText,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { InventoryItem, QuickExitLine } from '../types';
import * as repo from '../lib/repo';
import PhotoCapture from './PhotoCapture';

export interface QuickExitProps {
  inventory: InventoryItem[];
  userName: string;
  onBack: () => void;
}

interface LineState {
  name: string;
  quantity: number;
}

/**
 * Hızlı/Toplu Çıkış (plan 14): tek alıcıya çoklu ürün+adet çıkışı.
 * Stok kontrolü UI'da gösterilir (kırmızı satır + bloklu onay); repo da atomik korur.
 * Kanıt (not + foto) opsiyoneldir. repo.quickExit ile tek işlemde Dexie'ye yazılır.
 */
export default function QuickExit({ inventory, userName, onBack }: QuickExitProps) {
  const [recipient, setRecipient] = useState('');
  const [lines, setLines] = useState<LineState[]>([]);
  const [search, setSearch] = useState('');
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Eklenmemiş + arama filtreli envanter listesi.
  const selectedNames = useMemo(() => new Set(lines.map((l) => l.name)), [lines]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return inventory
      .filter((i) => !selectedNames.has(i.name))
      .filter(
        (i) =>
          !q ||
          i.name.toLowerCase().includes(q) ||
          i.sku.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q),
      )
      .slice(0, 30);
  }, [inventory, selectedNames, search]);

  // Her satır için stok durumu.
  const lineStatus = useMemo(
    () =>
      lines.map((line) => {
        const inv = inventory.find((i) => i.name === line.name);
        const available = inv ? inv.quantity : 0;
        const exists = !!inv;
        const insufficient = !exists || available < line.quantity;
        const unit = inv?.unit ?? 'Adet';
        return { ...line, available, exists, insufficient, unit };
      }),
    [lines, inventory],
  );

  const hasBlockingStock = lineStatus.some((l) => l.quantity > 0 && l.insufficient);
  const totalItems = lineStatus.filter((l) => l.quantity > 0).length;
  const totalQty = lineStatus.reduce((sum, l) => sum + (l.quantity > 0 ? l.quantity : 0), 0);
  const canConfirm =
    recipient.trim().length > 0 && totalItems > 0 && !hasBlockingStock && !submitting;

  // --- Eylemler -------------------------------------------------------------

  const addLine = (item: InventoryItem) => {
    setLines((prev) => (prev.some((l) => l.name === item.name) ? prev : [...prev, { name: item.name, quantity: 1 }]));
    setSearch('');
  };

  const removeLine = (name: string) => setLines((prev) => prev.filter((l) => l.name !== name));

  const updateQty = (name: string, val: number) =>
    setLines((prev) =>
      prev.map((l) =>
        l.name === name ? { ...l, quantity: Number.isNaN(val) || val < 0 ? 0 : Math.floor(val) } : l,
      ),
    );

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setSubmitting(true);
    setError(null);
    try {
      const payloadLines: QuickExitLine[] = lineStatus
        .filter((l) => l.quantity > 0)
        .map((l) => ({ name: l.name, quantity: l.quantity }));
      // Teslim nedeni + serbest not tek bir not alanında birleştirilir.
      const mergedNote = [
        reason.trim() ? `Teslim Nedeni: ${reason.trim()}` : '',
        note.trim(),
      ]
        .filter(Boolean)
        .join('\n')
        .trim();
      const proof =
        photo || mergedNote
          ? { photoDataUrl: photo ?? undefined, note: mergedNote || undefined }
          : undefined;
      const res = await repo.quickExit(payloadLines, recipient.trim(), userName, proof);
      if (res.ok) {
        setDone(true);
      } else {
        setError(res.error || 'Çıkış kaydedilemedi. Lütfen tekrar deneyin.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setRecipient('');
    setLines([]);
    setSearch('');
    setNote('');
    setReason('');
    setPhoto(null);
    setError(null);
    setDone(false);
  };

  // --- Başarı ekranı --------------------------------------------------------

  if (done) {
    return (
      <div className="max-w-2xl mx-auto pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 p-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="inline-flex"
          >
            <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
          </motion.div>
          <h3 className="text-2xl font-bold text-[#2a3439] dark:text-white mb-2 font-headline">
            Çıkış Tamamlandı
          </h3>
          <p className="text-[#566166] dark:text-gray-400 mb-8">
            {recipient.trim()} adlı alıcıya {totalItems} kalem ({totalQty} adet) çıkış yapıldı. Stok güncellendi.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={resetAll}
              className="px-8 py-3 bg-[#455f8a] dark:bg-[#1e293b] text-white rounded-xl font-bold text-sm hover:bg-[#38537d] dark:hover:bg-white/5 transition-all shadow-lg shadow-[#455f8a]/20 dark:shadow-none border border-transparent dark:border-white/10 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" /> Yeni Çıkış
            </button>
            <button
              onClick={onBack}
              className="px-8 py-3 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-[#e1e9ee] dark:hover:bg-white/10 transition-colors"
            >
              Panele Dön
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Form -----------------------------------------------------------------

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Üst başlık + geri */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors text-[#455f8a] dark:text-[#d6e3ff]"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#d6e3ff] dark:bg-[#455f8a]/30 text-[#455f8a] dark:text-[#d6e3ff]">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline">Hızlı Toplu Çıkış</h2>
            <p className="text-xs text-[#717c82] dark:text-gray-500">İşlem yapan: {userName}</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* ===================== ALICI ===================== */}
        <section className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 p-6 sm:p-8 space-y-2">
          <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">
            Alıcı (Ad Soyad) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500" />
            <input
              type="text"
              autoFocus
              placeholder="Örn: Ahmet Yılmaz"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white placeholder-[#717c82] dark:placeholder-gray-500"
            />
          </div>
        </section>

        {/* ===================== ÜRÜN SEÇİMİ ===================== */}
        <section className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#244069] dark:text-white font-headline">Ürünler</h3>
            {totalItems > 0 && (
              <span className="text-xs font-bold text-[#455f8a] dark:text-[#d6e3ff] bg-[#d6e3ff] dark:bg-[#244069]/50 px-3 py-1 rounded-full">
                {totalItems} kalem · {totalQty} adet
              </span>
            )}
          </div>

          {/* Arama + ekleme */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500" />
              <input
                type="text"
                placeholder="Envanterden ürün ara ve ekle..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white placeholder-[#717c82] dark:placeholder-gray-500"
              />
            </div>

            <AnimatePresence>
              {search.trim().length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="max-h-56 overflow-y-auto rounded-2xl border border-[#e1e9ee] dark:border-white/10 divide-y divide-[#e1e9ee] dark:divide-white/10">
                    {filtered.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-[#717c82] dark:text-gray-500">Eşleşen ürün yok.</p>
                    ) : (
                      filtered.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => addLine(item)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left bg-[#f7f9fb] dark:bg-white/5 hover:bg-[#d6e3ff]/50 dark:hover:bg-white/10 transition-colors"
                        >
                          <Package className="w-5 h-5 flex-shrink-0 text-[#455f8a] dark:text-[#d6e3ff]" />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[#2a3439] dark:text-white truncate">{item.name}</p>
                            <p className="text-xs text-[#717c82] dark:text-gray-500">
                              {item.sku} · Mevcut {item.quantity} {item.unit}
                            </p>
                          </div>
                          <Plus className="w-5 h-5 flex-shrink-0 text-[#455f8a] dark:text-[#d6e3ff]" />
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Seçili satırlar */}
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 rounded-2xl border-2 border-dashed border-[#d6e3ff] dark:border-white/15 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-400">
              <Package className="w-8 h-8" />
              <span className="text-sm font-bold">Henüz ürün eklenmedi</span>
              <span className="text-xs">Yukarıdan arayıp ekleyin.</span>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {lineStatus.map((l) => (
                  <motion.div
                    key={l.name}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
                      l.quantity > 0 && l.insufficient
                        ? 'border-red-400 dark:border-red-500/60 bg-red-50 dark:bg-red-500/10'
                        : 'border-[#e1e9ee] dark:border-white/10 bg-[#f7f9fb] dark:bg-white/5'
                    }`}
                  >
                    <Package
                      className={`w-5 h-5 flex-shrink-0 ${
                        l.quantity > 0 && l.insufficient ? 'text-red-500' : 'text-[#455f8a] dark:text-[#d6e3ff]'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#2a3439] dark:text-white truncate">{l.name}</p>
                      {!l.exists ? (
                        <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Stokta yok
                        </p>
                      ) : l.insufficient && l.quantity > 0 ? (
                        <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Yetersiz · Mevcut {l.available}, istenen {l.quantity}
                        </p>
                      ) : (
                        <p className="text-xs text-[#717c82] dark:text-gray-500">
                          Mevcut: {l.available} {l.unit}
                        </p>
                      )}
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={l.quantity}
                      onChange={(e) => updateQty(l.name, parseInt(e.target.value, 10))}
                      className="w-20 px-3 py-2 text-center font-bold bg-white dark:bg-white/10 border border-[#e1e9ee] dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeLine(l.name)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
                      aria-label="Satırı kaldır"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              {hasBlockingStock && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Bazı ürünlerde stok yetersiz. Onaylamak için adetleri mevcut stoğa indirin veya o satırı kaldırın.
                    Stok eksiye düşürülemez.
                  </span>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ===================== KANIT / FATURA (opsiyonel) ===================== */}
        <section className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 p-6 sm:p-8 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#d6e3ff] dark:bg-[#455f8a]/30 text-[#455f8a] dark:text-[#d6e3ff]">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#244069] dark:text-white font-headline leading-tight">
                  Kanıt / Fatura
                </h3>
                <p className="text-xs text-[#717c82] dark:text-gray-500">
                  İrsaliye, fatura veya teslim kanıtı ekleyebilirsiniz.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#566166] dark:text-gray-400 bg-[#f0f4f7] dark:bg-white/5 px-3 py-1 rounded-full whitespace-nowrap">
              Opsiyonel
            </span>
          </div>

          {/* Fotoğraf / Fatura */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Camera className="w-4 h-4" /> Fotoğraf / Fatura
            </label>
            <p className="text-[11px] text-[#717c82] dark:text-gray-500 ml-1 -mt-1">
              İrsaliye, fatura veya teslim fotoğrafı çekin/yükleyin.
            </p>
            <PhotoCapture value={photo} onChange={setPhoto} />
          </div>

          {/* Teslim Nedeni / Açıklama */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Teslim Nedeni / Açıklama
            </label>
            <input
              type="text"
              placeholder="Örn: Şantiye sevkiyatı, iade telafisi..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white placeholder-[#717c82] dark:placeholder-gray-500"
            />
          </div>

          {/* Serbest not */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <StickyNote className="w-4 h-4" /> Not
            </label>
            <textarea
              rows={2}
              placeholder="İsteğe bağlı ek açıklama / irsaliye no..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white placeholder-[#717c82] dark:placeholder-gray-500 resize-none"
            />
          </div>
        </section>

        {/* ===================== HATA + ONAY ===================== */}
        {error && (
          <div className="flex items-start gap-2 p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-400 dark:border-red-500/60 text-red-600 dark:text-red-400 text-sm">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="px-6 py-3 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-[#e1e9ee] dark:hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Geri
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={handleConfirm}
            className="flex-1 sm:flex-none px-8 py-3 bg-[#455f8a] dark:bg-[#1e293b] text-white rounded-xl font-bold text-sm hover:bg-[#38537d] dark:hover:bg-white/5 transition-all shadow-lg shadow-[#455f8a]/20 dark:shadow-none border border-transparent dark:border-white/10 disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Çıkışı Onayla
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
