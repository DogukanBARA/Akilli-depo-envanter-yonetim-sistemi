import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { PenTool, RotateCcw, Check, X } from 'lucide-react';

export interface SignaturePadProps {
  receiverName: string;
  onConfirm: (dataUrl: string) => void;
  onClose: () => void;
}

const STROKE_COLOR = '#2a3439';
const LINE_WIDTH = 2.5;

/**
 * Tam ekran imza modülü. Pointer Events ile mouse + dokunmatik tek kod yolu,
 * devicePixelRatio ile retina netliği, ResizeObserver ile responsive ölçek.
 */
export default function SignaturePad({ receiverName, onConfirm, onClose }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Canvas'ı container boyutuna + devicePixelRatio'ya göre ölçekler.
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Önceki çizimi sakla (yeniden ölçeklemede kaybolmasın)
    const prev = canvas.width > 0 ? canvas.toDataURL('image/png') : null;

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = STROKE_COLOR;

    if (prev && hasDrawn) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = prev;
    }
  }, [hasDrawn]);

  useEffect(() => {
    setupCanvas();
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => setupCanvas());
    ro.observe(container);
    return () => ro.disconnect();
  }, [setupCanvas]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPos(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const last = lastPointRef.current;
    if (!canvas || !ctx || !last) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPointRef.current = pos;
    if (!hasDrawn) setHasDrawn(true);
  };

  const endStroke = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    setHasDrawn(false);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawn) return;
    onConfirm(canvas.toDataURL('image/png'));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[300] flex flex-col bg-[#f0f4f7] dark:bg-[#0f172a] p-4 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#d6e3ff] dark:bg-[#455f8a]/30 text-[#455f8a] dark:text-[#d6e3ff]">
          <PenTool size={18} />
        </div>
        <div>
          <p className="text-xs text-[#566166] dark:text-white/50 font-medium">E-İmza</p>
          <p className="text-sm font-bold text-[#2a3439] dark:text-[#d6e3ff]">
            Teslim Alan: {receiverName}
          </p>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 w-full rounded-2xl bg-white dark:bg-[#1e293b] border border-[#e1e9ee] dark:border-white/10 overflow-hidden relative"
      >
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-sm text-[#566166]/60 dark:text-white/30 font-medium">
              Bu alana imzanızı atın
            </p>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
          className="block w-full h-full"
          style={{ touchAction: 'none' }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <button
          onClick={onClose}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-white/5 text-[#566166] dark:text-white/70 font-bold border border-[#e1e9ee] dark:border-white/10 active:scale-[0.98] transition"
        >
          <X size={18} /> Vazgeç
        </button>
        <button
          onClick={handleClear}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-white/5 text-[#566166] dark:text-white/70 font-bold border border-[#e1e9ee] dark:border-white/10 active:scale-[0.98] transition"
        >
          <RotateCcw size={18} /> Temizle
        </button>
        <button
          disabled={!hasDrawn}
          onClick={handleConfirm}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#455f8a] text-white font-bold active:scale-[0.98] transition disabled:opacity-40 disabled:active:scale-100"
        >
          <Check size={18} /> Onayla
        </button>
      </div>
    </motion.div>
  );
}
