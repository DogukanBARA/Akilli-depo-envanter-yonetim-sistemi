import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Save, Package, Tag, Layers, MapPin, Info, CheckCircle2, Loader2, Search,
  AlertCircle, Calendar, Hash, FilePlus2, ListPlus, Plus, Trash2, FileDown, Upload, ShieldCheck, Loader,
} from 'lucide-react';
import { InventoryItem, ParsedInventoryRow, ExportFormat } from '../types';
import { CATEGORIES, UNITS, LOCATIONS } from '../data/categories';
import { exportInventory, downloadInventoryTemplate } from '../lib/io';
import { importInventory } from '../lib/repo';
import ExportMenu from './ExportMenu';
import ImportDialog from './ImportDialog';

interface ProductFormProps {
  onBack: () => void;
  onAdd: (item: Omit<InventoryItem, 'id' | 'lastUpdated'>) => void;
  inventory: InventoryItem[];
  userName: string;
}

interface FormState {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  criticalLevel: number;
  expiryDate: string;
}

const initialState: FormState = {
  name: '', sku: '', category: '', quantity: 1, unit: 'Adet', location: '', criticalLevel: 10, expiryDate: '',
};

type FieldErrors = Partial<Record<keyof FormState, string>>;
type Mode = 'single' | 'bulk';

/* ----------------------------- Toplu satır tipi ----------------------------- */
interface BulkRow {
  name: string;
  sku: string;
  category: string;
  quantity: string;
  unit: string;
  location: string;
  criticalLevel: string;
}
const emptyBulkRow = (): BulkRow => ({ name: '', sku: '', category: '', quantity: '', unit: 'Adet', location: '', criticalLevel: '0' });
const uidSku = (name: string) => name.slice(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000);

