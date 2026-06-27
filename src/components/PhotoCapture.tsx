import React, { useRef, useState } from 'react';
import { Camera, Trash2, RotateCcw } from 'lucide-react';

export interface PhotoCaptureProps {
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}

const MAX_BYTES = 2 * 1024 * 1024; // ~2MB
const MAX_DIM = 1280;
const JPEG_QUALITY = 0.8;

/**
 * Kamera/dosya seçimi + FileReader dataURL + büyük görsellerde canvas ile
 * en-boy koruyarak yeniden boyutlandırma & JPEG sıkıştırma (IndexedDB şişmesin).
 */
export default function PhotoCapture({ value, onChange }: PhotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  // dataURL'i canvas ile en-boy koruyarak küçültüp JPEG'e sıkıştırır.
  const compress = (dataUrl: string): Promise<string> =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          const scale = Math.min(MAX_DIM / width, MAX_DIM / height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (!result) {
        setLoading(false);
        onChange(null);
        return;
      }
      // ~2MB üzeri veya doğrudan kamera çekimi ise küçült/sıkıştır.
      const needsCompress = file.size > MAX_BYTES;
      const out = needsCompress ? await compress(result) : result;
      onChange(out);
      setLoading(false);
    };
    reader.onerror = () => {
      setLoading(false);
      onChange(null);
    };
    reader.readAsDataURL(file);
    // Aynı dosya tekrar seçilebilsin diye input'u sıfırla.
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {value ? (
        <div className="space-y-3">
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src={value}
              alt="Teslimat fotoğrafı önizleme"
              className="w-full max-h-48 object-cover rounded-2xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white dark:bg-white/5 text-[#566166] dark:text-white/70 font-bold border border-[#e1e9ee] dark:border-white/10 active:scale-[0.98] transition"
            >
              <RotateCcw size={16} /> Değiştir
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-white dark:bg-white/5 text-red-500 font-bold border border-[#e1e9ee] dark:border-white/10 active:scale-[0.98] transition"
            >
              <Trash2 size={16} /> Kaldır
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-full flex flex-col items-center justify-center gap-2 h-36 rounded-2xl border-2 border-dashed border-[#d6e3ff] dark:border-white/15 bg-[#f0f4f7] dark:bg-white/5 text-[#566166] dark:text-white/60 hover:border-[#455f8a] dark:hover:border-[#455f8a] active:scale-[0.99] transition disabled:opacity-50"
        >
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-[#d6e3ff] dark:bg-[#455f8a]/30 text-[#455f8a] dark:text-[#d6e3ff]">
            <Camera size={22} />
          </div>
          <span className="text-sm font-bold">
            {loading ? 'İşleniyor…' : 'Fotoğraf Ekle'}
          </span>
        </button>
      )}
    </div>
  );
}
