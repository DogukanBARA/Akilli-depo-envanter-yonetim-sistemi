import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  LogIn,
  Package,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Truck,
} from 'lucide-react';
import { InventoryItem, BulkEntryRow, MovementProof } from '../types';
import { CATEGORIES, UNITS, LOCATIONS } from '../data/categories';
import * as repo from '../lib/repo';
import PhotoCapture from './PhotoCapture';

export interface StockEntryProps {
  inventory: InventoryItem[];
  userName: string;
  onBack: () => void;
}

type Tab = 'single' | 'bulk';

interface BulkRowState extends BulkEntryRow {
  _key: string;
}

const inputCls =
  'w-full px-4 py-3 bg-[#f0f4f7] dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-[#455f8a]/30 outline-none text-sm text-[#2a3439] dark:text-white placeholder-[#717c82] dark:placeholder-gray-500';
const labelCls = 'block text-xs font-bold text-[#566166] dark:text-gray-300 mb-1.5 uppercase tracking-wider';

const newKey = () => Math.random().toString(36).slice(2, 9);

export default function StockEntry({ inventory, userName, onBack }: StockEntryProps) {
  const [tab, setTab] = useState<Tab>('single');

  /* ----------------------------- Tekli ----------------------------- */
  // mode: mevcut üründen mü, yeni ürün mü
  const [singleMode, setSingleMode] = useState<'existing' | 'new'>('existing');
  const [selectedId, setSelectedId] = useState<string>('');
  const [sQty, setSQty] = useState<string>('1');
  const [sLocation, setSLocation] = useState<string>(LOCATIONS[0]);
  // yeni ürün alanları
  const [nName, setNName] = useState('');
  const [nCategory, setNCategory] = useState<string>(CATEGORIES[0]);
  const [nUnit, setNUnit] = useState<string>(UNITS[0]);
  const [nCritical, setNCritical] = useState<string>('0');
  // ortak kanıt (tekli)
  const [sSupplier, setSSupplier] = useState('');
  const [sNote, setSNote] = useState('');
  const [sPhoto, setSPhoto] = useState<string | null>(null);

  /* ----------------------------- Toplu ----------------------------- */
  const [rows, setRows] = useState<BulkRowState[]>([
    { _key: newKey(), name: '', quantity: 1, category: CATEGORIES[0], location: LOCATIONS[0] },
  ]);
  const [bSupplier, setBSupplier] = useState('');
  const [bNote, setBNote] = useState('');
  const [bPhoto, setBPhoto] = useState<string | null>(null);

  /* ----------------------------- Durum ----------------------------- */
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sortedInventory = useMemo(
    () => [...inventory].sort((a, b) => a.name.localeCompare(b.name, 'tr')),
    [inventory],
  );
  const selectedItem = useMemo(
    () => inventory.find((i) => i.id === selectedId),
    [inventory, selectedId],
  );

  const resetSingle = () => {
    setSelectedId('');
    setSQty('1');
    setSLocation(LOCATIONS[0]);
    setNName('');
    setNCategory(CATEGORIES[0]);
    setNUnit(UNITS[0]);
    setNCritical('0');
    setSSupplier('');
    setSNote('');
    setSPhoto(null);
  };

  const resetBulk = () => {
    setRows([{ _key: newKey(), name: '', quantity: 1, category: CATEGORIES[0], location: LOCATIONS[0] }]);
    setBSupplier('');
    setBNote('');
    setBPhoto(null);
  };

  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    setError(null);
    setTimeout(() => setSuccess(null), 4000);
  };

  /* --------------------------- Tekli kaydet --------------------------- */
  const handleSingleSubmit = async () => {
    setError(null);
    const qty = Number(sQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError('Adet 0\'dan büyük olmalıdır.');
      return;
    }

    const proof: MovementProof = {
      photoDataUrl: sPhoto || undefined,
      note: sNote.trim() || undefined,
      supplier: sSupplier.trim() || undefined,
    };

    setBusy(true);
    try {
      if (singleMode === 'existing') {
        if (!selectedItem) {
          setError('Lütfen bir ürün seçin.');
          setBusy(false);
          return;
        }
        await repo.materialEntry(selectedItem.id, qty, userName, proof);
        flashSuccess(`${selectedItem.name} için ${qty} birim giriş yapıldı.`);
      } else {
        const name = nName.trim();
        if (!name) {
          setError('Ürün adı zorunludur.');
          setBusy(false);
          return;
        }
        const sku = name.slice(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);
        await repo.addProduct(
          {
            name,
            sku,
            category: nCategory,
            quantity: qty,
            unit: nUnit,
            location: sLocation,
            criticalLevel: Number(nCritical) || 0,
          },
          userName,
          proof,
        );
        flashSuccess(`${name} envantere eklendi (${qty} ${nUnit}).`);
      }
      resetSingle();
    } catch (e: any) {
      setError(e?.message || 'Giriş sırasında bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  };

  /* --------------------------- Toplu satır işlemleri --------------------------- */
  const addRow = () =>
    setRows((r) => [
      ...r,
      { _key: newKey(), name: '', quantity: 1, category: CATEGORIES[0], location: LOCATIONS[0] },
    ]);

  const removeRow = (key: string) =>
    setRows((r) => (r.length === 1 ? r : r.filter((row) => row._key !== key)));

  const updateRow = (key: string, patch: Partial<BulkRowState>) =>
    setRows((r) => r.map((row) => (row._key === key ? { ...row, ...patch } : row)));

  const handleBulkSubmit = async () => {
    setError(null);
    const valid = rows.filter((r) => r.name.trim() && Number(r.quantity) > 0);
    if (!valid.length) {
      setError('En az bir geçerli satır gerekli (ad zorunlu, adet > 0).');
      return;
    }

    const proof: MovementProof = {
      photoDataUrl: bPhoto || undefined,
      note: bNote.trim() || undefined,
      supplier: bSupplier.trim() || undefined,
    };

    const payload: BulkEntryRow[] = valid.map((r) => ({
      name: r.name.trim(),
      quantity: Number(r.quantity),
      category: r.category,
      location: r.location,
    }));

    setBusy(true);
    try {
      const res = await repo.bulkEntry(payload, userName, proof);
      if (!res.ok) {
        setError(res.error || 'Toplu giriş başarısız.');
      } else {
        flashSuccess(`${res.count} kalem başarıyla giriş yapıldı.`);
        resetBulk();
      }
    } catch (e: any) {
      setError(e?.message || 'Toplu giriş sırasında bir hata oluştu.');
    } finally {
      setBusy(false);
    }
  };

  /* ----------------------------- Kanıt bloğu ----------------------------- */
  const ProofBlock = ({
    supplier,
    setSupplier,
    note,
    setNote,
    photo,
    setPhoto,
  }: {
    supplier: string;
    setSupplier: (v: string) => void;
    note: string;
    setNote: (v: string) => void;
    photo: string | null;
    setPhoto: (v: string | null) => void;
  }) => (
    <div className="rounded-2xl bg-[#f0f4f7] dark:bg-white/5 p-5 space-y-4 border border-[#e1e9ee] dark:border-white/10">
      <div className="flex items-center gap-2 text-[#244069] dark:text-[#d6e3ff]">
        <Truck className="w-4 h-4" />
        <h4 className="text-sm font-bold uppercase tracking-wider">Kanıt / Detay (opsiyonel)</h4>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Tedarikçi</label>
          <input
            type="text"
            value={supplier}
            onChange={(e) => setSupplier(e.target.value)}
            placeholder="Ör. ABC Tekstil"
            className={inputCls.replace('bg-[#f0f4f7] dark:bg-white/5', 'bg-white dark:bg-white/10')}
          />
        </div>
        <div>
          <label className={labelCls}>Not</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Açıklama / irsaliye no"
            className={inputCls.replace('bg-[#f0f4f7] dark:bg-white/5', 'bg-white dark:bg-white/10')}
          />
        </div>
      </div>
      <div>
        <label className={labelCls}>Fatura / Fotoğraf</label>
        <PhotoCapture value={photo} onChange={setPhoto} />
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Başlık */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors text-[#455f8a] dark:text-[#d6e3ff]"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#d6e3ff] dark:bg-[#455f8a]/30 flex items-center justify-center text-[#455f8a] dark:text-[#d6e3ff]">
            <LogIn className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline">Malzeme Giriş</h2>
            <p className="text-xs text-[#717c82] dark:text-gray-500">{userName} · {inventory.length} kalem envanterde</p>
          </div>
        </div>
      </div>

      {/* Sekmeler */}
      <div className="flex gap-2 p-1.5 bg-[#f0f4f7] dark:bg-white/5 rounded-2xl">
        {([
          { id: 'single', label: 'Tekli Giriş', icon: Package },
          { id: 'bulk', label: 'Toplu Giriş', icon: Plus },
        ] as const).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setError(null);
                setSuccess(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition active:scale-[0.98] ${
                active
                  ? 'bg-[#455f8a] text-white shadow-sm'
                  : 'text-[#566166] dark:text-gray-300 hover:bg-white dark:hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {/* Başarı / Hata mesajları */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-green-50 dark:bg-green-500/15 border border-green-200 dark:border-green-500/30 text-green-700 dark:text-green-300"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="text-sm font-bold">{success}</span>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-50 dark:bg-red-500/15 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-300"
          >
            <span className="text-sm font-bold">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 sm:p-8 border border-[#e1e9ee] dark:border-white/10 shadow-sm">
        {tab === 'single' ? (
          /* ============================= TEKLİ ============================= */
          <div className="space-y-6">
            {/* Mod seçimi */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSingleMode('existing')}
                className={`py-3 rounded-2xl text-sm font-bold border transition active:scale-[0.98] ${
                  singleMode === 'existing'
                    ? 'bg-[#d6e3ff] dark:bg-[#455f8a]/30 border-[#455f8a] text-[#244069] dark:text-[#d6e3ff]'
                    : 'bg-white dark:bg-white/5 border-[#e1e9ee] dark:border-white/10 text-[#566166] dark:text-gray-300'
                }`}
              >
                Mevcut Ürün
              </button>
              <button
                onClick={() => setSingleMode('new')}
                className={`py-3 rounded-2xl text-sm font-bold border transition active:scale-[0.98] ${
                  singleMode === 'new'
                    ? 'bg-[#d6e3ff] dark:bg-[#455f8a]/30 border-[#455f8a] text-[#244069] dark:text-[#d6e3ff]'
                    : 'bg-white dark:bg-white/5 border-[#e1e9ee] dark:border-white/10 text-[#566166] dark:text-gray-300'
                }`}
              >
                Yeni Ürün
              </button>
            </div>

            {singleMode === 'existing' ? (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Ürün Seç</label>
                  <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={inputCls}>
                    <option value="" className="dark:bg-[#1e293b]">— Ürün seçin —</option>
                    {sortedInventory.map((it) => (
                      <option key={it.id} value={it.id} className="dark:bg-[#1e293b]">
                        {it.name} ({it.sku}) · {it.quantity} {it.unit}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedItem && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-lg bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-300 font-bold">
                      {selectedItem.category}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-300 font-bold">
                      {selectedItem.location}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-300 font-bold">
                      Mevcut: {selectedItem.quantity} {selectedItem.unit}
                    </span>
                  </div>
                )}
                <div>
                  <label className={labelCls}>Eklenecek Adet</label>
                  <input
                    type="number"
                    min={1}
                    value={sQty}
                    onChange={(e) => setSQty(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Ürün Adı</label>
                  <input
                    type="text"
                    value={nName}
                    onChange={(e) => setNName(e.target.value)}
                    placeholder="Ör. Mavi İş Tişörtü"
                    className={inputCls}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Kategori</label>
                    <select value={nCategory} onChange={(e) => setNCategory(e.target.value)} className={inputCls}>
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c} className="dark:bg-[#1e293b]">{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Birim</label>
                    <select value={nUnit} onChange={(e) => setNUnit(e.target.value)} className={inputCls}>
                      {UNITS.map((u) => (
                        <option key={u} value={u} className="dark:bg-[#1e293b]">{u}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Adet</label>
                    <input
                      type="number"
                      min={1}
                      value={sQty}
                      onChange={(e) => setSQty(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Kritik Seviye</label>
                    <input
                      type="number"
                      min={0}
                      value={nCritical}
                      onChange={(e) => setNCritical(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Konum (her iki tekli modda) */}
            <div>
              <label className={labelCls}>Konum</label>
              <select value={sLocation} onChange={(e) => setSLocation(e.target.value)} className={inputCls}>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l} className="dark:bg-[#1e293b]">{l}</option>
                ))}
              </select>
              {singleMode === 'existing' && (
                <p className="text-[11px] text-[#717c82] dark:text-gray-500 mt-1.5">
                  Mevcut ürünlerde konum bilgilendirme amaçlıdır; stok kalem konumu korunur.
                </p>
              )}
            </div>

            <ProofBlock
              supplier={sSupplier}
              setSupplier={setSSupplier}
              note={sNote}
              setNote={setSNote}
              photo={sPhoto}
              setPhoto={setSPhoto}
            />

            <button
              onClick={handleSingleSubmit}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#455f8a] hover:bg-[#244069] text-white font-bold transition active:scale-[0.98] disabled:opacity-50"
            >
              <Save className="w-5 h-5" /> {busy ? 'Kaydediliyor…' : 'Girişi Kaydet'}
            </button>
          </div>
        ) : (
          /* ============================= TOPLU ============================= */
          <div className="space-y-6">
            <div className="space-y-3">
              {/* Başlık satırı (desktop) */}
              <div className="hidden sm:grid grid-cols-[1fr_90px_140px_180px_40px] gap-3 px-1">
                <span className={labelCls}>Ürün Adı</span>
                <span className={labelCls}>Adet</span>
                <span className={labelCls}>Kategori</span>
                <span className={labelCls}>Konum</span>
                <span></span>
              </div>

              {rows.map((row, idx) => (
                <motion.div
                  key={row._key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-[1fr_90px_140px_180px_40px] gap-3 items-center bg-[#f0f4f7] dark:bg-white/5 sm:bg-transparent dark:sm:bg-transparent rounded-2xl sm:rounded-none p-3 sm:p-0"
                >
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(row._key, { name: e.target.value })}
                    placeholder={`Ürün ${idx + 1}`}
                    className={`${inputCls} col-span-2 sm:col-span-1 bg-white dark:bg-white/10 sm:bg-[#f0f4f7] sm:dark:bg-white/5`}
                  />
                  <input
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => updateRow(row._key, { quantity: Number(e.target.value) })}
                    className={`${inputCls} bg-white dark:bg-white/10 sm:bg-[#f0f4f7] sm:dark:bg-white/5`}
                  />
                  <select
                    value={row.category}
                    onChange={(e) => updateRow(row._key, { category: e.target.value })}
                    className={`${inputCls} bg-white dark:bg-white/10 sm:bg-[#f0f4f7] sm:dark:bg-white/5`}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c} className="dark:bg-[#1e293b]">{c}</option>
                    ))}
                  </select>
                  <select
                    value={row.location}
                    onChange={(e) => updateRow(row._key, { location: e.target.value })}
                    className={`${inputCls} bg-white dark:bg-white/10 sm:bg-[#f0f4f7] sm:dark:bg-white/5`}
                  >
                    {LOCATIONS.map((l) => (
                      <option key={l} value={l} className="dark:bg-[#1e293b]">{l}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeRow(row._key)}
                    disabled={rows.length === 1}
                    className="flex items-center justify-center w-10 h-10 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-30 justify-self-end sm:justify-self-center"
                    aria-label="Satırı sil"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </div>

            <button
              onClick={addRow}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-[#d6e3ff] dark:border-white/15 text-[#455f8a] dark:text-[#d6e3ff] font-bold hover:border-[#455f8a] transition active:scale-[0.99]"
            >
              <Plus className="w-5 h-5" /> Satır Ekle
            </button>

            <ProofBlock
              supplier={bSupplier}
              setSupplier={setBSupplier}
              note={bNote}
              setNote={setBNote}
              photo={bPhoto}
              setPhoto={setBPhoto}
            />

            <button
              onClick={handleBulkSubmit}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#455f8a] hover:bg-[#244069] text-white font-bold transition active:scale-[0.98] disabled:opacity-50"
            >
              <Save className="w-5 h-5" /> {busy ? 'Kaydediliyor…' : 'Toplu Girişi Kaydet'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
