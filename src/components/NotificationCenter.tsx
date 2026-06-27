import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Bell,
  CalendarClock,
  AlertTriangle,
  ShieldCheck,
  Settings,
  Pin,
  Check,
  Trash2,
  Filter,
  Search,
  CheckCheck,
  Info,
} from 'lucide-react';
import { db } from '../lib/db';
import {
  setNotificationRead,
  toggleNotificationPin,
  markAllNotificationsRead,
  deleteNotification,
  clearReadNotifications,
} from '../lib/repo';
import { NotificationItem, NotificationType } from '../types';

export interface NotificationCenterProps {
  onBack: () => void;
}

type StatusFilter = 'all' | 'unread' | 'pinned';
type TypeFilter = 'all' | NotificationType;

const TYPE_META: Record<
  NotificationType,
  { label: string; icon: React.ComponentType<{ className?: string }>; badge: string; iconColor: string }
> = {
  task: {
    label: 'Görev',
    icon: CalendarClock,
    badge: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400',
    iconColor: 'text-blue-500',
  },
  stock: {
    label: 'Stok',
    icon: AlertTriangle,
    badge: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    iconColor: 'text-amber-500',
  },
  security: {
    label: 'Güvenlik',
    icon: ShieldCheck,
    badge: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    iconColor: 'text-red-500',
  },
  system: {
    label: 'Sistem',
    icon: Settings,
    badge: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
    iconColor: 'text-purple-500',
  },
  info: {
    label: 'Bilgi',
    icon: Info,
    badge: 'bg-[#f0f4f7] text-[#566166] dark:bg-white/10 dark:text-gray-300',
    iconColor: 'text-[#455f8a] dark:text-[#d6e3ff]',
  },
};

