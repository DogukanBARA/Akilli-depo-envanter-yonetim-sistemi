import React from 'react';
import { motion } from 'motion/react';
import {
  Package,
  ArrowRight,
  Boxes,
  LogOut,
  PenTool,
  ShieldCheck,
  History,
  FileSpreadsheet,
  AlertTriangle,
  Moon,
  LogIn,
  Truck,
  BarChart3,
  Check,
  X,
  Lock,
  Database,
  Sparkles,
} from 'lucide-react';

export interface LandingProps {
  onEnter: () => void;
}

const APP_VERSION = 'v4.0';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
};

const features = [
  {
    icon: <Boxes className="w-6 h-6" />,
    title: 'Anlık Stok Takibi',
    desc: 'Dexie (IndexedDB) tabanlı reaktif envanter; her değişiklik panelinize anında yansır.',
    color: 'bg-[#d3e4fe]',
    textColor: 'text-[#435368]',
  },
  {
    icon: <LogOut className="w-6 h-6" />,
    title: 'Çıkış Sihirbazı',
    desc: 'Proje → kıyafet → cinsiyet → imza adımlarıyla yönlendirmeli malzeme çıkışı.',
    color: 'bg-[#d9d7f8]',
    textColor: 'text-[#4a4a65]',
  },
  {
    icon: <PenTool className="w-6 h-6" />,
    title: 'E-İmza & Foto Kanıt',
    desc: 'Her teslimatta dijital imza ve fotoğraf ile yasal geçerli zimmet kanıtı.',
    color: 'bg-[#d6e3ff]',
    textColor: 'text-[#435368]',
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: 'Rol Tabanlı Erişim',
    desc: 'Yönetici ve Depocu için çift katmanlı yetki kontrolü; herkes yalnız işini görür.',
    color: 'bg-[#d9d7f8]',
    textColor: 'text-[#4a4a65]',
  },
  {
    icon: <History className="w-6 h-6" />,
    title: 'Denetim Günlüğü',
    desc: 'Giriş, çıkış, ürün ve ayar — tüm kritik işlemler zaman damgalı kayıt altında.',
    color: 'bg-[#f0f4f7]',
    textColor: 'text-[#455f8a]',
  },
  {
    icon: <FileSpreadsheet className="w-6 h-6" />,
    title: 'Excel Raporlama',
    desc: 'Tek tıkla istemci tarafında Excel; imza ve fotoğraf bağlantıları hücrelerde.',
    color: 'bg-[#d3e4fe]',
    textColor: 'text-[#435368]',
  },
  {
    icon: <AlertTriangle className="w-6 h-6" />,
    title: 'Kritik Stok Uyarısı',
    desc: 'Belirlenen eşiğin altına düşen ürünler için anlık görsel ve e-posta bildirimi.',
    color: 'bg-[#d9d7f8]',
    textColor: 'text-[#4a4a65]',
  },
  {
    icon: <Moon className="w-6 h-6" />,
    title: 'Karanlık Mod',
    desc: 'Göz yormayan karanlık tema ve mobilden masaüstüne tam duyarlı arayüz.',
    color: 'bg-[#f0f4f7]',
    textColor: 'text-[#455f8a]',
  },
];

const steps = [
  {
    icon: <LogIn className="w-6 h-6" />,
    title: 'Giriş Yap',
    desc: 'Kimlik bilgilerinizle güvenli oturum açın; isteğe bağlı 2FA ile ek koruma.',
  },
  {
    icon: <Boxes className="w-6 h-6" />,
    title: 'Stok Yönet',
    desc: 'Ürün ekleyin, giriş kaydı oluşturun, envanteri anlık takip edin.',
  },
  {
    icon: <Truck className="w-6 h-6" />,
    title: 'Teslimat + İmza',
    desc: 'Çıkış sihirbazıyla teslim edin; e-imza ve fotoğraf ile kanıtı saklayın.',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Raporla',
    desc: 'Tek tıkla Excel raporu üretin, denetim günlüğünü inceleyin.',
  },
];

