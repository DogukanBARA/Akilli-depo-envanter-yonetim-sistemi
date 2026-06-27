/**
 * Sisteme uygun başlangıç görevleri.
 *  - RECURRING: sabit kimlikli, HER açılışta yoksa eklenir (idempotent). Düzenli tekrar eder.
 *  - ONE-TIME: tek seferlik; yalnız ilk kurulumda (bayrakla) eklenir.
 */
import { TaskItem } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');
function todayAt(h: number, m: number): string {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}`;
}
function inDaysAt(days: number, h: number, m: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(h, m, 0, 0);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(h)}:${pad(m)}`;
}
/** Bu hafta/önümüzdeki Pazartesi. */
function nextMondayAt(h: number, m: number): string {
  const delta = ((8 - new Date().getDay()) % 7) || 7;
  return inDaysAt(delta, h, m);
}

/** Sabit kimlikli, tekrarlayan sistem görevleri (idempotent ensure-exist). */
export function buildRecurringTasks(createdBy: string): Omit<TaskItem, 'ts'>[] {
  return [
    { id: 'sys-kritik-stok',     title: 'Kritik stok kontrolü',            note: 'Kritik seviyenin altındaki ürünleri gözden geçir ve tedarik planla.', dueAt: todayAt(9, 0),  repeat: 'daily',  done: false, sound: true,  createdBy },
    { id: 'sys-gun-sonu-sayim',  title: 'Gün sonu stok sayımı',            note: 'Gün içindeki giriş/çıkışları kontrol et, fiziksel sayımla doğrula.',   dueAt: todayAt(17, 30), repeat: 'daily', done: false, sound: true,  createdBy },
    { id: 'sys-sevkiyat-plani',  title: 'Günlük sevkiyat/teslimat planı',  note: 'Bugünkü personel teslimatlarını ve çıkışları planla.',                  dueAt: todayAt(8, 30),  repeat: 'daily', done: false, sound: false, createdBy },
    { id: 'sys-haftalik-rapor',  title: 'Haftalık stok & teslimat raporu', note: 'Genel Rapor ekranından haftalık raporu indir ve arşivle.',              dueAt: nextMondayAt(10, 0), repeat: 'weekly', weekday: 1, done: false, sound: true,  createdBy },
    { id: 'sys-kit-kontrol',     title: 'Kıyafet kit stoklarını gözden geçir', note: 'Temizlik (yazlık/kışlık) ve Tüm&Çay kitlerindeki ürün yeterliliğini kontrol et.', dueAt: nextMondayAt(11, 0), repeat: 'weekly', weekday: 1, done: false, sound: false, createdBy },
  ];
}

/** Tek seferlik kurulum görevleri (yalnız ilk kurulumda). */
export function buildOneTimeTasks(createdBy: string): Omit<TaskItem, 'id' | 'ts'>[] {
  return [
    { title: 'İlk ürünleri ekle ve envanteri düzenle', note: 'Ürün Ekle → Toplu Ekle ile mevcut stoğunu sisteme aktar.',            dueAt: todayAt(Math.min(23, new Date().getHours() + 2), 0), repeat: 'none', done: false, sound: true,  createdBy },
    { title: 'Tedarikçi faturalarını arşivle',         note: 'Malzeme Giriş kanıtı olarak fatura/foto eklemeyi unutma.',           dueAt: inDaysAt(1, 14, 0), repeat: 'none', done: false, sound: true,  createdBy },
    { title: 'Personel zimmet teslimatlarını gözden geçir', note: 'Çıkış sihirbazı/toplu çıkış ile yapılan teslimatların imza/foto kanıtlarını kontrol et.', dueAt: inDaysAt(3, 15, 0), repeat: 'none', done: false, sound: false, createdBy },
  ];
}
