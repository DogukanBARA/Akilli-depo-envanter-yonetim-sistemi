import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Moon, Sun, Trash2, Shield, Bell, BellRing, User, AlertTriangle, X, Mail, Clock } from 'lucide-react';
import { getDurationMin, setDurationMin, DURATION_OPTIONS } from '../lib/session';
import { getTaskLeadMin, setTaskLeadMin, LEAD_OPTIONS } from '../lib/prefs';

interface SettingsViewProps {
  onBack: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  onResetData: () => void;
  twoFactorEnabled: boolean;
  onToggleTwoFactor: () => void;
  onLog: (action: string, details: string, type: 'security' | 'inventory' | 'system') => void;
  emailNotificationsEnabled: boolean;
  onToggleEmailNotifications: () => void;
  notificationEmail: string;
  onUpdateNotificationEmail: (email: string) => void;
  role: string;
  profile: any;
}

export default function SettingsView({ 
  onBack, 
  darkMode, 
  onToggleDarkMode, 
  notificationsEnabled,
  onToggleNotifications,
  onResetData,
  twoFactorEnabled,
  onToggleTwoFactor,
  onLog,
  emailNotificationsEnabled,
  onToggleEmailNotifications,
  notificationEmail,
  onUpdateNotificationEmail,
  role,
  profile
}: SettingsViewProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [sessionMin, setSessionMin] = useState<number>(() => getDurationMin());
  const [taskLeadMin, setTaskLeadMinState] = useState<number>(() => getTaskLeadMin());

  const handleSelectDuration = (min: number) => {
    setDurationMin(min);
    setSessionMin(min);
    onLog('Güvenlik Ayarı', `Oturum süresi ${min} dakika olarak ayarlandı.`, 'security');
  };

  const handleSelectTaskLead = (min: number) => {
    setTaskLeadMin(min);
    setTaskLeadMinState(min);
    onLog(
      'Bildirim Ayarı',
      min === 0
        ? 'Görev yaklaşma bildirimi kapatıldı.'
        : `Görev yaklaşma bildirimi ${min} dakika olarak ayarlandı.`,
      'system'
    );
  };

  // role hem kod ('admin'/'personnel') hem TR etiket ('Sistem Yöneticisi'/'Depo personeli')
  // olarak gelebilir; her iki biçimi de güvenli şekilde yöneticiye eşle.
  const isAdmin = role === 'admin' || role === 'Sistem Yöneticisi' || role === 'Yönetici';

  // Profil rol etiketini tutarlı TR etikete normalize et.
  const roleLabel = isAdmin ? 'Yönetici' : 'Depocu';

  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  const confirmReset = () => {
    onResetData();
    setShowResetConfirm(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors text-[#455f8a] dark:text-[#d6e3ff]"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline">Ayarlar</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Appearance Settings */}
        <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] p-8 shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg">
              <Sun className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-[#2a3439] dark:text-white">Görünüm</h3>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-[#f7f9fb] dark:bg-white/5 rounded-2xl">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-[#455f8a]" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <div>
                <p className="text-sm font-bold text-[#2a3439] dark:text-white">Karanlık Mod</p>
                <p className="text-xs text-[#717c82] dark:text-gray-300">Göz yorgunluğunu azaltmak için koyu tema.</p>
              </div>
            </div>
            <button 
              onClick={() => {
                onToggleDarkMode();
                onLog('Görünüm Değişikliği', `Karanlık mod ${!darkMode ? 'aktif' : 'pasif'} edildi.`, 'system');
              }}
              className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${darkMode ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <motion.div 
                animate={{ x: darkMode ? 26 : 2 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </button>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] p-8 shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg">
              <User className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-[#2a3439] dark:text-white">Hesap Profili</h3>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-[#f7f9fb] dark:bg-white/5 rounded-2xl">
            <img 
              src={profile.avatar} 
              alt="Profile" 
              className="w-12 h-12 rounded-full border-2 border-white dark:border-white/10"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-sm font-bold text-[#2a3439] dark:text-white">{profile.name}</p>
              <p className="text-xs text-[#717c82] dark:text-gray-300">{roleLabel}</p>
            </div>
          </div>
        </div>

        {/* Security & Notifications */}
        <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] p-8 shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 dark:bg-green-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-[#2a3439] dark:text-white">Güvenlik & Bildirimler</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#f7f9fb] dark:bg-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-[#455f8a]" />
                <div>
                  <p className="text-sm font-bold text-[#2a3439] dark:text-white">Stok Bildirimleri</p>
                  <p className="text-xs text-[#717c82] dark:text-gray-300">Kritik stok seviyelerinde uyarı al.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  onToggleNotifications();
                  onLog('Bildirim Ayarı', `Stok bildirimleri ${!notificationsEnabled ? 'aktif' : 'pasif'} edildi.`, 'system');
                }}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${notificationsEnabled ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <motion.div 
                  animate={{ x: notificationsEnabled ? 26 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#f7f9fb] dark:bg-white/5 rounded-2xl">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-[#455f8a]" />
                <div>
                  <p className="text-sm font-bold text-[#2a3439] dark:text-white">İki Faktörlü Doğrulama (2FA)</p>
                  <p className="text-xs text-[#717c82] dark:text-gray-300">Giriş yaparken ekstra güvenlik kodu iste.</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  onToggleTwoFactor();
                  onLog('Güvenlik Ayarı', `2FA ${!twoFactorEnabled ? 'aktif' : 'pasif'} edildi.`, 'security');
                }}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <motion.div 
                  animate={{ x: twoFactorEnabled ? 26 : 2 }}
                  className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            <div className="p-4 bg-[#f7f9fb] dark:bg-white/5 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-[#455f8a]" />
                <div>
                  <p className="text-sm font-bold text-[#2a3439] dark:text-white">Oturum Süresi</p>
                  <p className="text-xs text-[#717c82] dark:text-gray-300">Otomatik çıkış yapılmadan önceki etkin süre.</p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {DURATION_OPTIONS.map((min) => {
                  const active = sessionMin === min;
                  return (
                    <button
                      key={min}
                      onClick={() => handleSelectDuration(min)}
                      className={`relative py-2.5 rounded-xl text-sm font-bold transition-colors duration-300 ${
                        active
                          ? 'text-white'
                          : 'bg-white dark:bg-[#1e293b] text-[#566166] dark:text-gray-300 border border-[#e1e9ee] dark:border-white/10 hover:bg-[#f0f4f7] dark:hover:bg-white/10'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="session-duration-active"
                          className="absolute inset-0 bg-blue-600 rounded-xl"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{min} dk</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#717c82] dark:text-gray-300 mt-4 leading-relaxed">
                Oturum süresi, paylaşılan cihazlarda yetkisiz erişimi önlemek için güvenlik amacıyla sınırlanır. Belirlenen süre dolduğunda yeniden giriş yapmanız gerekir. Süre dolmadan sayfa yenilense bile oturumunuz korunur.
              </p>
            </div>

            <div className="p-4 bg-[#f7f9fb] dark:bg-white/5 rounded-2xl">
              <div className="flex items-center gap-3 mb-4">
                <BellRing className="w-5 h-5 text-[#455f8a]" />
                <div>
                  <p className="text-sm font-bold text-[#2a3439] dark:text-white">Görev Yaklaşma Bildirimi</p>
                  <p className="text-xs text-[#717c82] dark:text-gray-300">Görev vaktinden ne kadar önce zile düşsün.</p>
                </div>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {LEAD_OPTIONS.map((min) => {
                  const active = taskLeadMin === min;
                  return (
                    <button
                      key={min}
                      onClick={() => handleSelectTaskLead(min)}
                      className={`relative py-2.5 rounded-xl text-sm font-bold transition-colors duration-300 ${
                        active
                          ? 'text-white'
                          : 'bg-white dark:bg-[#1e293b] text-[#566166] dark:text-gray-300 border border-[#e1e9ee] dark:border-white/10 hover:bg-[#f0f4f7] dark:hover:bg-white/10'
                      }`}
                    >
                      {active && (
                        <motion.div
                          layoutId="task-lead-active"
                          className="absolute inset-0 bg-blue-600 rounded-xl"
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10">{min === 0 ? 'Kapalı' : `${min} dk`}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#717c82] dark:text-gray-300 mt-4 leading-relaxed">
                Görev vaktine kaç dakika kala zil bölümüne "yaklaşan görev" bildirimi düşsün. Kapalı seçilirse yalnız tam zamanında bildirilir.
              </p>
            </div>

            <div className="pt-4 border-t border-[#e1e9ee] dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-[#455f8a]" />
                  <div>
                    <p className="text-sm font-bold text-[#2a3439] dark:text-white">E-posta Bildirimleri</p>
                    <p className="text-xs text-[#717c82] dark:text-gray-300">Kritik stok uyarılarını e-posta ile al.</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    onToggleEmailNotifications();
                    onLog('E-posta Bildirim Ayarı', `E-posta bildirimleri ${!emailNotificationsEnabled ? 'aktif' : 'pasif'} edildi.`, 'system');
                  }}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${emailNotificationsEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                >
                  <motion.div 
                    animate={{ x: emailNotificationsEnabled ? 26 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                  />
                </button>
              </div>

              <AnimatePresence>
                {emailNotificationsEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 bg-[#f7f9fb] dark:bg-white/5 rounded-2xl space-y-2">
                      <label className="text-[10px] font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">Bildirim Gönderilecek Adres</label>
                      <input 
                        type="email" 
                        value={notificationEmail}
                        onChange={(e) => onUpdateNotificationEmail(e.target.value)}
                        placeholder="ornek@sirket.com"
                        className="w-full px-4 py-2 bg-white dark:bg-[#1e293b] border border-[#e1e9ee] dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-sm text-[#2a3439] dark:text-white"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Danger Zone — yalnızca yönetici görür */}
        {isAdmin && (
          <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] p-8 shadow-sm border border-red-100 dark:border-red-900/20">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-50 dark:bg-red-500/10 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-[#2a3439] dark:text-white">Tehlikeli Bölge</h3>
            </div>
            
            <p className="text-xs text-[#717c82] dark:text-gray-300 mb-4">Bu işlemler geri alınamaz. Lütfen dikkatli olun.</p>
            
            <button 
              onClick={handleResetClick}
              className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Tüm Verileri Sıfırla
            </button>
          </div>
        )}
      </div>

      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-[#1e293b] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-[#e1e9ee] dark:border-white/10"
            >
              <button 
                onClick={() => setShowResetConfirm(false)}
                className="absolute right-6 top-6 p-2 hover:bg-[#f0f4f7] dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#717c82]" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-[#2a3439] dark:text-white mb-2 font-headline">Emin misiniz?</h3>
                <p className="text-[#566166] dark:text-gray-400 mb-8 font-medium">
                  Tüm envanter ve sevkiyat kayıtları kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                </p>

                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-4 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-300 rounded-xl font-bold hover:bg-[#e1e9ee] dark:hover:bg-white/10 transition-all"
                  >
                    İptal Et
                  </button>
                  <button 
                    onClick={confirmReset}
                    className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
                  >
                    Evet, Sil
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
