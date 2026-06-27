import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Search, Calendar, User, CheckCircle2, Clock, XCircle, UserCheck, Filter, MapPin, Tag } from 'lucide-react';
import { Shipment } from '../types';

interface ShipmentTableProps {
  shipments: Shipment[];
  type: 'Giriş' | 'Çıkış';
  onBack: () => void;
}

export default function ShipmentTable({ shipments, type, onBack }: ShipmentTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Hepsi');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Hepsi');
  const [locationFilter, setLocationFilter] = useState('Hepsi');
  const [recipientFilter, setRecipientFilter] = useState('Hepsi');

  const categories = ['Hepsi', ...new Set(shipments.filter(s => s.type === type).map(s => s.category).filter(Boolean))];
  const locations = ['Hepsi', ...new Set(shipments.filter(s => s.type === type).map(s => s.location).filter(Boolean))];
  const recipients = ['Hepsi', ...new Set(shipments.filter(s => s.type === 'Çıkış' && s.recipient).map(s => s.recipient as string))];

  const parseDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split(' ')[0].split('.');
    return new Date(`${year}-${month}-${day}`).getTime();
  };

  const filteredData = shipments.filter(s => {
    const matchesType = s.type === type;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      s.id.toLowerCase().includes(searchLower) ||
      s.item.toLowerCase().includes(searchLower) ||
      s.personnel.toLowerCase().includes(searchLower) ||
      (s.recipient?.toLowerCase().includes(searchLower) || false);
    
    const matchesStatus = statusFilter === 'Hepsi' || s.status === statusFilter;
    const matchesCategory = categoryFilter === 'Hepsi' || s.category === categoryFilter;
    const matchesLocation = locationFilter === 'Hepsi' || s.location === locationFilter;
    const matchesRecipient = type === 'Giriş' || recipientFilter === 'Hepsi' || s.recipient === recipientFilter;
    
    let matchesDate = true;
    if (startDate || endDate) {
      const shipTime = parseDate(s.date);
      if (startDate) {
        const start = new Date(startDate).getTime();
        if (shipTime < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate).getTime();
        if (shipTime > end) matchesDate = false;
      }
    }

    return matchesType && matchesSearch && matchesStatus && matchesDate && matchesCategory && matchesLocation && matchesRecipient;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Tamamlandı': return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400';
      case 'Beklemede': return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400';
      case 'İptal Edildi': return 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400';
      default: return 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Tamamlandı': return <CheckCircle2 className="w-3 h-3" />;
      case 'Beklemede': return <Clock className="w-3 h-3" />;
      case 'İptal Edildi': return <XCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors text-[#455f8a] dark:text-[#d6e3ff]"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline">Malzeme {type} Kayıtları</h2>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 overflow-hidden">
        <div className="p-6 border-b border-[#e1e9ee] dark:border-white/10 space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500" />
              <input 
                type="text" 
                placeholder="Sevkiyat ID, ürün, personel veya teslim alan ara..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-sm text-[#2a3439] dark:text-white placeholder-[#717c82] dark:placeholder-gray-500"
              />
            </div>
            
            <div className="flex items-center gap-2 min-w-[150px]">
              <Filter className="w-4 h-4 text-[#717c82] dark:text-gray-400" />
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-sm text-[#2a3439] dark:text-white"
              >
                <option value="Hepsi" className="dark:bg-[#1e293b]">Tüm Durumlar</option>
                <option value="Tamamlandı" className="dark:bg-[#1e293b]">Tamamlandı</option>
                <option value="Beklemede" className="dark:bg-[#1e293b]">Beklemede</option>
                <option value="İptal Edildi" className="dark:bg-[#1e293b]">İptal Edildi</option>
              </select>
            </div>

            <div className="flex items-center gap-2 min-w-[150px]">
              <Tag className="w-4 h-4 text-[#717c82] dark:text-gray-400" />
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

            {type === 'Çıkış' && (
              <div className="flex items-center gap-2 min-w-[150px]">
                <UserCheck className="w-4 h-4 text-[#717c82] dark:text-gray-400" />
                <select 
                  value={recipientFilter}
                  onChange={(e) => setRecipientFilter(e.target.value)}
                  className="flex-1 px-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-sm text-[#2a3439] dark:text-white"
                >
                  {recipients.map(rec => (
                    <option key={rec} value={rec} className="dark:bg-[#1e293b]">{rec === 'Hepsi' ? 'Tüm Teslim Alanlar' : rec}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#717c82] dark:text-gray-400" />
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-lg focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-xs text-[#2a3439] dark:text-white"
                />
                <span className="text-[#717c82] dark:text-gray-500">-</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-lg focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-xs text-[#2a3439] dark:text-white"
                />
              </div>
            </div>

            {(searchTerm || statusFilter !== 'Hepsi' || categoryFilter !== 'Hepsi' || locationFilter !== 'Hepsi' || recipientFilter !== 'Hepsi' || startDate || endDate) && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('Hepsi');
                  setCategoryFilter('Hepsi');
                  setLocationFilter('Hepsi');
                  setRecipientFilter('Hepsi');
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline ml-auto"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f7f9fb] dark:bg-white/5">
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Sevkiyat ID</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Ürün / Miktar</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Tarih</th>
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Personel</th>
                {type === 'Çıkış' && (
                  <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Teslim Alan</th>
                )}
                <th className="px-6 py-4 text-xs font-bold text-[#566166] dark:text-gray-300 uppercase tracking-widest">Durum</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e1e9ee] dark:divide-white/10">
              {filteredData.map((shipment) => (
                <tr key={shipment.id} className="hover:bg-[#f7f9fb] dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-bold text-[#455f8a] dark:text-[#d6e3ff] font-mono">{shipment.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-[#2a3439] dark:text-white">{shipment.item}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-[#717c82] dark:text-gray-500">{shipment.quantity} Birim</p>
                        <span className="px-2 py-0.5 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-400 rounded text-[9px] font-bold uppercase tracking-wider">
                          {shipment.category}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#566166] dark:text-gray-300">{shipment.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-[#d6e3ff] dark:bg-blue-500/20 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-[#244069] dark:text-blue-300" />
                      </div>
                      <span className="text-sm font-medium text-[#566166] dark:text-gray-300">{shipment.personnel}</span>
                    </div>
                  </td>
                  {type === 'Çıkış' && (
                    <td className="px-6 py-4">
                      {shipment.recipient ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center">
                            <UserCheck className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          </div>
                          <span className="text-sm font-medium text-[#566166] dark:text-gray-300">{shipment.recipient}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#717c82] dark:text-gray-500 italic">Belirtilmedi</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(shipment.status)}`}>
                      {getStatusIcon(shipment.status)}
                      {shipment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-[#455f8a] dark:text-[#d6e3ff] text-xs font-bold hover:underline uppercase tracking-wider">Detay</button>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={type === 'Çıkış' ? 7 : 6} className="px-6 py-12 text-center text-[#717c82] dark:text-gray-500">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