export default function ProductForm({ onBack, onAdd, inventory, userName }: ProductFormProps) {
  const [mode, setMode] = useState<Mode>('single');

  // ---- Tekli form durumu ----
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState<FormState>(initialState);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const errors = useMemo<FieldErrors>(() => {
    const e: FieldErrors = {};
    if (!formData.name.trim()) e.name = 'Ürün adı zorunludur.';
    if (!formData.category.trim()) e.category = 'Kategori seçimi zorunludur.';
    if (isNaN(formData.quantity) || formData.quantity <= 0) e.quantity = 'Miktar 0\'dan büyük olmalıdır.';
    if (isNaN(formData.criticalLevel) || formData.criticalLevel < 0) e.criticalLevel = 'Kritik seviye negatif olamaz.';
    if (formData.expiryDate && formData.expiryDate < today) e.expiryDate = 'Son kullanma tarihi geçmiş olamaz.';
    return e;
  }, [formData, today]);

  const isValid = Object.keys(errors).length === 0;
  const filteredCategories = useMemo(
    () => CATEGORIES.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase())),
    [categorySearch],
  );
  const markTouched = (field: keyof FormState) => setTouched(prev => ({ ...prev, [field]: true }));
  const showErr = (field: keyof FormState) => touched[field] && errors[field];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, category: true, quantity: true, unit: true, location: true, criticalLevel: true, expiryDate: true, sku: true });
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);
    setTimeout(() => {
      onAdd({
        name: formData.name.trim(), sku: formData.sku.trim(), category: formData.category,
        quantity: Number(formData.quantity), unit: formData.unit || 'Adet', location: formData.location.trim(),
        criticalLevel: Number(formData.criticalLevel), expiryDate: formData.expiryDate || undefined,
      });
      setIsSubmitting(false);
      setIsSuccess(true);
      setFormData(initialState);
      setTouched({});
      setCategorySearch('');
      setTimeout(() => { setIsSuccess(false); onBack(); }, 1800);
    }, 700);
  };

  // ---- Toplu form durumu ----
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([emptyBulkRow(), emptyBulkRow(), emptyBulkRow()]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkMsg, setBulkMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const updateBulk = (idx: number, field: keyof BulkRow, val: string) =>
    setBulkRows(prev => prev.map((r, i) => (i === idx ? { ...r, [field]: val } : r)));
  const addBulkRow = () => setBulkRows(prev => [...prev, emptyBulkRow()]);
  const removeBulkRow = (idx: number) => setBulkRows(prev => prev.filter((_, i) => i !== idx));

  const validBulkRows = useMemo(
    () => bulkRows.filter(r => r.name.trim() && Number(r.quantity) > 0),
    [bulkRows],
  );

  const handleBulkAdd = async () => {
    if (!validBulkRows.length) {
      setBulkMsg({ type: 'err', text: 'Geçerli satır yok. En az bir satırda Ürün Adı ve 0\'dan büyük Adet girin.' });
      return;
    }
    setBulkSubmitting(true);
    setBulkMsg(null);
    const rows: ParsedInventoryRow[] = validBulkRows.map(r => ({
      name: r.name.trim(),
      sku: r.sku.trim() || uidSku(r.name.trim()),
      category: r.category.trim() || 'Diğer',
      quantity: Number(r.quantity) || 0,
      unit: r.unit.trim() || 'Adet',
      location: r.location.trim() || 'Ana Depo',
      criticalLevel: Number(r.criticalLevel) || 0,
    }));
    const res = await importInventory(rows, 'add', userName);
    setBulkSubmitting(false);
    if (res.ok) {
      setBulkMsg({ type: 'ok', text: `${res.total} ürün işlendi · ${res.added} yeni · ${res.updated} güncellendi.` });
      setBulkRows([emptyBulkRow(), emptyBulkRow(), emptyBulkRow()]);
    } else {
      setBulkMsg({ type: 'err', text: res.error || 'Toplu ekleme başarısız.' });
    }
  };

  // ---- Ortak stiller ----
  const inputBase =
    'w-full pl-12 pr-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border rounded-xl focus:ring-2 outline-none text-[#2a3439] dark:text-white placeholder-[#717c82] dark:placeholder-gray-500 transition-colors';
  const okRing = 'border-transparent focus:ring-[#455f8a]/20';
  const errRing = 'border-red-400 dark:border-red-500/50 focus:ring-red-500/20';
  const cellCls =
    'px-2.5 py-2 bg-[#f7f9fb] dark:bg-white/5 border border-transparent rounded-lg focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-sm text-[#2a3439] dark:text-white placeholder-[#717c82] dark:placeholder-gray-500';

  const ErrorText = ({ msg }: { msg?: string }) =>
    msg ? (
      <p className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 ml-1 mt-1">
        <AlertCircle className="w-3.5 h-3.5" />{msg}
      </p>
    ) : null;

  const tabCls = (active: boolean) =>
    `flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors ${
      active ? 'bg-[#455f8a] text-white shadow-lg shadow-[#455f8a]/20' : 'bg-white dark:bg-[#1e293b] text-[#566166] dark:text-gray-300 border border-[#e1e9ee] dark:border-white/10 hover:bg-[#f0f4f7] dark:hover:bg-white/5'
    }`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Başlık + sekmeler */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors text-[#455f8a] dark:text-[#d6e3ff]">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline">Ürün Ekle</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMode('single')} className={tabCls(mode === 'single')}><Package className="w-4 h-4" /> Tekli Ürün</button>
          <button onClick={() => setMode('bulk')} className={tabCls(mode === 'bulk')}><ListPlus className="w-4 h-4" /> Toplu Ekle</button>
        </div>
      </div>

      {/* ============================== TEKLİ ============================== */}
      {mode === 'single' && (
        <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 p-8 relative overflow-hidden">
          <AnimatePresence>
            {isSuccess && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 bg-white/90 dark:bg-[#1e293b]/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                  <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />
                </motion.div>
                <h3 className="text-2xl font-bold text-[#2a3439] dark:text-white mb-2 font-headline">Ürün Başarıyla Kaydedildi</h3>
                <p className="text-[#566166] dark:text-gray-400">Yeni ürün kataloğa eklendi. Dashboard'a yönlendiriliyorsunuz...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Temel Bilgiler */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-[#455f8a] dark:text-[#d6e3ff] uppercase tracking-[0.2em] flex items-center gap-2"><Info className="w-4 h-4" /> Temel Bilgiler</h3>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">Ürün Adı *</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-[1.45rem] -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500 z-10" />
                    <input type="text" placeholder="Örn: Tişört Beyaz M" value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })} onBlur={() => markTouched('name')}
                      className={`${inputBase} ${showErr('name') ? errRing : okRing}`} />
                  </div>
                  <ErrorText msg={showErr('name') ? errors.name : undefined} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">SKU Kodu</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500 z-10" />
                    <input type="text" placeholder="Örn: TSH-001" value={formData.sku}
                      onChange={e => setFormData({ ...formData, sku: e.target.value })} className={`${inputBase} ${okRing}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">Kategori *</label>
                  <div className="relative">
                    <Layers className="absolute left-4 top-[1.45rem] -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500 z-10" />
                    <button type="button" onClick={() => { setCategoryOpen(o => !o); markTouched('category'); }}
                      className={`${inputBase} ${showErr('category') ? errRing : okRing} text-left flex items-center justify-between`}>
                      <span className={formData.category ? 'text-[#2a3439] dark:text-white' : 'text-[#717c82] dark:text-gray-500'}>{formData.category || 'Kategori Seçin'}</span>
                    </button>
                    <AnimatePresence>
                      {categoryOpen && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          className="absolute z-30 mt-2 w-full bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e1e9ee] dark:border-white/10 overflow-hidden">
                          <div className="p-3 border-b border-[#e1e9ee] dark:border-white/10">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717c82] dark:text-gray-500" />
                              <input autoFocus type="text" placeholder="Kategori ara..." value={categorySearch}
                                onChange={e => setCategorySearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-lg text-sm outline-none text-[#2a3439] dark:text-white placeholder-[#717c82] dark:placeholder-gray-500" />
                            </div>
                          </div>
                          <div className="max-h-56 overflow-y-auto py-1">
                            {filteredCategories.length === 0 ? (
                              <p className="px-4 py-3 text-sm text-[#717c82] dark:text-gray-500">Sonuç yok</p>
                            ) : (
                              filteredCategories.map(cat => (
                                <button key={cat} type="button"
                                  onClick={() => { setFormData(prev => ({ ...prev, category: cat })); setCategoryOpen(false); setCategorySearch(''); }}
                                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#f0f4f7] dark:hover:bg-white/10 ${formData.category === cat ? 'bg-[#d6e3ff] dark:bg-blue-500/20 text-[#244069] dark:text-blue-300 font-bold' : 'text-[#2a3439] dark:text-gray-200'}`}>
                                  {cat}
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <ErrorText msg={showErr('category') ? errors.category : undefined} />
                </div>
              </div>

              {/* Envanter Detayları */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-[#455f8a] dark:text-[#d6e3ff] uppercase tracking-[0.2em] flex items-center gap-2"><Layers className="w-4 h-4" /> Envanter Detayları</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">Başlangıç Miktarı *</label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-[1.45rem] -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500 z-10" />
                      <input type="number" min="1" placeholder="0" value={isNaN(formData.quantity) ? '' : formData.quantity}
                        onChange={e => { const val = parseInt(e.target.value); setFormData({ ...formData, quantity: isNaN(val) ? NaN : val }); }}
                        onBlur={() => markTouched('quantity')} className={`${inputBase} ${showErr('quantity') ? errRing : okRing}`} />
                    </div>
                    <ErrorText msg={showErr('quantity') ? errors.quantity : undefined} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">Birim</label>
                    <input list="units-list" type="text" placeholder="Adet" value={formData.unit}
                      onChange={e => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border border-transparent rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white placeholder-[#717c82] dark:placeholder-gray-500" />
                    <datalist id="units-list">{UNITS.map(u => <option key={u} value={u} />)}</datalist>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">Depo Konumu</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500 z-10" />
                    <input list="locations-list" type="text" placeholder="Örn: Depo A - Raf 1" value={formData.location}
                      onChange={e => setFormData({ ...formData, location: e.target.value })} className={`${inputBase} ${okRing}`} />
                    <datalist id="locations-list">{LOCATIONS.map(l => <option key={l} value={l} />)}</datalist>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">Kritik Stok Seviyesi *</label>
                  <div className="relative">
                    <AlertCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500 z-10" />
                    <input type="number" min="0" placeholder="10" value={isNaN(formData.criticalLevel) ? '' : formData.criticalLevel}
                      onChange={e => { const val = parseInt(e.target.value); setFormData({ ...formData, criticalLevel: isNaN(val) ? NaN : val }); }}
                      onBlur={() => markTouched('criticalLevel')} className={`${inputBase} ${showErr('criticalLevel') ? errRing : okRing}`} />
                  </div>
                  <ErrorText msg={showErr('criticalLevel') ? errors.criticalLevel : undefined} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">Son Kullanma Tarihi (Opsiyonel)</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500 z-10 pointer-events-none" />
                    <input type="date" min={today} value={formData.expiryDate}
                      onChange={e => setFormData({ ...formData, expiryDate: e.target.value })} onBlur={() => markTouched('expiryDate')}
                      className={`${inputBase} ${showErr('expiryDate') ? errRing : okRing}`} />
                  </div>
                  <ErrorText msg={showErr('expiryDate') ? errors.expiryDate : undefined} />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-[#e1e9ee] dark:border-white/10 flex justify-end gap-4">
              <button type="button" onClick={onBack} disabled={isSubmitting}
                className="px-8 py-3 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-[#e1e9ee] dark:hover:bg-white/10 transition-colors disabled:opacity-50">İptal</button>
              <button type="submit" disabled={isSubmitting || !isValid}
                className="px-8 py-3 bg-[#455f8a] dark:bg-[#1e293b] text-white rounded-xl font-bold text-sm hover:bg-[#38537d] dark:hover:bg-white/5 transition-all shadow-lg shadow-[#455f8a]/20 dark:shadow-none border border-transparent dark:border-white/10 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>) : (<><Save className="w-4 h-4" /> Ürünü Kaydet</>)}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================== TOPLU ============================== */}
      {mode === 'bulk' && (
        <div className="space-y-6">
          {/* Kurallar */}
          <div className="bg-[#f0f4f7] dark:bg-white/5 rounded-2xl p-5 border border-[#e1e9ee] dark:border-white/10">
            <h3 className="flex items-center gap-2 text-sm font-bold text-[#455f8a] dark:text-[#d6e3ff] uppercase tracking-[0.15em] mb-3">
              <ShieldCheck className="w-4 h-4" /> İçe/Dışa Aktarma Kuralları
            </h3>
            <ul className="text-xs text-[#566166] dark:text-gray-400 space-y-1.5 leading-relaxed list-disc pl-4">
              <li><b>Zorunlu sütun:</b> <b>Ürün Adı</b>. Diğerleri boşsa varsayılan atanır (SKU otomatik üretilir, Kategori "Diğer", Birim "Adet", Konum "Ana Depo").</li>
              <li><b>Başlıklar</b> (TR/EN esnek): Ürün Adı, SKU, Kategori, Adet, Birim, Konum, Kritik Seviye, SKT.</li>
              <li><b>Adet</b> ve <b>Kritik Seviye</b> sayısal olmalı; harf/sembol otomatik temizlenir.</li>
              <li><b>İçe aktarma modları:</b> <b>Üzerine Ekle</b> (mevcuda ekler) · <b>Güncelle</b> (gelen değerle değiştirir) · <b>Tümünü Değiştir</b> (tüm envanteri siler).</li>
              <li>Eşleştirme önce <b>SKU</b>, yoksa <b>ürün adı</b> ile yapılır.</li>
            </ul>
          </div>

          {/* Şablon + Dışa/İçe aktarma aksiyonları */}
          <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 border border-[#e1e9ee] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#2a3439] dark:text-white">Dosya ile Toplu İşlem</p>
              <p className="text-xs text-[#717c82] dark:text-gray-400">Şablon indir, doldur, içe aktar; veya mevcut envanteri dışa aktar.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => downloadInventoryTemplate('xlsx')}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 text-[#566166] dark:text-gray-300 rounded-xl text-sm font-bold border border-[#e1e9ee] dark:border-white/10 hover:bg-[#f0f4f7] dark:hover:bg-white/10 transition-colors">
                <FileDown className="w-4 h-4" /> Şablon İndir
              </button>
              <button onClick={() => setImportOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 text-[#566166] dark:text-gray-300 rounded-xl text-sm font-bold border border-[#e1e9ee] dark:border-white/10 hover:bg-[#f0f4f7] dark:hover:bg-white/10 transition-colors">
                <Upload className="w-4 h-4" /> İçe Aktar
              </button>
              <ExportMenu onExport={(f: ExportFormat) => exportInventory(inventory, f)} label="Dışa Aktar" disabled={inventory.length === 0} />
            </div>
          </div>

          {/* Manuel toplu giriş grid */}
          <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#455f8a] dark:text-[#d6e3ff] uppercase tracking-[0.15em]">
                <FilePlus2 className="w-4 h-4" /> Manuel Toplu Giriş
              </h3>
              <span className="text-xs text-[#717c82] dark:text-gray-400">{validBulkRows.length} geçerli satır</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-y-2 min-w-[680px]">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-[#717c82] dark:text-gray-500 text-left">
                    <th className="px-2 font-bold">Ürün Adı *</th>
                    <th className="px-2 font-bold">SKU</th>
                    <th className="px-2 font-bold">Kategori</th>
                    <th className="px-2 font-bold w-20">Adet *</th>
                    <th className="px-2 font-bold w-24">Birim</th>
                    <th className="px-2 font-bold">Konum</th>
                    <th className="px-2 font-bold w-20">Kritik</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.map((row, idx) => (
                    <tr key={idx}>
                      <td><input value={row.name} onChange={e => updateBulk(idx, 'name', e.target.value)} placeholder="Tişört" className={`${cellCls} w-full`} /></td>
                      <td><input value={row.sku} onChange={e => updateBulk(idx, 'sku', e.target.value)} placeholder="oto" className={`${cellCls} w-full`} /></td>
                      <td>
                        <input list="cat-list" value={row.category} onChange={e => updateBulk(idx, 'category', e.target.value)} placeholder="Diğer" className={`${cellCls} w-full`} />
                      </td>
                      <td><input type="number" min="0" value={row.quantity} onChange={e => updateBulk(idx, 'quantity', e.target.value)} placeholder="0" className={`${cellCls} w-full`} /></td>
                      <td><input list="units-list-bulk" value={row.unit} onChange={e => updateBulk(idx, 'unit', e.target.value)} className={`${cellCls} w-full`} /></td>
                      <td><input list="loc-list" value={row.location} onChange={e => updateBulk(idx, 'location', e.target.value)} placeholder="Ana Depo" className={`${cellCls} w-full`} /></td>
                      <td><input type="number" min="0" value={row.criticalLevel} onChange={e => updateBulk(idx, 'criticalLevel', e.target.value)} className={`${cellCls} w-full`} /></td>
                      <td className="text-center">
                        <button onClick={() => removeBulkRow(idx)} disabled={bulkRows.length <= 1}
                          className="p-1.5 text-[#717c82] hover:text-red-500 disabled:opacity-30 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <datalist id="cat-list">{CATEGORIES.map(c => <option key={c} value={c} />)}</datalist>
              <datalist id="units-list-bulk">{UNITS.map(u => <option key={u} value={u} />)}</datalist>
              <datalist id="loc-list">{LOCATIONS.map(l => <option key={l} value={l} />)}</datalist>
            </div>

            <button onClick={addBulkRow} className="mt-2 flex items-center gap-2 px-3 py-2 text-sm font-bold text-[#455f8a] dark:text-[#d6e3ff] hover:bg-[#f0f4f7] dark:hover:bg-white/5 rounded-xl transition-colors">
              <Plus className="w-4 h-4" /> Satır Ekle
            </button>

            {bulkMsg && (
              <div className={`flex items-center gap-2 p-3 mt-4 rounded-xl text-xs font-medium ${bulkMsg.type === 'ok' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                {bulkMsg.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {bulkMsg.text}
              </div>
            )}

            <div className="pt-5 mt-4 border-t border-[#e1e9ee] dark:border-white/10 flex justify-end">
              <button onClick={handleBulkAdd} disabled={bulkSubmitting || validBulkRows.length === 0}
                className="px-8 py-3 bg-[#455f8a] text-white rounded-xl font-bold text-sm hover:bg-[#38537d] transition-all shadow-lg shadow-[#455f8a]/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                {bulkSubmitting ? (<><Loader className="w-4 h-4 animate-spin" /> Ekleniyor...</>) : (<><ListPlus className="w-4 h-4" /> Tümünü Ekle ({validBulkRows.length})</>)}
              </button>
            </div>
          </div>
        </div>
      )}

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} userName={userName} />
    </motion.div>
  );
}
