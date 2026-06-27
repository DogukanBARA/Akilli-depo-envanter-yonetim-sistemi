import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Menu, 
  Package, 
  LogIn, 
  LogOut, 
  PlusSquare, 
  BarChart3, 
  Truck, 
  Box, 
  Settings,
  Bell,
  Search,
  ChevronRight,
  LayoutDashboard,
  History,
  AlertTriangle,
  X,
  ListChecks,
  Zap,
  CalendarClock,
  Users,
} from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { UserRole, ViewType, InventoryItem, Shipment, AuditLog, DeliveryPayload, TaskItem, NotificationItem } from '../types';
import { db } from '../lib/db';
import * as repo from '../lib/repo';
import { loadSession } from '../lib/session';
import { getTaskLeadMin } from '../lib/prefs';
import NotificationBell from './NotificationBell';
import NotificationCenter from './NotificationCenter';
import InventoryTable from './InventoryTable';
import StockExitWizard from './StockExitWizard';
import ShipmentTable from './ShipmentTable';
import ProductForm from './ProductForm';
import ReportView from './ReportView';
import SettingsView from './SettingsView';
import ProfileView from './ProfileView';
import AuditLogView from './AuditLogView';
import StockEntry from './StockEntry';
import QuickExit from './QuickExit';
import StockExitHub from './StockExitHub';
import TaskCenter from './TaskCenter';
import UserManagement from './UserManagement';

interface DashboardProps {
  onLogout: () => void;
  role: UserRole;
  /** Giriş yapan kullanıcının görünen adı (yoksa role göre varsayılan). */
  displayName?: string;
}