const adminPerms = [
  'Tüm stok ve sevkiyatları görüntüleme',
  'Ürün ekleme ve düzenleme',
  'Malzeme giriş & çıkış işlemleri',
  'Excel raporlarına erişim',
  'Denetim günlüğünü görüntüleme',
  'Sistem ayarları & veri sıfırlama',
];

const personnelPerms = [
  { label: 'Stok görüntüleme & çıkış işlemi', allowed: true },
  { label: 'Malzeme giriş kaydı', allowed: true },
  { label: 'E-imza ile teslimat onayı', allowed: true },
  { label: 'Excel raporlarına erişim', allowed: false },
  { label: 'Denetim günlüğü', allowed: false },
  { label: 'Sistem ayarları & sıfırlama', allowed: false },
];

const trustItems = [
  {
    icon: <History className="w-7 h-7" />,
    title: 'Tüm işlemler denetim günlüğüne kaydedilir',
    desc: 'Kim, ne zaman, hangi işlemi yaptı — her hareket zaman damgalı olarak izlenebilir.',
  },
  {
    icon: <PenTool className="w-7 h-7" />,
    title: 'E-imza ile teslim kanıtı',
    desc: 'Her teslimat dijital imza ve fotoğrafla belgelenir; itirazsız zimmet kaydı oluşur.',
  },
  {
    icon: <Database className="w-7 h-7" />,
    title: 'Veriler cihazında güvende (IndexedDB)',
    desc: 'İş verileri tarayıcınızdaki yerel veritabanında tutulur; harici sunucuya gönderilmez.',
  },
];

