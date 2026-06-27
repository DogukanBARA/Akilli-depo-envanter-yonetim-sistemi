import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Eye, EyeOff, ArrowRight, Package, ShieldCheck, X, ShieldUser, Boxes } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

import { UserRole, AuthResult } from '../types';
import * as repo from '../lib/repo';

interface LoginProps {
  onLogin: (role: UserRole, name?: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('rememberMe') === 'true');
  const [username, setUsername] = useState(() => localStorage.getItem('savedUsername') || '');
  const [password, setPassword] = useState('');
  const [showModal, setShowModal] = useState<'forgot' | 'admin' | null>(null);
  // Doğrulanan kullanıcı — 2FA onayında kullanılır.
  const [authUser, setAuthUser] = useState<AuthResult | null>(null);

  const is2FAEnabled = localStorage.getItem('twoFactorEnabled') === 'true';

  // Varsayılan hesapları hazırla (idempotent).
  useEffect(() => {
    void repo.seedUsersIfEmpty();
  }, []);

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setIsError(true);
    setTimeout(() => setIsError(false), 2500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 2FA adımı: kodu doğrula ve girişi tamamla.
    if (show2FA) {
      if (twoFactorCode === '123456' && authUser) {
        onLogin(authUser.role, authUser.name);
      } else {
        triggerError('Hatalı kod. Lütfen tekrar deneyin.');
      }
      return;
    }

    // Kimlik doğrulama.
    const res = await repo.authenticate(username, password);
    if (!res) {
      triggerError('Kullanıcı adı veya şifre hatalı');
      return;
    }

    if (rememberMe) {
      localStorage.setItem('rememberMe', 'true');
      localStorage.setItem('savedUsername', username);
    } else {
      localStorage.removeItem('rememberMe');
      localStorage.removeItem('savedUsername');
    }

    setAuthUser(res);

    if (is2FAEnabled) {
      setShow2FA(true);
      return;
    }

    onLogin(res.role, res.name);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f7f9fb] text-[#2a3439] font-sans overflow-hidden">
      {/* Left Panel: Brand & Visual Identity */}
      <aside className="hidden md:flex w-1/2 lg:w-3/5 bg-[#455f8a] relative flex-col justify-between p-12 lg:p-20 overflow-hidden">
        {/* Abstract Architectural Texture */}
        <div className="absolute inset-0 z-0 opacity-20">
          <div className="absolute w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:40px_40px]"></div>
        </div>
        
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-12"
          >
            <div className="w-10 h-10 bg-white flex items-center justify-center rounded-xl">
              <Package className="text-[#455f8a] w-6 h-6" />
            </div>
            <h1 className="text-white text-2xl font-extrabold tracking-tight font-headline">Akıllı Depo</h1>
          </motion.div>

          <div className="max-w-xl">
            <motion.span 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-block px-3 py-1 bg-white/10 text-[#bfd5ff] rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
            >
              Operasyonel Mükemmeliyet
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-white text-5xl lg:text-7xl font-bold leading-[1.1] font-headline mb-8"
            >
              Akıllı Depo ve Envanter <span className="text-[#bfd5ff]">Yönetim Sistemi.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white/80 text-lg leading-relaxed max-w-md"
            >
              Gerçek zamanlı envanter takibi ve akıllı lojistik çözümleriyle verimliliğinizi mimari bir titizlikle yönetin.
            </motion.p>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 flex items-center gap-12"
        >
          <div className="flex flex-col">
            <span className="text-[#bfd5ff] text-3xl font-bold font-headline">4492+</span>
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Aktif Saha</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[#bfd5ff] text-3xl font-bold font-headline">99.9%</span>
            <span className="text-white/60 text-xs font-medium uppercase tracking-wider">Hata Payı</span>
          </div>
        </motion.div>

        {/* Background Image with Tonal Overlay */}
        <div className="absolute inset-0 z-[-1] brightness-50 contrast-125">
          <img 
            alt="Logistics warehouse" 
            className="w-full h-full object-cover" 
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=2000"
            referrerPolicy="no-referrer"
          />
        </div>
      </aside>

      {/* Right Panel: Login Form */}
      <main className="w-full md:w-1/2 lg:w-2/5 flex flex-col justify-center items-center p-6 md:p-12 lg:p-24 bg-white">
        <div className="w-full max-w-md space-y-12">
          {/* Mobile Header Only */}
          <div className="md:hidden flex flex-col items-center mb-8">
            <div className="w-12 h-12 bg-[#455f8a] flex items-center justify-center rounded-2xl mb-4 shadow-lg">
              <Package className="text-white w-8 h-8" />
            </div>
            <h1 className="text-[#2a3439] text-xl font-bold font-headline">Akıllı Depo</h1>
          </div>

          <header className="text-left">
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-[#2a3439] text-3xl font-bold tracking-tight font-headline mb-2"
            >
              {show2FA ? 'Güvenlik Doğrulaması' : 'Hoş Geldiniz'}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-[#566166] font-medium"
            >
              {show2FA 
                ? 'Lütfen 2FA uygulamanızdaki 6 haneli kodu girin.' 
                : 'Sisteme erişmek için kimlik bilgilerinizi girin.'}
            </motion.p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!show2FA ? (
              <>
                {/* Username Input Group */}
                <div className="space-y-2">
                  <label className="text-[#566166] text-xs font-bold uppercase tracking-widest px-1" htmlFor="username">
                    Kullanıcı Adı
                  </label>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <User className="text-[#717c82] w-5 h-5 group-focus-within:text-[#455f8a] transition-colors" />
                    </div>
                    <input
                      className="w-full pl-12 pr-4 py-4 bg-[#f0f4f7] border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/40 focus:bg-white text-[#2a3439] placeholder:text-[#717c82]/60 transition-all outline-none"
                      id="username"
                      name="username"
                      placeholder="kullanici.adi"
                      type="text"
                      value={username}
                      onChange={(e) => { setUsername(e.target.value); setIsError(false); }}
                      required
                    />
                  </div>
                </div>

                {/* Password Input Group */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[#566166] text-xs font-bold uppercase tracking-widest" htmlFor="password">
                      Şifre
                    </label>
                    <button 
                      type="button"
                      onClick={() => setShowModal('forgot')}
                      className="text-[#455f8a] text-[10px] font-bold uppercase tracking-wider hover:underline"
                    >
                      Şifremi Unuttum
                    </button>
                  </div>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <Lock className="text-[#717c82] w-5 h-5 group-focus-within:text-[#455f8a] transition-colors" />
                    </div>
                    <input
                      className={`w-full pl-12 pr-12 py-4 bg-[#f0f4f7] border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/40 focus:bg-white text-[#2a3439] placeholder:text-[#717c82]/60 transition-all outline-none ${isError ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                      id="password"
                      name="password"
                      placeholder="••••••••"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setIsError(false); }}
                      required
                    />
                    <button 
                      className="absolute inset-y-0 right-4 flex items-center" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="text-[#717c82] w-5 h-5 hover:text-[#455f8a] transition-colors" />
                      ) : (
                        <Eye className="text-[#717c82] w-5 h-5 hover:text-[#455f8a] transition-colors" />
                      )}
                    </button>
                  </div>
                  {isError && !show2FA && (
                    <p className="text-red-500 text-xs font-bold mt-2 px-1">{errorMsg}</p>
                  )}
                </div>

                {/* Remember Me Toggle */}
                <div className="flex items-center gap-3 px-1">
                  <input 
                    className="w-5 h-5 rounded border-none bg-[#e1e9ee] text-[#455f8a] focus:ring-[#455f8a]/20 cursor-pointer" 
                    id="remember" 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label className="text-[#566166] text-sm font-medium select-none cursor-pointer" htmlFor="remember">
                    Beni hatırla
                  </label>
                </div>

                {/* Demo Credentials */}
                <div className="rounded-xl bg-[#f0f4f7] border border-[#e1e9ee] p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#566166]">Demo Hesapları</p>
                  <div className="flex items-center gap-2 text-xs text-[#2a3439]">
                    <ShieldUser className="w-4 h-4 text-[#455f8a] shrink-0" />
                    <span><span className="font-bold">Yönetici</span> · <span className="font-mono">admin</span> / <span className="font-mono">admin123</span></span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#2a3439]">
                    <Boxes className="w-4 h-4 text-[#455f8a] shrink-0" />
                    <span><span className="font-bold">Depocu</span> · <span className="font-mono">depocu</span> / <span className="font-mono">depocu123</span></span>
                  </div>
                  <p className="text-[11px] text-[#717c82] pt-1">2FA kodu: <span className="font-mono font-bold">123456</span></p>
                </div>
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[#566166] text-xs font-bold uppercase tracking-widest px-1">
                    Doğrulama Kodu
                  </label>
                  <div className="group relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <ShieldCheck className="text-[#717c82] w-5 h-5 group-focus-within:text-[#455f8a] transition-colors" />
                    </div>
                    <input 
                      className={`w-full pl-12 pr-4 py-4 bg-[#f0f4f7] border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/40 focus:bg-white text-[#2a3439] placeholder:text-[#717c82]/60 transition-all outline-none text-center text-2xl tracking-[0.5em] font-bold ${isError ? 'ring-2 ring-red-500 bg-red-50' : ''}`} 
                      placeholder="000000" 
                      type="text"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                      required
                      autoFocus
                    />
                  </div>
                  {isError && (
                    <p className="text-red-500 text-xs font-bold mt-2 text-center">Hatalı kod. Lütfen tekrar deneyin.</p>
                  )}
                  <p className="text-[#717c82] text-[10px] text-center mt-4 italic">Demo için kod: 123456</p>
                </div>
                
                <button 
                  type="button"
                  onClick={() => setShow2FA(false)}
                  className="w-full text-[#455f8a] text-xs font-bold uppercase tracking-wider hover:underline"
                >
                  Giriş Ekranına Dön
                </button>
              </motion.div>
            )}

            {/* Action Button */}
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-[#455f8a] text-white rounded-xl font-bold text-lg font-headline shadow-lg shadow-[#455f8a]/20 hover:bg-[#38537d] transition-all flex items-center justify-center gap-2" 
              type="submit"
            >
              {show2FA ? 'Doğrula ve Giriş Yap' : 'Giriş Yap'}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </form>

          <footer className="pt-8 border-t border-[#e1e9ee] text-center">
            <p className="text-[#566166] text-sm">
              Hesabınız yok mu? <button type="button" onClick={() => setShowModal('admin')} className="text-[#455f8a] font-bold hover:underline">Sistem Yöneticisine Başvurun</button>
            </p>
          </footer>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowModal(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-[#e1e9ee]"
              >
                <button 
                  onClick={() => setShowModal(null)}
                  className="absolute right-6 top-6 p-2 hover:bg-[#f0f4f7] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[#717c82]" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#f0f4f7] rounded-2xl flex items-center justify-center mb-6">
                    {showModal === 'forgot' ? <Lock className="w-8 h-8 text-[#455f8a]" /> : <User className="w-8 h-8 text-[#455f8a]" />}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-[#2a3439] mb-2 font-headline">
                    {showModal === 'forgot' ? 'Şifre Sıfırlama' : 'Sistem Yöneticisi'}
                  </h3>
                  <p className="text-[#566166] mb-8 font-medium">
                    {showModal === 'forgot' 
                      ? 'Şifrenizi sıfırlamak için lütfen bağlı olduğunuz birim amiri ile iletişime geçin veya IT departmanına talep oluşturun.' 
                      : 'Yeni bir hesap oluşturmak veya yetki yükseltme talebinde bulunmak için sistem yöneticisine e-posta gönderin.'}
                  </p>

                  <button 
                    onClick={() => setShowModal(null)}
                    className="w-full py-4 bg-[#455f8a] text-white rounded-xl font-bold shadow-lg shadow-[#455f8a]/20 hover:bg-[#38537d] transition-all"
                  >
                    Anladım
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Bottom Branding for Mobile */}
        <div className="mt-12 md:hidden">
          <p className="text-[10px] text-[#717c82] uppercase tracking-[0.2em] font-semibold">Akıllı Depo ve Envanter Yönetim Sistemi</p>
        </div>
      </main>

      {/* Overlay Decoration */}
      <div className="fixed top-0 right-0 w-32 h-32 bg-[#455f8a]/5 rounded-bl-[100%] pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 w-64 h-64 bg-[#455f8a]/5 rounded-tr-[100%] pointer-events-none hidden md:block"></div>
    </div>
  );
}
