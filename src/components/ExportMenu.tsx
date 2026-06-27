import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, FileSpreadsheet, FileText, FileCode, ChevronDown } from 'lucide-react';
import { ExportFormat } from '../types';

export interface ExportMenuProps {
  onExport: (format: ExportFormat) => void;
  label?: string;
  disabled?: boolean;
}

const OPTIONS: { format: ExportFormat; label: string; icon: React.ReactNode; hint: string }[] = [
  { format: 'xlsx', label: 'Excel (.xlsx)', icon: <FileSpreadsheet className="w-4 h-4" />, hint: 'Tablolu çalışma kitabı' },
  { format: 'csv', label: 'CSV (.csv)', icon: <FileText className="w-4 h-4" />, hint: 'Düz metin, evrensel' },
  { format: 'html', label: 'HTML Rapor', icon: <FileCode className="w-4 h-4" />, hint: 'Markalı sunum/yazdırma' },
];

/** Format seçmeli dışa aktarma butonu (XLSX / CSV / HTML). */
export default function ExportMenu({ onExport, label = 'Dışa Aktar', disabled }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 bg-[#455f8a] dark:bg-[#1e293b] text-white rounded-xl text-sm font-bold hover:bg-[#38537d] dark:hover:bg-white/5 transition-colors shadow-lg shadow-[#455f8a]/20 dark:shadow-none border border-transparent dark:border-white/10 disabled:opacity-40"
      >
        <Download className="w-4 h-4" />
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#1e293b] rounded-2xl shadow-2xl border border-[#e1e9ee] dark:border-white/10 z-50 overflow-hidden p-1.5"
          >
            {OPTIONS.map((opt) => (
              <button
                key={opt.format}
                onClick={() => {
                  setOpen(false);
                  onExport(opt.format);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-[#f0f4f7] dark:hover:bg-white/5 transition-colors group"
              >
                <span className="w-9 h-9 rounded-xl bg-[#f0f4f7] dark:bg-white/5 text-[#455f8a] dark:text-[#d6e3ff] flex items-center justify-center group-hover:bg-[#d6e3ff] dark:group-hover:bg-white/10">
                  {opt.icon}
                </span>
                <span>
                  <span className="block text-sm font-bold text-[#2a3439] dark:text-white">{opt.label}</span>
                  <span className="block text-[11px] text-[#717c82] dark:text-gray-400">{opt.hint}</span>
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
