import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, History, Search, Filter, Shield, Box, Settings as SettingsIcon, Calendar } from 'lucide-react';
import { AuditLog } from '../types';

interface AuditLogViewProps {
  logs: AuditLog[];
  onBack: () => void;
}

export default function AuditLogView({ logs, onBack }: AuditLogViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || log.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'security': return <Shield className="w-4 h-4 text-red-500" />;
      case 'inventory': return <Box className="w-4 h-4 text-blue-500" />;
      case 'system': return <SettingsIcon className="w-4 h-4 text-purple-500" />;
      default: return <History className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'security': return 'Güvenlik';
      case 'inventory': return 'Envanter';
      case 'system': return 'Sistem';
      default: return type;
    }
  };

  // Tip bazlı renkli rozet sınıfları (açık + koyu tema)
  const getTypeBadgeClasses = (type: string) => {
    switch (type) {
      case 'security': return 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400';
      case 'inventory': return 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400';
      case 'system': return 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400';
      default: return 'bg-[#f0f4f7] text-[#566166] dark:bg-white/10 dark:text-gray-300';
    }
  };

  const isFiltered = searchTerm.trim() !== '' || filterType !== 'all';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors text-[#455f8a] dark:text-[#d6e3ff]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline">Denetim Günlüğü (Audit Log)</h2>
        </div>
        <span className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-[#d6e3ff]/50 dark:bg-white/10 rounded-full text-sm font-bold text-[#244069] dark:text-[#d6e3ff]">
          <History className="w-4 h-4" />
          {filteredLogs.length} kayıt
        </span>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] p-8 shadow-sm border border-[#e1e9ee] dark:border-white/10">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500" />
            <input 
              type="text" 
              placeholder="İşlem, detay veya kullanıcı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white"
            />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717c82] dark:text-gray-500" />
              <select 
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="pl-10 pr-8 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white appearance-none cursor-pointer text-sm font-bold"
              >
                <option value="all">Tüm Türler</option>
                <option value="security">Güvenlik</option>
                <option value="inventory">Envanter</option>
                <option value="system">Sistem</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-[#e1e9ee] dark:border-white/10">
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest">Zaman Damgası</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest">Kullanıcı</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest">Tür</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest">İşlem</th>
                <th className="pb-4 pt-2 px-4 text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest">Detaylar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f7f9fb] dark:divide-white/5">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="group hover:bg-[#f7f9fb] dark:hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-sm text-[#2a3439] dark:text-white font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#717c82]" />
                        {log.timestamp}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-bold text-[#455f8a] dark:text-[#d6e3ff]">{log.user}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit ${getTypeBadgeClasses(log.type)}`}>
                        {getTypeIcon(log.type)}
                        <span className="text-[10px] font-bold uppercase tracking-wider">
                          {getTypeLabel(log.type)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-bold text-[#2a3439] dark:text-white">{log.action}</span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-xs text-[#566166] dark:text-gray-400 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </p>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <History className="w-12 h-12 text-[#e1e9ee] dark:text-white/10 mx-auto mb-4" />
                    <p className="text-[#717c82] dark:text-gray-500 font-medium">
                      {isFiltered
                        ? 'Arama veya filtre kriterlerinize uygun kayıt bulunamadı.'
                        : 'Henüz denetim kaydı bulunmuyor.'}
                    </p>
                    {isFiltered && (
                      <button
                        onClick={() => { setSearchTerm(''); setFilterType('all'); }}
                        className="mt-4 text-sm font-bold text-[#455f8a] dark:text-[#d6e3ff] hover:underline"
                      >
                        Filtreleri Temizle
                      </button>
                    )}
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
