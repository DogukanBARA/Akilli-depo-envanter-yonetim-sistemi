import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  CalendarClock,
  AlertTriangle,
  ShieldCheck,
  Settings,
  Pin,
  Check,
  Trash2,
  CheckCheck,
  ArrowRight,
} from 'lucide-react';
import { NotificationItem, NotificationType } from '../types';
import {
  setNotificationRead,
  toggleNotificationPin,
  markAllNotificationsRead,
  deleteNotification,
} from '../lib/repo';

export interface NotificationBellProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onViewAll: () => void;
}

/** Tip → ikon + renk eşlemesi. */
const TYPE_META: Record<NotificationType, { icon: React.ComponentType<any>; cls: string }> = {
  task: { icon: CalendarClock, cls: 'text-[#455f8a] dark:text-[#d6e3ff] bg-[#d6e3ff] dark:bg-white/10' },
  stock: { icon: AlertTriangle, cls: 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/15' },
  security: { icon: ShieldCheck, cls: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/15' },
  system: { icon: Settings, cls: 'text-[#566166] dark:text-gray-300 bg-[#f0f4f7] dark:bg-white/10' },
  info: { icon: Bell, cls: 'text-[#244069] dark:text-[#d6e3ff] bg-[#d6e3ff] dark:bg-white/10' },
};

/** tr-TR kısa tarih/saat. */
function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleString('tr-TR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Sağ üst zil + açılır bildirim paneli.
 * Sabitlenmişler en üstte, ardından gelen sıra (ts'e göre tersten) korunur.
 * Aksiyonlar repo üzerinden: okundu/okunmadı, sabitle/sabiti kaldır, sil, tümünü okundu yap.
 */
export default function NotificationBell({ notifications, unreadCount, onViewAll }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // Sabitlenmişler üstte; her grup gelen sırayı (newest-first) korur.
  const sorted = useMemo(() => {
    return [...notifications].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return 0;
    });
  }, [notifications]);

  const handleViewAll = () => {
    setOpen(false);
    onViewAll();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Bildirimler"
        className="p-2 relative text-[#566166] dark:text-gray-400 hover:text-[#455f8a] dark:hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-white dark:border-[#1e293b]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e1e9ee] dark:border-white/10 z-50 overflow-hidden"
          >
            {/* Başlık */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#e1e9ee] dark:border-white/10">
              <div>
                <p className="text-sm font-bold text-[#2a3439] dark:text-white">Bildirimler</p>
                <p className="text-[11px] text-[#717c82] dark:text-gray-400">
                  {unreadCount} okunmamış
                </p>
              </div>
              <button
                type="button"
                onClick={() => markAllNotificationsRead()}
                disabled={unreadCount === 0}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[#455f8a] dark:text-[#d6e3ff] hover:bg-[#f0f4f7] dark:hover:bg-white/5 transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Tümünü Okundu Yap
              </button>
            </div>

            {/* Liste */}
            <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
              {sorted.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="w-8 h-8 mx-auto text-[#c3ccd2] dark:text-white/20" />
                  <p className="mt-3 text-sm text-[#717c82] dark:text-gray-400">Henüz bildiriminiz yok.</p>
                </div>
              ) : (
                <ul className="p-1.5">
                  <AnimatePresence initial={false}>
                    {sorted.map((n) => {
                      const meta = TYPE_META[n.type] ?? TYPE_META.info;
                      const Icon = meta.icon;
                      return (
                        <motion.li
                          key={n.id}
                          layout
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <div
                            className={`group relative flex gap-3 px-3 py-3 rounded-xl transition-colors hover:bg-[#f0f4f7] dark:hover:bg-white/5 ${
                              !n.read
                                ? 'bg-[#d6e3ff]/40 dark:bg-white/[0.06] border-l-[3px] border-[#455f8a] dark:border-[#d6e3ff]'
                                : 'border-l-[3px] border-transparent'
                            }`}
                          >
                            {/* Tip ikonu */}
                            <span
                              className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${meta.cls}`}
                            >
                              <Icon className="w-[18px] h-[18px]" />
                            </span>

                            {/* İçerik */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-1.5">
                                {n.pinned && (
                                  <Pin className="w-3 h-3 mt-0.5 shrink-0 text-[#455f8a] dark:text-[#d6e3ff] fill-current" />
                                )}
                                <p
                                  className={`text-sm leading-snug truncate ${
                                    !n.read
                                      ? 'font-bold text-[#2a3439] dark:text-white'
                                      : 'font-semibold text-[#566166] dark:text-gray-300'
                                  }`}
                                >
                                  {n.title}
                                </p>
                              </div>
                              <p className="mt-0.5 text-[12px] text-[#566166] dark:text-gray-400 line-clamp-2">
                                {n.message}
                              </p>
                              <p className="mt-1 text-[10px] text-[#9aa4ab] dark:text-gray-500">
                                {formatDate(n.ts)}
                              </p>

                              {/* Aksiyonlar */}
                              <div className="mt-2 flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                  type="button"
                                  onClick={() => setNotificationRead(n.id, !n.read)}
                                  title={n.read ? 'Okunmadı işaretle' : 'Okundu işaretle'}
                                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold text-[#455f8a] dark:text-[#d6e3ff] hover:bg-[#d6e3ff] dark:hover:bg-white/10 transition-colors"
                                >
                                  <Check className="w-3 h-3" />
                                  {n.read ? 'Okunmadı' : 'Okundu'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleNotificationPin(n.id)}
                                  title={n.pinned ? 'Sabiti kaldır' : 'Yukarı sabitle'}
                                  className={`p-1.5 rounded-md transition-colors hover:bg-[#d6e3ff] dark:hover:bg-white/10 ${
                                    n.pinned
                                      ? 'text-[#455f8a] dark:text-[#d6e3ff]'
                                      : 'text-[#9aa4ab] dark:text-gray-500'
                                  }`}
                                >
                                  <Pin className={`w-3.5 h-3.5 ${n.pinned ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteNotification(n.id)}
                                  title="Sil"
                                  className="p-1.5 rounded-md text-[#9aa4ab] dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {/* Alt çubuk */}
            <div className="px-3 py-2.5 border-t border-[#e1e9ee] dark:border-white/10">
              <button
                type="button"
                onClick={handleViewAll}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-white bg-[#455f8a] dark:bg-white/10 hover:bg-[#38537d] dark:hover:bg-white/15 transition-colors"
              >
                Tümünü Görüntüle
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
