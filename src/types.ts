export type UserRole = 'admin' | 'personnel';

export interface UserProfile {
  name: string;
  role: UserRole;
  email: string;
  avatar: string;
  department: string;
  phone: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  lastUpdated: string;
  criticalLevel: number;
  expiryDate?: string;
}

export interface Shipment {
  id: string;
  type: 'Giriş' | 'Çıkış';
  date: string;
  item: string;
  category: string;
  location: string;
  quantity: number;
  status: 'Tamamlandı' | 'Beklemede' | 'İptal Edildi';
  personnel: string;
  recipient?: string;
  /** Sıralama için epoch ms (newest-first). WP0/Dexie eklentisi. */
  ts?: number;
  /** Kanıt foto/fatura (base64 dataURL) — opsiyonel, geriye uyumlu. */
  photoDataUrl?: string;
  /** Açıklama / not. */
  note?: string;
  /** Tedarikçi (giriş kanıtı için). */
  supplier?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  type: 'security' | 'inventory' | 'system';
  /** Sıralama için epoch ms (newest-first). WP0/Dexie eklentisi. */
  ts?: number;
}

export type ViewType = 'dashboard' | 'stock' | 'entry' | 'exit' | 'add' | 'reports' | 'settings' | 'profile' | 'audit' | 'tasks' | 'quickexit' | 'notifications' | 'users';

/* ===================== Teslimat / Çıkış Sihirbazı (WP0) ===================== */

export type Gender = 'erkek' | 'kadin';
export type ProjectType = 'temizlik' | 'tum_ve_cay';
export type Season = 'yazlik' | 'kislik';

export const PROJECT_LABELS: Record<ProjectType, string> = {
  temizlik: 'Temizlik',
  tum_ve_cay: 'Tüm ve Çay',
};

/** Sihirbazda seçilen tek ürün satırı (girdi). */
export interface DeliveryLineInput {
  /** Ürün adı (inventory.name ile eşleşir). */
  name: string;
  quantity: number;
}

/** StockExitWizard'ın onConfirm'e gönderdiği yük. */
export interface DeliveryPayload {
  receiverName: string;
  receiverGender: Gender;
  project: ProjectType;
  season?: Season;            // sadece temizlik için
  items: DeliveryLineInput[]; // cinsiyete göre filtrelenmiş, adetleri düzenlenmiş
  photoDataUrl: string;       // base64 dataURL (zorunlu)
  signatureDataUrl: string;   // base64 PNG dataURL (zorunlu)
}

/** Dexie `deliveries` kaydı. */
export interface Delivery {
  id: string;
  ts: number;
  project: ProjectType;
  projectLabel: string;
  season?: Season;
  subType: string;            // "Yazlık" | "Kışlık" | "-"
  receiverName: string;
  receiverGender: Gender;
  deliveredBy: string;        // teslim eden (depocu/yönetici)
  deliveryDate: string;       // tr-TR okunabilir tarih
  items: { name: string; quantity: number }[];
  photoDataUrl: string;
  signatureDataUrl: string;
}

/** Dexie `deliveryItems` (normalize) kaydı. */
export interface DeliveryItem {
  autoId?: number;
  deliveryId: string;
  itemId: string;             // inventory.id (varsa)
  name: string;
  quantity: number;
}

/** confirmDelivery dönüşü. */
export interface DeliveryResult {
  ok: boolean;
  error?: string;
}

/* ===================== İçe / Dışa Aktarma (IO) ===================== */

export type ExportFormat = 'xlsx' | 'csv' | 'html';

/** İçe aktarma birleştirme stratejisi. */
export type ImportMode = 'add' | 'replace' | 'upsert';

/** Dosyadan ayrıştırılmış ham stok satırı (alanlar opsiyonel/temizlenmemiş olabilir). */
export interface ParsedInventoryRow {
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  criticalLevel: number;
  expiryDate?: string;
}

/** İçe aktarma sonucu özeti. */
export interface ImportResult {
  ok: boolean;
  added: number;
  updated: number;
  total: number;
  error?: string;
}

/* ===================== Görev & Hatırlatıcı (plan 12) ===================== */

export type TaskRepeat = 'none' | 'daily' | 'weekly';

export interface TaskItem {
  id: string;
  title: string;
  note?: string;
  dueAt: string;           // ISO datetime (yyyy-MM-ddTHH:mm)
  repeat: TaskRepeat;
  weekday?: number;        // weekly için 0-6 (0=Pazar)
  done: boolean;
  remindedAt?: number;     // son zil epoch ms (aynı anda tekrar çalmayı önler)
  sound: boolean;
  createdBy: string;
  ts: number;
}

/* ===================== Toplu Giriş/Çıkış + Kanıt (plan 14) ===================== */

/** Giriş/çıkış işlemine iliştirilen opsiyonel kanıt. */
export interface MovementProof {
  photoDataUrl?: string;
  note?: string;
  supplier?: string;
}

/** Toplu giriş satırı. */
export interface BulkEntryRow {
  name: string;
  quantity: number;
  category?: string;
  unit?: string;
  location?: string;
  sku?: string;
}

/** Hızlı/toplu çıkış satırı. */
export interface QuickExitLine {
  name: string;
  quantity: number;
}

/* ===================== Bildirimler (zil) ===================== */

export type NotificationType = 'task' | 'stock' | 'system' | 'security' | 'info';

export interface NotificationItem {
  id: string;
  ts: number;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  pinned: boolean;
  /** Aynı bildirimi tekrar üretmemek için benzersiz anahtar. */
  dedupeKey?: string;
}

/* ===================== Kullanıcı Hesapları (yalnız admin yönetir) ===================== */

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password: string;   // frontend-only demo; gerçek backend'de hash'lenir
  createdAt: string;
}

export interface AuthResult {
  role: UserRole;
  name: string;
  username: string;
}
