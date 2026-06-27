import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  User,
  Users,
  Sparkles,
  Coffee,
  Sun,
  Snowflake,
  Package,
  AlertTriangle,
  Camera,
  PenLine,
  CheckCircle2,
  Loader2,
  PartyPopper,
  ShieldCheck,
  Info,
} from 'lucide-react';
import {
  InventoryItem,
  DeliveryPayload,
  DeliveryResult,
  Gender,
  ProjectType,
  Season,
  PROJECT_LABELS,
} from '../types';
import { getKit } from '../data/kits';
import SignaturePad from './SignaturePad';
import PhotoCapture from './PhotoCapture';

export interface StockExitWizardProps {
  inventory: InventoryItem[];
  userName: string;
  onConfirm: (payload: DeliveryPayload) => Promise<DeliveryResult>;
  onBack: () => void;
}

type Step = 1 | 2 | 3 | 4 | 5;

interface LineState {
  name: string;
  quantity: number;
}

const STEP_LABELS = ['Personel', 'Proje', 'Ürünler', 'Foto & İmza', 'Özet'];

export default function StockExitWizard({ inventory, userName, onConfirm, onBack }: StockExitWizardProps) {
  const [step, setStep] = useState<Step>(1);

  // Adım 1
  const [receiverName, setReceiverName] = useState('');
  const [receiverGender, setReceiverGender] = useState<Gender | null>(null);

  // Adım 2
  const [project, setProject] = useState<ProjectType | null>(null);
  const [season, setSeason] = useState<Season | null>(null);

  // Adım 3
  const [lines, setLines] = useState<LineState[]>([]);

  // Adım 4
  const [photo, setPhoto] = useState<string | null>(null);
  const [sig, setSig] = useState<string | null>(null);
  const [showSignPad, setShowSignPad] = useState(false);

  // Adım 5
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // --- Türetilmiş veriler ---------------------------------------------------

  // İstenen kit hesaplanır; adetler kullanıcı tarafından override edilebilir.
  const computeKitLines = (): LineState[] => {
    if (!project || !receiverGender) return [];
    const kit = getKit(project, receiverGender, project === 'temizlik' ? season ?? 'yazlik' : undefined);
    return kit.map((k) => ({ name: k.urun, quantity: k.adet }));
  };

  // Her satır için stok durumu.
  const lineStatus = useMemo(() => {
    return lines.map((line) => {
      const inv = inventory.find((i) => i.name === line.name);
      const available = inv ? inv.quantity : 0;
      const exists = !!inv;
      const insufficient = !exists || available < line.quantity;
      return { ...line, available, exists, insufficient };
    });
  }, [lines, inventory]);

  const hasBlockingStock = lineStatus.some((l) => l.quantity > 0 && l.insufficient);
  const anyPositiveQty = lineStatus.some((l) => l.quantity > 0);

  // --- Adım geçiş geçerlilikleri --------------------------------------------

  const canNext1 = receiverName.trim().length > 0 && receiverGender !== null;
  const canNext2 = project !== null && (project === 'tum_ve_cay' || season !== null);
  const canNext3 = anyPositiveQty && !hasBlockingStock;
  const canNext4 = !!photo && !!sig;

  // --- Eylemler -------------------------------------------------------------

  const goToProducts = () => {
    // Adım 2'den 3'e geçerken kit'i (yeniden) yükle.
    setLines(computeKitLines());
    setStep(3);
  };

  const updateQty = (idx: number, val: number) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, quantity: Number.isNaN(val) || val < 0 ? 0 : Math.floor(val) } : l)),
    );
  };

  const handleConfirm = async () => {
    if (!project || !receiverGender || !photo || !sig) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload: DeliveryPayload = {
        receiverName: receiverName.trim(),
        receiverGender,
        project,
        season: project === 'temizlik' ? season ?? 'yazlik' : undefined,
        items: lineStatus
          .filter((l) => l.quantity > 0)
          .map((l) => ({ name: l.name, quantity: l.quantity })),
        photoDataUrl: photo,
        signatureDataUrl: sig,
      };
      const res = await onConfirm(payload);
      if (res.ok) {
        setDone(true);
      } else {
        setError(res.error || 'Teslimat kaydedilemedi. Lütfen tekrar deneyin.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setReceiverName('');
    setReceiverGender(null);
    setProject(null);
    setSeason(null);
    setLines([]);
    setPhoto(null);
    setSig(null);
    setError(null);
    setDone(false);
  };

  // --- Başarı ekranı --------------------------------------------------------

  if (done) {
    return (
      <div className="max-w-2xl mx-auto pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 p-10 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12 }}
            className="inline-flex"
          >
            <PartyPopper className="w-20 h-20 text-green-500 mb-4" />
          </motion.div>
          <h3 className="text-2xl font-bold text-[#2a3439] dark:text-white mb-2 font-headline">
            Teslimat Tamamlandı
          </h3>
          <p className="text-[#566166] dark:text-gray-400 mb-8">
            {receiverName.trim()} adlı personele teslimat başarıyla kaydedildi. Stok güncellendi.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button
              onClick={resetAll}
              className="px-8 py-3 bg-[#455f8a] dark:bg-[#1e293b] text-white rounded-xl font-bold text-sm hover:bg-[#38537d] dark:hover:bg-white/5 transition-all shadow-lg shadow-[#455f8a]/20 dark:shadow-none border border-transparent dark:border-white/10 flex items-center justify-center gap-2"
            >
              <Package className="w-4 h-4" /> Yeni Teslimat
            </button>
            <button
              onClick={onBack}
              className="px-8 py-3 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-[#e1e9ee] dark:hover:bg-white/10 transition-colors"
            >
              Panele Dön
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      {/* Üst başlık + geri */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors text-[#455f8a] dark:text-[#d6e3ff]"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline">Malzeme Çıkışı</h2>
          <p className="text-xs text-[#717c82] dark:text-gray-500">İşlem yapan: {userName}</p>
        </div>
      </div>

      {/* Adım göstergesi */}
      <div className="flex items-center justify-between mb-8 px-1">
        {STEP_LABELS.map((label, i) => {
          const n = (i + 1) as Step;
          const active = n === step;
          const completed = n < step;
          return (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    active
                      ? 'bg-[#455f8a] text-white'
                      : completed
                      ? 'bg-[#d6e3ff] dark:bg-[#244069] text-[#244069] dark:text-[#d6e3ff]'
                      : 'bg-[#f0f4f7] dark:bg-white/5 text-[#717c82] dark:text-gray-500'
                  }`}
                >
                  {completed ? <CheckCircle2 className="w-5 h-5" /> : n}
                </div>
                <span
                  className={`text-[10px] font-bold text-center ${
                    active ? 'text-[#455f8a] dark:text-[#d6e3ff]' : 'text-[#717c82] dark:text-gray-500'
                  } hidden sm:block`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-1 rounded-full ${
                    completed ? 'bg-[#d6e3ff] dark:bg-[#244069]' : 'bg-[#f0f4f7] dark:bg-white/5'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className="bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-sm border border-[#e1e9ee] dark:border-white/10 p-6 sm:p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* ===================== ADIM 1: PERSONEL ===================== */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-[#244069] dark:text-white font-headline">Personel Bilgisi</h3>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">
                  Teslim Alan (Ad Soyad)
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#717c82] dark:text-gray-500" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Örn: Ahmet Yılmaz"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white placeholder-[#717c82] dark:placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">
                  Cinsiyet
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {([
                    { val: 'erkek' as Gender, label: 'Erkek', icon: User },
                    { val: 'kadin' as Gender, label: 'Kadın', icon: Users },
                  ]).map(({ val, label, icon: Icon }) => {
                    const selected = receiverGender === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setReceiverGender(val)}
                        className={`flex flex-col items-center justify-center gap-3 py-8 rounded-2xl border-2 transition-all ${
                          selected
                            ? 'border-[#455f8a] bg-[#d3e4fe] dark:bg-[#244069]/50 dark:border-[#d6e3ff]'
                            : 'border-[#e1e9ee] dark:border-white/10 bg-[#f7f9fb] dark:bg-white/5 hover:border-[#455f8a]/40'
                        }`}
                      >
                        <Icon
                          className={`w-8 h-8 ${
                            selected ? 'text-[#244069] dark:text-[#d6e3ff]' : 'text-[#717c82] dark:text-gray-500'
                          }`}
                        />
                        <span
                          className={`font-bold ${
                            selected ? 'text-[#244069] dark:text-[#d6e3ff]' : 'text-[#566166] dark:text-gray-300'
                          }`}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===================== ADIM 2: PROJE ===================== */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-[#244069] dark:text-white font-headline">Proje Seçimi</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {([
                  { val: 'temizlik' as ProjectType, icon: Sparkles, desc: 'Yazlık / Kışlık kıyafet seti' },
                  { val: 'tum_ve_cay' as ProjectType, icon: Coffee, desc: 'Sabit kıyafet seti (sezonsuz)' },
                ]).map(({ val, icon: Icon, desc }) => {
                  const selected = project === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => {
                        setProject(val);
                        if (val === 'tum_ve_cay') setSeason(null);
                      }}
                      className={`flex flex-col items-start gap-3 p-6 rounded-2xl border-2 text-left transition-all ${
                        selected
                          ? 'border-[#455f8a] bg-[#d3e4fe] dark:bg-[#244069]/50 dark:border-[#d6e3ff]'
                          : 'border-[#e1e9ee] dark:border-white/10 bg-[#f7f9fb] dark:bg-white/5 hover:border-[#455f8a]/40'
                      }`}
                    >
                      <Icon
                        className={`w-8 h-8 ${
                          selected ? 'text-[#244069] dark:text-[#d6e3ff]' : 'text-[#717c82] dark:text-gray-500'
                        }`}
                      />
                      <span
                        className={`font-bold text-lg ${
                          selected ? 'text-[#244069] dark:text-[#d6e3ff]' : 'text-[#566166] dark:text-gray-300'
                        }`}
                      >
                        {PROJECT_LABELS[val]}
                      </span>
                      <span className="text-xs text-[#717c82] dark:text-gray-500">{desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Sezon alt seçimi (yalnız temizlik) */}
              <AnimatePresence>
                {project === 'temizlik' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">
                      Sezon
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {([
                        { val: 'yazlik' as Season, label: 'Yazlık', icon: Sun },
                        { val: 'kislik' as Season, label: 'Kışlık', icon: Snowflake },
                      ]).map(({ val, label, icon: Icon }) => {
                        const selected = season === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setSeason(val)}
                            className={`flex items-center justify-center gap-2 py-5 rounded-2xl border-2 transition-all ${
                              selected
                                ? 'border-[#455f8a] bg-[#d9d7f8] dark:bg-[#244069]/50 dark:border-[#d6e3ff]'
                                : 'border-[#e1e9ee] dark:border-white/10 bg-[#f7f9fb] dark:bg-white/5 hover:border-[#455f8a]/40'
                            }`}
                          >
                            <Icon
                              className={`w-5 h-5 ${
                                selected ? 'text-[#244069] dark:text-[#d6e3ff]' : 'text-[#717c82] dark:text-gray-500'
                              }`}
                            />
                            <span
                              className={`font-bold ${
                                selected ? 'text-[#244069] dark:text-[#d6e3ff]' : 'text-[#566166] dark:text-gray-300'
                              }`}
                            >
                              {label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ===================== ADIM 3: ÜRÜN LİSTESİ ===================== */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-[#244069] dark:text-white font-headline">Ürün Listesi</h3>
              <p className="text-xs text-[#717c82] dark:text-gray-500">
                Adetleri kontrol edip gerekirse düzenleyin. Stok yetersiz satırlar kırmızı işaretlenir.
              </p>

              <div className="space-y-3">
                {lineStatus.map((l, idx) => (
                  <div
                    key={l.name}
                    className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${
                      l.quantity > 0 && l.insufficient
                        ? 'border-red-400 dark:border-red-500/60 bg-red-50 dark:bg-red-500/10'
                        : 'border-[#e1e9ee] dark:border-white/10 bg-[#f7f9fb] dark:bg-white/5'
                    }`}
                  >
                    <Package
                      className={`w-5 h-5 flex-shrink-0 ${
                        l.quantity > 0 && l.insufficient
                          ? 'text-red-500'
                          : 'text-[#455f8a] dark:text-[#d6e3ff]'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#2a3439] dark:text-white truncate">{l.name}</p>
                      {!l.exists ? (
                        <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Stokta yok
                        </p>
                      ) : l.insufficient && l.quantity > 0 ? (
                        <p className="text-xs font-bold text-red-500 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Yetersiz · Mevcut {l.available}, istenen {l.quantity}
                        </p>
                      ) : (
                        <p className="text-xs text-[#717c82] dark:text-gray-500">
                          Mevcut: {l.available} · İstenen: {l.quantity}
                        </p>
                      )}
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={l.quantity}
                      onChange={(e) => updateQty(idx, parseInt(e.target.value, 10))}
                      className="w-20 px-3 py-2 text-center font-bold bg-white dark:bg-white/10 border border-[#e1e9ee] dark:border-white/10 rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white"
                    />
                  </div>
                ))}
              </div>

              {hasBlockingStock && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Bazı ürünlerde stok yetersiz. Devam etmek için adetleri mevcut stoğa indirin veya o satırı 0 yapın.
                  </span>
                </div>
              )}
              {!anyPositiveQty && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-400 text-sm">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>En az bir ürünün adedi 0'dan büyük olmalı.</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ===================== ADIM 4: FOTOĞRAF + İMZA ===================== */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-[#244069] dark:text-white font-headline">Fotoğraf & İmza</h3>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Camera className="w-4 h-4" /> Teslimat Fotoğrafı
                </label>
                <PhotoCapture value={photo} onChange={setPhoto} />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <PenLine className="w-4 h-4" /> E-İmza
                </label>
                {sig ? (
                  <div className="relative border border-[#e1e9ee] dark:border-white/10 rounded-2xl p-3 bg-[#f7f9fb] dark:bg-white/5">
                    <img src={sig} alt="İmza önizleme" className="w-full max-h-32 object-contain" />
                    <button
                      onClick={() => setShowSignPad(true)}
                      className="absolute top-2 right-2 px-3 py-1 rounded-lg bg-[#455f8a] text-white text-xs font-bold"
                    >
                      Yeniden İmzala
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!receiverName.trim()) return;
                      setShowSignPad(true);
                    }}
                    className="flex flex-col items-center justify-center gap-2 w-full h-32 border-2 border-dashed border-[#e1e9ee] dark:border-white/10 rounded-2xl text-[#566166] dark:text-gray-400 hover:border-[#455f8a]/40 transition-colors"
                  >
                    <PenLine className="w-6 h-6" />
                    <span className="font-bold text-sm">İmza Al</span>
                  </button>
                )}
              </div>

              {!canNext4 && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-400 text-sm">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Devam etmek için hem fotoğraf hem de imza zorunludur.</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ===================== ADIM 5: ÖZET ===================== */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-bold text-[#244069] dark:text-white font-headline">Özet & Onay</h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-[#f7f9fb] dark:bg-white/5">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#717c82]">Teslim Alan</p>
                  <p className="font-bold text-[#2a3439] dark:text-white">{receiverName.trim()}</p>
                  <p className="text-xs text-[#566166] dark:text-gray-400">
                    {receiverGender === 'erkek' ? 'Erkek' : 'Kadın'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-[#f7f9fb] dark:bg-white/5">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#717c82]">Proje</p>
                  <p className="font-bold text-[#2a3439] dark:text-white">
                    {project ? PROJECT_LABELS[project] : '-'}
                  </p>
                  {project === 'temizlik' && (
                    <p className="text-xs text-[#566166] dark:text-gray-400">
                      {season === 'kislik' ? 'Kışlık' : 'Yazlık'}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold text-[#566166] dark:text-gray-400 uppercase tracking-widest ml-1">
                  Ürünler
                </p>
                <div className="rounded-2xl border border-[#e1e9ee] dark:border-white/10 divide-y divide-[#e1e9ee] dark:divide-white/10 overflow-hidden">
                  {lineStatus
                    .filter((l) => l.quantity > 0)
                    .map((l) => (
                      <div key={l.name} className="flex items-center justify-between px-4 py-3 bg-[#f7f9fb] dark:bg-white/5">
                        <span className="font-bold text-[#2a3439] dark:text-white">{l.name}</span>
                        <span className="font-bold text-[#455f8a] dark:text-[#d6e3ff]">{l.quantity} adet</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {photo && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#717c82] mb-1">Fotoğraf</p>
                    <img src={photo} alt="Fotoğraf" className="w-full h-28 object-cover rounded-xl" />
                  </div>
                )}
                {sig && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#717c82] mb-1">İmza</p>
                    <img src={sig} alt="İmza" className="w-full h-28 object-contain rounded-xl bg-[#f7f9fb] dark:bg-white/5" />
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================== NAVİGASYON ===================== */}
        <div className="pt-8 mt-6 border-t border-[#e1e9ee] dark:border-white/10 flex justify-between gap-4">
          <button
            type="button"
            onClick={() => (step === 1 ? onBack() : setStep((s) => (s - 1) as Step))}
            disabled={submitting}
            className="px-6 py-3 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-gray-300 rounded-xl font-bold text-sm hover:bg-[#e1e9ee] dark:hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Geri
          </button>

          {step < 5 ? (
            <button
              type="button"
              disabled={
                (step === 1 && !canNext1) ||
                (step === 2 && !canNext2) ||
                (step === 3 && !canNext3) ||
                (step === 4 && !canNext4)
              }
              onClick={() => {
                if (step === 2) {
                  goToProducts();
                } else {
                  setStep((s) => (s + 1) as Step);
                }
              }}
              className="px-8 py-3 bg-[#455f8a] dark:bg-[#1e293b] text-white rounded-xl font-bold text-sm hover:bg-[#38537d] dark:hover:bg-white/5 transition-all shadow-lg shadow-[#455f8a]/20 dark:shadow-none border border-transparent dark:border-white/10 disabled:opacity-40 flex items-center gap-2"
            >
              İleri <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting || hasBlockingStock || !canNext4 || !anyPositiveQty}
              onClick={handleConfirm}
              className="px-8 py-3 bg-[#455f8a] dark:bg-[#1e293b] text-white rounded-xl font-bold text-sm hover:bg-[#38537d] dark:hover:bg-white/5 transition-all shadow-lg shadow-[#455f8a]/20 dark:shadow-none border border-transparent dark:border-white/10 disabled:opacity-40 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Teslimatı Onayla
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* İmza modalı */}
      {showSignPad && (
        <SignaturePad
          receiverName={receiverName.trim()}
          onConfirm={(dataUrl) => {
            setSig(dataUrl);
            setShowSignPad(false);
          }}
          onClose={() => setShowSignPad(false)}
        />
      )}
    </div>
  );
}
