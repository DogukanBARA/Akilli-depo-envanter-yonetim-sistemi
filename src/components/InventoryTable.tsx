import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Upload, MoreVertical, ArrowLeft, LogOut, LogIn, X, MapPin, Info, AlertTriangle, ChevronDown } from 'lucide-react';
import { InventoryItem, ExportFormat } from '../types';
import ExportMenu from './ExportMenu';
import ImportDialog from './ImportDialog';
import { exportInventory } from '../lib/io';

interface InventoryTableProps {
  inventory: InventoryItem[];
  onBack: () => void;
  onExit: (id: string, qty: number, recipient: string) => void;
  onEntry: (id: string, qty: number) => void;
  role: string;
  userName: string;
}

export default function InventoryTable({ inventory, onBack, onExit, onEntry, role, userName }: InventoryTableProps) {
  const [exitItem, setExitItem] = useState<InventoryItem | null>(null);
  const [entryItem, setEntryItem] = useState<InventoryItem | null>(null);
  const [qty, setQty] = useState<number>(1);
  const [recipient, setRecipient] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Hepsi');
  const [locationFilter, setLocationFilter] = useState('Hepsi');
  const [quickFilter, setQuickFilter] = useState('Hepsi');
  const [showFilters, setShowFilters] = useState(true);

  const categories = ['Hepsi', ...new Set(inventory.map(item => item.category))];
  const locations = ['Hepsi', ...new Set(inventory.map(item => item.location))];

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'Hepsi' || item.category === categoryFilter;
    const matchesLocation = locationFilter === 'Hepsi' || item.location === locationFilter;

    let matchesQuick = true;
    if (quickFilter === 'Kritik Stok') {
      matchesQuick = item.quantity <= item.criticalLevel;
    } else if (quickFilter === 'Son Kullanma Yaklaşan') {
      if (!item.expiryDate) {
        matchesQuick = false;
      } else {
        const expiry = new Date(item.expiryDate).getTime();
        const now = new Date().getTime();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        matchesQuick = expiry - now < thirtyDays && expiry - now > 0;
      }
    }

    return matchesSearch && matchesCategory && matchesLocation && matchesQuick;
  });

  const hasActiveFilters =
    searchTerm !== '' ||
    categoryFilter !== 'Hepsi' ||
    locationFilter !== 'Hepsi' ||
    quickFilter !== 'Hepsi';

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('Hepsi');
    setLocationFilter('Hepsi');
    setQuickFilter('Hepsi');
  };

  const handleExitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;
    
    if (exitItem && recipient.trim() && !isNaN(qty) && qty > 0 && qty <= exitItem.quantity) {
      setShowExitConfirmation(true);
    }
  };

  const exitExceedsStock = !!exitItem && !isNaN(qty) && qty > exitItem.quantity;

  const confirmExit = () => {
    if (exitItem && recipient.trim() && !isProcessing) {
      setIsProcessing(true);
      onExit(exitItem.id, qty, recipient);
      setExitItem(null);
      setShowExitConfirmation(false);
      setQty(1);
      setRecipient('');
      setIsProcessing(false);
    }
  };

  const handleEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (entryItem) {
      setIsProcessing(true);
      onEntry(entryItem.id, qty);
      setEntryItem(null);
      setQty(1);
      setIsProcessing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors text-[#455f8a] dark:text-[#d6e3ff]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline">Stok Takibi</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(v => !v)}
            aria-expanded={showFilters}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm border ${
              showFilters
                ? 'bg-[#455f8a] text-white border-[#455f8a] hover:bg-[#244069]'
                : 'bg-white dark:bg-[#1e293b] text-[#566166] dark:text-gray-300 hover:bg-[#f0f4f7] dark:hover:bg-white/10 border-transparent dark:border-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtrele
            {hasActiveFilters && (
              <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                showFilters ? 'bg-white/25 text-white' : 'bg-[#455f8a] text-white'
              }`}>
                {filteredInventory.length}
              </span>
            )}
            <motion.span animate={{ rotate: showFilters ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex">
              <ChevronDown className="w-4 h-4" />
            </motion.span>
          </button>
          <button
            onClick={() => setImportOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#1e293b] text-[#566166] dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-[#f0f4f7] dark:hover:bg-white/10 transition-colors shadow-sm border border-[#e1e9ee] dark:border-white/10"
          >
            <Upload className="w-4 h-4" />
            İçe Aktar
          </button>
          <ExportMenu onExport={(f: ExportFormat) => exportInventory(filteredInventory, f)} />
        </div>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 overflow-hidden">
        <AnimatePresence initial={false}>
        {showFilters && (
        <motion.div
          key="filter-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="overflow-hidden border-b border-[#e1e9ee] dark:border-white/10"
        >
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500" />
              <input 
                type="text" 
                placeholder="Ürün adı, SKU veya kategori ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-sm text-[#2a3439] dark:text-white placeholder-[#717c82] dark:placeholder-gray-500"
              />
            </div>
            
            <div className="flex items-center gap-2 min-w-[150px]">
              <Filter className="w-4 h-4 text-[#717c82] dark:text-gray-400" />
              <select 
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-sm text-[#2a3439] dark:text-white"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat} className="dark:bg-[#1e293b]">{cat === 'Hepsi' ? 'Tüm Kategoriler' : cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 min-w-[150px]">
              <MapPin className="w-4 h-4 text-[#717c82] dark:text-gray-400" />
              <select 
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-sm text-[#2a3439] dark:text-white"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc} className="dark:bg-[#1e293b]">{loc === 'Hepsi' ? 'Tüm Konumlar' : loc}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 min-w-[150px]">
              <Info className="w-4 h-4 text-[#717c82] dark:text-gray-400" />
              <select 
                value={quickFilter}
                onChange={(e) => setQuickFilter(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-sm text-[#2a3439] dark:text-white"
              >
                <option value="Hepsi" className="dark:bg-[#1e293b]">Tüm Ürünler</option>
                <option value="Kritik Stok" className="dark:bg-[#1e293b]">Kritik Stok</option>
                <option value="Son Kullanma Yaklaşan" className="dark:bg-[#1e293b]">SKT Yaklaşan</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-[#566166] dark:text-gray-400">
              {hasActiveFilters ? (
                <>
                  <span className="text-[#455f8a] dark:text-[#d6e3ff]">{filteredInventory.length}</span>
                  {' / '}{inventory.length} ürün gösteriliyor
                </>
              ) : (
                <>Toplam {inventory.length} ürün</>
              )}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 hover:underline"
              >
                <X className="w-3.5 h-3.5" />
                Filtreleri Temizle
              </button>
            )}
          </div>
        </div>
        </motion.div>
        )}
        </AnimatePresence>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f7f9fb] dark:bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Ürün Bilgisi</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Kategori</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Miktar</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Konum</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">SKT</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Son Güncelleme</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e9ee] dark:divide-white/10">
              {filteredInventory.map((item) => {
                const isCritical = item.quantity <= item.criticalLevel;
                return (
                <tr
                  key={item.id}
                  className={`transition-colors group ${
                    isCritical
                      ? 'bg-red-50/70 dark:bg-red-500/10 hover:bg-red-100/70 dark:hover:bg-red-500/20'
                      : 'hover:bg-[#f7f9fb] dark:hover:bg-white/5'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isCritical && <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />}
                      <div>
                        <p className="font-bold text-[#2a3439] dark:text-white">{item.name}</p>
                        <p className="text-xs text-[#717c82] dark:text-gray-500 font-mono">{item.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-[#d6e3ff] dark:bg-blue-500/20 text-[#244069] dark:text-blue-300 rounded-full text-[10px] font-bold uppercase tracking-wider">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <p className={`font-bold ${isCritical ? 'text-red-600 dark:text-red-400' : 'text-[#2a3439] dark:text-white'}`}>
                        {item.quantity} <span className="text-[#717c82] dark:text-gray-500 font-normal text-xs">{item.unit}</span>
                      </p>
                      {isCritical && (
                        <span className="px-2 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 rounded-full text-[9px] font-bold uppercase tracking-wider">
                          Kritik
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#566166] dark:text-gray-300 font-medium">{item.location}</td>
                  <td className="px-6 py-4 text-sm">
                    {item.expiryDate ? (
                      <span className={`font-medium ${
                        new Date(item.expiryDate).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-[#566166] dark:text-gray-300'
                      }`}>
                        {item.expiryDate}
                      </span>
                    ) : (
                      <span className="text-[#717c82] dark:text-gray-500 italic">Yok</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#566166] dark:text-gray-300">{item.lastUpdated}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {
                          setEntryItem(item);
                          setQty(1);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-50 dark:bg-green-500/20 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold hover:bg-green-100 dark:hover:bg-green-500/30 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <LogIn className="w-3 h-3" />
                        Giriş Yap
                      </button>
                      <button 
                        onClick={() => {
                          setExitItem(item);
                          setQty(1);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/30 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <LogOut className="w-3 h-3" />
                        Çıkış Yap
                      </button>
                      <button className="p-2 hover:bg-[#e1e9ee] dark:hover:bg-white/10 rounded-lg transition-colors">
                        <MoreVertical className="w-5 h-5 text-[#717c82] dark:text-gray-400" />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Material Exit Modal */}
      <AnimatePresence>
        {exitItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExitItem(null)}
              className="absolute inset-0 bg-[#2a3439]/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-[#1e293b] w-full max-w-md rounded-[2rem] shadow-2xl p-8"
            >
              <button 
                onClick={() => {
                  setExitItem(null);
                  setShowExitConfirmation(false);
                }}
                className="absolute top-6 right-6 p-2 hover:bg-[#f0f4f7] dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#717c82] dark:text-gray-400" />
              </button>

              {!showExitConfirmation ? (
                <>
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline mb-2">Malzeme Çıkışı</h3>
                    <p className="text-[#566166] dark:text-gray-400">
                      <span className="font-bold text-[#455f8a] dark:text-[#d6e3ff]">{exitItem.name}</span> ürünü için çıkış miktarını belirleyin.
                    </p>
                  </div>

                  <form onSubmit={handleExitSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">Çıkış Miktarı ({exitItem.unit})</label>
                      <input 
                        type="number" 
                        min="1" 
                        max={exitItem.quantity}
                        value={isNaN(qty) ? '' : qty}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setQty(isNaN(val) ? NaN : val);
                        }}
                        className={`w-full px-4 py-4 bg-[#f7f9fb] dark:bg-white/5 rounded-xl focus:ring-2 outline-none text-lg font-bold text-[#2a3439] dark:text-white border ${
                          exitExceedsStock ? 'border-red-500 focus:ring-red-500/30' : 'border-transparent focus:ring-red-500/20'
                        }`}
                        required
                      />
                      <p className="text-xs text-[#717c82] dark:text-gray-500 ml-1">Mevcut Stok: {exitItem.quantity} {exitItem.unit}</p>
                      {exitExceedsStock && (
                        <p className="flex items-center gap-1.5 text-xs font-bold text-red-600 dark:text-red-400 ml-1 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Çıkış miktarı mevcut stoğu ({exitItem.quantity} {exitItem.unit}) aşamaz.
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">Teslim Alan Kişi</label>
                      <input 
                        type="text" 
                        placeholder="İsim Soyisim"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="w-full px-4 py-4 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none text-sm font-medium text-[#2a3439] dark:text-white placeholder-[#717c82] dark:placeholder-gray-500"
                        required
                      />
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button 
                        type="button"
                        onClick={() => setExitItem(null)}
                        className="flex-1 py-4 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-400 rounded-xl font-bold transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        type="submit"
                        disabled={exitExceedsStock || isNaN(qty) || qty <= 0 || !recipient.trim()}
                        className="flex-1 py-4 bg-red-600 dark:bg-red-900/40 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 dark:shadow-none hover:bg-red-700 dark:hover:bg-red-900/60 transition-all border border-transparent dark:border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Devam Et
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline mb-2">İşlemi Onaylayın</h3>
                    <p className="text-[#566166] dark:text-gray-400">Lütfen çıkış detaylarını kontrol edin.</p>
                  </div>

                  <div className="bg-[#f7f9fb] dark:bg-white/5 rounded-2xl p-6 space-y-4 border border-[#e1e9ee] dark:border-white/10">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#717c82] dark:text-gray-500 uppercase tracking-widest">Ürün</span>
                      <span className="text-sm font-bold text-[#2a3439] dark:text-white">{exitItem.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#717c82] dark:text-gray-500 uppercase tracking-widest">Miktar</span>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400">{qty} {exitItem.unit}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#717c82] dark:text-gray-500 uppercase tracking-widest">Teslim Alan</span>
                      <span className="text-sm font-bold text-[#2a3439] dark:text-white">{recipient}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setShowExitConfirmation(false)}
                      className="flex-1 py-4 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-400 rounded-xl font-bold transition-colors"
                    >
                      Geri Dön
                    </button>
                    <button 
                      onClick={confirmExit}
                      disabled={isProcessing}
                      className="flex-1 py-4 bg-red-600 dark:bg-red-900/40 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 dark:shadow-none hover:bg-red-700 dark:hover:bg-red-900/60 transition-all border border-transparent dark:border-red-500/20 disabled:opacity-50"
                    >
                      {isProcessing ? 'İşleniyor...' : 'Onayla'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Material Entry Modal */}
      <AnimatePresence>
        {entryItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEntryItem(null)}
              className="absolute inset-0 bg-[#2a3439]/60 backdrop-blur-sm"
            ></motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-[#1e293b] w-full max-w-md rounded-[2rem] shadow-2xl p-8"
            >
              <button 
                onClick={() => setEntryItem(null)}
                className="absolute top-6 right-6 p-2 hover:bg-[#f0f4f7] dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#717c82] dark:text-gray-400" />
              </button>

              <div className="mb-8">
                <h3 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline mb-2">Malzeme Girişi</h3>
                <p className="text-[#566166] dark:text-gray-400">
                  <span className="font-bold text-[#455f8a] dark:text-[#d6e3ff]">{entryItem.name}</span> ürünü için giriş miktarını belirleyin.
                </p>
              </div>

              <form onSubmit={handleEntrySubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">Giriş Miktarı ({entryItem.unit})</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={isNaN(qty) ? '' : qty}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setQty(isNaN(val) ? NaN : val);
                    }}
                    className="w-full px-4 py-4 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-green-500/20 outline-none text-lg font-bold text-[#2a3439] dark:text-white"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEntryItem(null)}
                    className="flex-1 py-4 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-400 rounded-xl font-bold transition-colors"
                  >
                    İptal
                  </button>
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1 py-4 bg-green-600 dark:bg-green-900/40 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 dark:shadow-none hover:bg-green-700 dark:hover:bg-green-900/60 transition-all border border-transparent dark:border-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? 'İşleniyor...' : 'Girişi Onayla'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} userName={userName} />
    </motion.div>
  );
}