export default function Landing({ onEnter }: LandingProps) {
  const scrollToFeatures = () => {
    document
      .getElementById('ozellikler')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#2a3439] font-sans selection:bg-[#d6e3ff] selection:text-[#244069]">
      {/* ===== Üst Bar ===== */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#e1e9ee]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#455f8a] flex items-center justify-center shadow-lg shadow-[#455f8a]/20">
              <Package className="w-6 h-6 text-white" />
            </div>
            <span className="flex flex-col leading-none">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-[#244069] font-headline">
                Akıllı Depo ve Envanter Yönetim Sistemi
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#717c82] mt-0.5">
                Precision Logistics
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={scrollToFeatures}
              className="hidden sm:inline-flex text-sm font-bold uppercase tracking-wider text-[#566166] hover:text-[#455f8a] transition-colors"
            >
              Özellikler
            </button>
            <button
              onClick={onEnter}
              className="px-5 py-2.5 bg-[#455f8a] text-white rounded-xl font-bold text-sm hover:bg-[#38537d] transition-colors shadow-lg shadow-[#455f8a]/20 flex items-center gap-2"
            >
              Giriş Yap <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="relative overflow-hidden pt-36 pb-24 px-6">
        {/* Dekoratif zemin */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-32 -right-24 w-[28rem] h-[28rem] bg-[#d6e3ff] rounded-full blur-3xl opacity-50" />
          <div className="absolute top-40 -left-24 w-[24rem] h-[24rem] bg-[#d9d7f8] rounded-full blur-3xl opacity-40" />
        </div>

        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex w-16 h-16 rounded-2xl bg-[#455f8a] text-white items-center justify-center mb-8 shadow-xl shadow-[#455f8a]/25"
          >
            <Package className="w-8 h-8" />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-white border border-[#e1e9ee] rounded-full text-xs font-bold uppercase tracking-[0.15em] text-[#455f8a] mb-6 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" /> Operasyonel Mükemmeliyet
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold font-headline text-[#244069] tracking-tight leading-[1.1]"
          >
            Akıllı Depo ve Envanter{' '}
            <span className="text-[#455f8a]">Yönetim Sistemi</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-[#566166] mt-6 max-w-2xl mx-auto text-lg font-medium leading-relaxed"
          >
            Anlık stok takibi, kıyafet zimmet sihirbazı, e-imza ile teslimat kanıtı
            ve Excel raporlama — hepsi tek, hızlı ve güvenli panelde.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnter}
              className="w-full sm:w-auto px-8 py-4 bg-[#455f8a] text-white rounded-xl font-bold text-lg font-headline flex items-center justify-center gap-2 hover:bg-[#38537d] transition-colors shadow-lg shadow-[#455f8a]/25"
            >
              Giriş Yap <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={scrollToFeatures}
              className="w-full sm:w-auto px-8 py-4 bg-white text-[#244069] border border-[#e1e9ee] rounded-xl font-bold text-lg font-headline hover:bg-[#f0f4f7] transition-colors shadow-sm"
            >
              Özellikler
            </motion.button>
          </motion.div>

          {/* İstatistik bandı */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-16 grid grid-cols-3 gap-4 max-w-xl mx-auto"
          >
            {[
              { v: '4492+', l: 'Aktif Saha' },
              { v: '99.9%', l: 'Doğruluk' },
              { v: '%100', l: 'Yerel Veri' },
            ].map((s) => (
              <div
                key={s.l}
                className="bg-white rounded-2xl border border-[#e1e9ee] py-4 shadow-sm"
              >
                <p className="text-2xl sm:text-3xl font-extrabold text-[#455f8a] font-headline">
                  {s.v}
                </p>
                <p className="text-[10px] sm:text-xs text-[#566166] uppercase tracking-wider font-semibold mt-1">
                  {s.l}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== Özellik Kartları ===== */}
      <section id="ozellikler" className="py-20 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-[#455f8a] text-xs font-bold uppercase tracking-[0.2em] mb-3">
              Neler Sunuyor?
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-[#244069] tracking-tight">
              Uçtan Uca Depo Yönetimi
            </h2>
            <p className="text-[#566166] mt-4 max-w-2xl mx-auto font-medium">
              Stok girişinden imzalı teslimata, denetimden raporlamaya kadar tüm
              operasyonu kapsayan derinlikli özellikler.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: (i % 4) * 0.08 }}
                whileHover={{ y: -6 }}
                className="group p-7 bg-white rounded-2xl border border-[#e1e9ee] shadow-sm hover:shadow-xl hover:shadow-[#455f8a]/10 transition-all"
              >
                <div
                  className={`w-14 h-14 rounded-2xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform`}
                >
                  <span className={f.textColor}>{f.icon}</span>
                </div>
                <h3 className="text-lg font-bold font-headline text-[#244069] mb-2">
                  {f.title}
                </h3>
                <p className="text-sm text-[#566166] leading-relaxed font-medium">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Nasıl Çalışır ===== */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-[#455f8a] text-xs font-bold uppercase tracking-[0.2em] mb-3">
              Süreç Akışı
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-[#244069] tracking-tight">
              Nasıl Çalışır?
            </h2>
            <p className="text-[#566166] mt-4 max-w-2xl mx-auto font-medium">
              Dört basit adımda girişten raporlamaya kesintisiz bir akış.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.1 }}
                className="relative p-7 bg-[#f7f9fb] rounded-2xl border border-[#e1e9ee]"
              >
                <span className="absolute -top-4 -left-2 text-6xl font-black text-[#d6e3ff] font-headline select-none">
                  {i + 1}
                </span>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-[#455f8a] text-white flex items-center justify-center mb-5 shadow-lg shadow-[#455f8a]/20">
                    {s.icon}
                  </div>
                  <h3 className="text-lg font-bold font-headline text-[#244069] mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-[#566166] leading-relaxed font-medium">
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Rol Vitrini ===== */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-[#455f8a] text-xs font-bold uppercase tracking-[0.2em] mb-3">
              Rol Tabanlı Erişim
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-[#244069] tracking-tight">
              Herkes Yalnız Yetkili Olduğunu Görür
            </h2>
            <p className="text-[#566166] mt-4 max-w-2xl mx-auto font-medium">
              Yönetici ve Depocu yetkileri net biçimde ayrılır; kritik işlemler
              yalnızca yöneticiye açıktır.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Yönetici */}
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              className="rounded-[2rem] p-8 bg-[#455f8a] text-white shadow-xl shadow-[#455f8a]/20"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-headline">Yönetici</h3>
                  <p className="text-[#d6e3ff] text-xs uppercase tracking-wider font-semibold">
                    Tam Yetki
                  </p>
                </div>
              </div>
              <ul className="space-y-3">
                {adminPerms.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm font-medium">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Depocu */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              className="rounded-[2rem] p-8 bg-white border border-[#e1e9ee] shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#d9d7f8] flex items-center justify-center">
                  <Boxes className="w-6 h-6 text-[#4a4a65]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-headline text-[#244069]">
                    Depocu
                  </h3>
                  <p className="text-[#566166] text-xs uppercase tracking-wider font-semibold">
                    Operasyonel Yetki
                  </p>
                </div>
              </div>
              <ul className="space-y-3">
                {personnelPerms.map((p) => (
                  <li
                    key={p.label}
                    className={`flex items-start gap-3 text-sm font-medium ${
                      p.allowed ? 'text-[#2a3439]' : 'text-[#717c82]'
                    }`}
                  >
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        p.allowed
                          ? 'bg-[#d3e4fe] text-[#455f8a]'
                          : 'bg-[#f0f4f7] text-[#a9b4b9]'
                      }`}
                    >
                      {p.allowed ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <X className="w-3.5 h-3.5" />
                      )}
                    </span>
                    {p.label}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== Güven Bandı ===== */}
      <section className="py-20 px-6 bg-[#244069] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.06)_50%,transparent_75%)] bg-[length:40px_40px]" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div {...fadeUp} className="text-center mb-14">
            <p className="text-[#bfd5ff] text-xs font-bold uppercase tracking-[0.2em] mb-3 flex items-center justify-center gap-2">
              <Lock className="w-3.5 h-3.5" /> Güven &amp; Güvenlik
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-white tracking-tight">
              Her İşlem Kanıtlı, Her Veri Güvende
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trustItems.map((t, i) => (
              <motion.div
                key={t.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-7 bg-white/5 border border-white/10 backdrop-blur-sm"
              >
                <div className="w-14 h-14 rounded-2xl bg-white/10 text-[#bfd5ff] flex items-center justify-center mb-5">
                  {t.icon}
                </div>
                <h3 className="text-lg font-bold font-headline text-white mb-2">
                  {t.title}
                </h3>
                <p className="text-sm text-white/70 leading-relaxed font-medium">
                  {t.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Kapanış CTA ===== */}
      <section className="py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          className="max-w-4xl mx-auto text-center bg-white rounded-[2.5rem] border border-[#e1e9ee] px-8 py-16 shadow-xl shadow-[#455f8a]/5 relative overflow-hidden"
        >
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-[#d6e3ff] rounded-full blur-3xl opacity-50" />
          <div className="relative">
            <div className="inline-flex w-14 h-14 rounded-2xl bg-[#455f8a] text-white items-center justify-center mb-6 shadow-lg shadow-[#455f8a]/25">
              <Package className="w-7 h-7" />
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold font-headline text-[#244069] tracking-tight">
              Depo Operasyonlarınızı Bugün Dijitalleştirin
            </h2>
            <p className="text-[#566166] mt-4 max-w-xl mx-auto font-medium">
              Kurulum yok, sunucu yok. Giriş yapın ve saniyeler içinde stok
              yönetmeye başlayın.
            </p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onEnter}
              className="mt-8 px-10 py-4 bg-[#455f8a] text-white rounded-xl font-bold text-lg font-headline inline-flex items-center gap-2 hover:bg-[#38537d] transition-colors shadow-lg shadow-[#455f8a]/25"
            >
              Hemen Başla <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-[#e1e9ee] bg-white px-6 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#455f8a] flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-extrabold text-[#244069] font-headline leading-none">
                Akıllı Depo ve Envanter Yönetim Sistemi
              </p>
              <p className="text-[11px] text-[#717c82] font-semibold uppercase tracking-wider mt-1">
                Precision Logistics · {APP_VERSION}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {['React 19', 'TypeScript', 'Vite', 'Tailwind v4', 'IndexedDB'].map(
              (tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-[#f0f4f7] text-[#566166] rounded-full text-[11px] font-bold uppercase tracking-wider"
                >
                  {tech}
                </span>
              ),
            )}
          </div>

          <p className="text-[11px] text-[#717c82] font-medium text-center md:text-right">
            © {new Date().getFullYear()} Precision Logistics
            <br />
            Geliştiren: <span className="font-bold text-[#566166]">Doğukan BARA</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