export default function Dashboard({ onLogout, role, displayName }: DashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  // Veri katmanı: Dexie (IndexedDB) + canlı sorgu — anlık reaktif. İş verisi için localStorage KULLANILMAZ.
  const inventory = useLiveQuery(() => db.inventory.toArray(), [], [] as InventoryItem[]);
  const shipments = useLiveQuery(
    () => db.shipments.orderBy('ts').reverse().toArray(),
    [],
    [] as Shipment[],
  );

  // İlk açılış: localStorage → Dexie migrasyonu + demo seed (bir kez).
  useEffect(() => {
    repo.init();
  }, []);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('notificationsEnabled');
    return saved !== 'false'; // Default to true
  });

  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => {
    const saved = localStorage.getItem('twoFactorEnabled');
    return saved === 'true';
  });

  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(() => {
    const saved = localStorage.getItem('emailNotificationsEnabled');
    return saved === 'true';
  });

  const [notificationEmail, setNotificationEmail] = useState(() => {
    const saved = localStorage.getItem('notificationEmail');
    return saved || 'baradogukan@gmail.com';
  });

  const [userProfile, setUserProfile] = useState(() => {
    const saved = localStorage.getItem('userProfile');
    const baseProfile = saved ? JSON.parse(saved) : {
      name: role === 'admin' ? 'Doğukan BARA' : 'Hasan Koçak',
      email: role === 'admin' ? 'admin@sirket.com' : 'personel@sirket.com',
      role: role === 'admin' ? 'Sistem Yöneticisi' : 'Depo personeli',
      avatar: role === 'admin' 
        ? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    };
    return {
      ...baseProfile,
      name: displayName || (role === 'admin' ? 'Doğukan BARA' : 'Hasan Koçak'),
      role: role === 'admin' ? 'Sistem Yöneticisi' : 'Depo personeli'
    };
  });

  useEffect(() => {
    setUserProfile(prev => ({
      ...prev,
      name: displayName || (role === 'admin' ? 'Doğukan BARA' : 'Hasan Koçak'),
      role: role === 'admin' ? 'Sistem Yöneticisi' : 'Depo personeli'
    }));
  }, [role, displayName]);

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
  }, [userProfile]);

  const auditLogs = useLiveQuery(
    () => db.auditLogs.orderBy('ts').reverse().toArray(),
    [],
    [] as AuditLog[],
  );

  const addAuditLog = (action: string, details: string, type: 'security' | 'inventory' | 'system') => {
    void repo.addLog(userProfile.name, action, details, type);
  };

  // Log login on initial mount
  useEffect(() => {
    const hasLoggedLogin = sessionStorage.getItem('hasLoggedLogin');
    if (!hasLoggedLogin) {
      addAuditLog('Sisteme Giriş', 'Kullanıcı başarılı bir şekilde giriş yaptı.', 'security');
      sessionStorage.setItem('hasLoggedLogin', 'true');
    }
  }, []);

  // Oturum süresi denetimi: süre dolunca otomatik çıkış (güvenlik).
  useEffect(() => {
    const id = setInterval(() => {
      if (!loadSession()) onLogout();
    }, 60_000);
    return () => clearInterval(id);
  }, [onLogout]);

  // ---- Görev & Hatırlatıcı zamanlayıcı (zil + ötelenen tekrar) ----
  const [taskAlert, setTaskAlert] = useState<{ title: string; note?: string } | null>(null);

  useEffect(() => {
    const playBeep = () => {
      try {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        if (!Ctx) return;
        const ctx = new Ctx();
        const beepAt = (start: number, freq: number) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g); g.connect(ctx.destination);
          o.type = 'sine'; o.frequency.value = freq;
          g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
          g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + start + 0.04);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + 0.45);
          o.start(ctx.currentTime + start);
          o.stop(ctx.currentTime + start + 0.5);
        };
        beepAt(0, 880); beepAt(0.5, 1100);
        setTimeout(() => ctx.close().catch(() => {}), 1300);
      } catch { /* ses çalınamadı, sessiz geç */ }
    };

    const formatDueShort = (iso: string) => {
      const d = new Date(iso);
      return isNaN(d.getTime())
        ? iso
        : d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    };

    const tick = async () => {
      const now = Date.now();
      const leadMs = getTaskLeadMin() * 60_000;
      const all = await db.tasks.toArray();
      for (const t of all) {
        if (t.done) continue;
        const due = new Date(t.dueAt).getTime();
        if (!Number.isFinite(due)) continue;

        // Yaklaşan görev (lead-time): vakit gelmeden zile bildirim düşür
        if (leadMs > 0 && now >= due - leadMs && now < due) {
          void repo.pushNotification({
            title: 'Yaklaşan Görev',
            message: `${t.title} — ${formatDueShort(t.dueAt)}`,
            type: 'task',
            dedupeKey: `task-approach-${t.id}-${t.dueAt}`,
          });
        }

        if (due > now) continue;
        if (t.remindedAt && t.remindedAt >= due) continue; // bu görünüm için zaten hatırlatıldı

        // Vakti gelen görev: zil + toast + kalıcı bildirim
        if (t.sound) playBeep();
        setTaskAlert({ title: t.title, note: t.note });
        void repo.pushNotification({
          title: 'Görev Zamanı',
          message: t.note ? `${t.title} — ${t.note}` : t.title,
          type: 'task',
          dedupeKey: `task-due-${t.id}-${t.dueAt}`,
        });
        void repo.addLog(userProfile.name, 'Görev Hatırlatma', t.title, 'system');
        if (t.repeat === 'none') {
          await repo.updateTask(t.id, { remindedAt: now });
        } else {
          const next = new Date(due);
          if (t.repeat === 'daily') next.setDate(next.getDate() + 1);
          else next.setDate(next.getDate() + 7);
          const pad = (n: number) => String(n).padStart(2, '0');
          const iso = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}T${pad(next.getHours())}:${pad(next.getMinutes())}`;
          await repo.updateTask(t.id, { dueAt: iso, remindedAt: now });
        }
      }
    };
    const id = setInterval(tick, 30_000);
    tick();
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kritik stok → kalıcı bildirim (zil). Miktar değişince yeniden bildirir.
  useEffect(() => {
    if (!notificationsEnabled) return;
    inventory
      .filter((i) => i.quantity <= i.criticalLevel)
      .forEach((i) => {
        void repo.pushNotification({
          title: 'Kritik Stok',
          message: `${i.name} kritik seviyede (${i.quantity} ${i.unit}, eşik ${i.criticalLevel}).`,
          type: 'stock',
          dedupeKey: `stock-${i.id}-${i.quantity}`,
        });
      });
  }, [inventory, notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode.toString());
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const [showCriticalModal, setShowCriticalModal] = useState(false);
  const [criticalItemsForModal, setCriticalItemsForModal] = useState<InventoryItem[]>([]);

  // Görevler & kalıcı bildirimler (Dexie, reaktif)
  const taskList = useLiveQuery(() => db.tasks.orderBy('dueAt').toArray(), [], [] as TaskItem[]);
  const notifications = useLiveQuery(
    () => db.notifications.orderBy('ts').reverse().toArray(),
    [],
    [] as NotificationItem[],
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Aktif (yapılmamış) görevler — en yakın tarihli önce
  const activeTasks = [...taskList].filter((t) => !t.done).sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  // Bugünün görev hedefi (tamamlanma yüzdesi)
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayTasks = taskList.filter((t) => (t.dueAt || '').slice(0, 10) === todayKey);
  const todayDone = todayTasks.filter((t) => t.done).length;
  const goalPct = todayTasks.length ? Math.round((todayDone / todayTasks.length) * 100) : 0;

  // (inventory/shipments/auditLogs artık Dexie'de tutuluyor — localStorage persistliğine gerek yok.)

  useEffect(() => {
    localStorage.setItem('notificationsEnabled', notificationsEnabled.toString());
  }, [notificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('twoFactorEnabled', twoFactorEnabled.toString());
  }, [twoFactorEnabled]);

  useEffect(() => {
    localStorage.setItem('emailNotificationsEnabled', emailNotificationsEnabled.toString());
  }, [emailNotificationsEnabled]);

  useEffect(() => {
    localStorage.setItem('notificationEmail', notificationEmail);
  }, [notificationEmail]);

  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('userProfile');
      if (saved) setUserProfile(JSON.parse(saved));
    };
    window.addEventListener('storage', handleStorageChange);
    // Also update when currentView changes to profile and back
    if (currentView !== 'profile') {
      handleStorageChange();
    }
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentView]);

  useEffect(() => {
    if (notificationsEnabled) {
      const criticalItems = inventory.filter(item => item.quantity <= item.criticalLevel);
      if (criticalItems.length > 0) {
        const lastAlertShown = sessionStorage.getItem('lastCriticalAlertShown');
        const currentAlertKey = criticalItems.map(i => `${i.id}-${i.quantity}`).join('|');
        
        if (lastAlertShown !== currentAlertKey) {
          setCriticalItemsForModal(criticalItems);
          setShowCriticalModal(true);
          sessionStorage.setItem('lastCriticalAlertShown', currentAlertKey);
          
          // Log the visual alert
          addAuditLog('Kritik Stok Görsel Uyarı', `${criticalItems.length} ürün için ekranda uyarı gösterildi.`, 'system');
        }
      }
    }
  }, [inventory, notificationsEnabled]);

  useEffect(() => {
    if (emailNotificationsEnabled && notificationEmail) {
      const criticalItems = inventory.filter(item => item.quantity <= item.criticalLevel);
      if (criticalItems.length > 0) {
        // In a real app, this would call a backend API to send an email.
        // For this demo, we'll log it in the audit log to show it was "triggered".
        const lastEmailSent = sessionStorage.getItem('lastCriticalEmailSent');
        const now = Date.now();
        
        // Throttle emails to once per session or every 10 minutes to avoid spamming the log
        if (!lastEmailSent || (now - parseInt(lastEmailSent)) > 600000) {
          addAuditLog(
            'E-posta Bildirimi Tetiklendi', 
            `${criticalItems.length} ürün kritik seviyede. Bildirim adresi: ${notificationEmail}`, 
            'system'
          );
          sessionStorage.setItem('lastCriticalEmailSent', now.toString());
        }
      }
    }
  }, [inventory, emailNotificationsEnabled, notificationEmail]);

  const handleAddProduct = (newItem: Omit<InventoryItem, 'id' | 'lastUpdated'>) => {
    void repo.addProduct(newItem, userProfile.name);
  };

  const handleMaterialEntry = (itemId: string, quantity: number) => {
    void repo.materialEntry(itemId, quantity, userProfile.name);
  };

  const handleMaterialExit = async (itemId: string, quantity: number, recipient: string) => {
    const res = await repo.materialExit(itemId, quantity, recipient, userProfile.name);
    if (!res.ok && res.error) alert(res.error);
  };

  const menuItems = [
    { id: 'stock', icon: <Box className="w-6 h-6" />, title: 'Stok Takibi', desc: 'Mevcut envanterinizi anlık olarak görüntüleyin ve yönetin.', color: 'bg-[#d3e4fe]', textColor: 'text-[#435368]' },
    { id: 'entry', icon: <LogIn className="w-6 h-6" />, title: 'Malzeme Giriş', desc: 'Yeni gelen sevkiyatları sisteme kaydedin ve raflara yerleştirin.', color: 'bg-[#d9d7f8]', textColor: 'text-[#4a4a65]' },
    { id: 'exit', icon: <LogOut className="w-6 h-6" />, title: 'Malzeme Çıkış', desc: 'Sevkiyat emirlerini onaylayın ve stok çıkışlarını gerçekleştirin.', color: 'bg-[#d3e4fe]', textColor: 'text-[#435368]' },
    { id: 'add', icon: <PlusSquare className="w-6 h-6" />, title: 'Ürün Ekleme', desc: 'Kataloğunuza yeni ürün kalemleri ve SKU\'lar tanımlayın.', color: 'bg-[#d9d7f8]', textColor: 'text-[#4a4a65]' },
    { id: 'quickexit', icon: <Zap className="w-6 h-6" />, title: 'Hızlı Çıkış', desc: 'Çoklu ürünü tek alıcıya hızlıca, isteğe bağlı kanıtla çıkarın.', color: 'bg-[#d3e4fe]', textColor: 'text-[#435368]' },
    { id: 'tasks', icon: <ListChecks className="w-6 h-6" />, title: 'Görevler', desc: 'Günlük görev ve hatırlatıcılar; zamanı gelince zil ile uyarı.', color: 'bg-[#d9d7f8]', textColor: 'text-[#4a4a65]' },
    ...(role === 'admin' ? [
      { id: 'users', icon: <Users className="w-6 h-6" />, title: 'Kullanıcılar', desc: 'Kullanıcı ekleyin/çıkarın ve yetkilendirmeyi yönetin (yalnız yönetici).', color: 'bg-[#d6e3ff]', textColor: 'text-[#244069]' },
      { id: 'audit', icon: <History className="w-6 h-6" />, title: 'Denetim Günlüğü', desc: 'Sistemdeki tüm kritik işlemleri ve girişleri takip edin.', color: 'bg-[#f0f4f7]', textColor: 'text-[#455f8a]' },
    ] : []),
  ];

  const handleResetData = () => {
    if (role !== 'admin') return;
    void repo.resetData(userProfile.name);
  };

  const dynamicTasks = shipments.slice(0, 3).map(s => ({
    id: s.id.replace('TRK-', '#'),
    title: s.type === 'Giriş' ? 'Malzeme Girişi' : 'Malzeme Çıkışı',
    location: s.item,
    color: s.type === 'Giriş' ? 'bg-[#455f8a]' : 'bg-[#506076]',
    status: s.status
  }));

  const renderContent = () => {
    switch (currentView) {
      case 'stock':
        return (
          <InventoryTable
            inventory={inventory}
            onBack={() => setCurrentView('dashboard')}
            onExit={handleMaterialExit}
            onEntry={handleMaterialEntry}
            role={userProfile.role}
            userName={userProfile.name}
          />
        );
      case 'entry':
        return (
          <StockEntry
            inventory={inventory}
            userName={userProfile.name}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'exit':
        return (
          <StockExitHub
            inventory={inventory}
            userName={userProfile.name}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'quickexit':
        return (
          <QuickExit
            inventory={inventory}
            userName={userProfile.name}
            onBack={() => setCurrentView('dashboard')}
          />
        );
      case 'tasks':
        return <TaskCenter userName={userProfile.name} onBack={() => setCurrentView('dashboard')} />;
      case 'notifications':
        return <NotificationCenter onBack={() => setCurrentView('dashboard')} />;
      case 'users':
        if (role !== 'admin') {
          setCurrentView('dashboard');
          return null;
        }
        return <UserManagement actor={userProfile.name} onBack={() => setCurrentView('dashboard')} />;
      case 'add':
        return (
          <ProductForm
            onBack={() => setCurrentView('dashboard')}
            onAdd={handleAddProduct}
            inventory={inventory}
            userName={userProfile.name}
          />
        );
      case 'reports':
        if (role !== 'admin') {
          setCurrentView('dashboard');
          return null;
        }
        return <ReportView inventory={inventory} shipments={shipments} onBack={() => setCurrentView('dashboard')} onLog={addAuditLog} />;
      case 'profile':
        return (
          <ProfileView 
            profile={userProfile} 
            onUpdateProfile={setUserProfile} 
            onBack={() => setCurrentView('dashboard')} 
            onSave={(action, details) => addAuditLog(action, details, 'system')} 
            onLogout={onLogout}
          />
        );
      case 'audit':
        if (role !== 'admin') {
          setCurrentView('dashboard');
          return null;
        }
        return <AuditLogView logs={auditLogs} onBack={() => setCurrentView('dashboard')} />;
      case 'settings':
        return (
          <SettingsView 
            onBack={() => setCurrentView('dashboard')} 
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode(!darkMode)}
            notificationsEnabled={notificationsEnabled}
            onToggleNotifications={() => setNotificationsEnabled(!notificationsEnabled)}
            onResetData={handleResetData}
            twoFactorEnabled={twoFactorEnabled}
            onToggleTwoFactor={() => setTwoFactorEnabled(!twoFactorEnabled)}
            onLog={addAuditLog}
            emailNotificationsEnabled={emailNotificationsEnabled}
            onToggleEmailNotifications={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
            notificationEmail={notificationEmail}
            onUpdateNotificationEmail={setNotificationEmail}
            role={userProfile.role}
            profile={userProfile}
          />
        );
      default:
        return (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Hero Greeting */}
            <section className="mb-10">
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[#455f8a] text-xs font-bold uppercase tracking-[0.2em] mb-2"
              >
                Sistem Özeti
              </motion.p>
              <motion.h1 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-extrabold text-[#2a3439] tracking-tight font-headline"
              >
                Hoşgeldiniz
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[#566166] mt-2 max-w-2xl font-medium"
              >
                Lojistik operasyonlarınızı yönetmek ve stok durumunu anlık olarak takip etmek için aşağıdaki panelleri kullanabilirsiniz.
              </motion.p>
            </section>

            {/* Bento Grid for Functional Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {menuItems.map((item, index) => (
                <motion.button 
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                  onClick={() => setCurrentView(item.id as ViewType)}
                  className="group flex flex-col items-start p-8 bg-white dark:bg-[#1e293b] rounded-2xl transition-all duration-300 hover:bg-[#455f8a] dark:hover:bg-[#244069] hover:text-white text-left shadow-sm hover:shadow-xl hover:shadow-[#455f8a]/20 dark:hover:shadow-none border border-transparent dark:border-white/10"
                >
                  <div className={`w-14 h-14 rounded-2xl ${item.color} dark:bg-white/10 flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors`}>
                    <div className={`${item.textColor} dark:text-white group-hover:text-white transition-colors`}>
                      {item.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 font-headline dark:text-white group-hover:text-white">{item.title}</h3>
                  <p className="text-sm opacity-70 group-hover:opacity-90 leading-relaxed dark:text-gray-400 group-hover:text-white">{item.desc}</p>
                </motion.button>
              ))}
            </div>

            {/* Secondary Visual Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-2 bg-[#f0f4f7] dark:bg-[#1e293b] rounded-[2rem] p-10 overflow-hidden relative min-h-[400px] flex flex-col justify-end group border border-transparent dark:border-white/10"
              >
                <div className="absolute inset-0 z-0">
                  <img 
                    alt="Warehouse" 
                    className="w-full h-full object-cover opacity-40 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" 
                    src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=2000"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#f0f4f7] dark:from-[#1e293b] via-transparent to-transparent"></div>
                </div>
                <div className="relative z-10">
                  <h2 className="text-3xl font-bold text-[#244069] dark:text-white mb-4 tracking-tight font-headline">Depo Verimlilik Raporu</h2>
                  <p className="text-[#566166] dark:text-gray-400 max-w-md mb-6 font-medium">Son 24 saat içerisinde operasyonel verimlilik %12 artış gösterdi. Tüm sistemler optimize edildi.</p>
                  {role === 'admin' && (
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentView('reports')}
                      className="px-6 py-3 bg-[#455f8a] dark:bg-[#1e293b] text-white rounded-xl font-bold text-sm hover:bg-[#38537d] dark:hover:bg-white/5 transition-colors shadow-lg shadow-[#455f8a]/20 dark:shadow-none border border-transparent dark:border-white/10"
                    >
                      Raporu Görüntüle
                    </motion.button>
                  )}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-[#d9e4ea] dark:bg-[#1e293b]/50 rounded-[2rem] p-8 flex flex-col gap-6 border border-transparent dark:border-white/10"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-[#244069] dark:text-white font-headline">Aktif Görevler</h3>
                  <button onClick={() => setCurrentView('tasks')} className="text-[#455f8a] dark:text-[#d6e3ff] hover:underline text-xs font-bold uppercase tracking-wider">Tümünü Gör</button>
                </div>
                <div className="space-y-4">
                  {activeTasks.slice(0, 4).map((task, index) => {
                    const due = new Date(task.dueAt);
                    const overdue = !isNaN(due.getTime()) && due.getTime() < Date.now();
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        onClick={() => setCurrentView('tasks')}
                        className="bg-white dark:bg-[#1e293b] p-4 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-transparent dark:border-white/10"
                      >
                        <div className={`w-1.5 h-10 ${overdue ? 'bg-red-500' : 'bg-[#455f8a]'} rounded-full`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-[#2a3439] dark:text-white truncate">{task.title}</p>
                          <p className={`text-xs font-medium ${overdue ? 'text-red-500' : 'text-[#566166] dark:text-gray-400'}`}>
                            {isNaN(due.getTime())
                              ? task.dueAt
                              : due.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            {overdue ? ' · Gecikmiş' : ''}
                            {task.repeat !== 'none' ? ' · Tekrarlı' : ''}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#717c82] dark:text-gray-500" />
                      </motion.div>
                    );
                  })}
                  {activeTasks.length === 0 && (
                    <p className="text-center text-sm text-[#566166] dark:text-gray-500 py-4">Aktif görev yok. "Görevler"den ekleyebilirsiniz.</p>
                  )}
                </div>

                <div className="mt-auto pt-6 border-t border-[#a9b4b9]/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#566166] uppercase tracking-wider">Günlük Hedef</span>
                    <span className="text-xs font-bold text-[#455f8a]">{goalPct}% ({todayDone}/{todayTasks.length})</span>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${goalPct}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                      className="h-full bg-[#455f8a]"
                    ></motion.div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#0f172a]' : 'bg-[#f7f9fb]'}`}>
      {/* Top Bar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl border-b border-[#e1e9ee] dark:border-white/10 flex justify-between items-center px-6 py-4">
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-[#f0f4f7] dark:hover:bg-white/10 rounded-full transition-colors">
            <Menu className="w-6 h-6 text-[#455f8a] dark:text-[#d6e3ff]" />
          </button>
          <span className="text-xl font-bold text-[#244069] dark:text-white font-headline">Akıllı Depo ve Envanter</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-6 mr-6">
            <nav className="flex gap-6">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`font-bold text-sm uppercase tracking-wider transition-colors ${currentView === 'dashboard' ? 'text-[#455f8a] dark:text-[#d6e3ff]' : 'text-[#566166] dark:text-gray-400 hover:text-[#455f8a] dark:hover:text-white'}`}
              >
                Panel
              </button>
              <button 
                onClick={() => setCurrentView('stock')}
                className={`font-bold text-sm uppercase tracking-wider transition-colors ${currentView === 'stock' ? 'text-[#455f8a] dark:text-[#d6e3ff]' : 'text-[#566166] dark:text-gray-400 hover:text-[#455f8a] dark:hover:text-white'}`}
              >
                Stok Listesi
              </button>
              {role === 'admin' && (
                <button 
                  onClick={() => setCurrentView('reports')}
                  className={`font-bold text-sm uppercase tracking-wider transition-colors ${currentView === 'reports' ? 'text-[#455f8a] dark:text-[#d6e3ff]' : 'text-[#566166] dark:text-gray-400 hover:text-[#455f8a] dark:hover:text-white'}`}
                >
                  Raporlar
                </button>
              )}
            </nav>
            <div className="h-6 w-px bg-[#e1e9ee] dark:bg-white/10"></div>
            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onViewAll={() => setCurrentView('notifications')}
            />
          </div>
          
          <div className="flex items-center gap-3 pl-4 border-l border-[#e1e9ee] dark:border-white/10">
            <button 
              onClick={() => setCurrentView('settings')}
              className={`p-2 transition-colors rounded-full ${currentView === 'settings' ? 'text-[#455f8a] bg-[#f0f4f7] dark:bg-white/10' : 'text-[#566166] dark:text-gray-400 hover:text-[#455f8a]'}`}
              title="Ayarlar"
            >
              <Settings className="w-5 h-5" />
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-[#2a3439] dark:text-white">{userProfile.name}</p>
              <p className="text-[10px] text-[#566166] dark:text-gray-400 uppercase font-semibold tracking-wider">{userProfile.role}</p>
            </div>
            <button onClick={() => setCurrentView('profile')} className="group relative">
              <img 
                alt="Manager Profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-[#d6e3ff] dark:border-white/10 group-hover:border-[#455f8a] transition-colors" 
                src={userProfile.avatar}
                referrerPolicy="no-referrer"
              />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 px-6 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {renderContent()}
        </AnimatePresence>
      </main>

      {/* Critical Stock Modal */}
      <AnimatePresence>
        {showCriticalModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCriticalModal(false)}
              className="absolute inset-0 bg-red-950/40 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-[#1e293b] w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl border-4 border-red-500/20"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-100 dark:bg-red-500/20 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                  <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
                </div>
                
                <h3 className="text-3xl font-bold text-[#2a3439] dark:text-white mb-2 font-headline">
                  KRİTİK STOK UYARISI!
                </h3>
                <p className="text-[#566166] dark:text-gray-300 mb-8 font-medium">
                  Aşağıdaki ürünler belirlenen kritik seviyenin altına düşmüştür. Lütfen acil tedarik planlaması yapın.
                </p>

                <div className="w-full max-h-48 overflow-y-auto mb-8 space-y-3 pr-2 custom-scrollbar">
                  {criticalItemsForModal.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-100 dark:border-red-500/10">
                      <div className="text-left">
                        <p className="font-bold text-[#2a3439] dark:text-white text-sm">{item.name}</p>
                        <p className="text-[10px] text-red-600 dark:text-red-400 font-bold uppercase tracking-widest">Kritik: {item.criticalLevel} {item.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-black text-red-600 dark:text-red-400">{item.quantity}</p>
                        <p className="text-[10px] text-[#717c82] font-bold uppercase">Mevcut</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <button 
                    onClick={() => setShowCriticalModal(false)}
                    className="py-4 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-300 rounded-2xl font-bold hover:bg-[#e1e9ee] dark:hover:bg-white/10 transition-all"
                  >
                    Kapat
                  </button>
                  <button 
                    onClick={() => {
                      setShowCriticalModal(false);
                      setCurrentView('stock');
                    }}
                    className="py-4 bg-red-600 text-white rounded-2xl font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
                  >
                    Stokları Yönet
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Görev Hatırlatma Toast */}
      <AnimatePresence>
        {taskAlert && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 40, x: '-50%' }}
            className="fixed bottom-28 md:bottom-8 left-1/2 z-[300] w-[92%] max-w-md bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border-l-4 border-[#455f8a] p-4 flex items-start gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-[#d6e3ff] dark:bg-[#455f8a]/30 text-[#455f8a] dark:text-[#d6e3ff] flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#455f8a] dark:text-[#d6e3ff]">Görev Hatırlatma</p>
              <p className="text-sm font-bold text-[#2a3439] dark:text-white truncate">{taskAlert.title}</p>
              {taskAlert.note && <p className="text-xs text-[#566166] dark:text-gray-400">{taskAlert.note}</p>}
            </div>
            <button onClick={() => setTaskAlert(null)} className="p-1.5 text-[#717c82] hover:bg-[#f0f4f7] dark:hover:bg-white/5 rounded-lg shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 pb-8 pt-4 bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-2xl z-50 rounded-t-[2.5rem] shadow-[0_-8px_32px_rgba(42,52,57,0.08)] border-t border-[#e1e9ee] dark:border-white/10">
        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 transition-all ${currentView === 'dashboard' ? 'bg-[#d6e3ff] dark:bg-blue-500/20 text-[#455f8a] dark:text-blue-300' : 'text-[#717c82] dark:text-gray-400'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Panel</span>
        </button>
        <button 
          onClick={() => setCurrentView('stock')}
          className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 transition-all ${currentView === 'stock' ? 'bg-[#d6e3ff] dark:bg-blue-500/20 text-[#455f8a] dark:text-blue-300' : 'text-[#717c82] dark:text-gray-400'}`}
        >
          <Package className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Stok</span>
        </button>
        {role === 'admin' && (
          <button 
            onClick={() => setCurrentView('reports')}
            className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 transition-all ${currentView === 'reports' ? 'bg-[#d6e3ff] dark:bg-blue-500/20 text-[#455f8a] dark:text-blue-300' : 'text-[#717c82] dark:text-gray-400'}`}
          >
            <BarChart3 className="w-6 h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Rapor</span>
          </button>
        )}
        <button
          onClick={() => setCurrentView('notifications')}
          className={`relative flex flex-col items-center justify-center rounded-2xl px-5 py-2 transition-all ${currentView === 'notifications' ? 'bg-[#d6e3ff] dark:bg-blue-500/20 text-[#455f8a] dark:text-blue-300' : 'text-[#717c82] dark:text-gray-400'}`}
        >
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-3 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Bildirim</span>
        </button>
        <button 
          onClick={() => setCurrentView('settings')}
          className={`flex flex-col items-center justify-center rounded-2xl px-5 py-2 transition-all ${currentView === 'settings' ? 'bg-[#d6e3ff] dark:bg-blue-500/20 text-[#455f8a] dark:text-blue-300' : 'text-[#717c82] dark:text-gray-400'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest mt-1">Ayar</span>
        </button>
      </nav>
    </div>
  );
}


