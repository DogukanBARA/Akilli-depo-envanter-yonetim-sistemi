import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ShieldCheck, Zap, ChevronRight } from 'lucide-react';
import { InventoryItem, DeliveryPayload } from '../types';
import * as repo from '../lib/repo';
import StockExitWizard from './StockExitWizard';
import QuickExit from './QuickExit';

export interface StockExitHubProps {
  inventory: InventoryItem[];
  userName: string;
  onBack: () => void;
}

type Mode = 'choose' | 'kit' | 'quick';

/**
 * Malzeme Çıkış girişi: Kit Sihirbazı (proje/kıyafet/imza) veya Toplu/Hızlı Çıkış
 * (çoklu ürün + opsiyonel fatura/foto kanıt) seçimi.
 */
export default function StockExitHub({ inventory, userName, onBack }: StockExitHubProps) {
  const [mode, setMode] = useState<Mode>('choose');

  if (mode === 'kit') {
    return (
      <StockExitWizard
        inventory={inventory}
        userName={userName}
        onConfirm={(payload: DeliveryPayload) => repo.confirmDelivery(payload, userName)}
        onBack={() => setMode('choose')}
      />
    );
  }
  if (mode === 'quick') {
    return <QuickExit inventory={inventory} userName={userName} onBack={() => setMode('choose')} />;
  }

  const cards = [
    {
      key: 'kit' as const,
      icon: <ShieldCheck className="w-7 h-7" />,
      title: 'Kit Sihirbazı',
      desc: 'Proje + kıyafet seti seçimi, cinsiyete göre liste, e-imza ve fotoğraf ile zimmet teslimatı.',
      color: 'bg-[#d9d7f8]', text: 'text-[#4a4a65]',
    },
    {
      key: 'quick' as const,
      icon: <Zap className="w-7 h-7" />,
      title: 'Toplu / Hızlı Çıkış',
      desc: 'Çoklu ürünü tek alıcıya hızlıca çıkar; isteğe bağlı fatura/fotoğraf ve not ekle.',
      color: 'bg-[#d3e4fe]', text: 'text-[#435368]',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors text-[#455f8a] dark:text-[#d6e3ff]">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[#2a3439] dark:text-white font-headline">Malzeme Çıkış</h2>
          <p className="text-xs text-[#717c82] dark:text-gray-500">Çıkış yöntemini seçin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {cards.map((c, i) => (
          <motion.button
            key={c.key}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.08 }}
            whileHover={{ y: -4 }}
            onClick={() => setMode(c.key)}
            className="group text-left p-8 bg-white dark:bg-[#1e293b] rounded-[2rem] border border-[#e1e9ee] dark:border-white/10 shadow-sm hover:shadow-xl hover:shadow-[#455f8a]/10 transition-all"
          >
            <div className={`w-16 h-16 rounded-2xl ${c.color} dark:bg-white/10 ${c.text} dark:text-white flex items-center justify-center mb-6`}>
              {c.icon}
            </div>
            <h3 className="text-xl font-bold font-headline text-[#2a3439] dark:text-white mb-2 flex items-center gap-2">
              {c.title}
              <ChevronRight className="w-5 h-5 text-[#717c82] group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-sm text-[#566166] dark:text-gray-400 leading-relaxed">{c.desc}</p>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
