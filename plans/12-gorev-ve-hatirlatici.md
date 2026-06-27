# 12 — Görev & Hatırlatıcı Modülü

## Sorun / Hedef
Dashboard "Aktif Görevler → Tümünü Gör" çalışmıyor. Detaylı bir **görev & hatırlatıcı** bölümü:
- Günlük görev/hatırlatıcı girme.
- **Zamanı gelince zil sesi** + görsel uyarı (zamanlama).
- **Oto/tekrarlayan görevler** (günlük/haftalık) ve **belirli günlere** ayarlı görevler.
- Görev tamamlama, silme, listeleme; "Tümünü Gör" bu modülü açar.

## Gerçek Uygulama (React + Dexie)
- **Tip (`types.ts`):**
  ```ts
  export type TaskRepeat = 'none' | 'daily' | 'weekly';
  export interface TaskItem {
    id: string; title: string; note?: string;
    dueAt: string;            // ISO datetime
    repeat: TaskRepeat; weekday?: number; // weekly için 0-6
    done: boolean; remindedAt?: number;   // son zil zamanı (tekrar engelleme)
    sound: boolean; createdBy: string; ts: number;
  }
  ```
- **Dexie (`db.ts` v2):** `tasks: 'id, ts, dueAt, done'` tablosu (versiyon yükseltme `.version(2)`).
- **Repo:** `addTask`, `updateTask`, `toggleTaskDone`, `deleteTask`. Okuma `useLiveQuery(() => db.tasks.orderBy('dueAt').toArray())`.
- **Bileşen `TaskCenter.tsx` (YENİ):** liste (bugün / yaklaşan / tamamlanan), ekleme formu (başlık, not, tarih-saat,
  tekrar, gün, zil aç/kapa), tamamla/sil. Mobile-first kartlar.
- **Zamanlayıcı (Dashboard'da, her zaman mount):** `setInterval` (~30 sn) ile `dueAt <= now && !remindedAt(bugün)`
  görevleri bulur → **Web Audio API ile zil (beep)** çalar + toast/uyarı gösterir + `remindedAt` günceller.
  Tekrarlayan görevlerde `dueAt` bir sonraki güne/haftaya ötelenir. (Harici ses dosyası yok; oscillator beep.)
- **Dashboard entegrasyonu:** "Aktif Görevler" kartı yaklaşan görevleri gösterir; "Tümünü Gör" → `setCurrentView('tasks')`.
  Menüye "Görevler" eklenir.

## Kurallar / Kısıtlar
- GSAP yok (motion). Ses yalnız `sound:true` görevlerde. Bildirim izni varsa `Notification` da kullanılabilir (opsiyonel).

## Kabul Kriteri
- Görev eklenir, listelenir, tamamlanır. Zamanı gelince zil + uyarı. Tekrarlı görevler öteler. "Tümünü Gör" çalışır.