const TYPE_ORDER: NotificationType[] = ['task', 'stock', 'security', 'system', 'info'];

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Tümü' },
  { key: 'unread', label: 'Okunmamış' },
  { key: 'pinned', label: 'Sabitlenmiş' },
];

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function NotificationCenter({ onBack }: NotificationCenterProps) {
  const notifications = useLiveQuery(
    () => db.notifications.orderBy('ts').reverse().toArray(),
    [],
    [] as NotificationItem[],
  );

  const [status, setStatus] = useState<StatusFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications],
  );

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return notifications
      .filter((n) => {
        if (status === 'unread' && n.read) return false;
        if (status === 'pinned' && !n.pinned) return false;
        if (typeFilter !== 'all' && n.type !== typeFilter) return false;
        if (term) {
          const haystack = `${n.title} ${n.message}`.toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      })
      // Sıralama: sabitlenmişler önce, sonra ts (yeni → eski)
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return b.ts - a.ts;
      });
  }, [notifications, status, typeFilter, searchTerm]);

  const isFiltered = status !== 'all' || typeFilter !== 'all' || searchTerm.trim() !== '';
  const hasAny = notifications.length > 0;

  const resetFilters = () => {
    setStatus('all');
    setTypeFilter('all');
    setSearchTerm('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20 max-w-3xl mx-auto"
    >
      {/* Başlık */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors text-[#455f8a] dark:text-[#d6e3ff] shrink-0"
            aria-label="Geri"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2a3439] dark:text-white font-headline truncate">
            Bildirimler
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-2 bg-[#d6e3ff]/50 dark:bg-white/10 rounded-full text-sm font-bold text-[#244069] dark:text-[#d6e3ff] shrink-0">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 ? `${unreadCount} okunmamış` : 'Hepsi okundu'}
        </span>
      </div>

      {/* Üst aksiyon çubuğu */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => markAllNotificationsRead()}
          disabled={unreadCount === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-[#455f8a] text-white hover:bg-[#244069] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <CheckCheck className="w-4 h-4" />
          Tümünü Okundu Yap
        </button>
        <button
          onClick={() => clearReadNotifications()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white dark:bg-white/5 text-[#566166] dark:text-gray-300 border border-[#e1e9ee] dark:border-white/10 hover:bg-[#f0f4f7] dark:hover:bg-white/10 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Okunmuşları Temizle
        </button>
      </div>

      {/* Filtre paneli */}
      <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-4 sm:p-5 shadow-sm border border-[#e1e9ee] dark:border-white/10 space-y-4">
        {/* Durum sekmeleri */}
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setStatus(tab.key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  active
                    ? 'bg-[#d6e3ff] text-[#244069] dark:bg-[#455f8a] dark:text-white'
                    : 'bg-[#f0f4f7] text-[#566166] dark:bg-white/5 dark:text-gray-300 hover:bg-[#e1e9ee] dark:hover:bg-white/10'
                }`}
              >
                {tab.label}
                {tab.key === 'unread' && unreadCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[#455f8a] text-white text-[11px] dark:bg-[#244069]">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Arama + tip seçici */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500" />
            <input
              type="text"
              placeholder="Başlık veya mesajda ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#717c82] dark:text-gray-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="w-full sm:w-auto pl-10 pr-8 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white appearance-none cursor-pointer text-sm font-bold"
            >
              <option value="all">Tüm Türler</option>
              {TYPE_ORDER.map((t) => (
                <option key={t} value={t}>
                  {TYPE_META[t].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Liste */}
      {!hasAny ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-12 text-center shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <Bell className="w-12 h-12 text-[#e1e9ee] dark:text-white/10 mx-auto mb-4" />
          <p className="text-[#717c82] dark:text-gray-500 font-medium">Henüz bildirim bulunmuyor.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-12 text-center shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <Search className="w-12 h-12 text-[#e1e9ee] dark:text-white/10 mx-auto mb-4" />
          <p className="text-[#717c82] dark:text-gray-500 font-medium">
            Arama veya filtre kriterlerinize uygun bildirim bulunamadı.
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 text-sm font-bold text-[#455f8a] dark:text-[#d6e3ff] hover:underline"
          >
            Filtreleri Temizle
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {filtered.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.info;
              const Icon = meta.icon;
              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={`relative rounded-2xl p-4 sm:p-5 border transition-colors ${
                    n.read
                      ? 'bg-white dark:bg-[#1e293b] border-[#e1e9ee] dark:border-white/10'
                      : 'bg-[#f0f4f7] dark:bg-white/[0.06] border-[#d6e3ff] dark:border-[#455f8a]/40'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Tip ikonu */}
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-[#f7f9fb] dark:bg-white/5 flex items-center justify-center">
                      <Icon className={`w-5 h-5 ${meta.iconColor}`} />
                    </div>

                    {/* İçerik */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full bg-[#455f8a] dark:bg-[#d6e3ff] shrink-0" aria-hidden />
                        )}
                        <h3 className="text-sm sm:text-base font-bold text-[#2a3439] dark:text-white break-words">
                          {n.title}
                        </h3>
                        {n.pinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#d6e3ff] text-[#244069] dark:bg-[#455f8a] dark:text-white text-[10px] font-bold uppercase tracking-wider">
                            <Pin className="w-3 h-3" />
                            Sabit
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${meta.badge}`}
                        >
                          {meta.label}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-[#566166] dark:text-gray-400 break-words">{n.message}</p>
                      <p className="mt-2 text-xs text-[#717c82] dark:text-gray-500">{formatDate(n.ts)}</p>
                    </div>
                  </div>

                  {/* Aksiyonlar */}
                  <div className="flex items-center justify-end gap-1.5 mt-3 pt-3 border-t border-[#f0f4f7] dark:border-white/5">
                    <button
                      onClick={() => setNotificationRead(n.id, !n.read)}
                      title={n.read ? 'Okunmadı olarak işaretle' : 'Okundu olarak işaretle'}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#566166] dark:text-gray-300 hover:bg-[#f0f4f7] dark:hover:bg-white/10 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      {n.read ? 'Okunmadı' : 'Okundu'}
                    </button>
                    <button
                      onClick={() => toggleNotificationPin(n.id)}
                      title={n.pinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        n.pinned
                          ? 'text-[#244069] dark:text-[#d6e3ff] bg-[#d6e3ff]/50 dark:bg-white/10'
                          : 'text-[#566166] dark:text-gray-300 hover:bg-[#f0f4f7] dark:hover:bg-white/10'
                      }`}
                    >
                      <Pin className="w-4 h-4" />
                      {n.pinned ? 'Kaldır' : 'Sabitle'}
                    </button>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      title="Sil"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Sil
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
