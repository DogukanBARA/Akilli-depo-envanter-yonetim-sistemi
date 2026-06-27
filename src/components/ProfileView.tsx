import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Camera, User, Mail, Shield, Save, Loader2, CheckCircle2, LogOut, AlertCircle, X } from 'lucide-react';

interface ProfileViewProps {
  profile: any;
  onUpdateProfile: (profile: any) => void;
  onBack: () => void;
  onSave: (action: string, details: string) => void;
  onLogout: () => void;
}

export default function ProfileView({ profile, onUpdateProfile, onBack, onSave, onLogout }: ProfileViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localProfile, setLocalProfile] = useState(profile);

  React.useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalProfile({ ...localProfile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      localStorage.setItem('userProfile', JSON.stringify(localProfile));
      onUpdateProfile(localProfile);
      onSave('Profil Güncelleme', 'Kullanıcı profil bilgilerini güncelledi.');
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }, 1000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8 pb-12"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors text-[#455f8a] dark:text-[#d6e3ff]"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline">Profil Ayarları</h2>
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#455f8a] to-[#244069] relative">
          <div className="absolute -bottom-12 left-8">
            <div className="relative group">
              <img 
                src={localProfile.avatar} 
                alt="Profile" 
                className="w-24 h-24 rounded-3xl object-cover border-4 border-white dark:border-[#1e293b] shadow-xl"
                referrerPolicy="no-referrer"
              />
              <button 
                onClick={handleAvatarClick}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="w-6 h-6 text-white" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>
        </div>

        <div className="pt-16 p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline">{localProfile.name}</h3>
              <p className="text-[#566166] dark:text-gray-400 font-medium">{localProfile.role}</p>
            </div>
            {isSuccess && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 rounded-xl text-sm font-bold"
              >
                <CheckCircle2 className="w-4 h-4" />
                Kaydedildi
              </motion.div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">Ad Soyad</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500" />
                  <input 
                    type="text" 
                    value={localProfile.name}
                    onChange={e => setLocalProfile({...localProfile, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">E-posta</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500" />
                  <input 
                    type="email" 
                    value={localProfile.email}
                    onChange={e => setLocalProfile({...localProfile, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">Pozisyon</label>
                <div className="relative">
                  <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500" />
                  <input 
                    type="text" 
                    value={localProfile.role}
                    onChange={e => setLocalProfile({...localProfile, role: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-[#e1e9ee] dark:border-white/10 flex justify-between items-center">
              <button 
                type="button"
                onClick={() => setShowLogoutConfirm(true)}
                className="px-6 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/20 transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Çıkış Yap
              </button>
              
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-[#455f8a] dark:bg-[#1e293b] text-white rounded-xl font-bold text-sm hover:bg-[#38537d] dark:hover:bg-white/5 transition-all shadow-lg shadow-[#455f8a]/20 dark:shadow-none border border-transparent dark:border-white/10 flex items-center gap-2 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-[#1e293b] w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-[#e1e9ee] dark:border-white/10"
            >
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="absolute right-6 top-6 p-2 hover:bg-[#f0f4f7] dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#717c82] dark:text-gray-400" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
                
                <h3 className="text-2xl font-bold text-[#2a3439] dark:text-white mb-2 font-headline">
                  Çıkış Yapılıyor
                </h3>
                <p className="text-[#566166] dark:text-gray-400 mb-8 font-medium">
                  Oturumunuzu sonlandırmak istediğinize emin misiniz? Kaydedilmemiş değişiklikleriniz varsa kaybolabilir.
                </p>

                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-4 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-400 rounded-xl font-bold transition-all"
                  >
                    Vazgeç
                  </button>
                  <button 
                    onClick={onLogout}
                    className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all"
                  >
                    Çıkış Yap
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
