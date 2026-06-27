/**
 * Repository — TEK veri erişim noktası. Bileşenler doğrudan Dexie'ye yazmaz, buradan geçer.
 * Okuma için bileşenler `useLiveQuery(() => db.<tablo>...)` kullanır; yazma için bu fonksiyonlar.
 * İleride gerçek bir backend (SQLite/Postgres/REST) gerekirse YALNIZ bu dosya değişir.
 */
import { db } from './db';
import {
  InventoryItem,
  Shipment,
  AuditLog,
  DeliveryPayload,
  DeliveryResult,
  PROJECT_LABELS,
  ParsedInventoryRow,
  ImportMode,
  ImportResult,
  TaskItem,
  MovementProof,
  BulkEntryRow,
  QuickExitLine,
  NotificationItem,
  UserAccount,
  AuthResult,
} from '../types';
import { SEED_INVENTORY } from '../data/seed';
import { buildRecurringTasks, buildOneTimeTasks } from '../data/taskSeed';

const uid = () => Math.random().toString(36).substr(2, 9);
const trk = () => `TRK-${Math.floor(1000 + Math.random() * 9000)}`;
const nowTr = () => new Date().toLocaleString('tr-TR').slice(0, 16);
const isoDay = () => new Date().toISOString().split('T')[0];

/* ----------------------------- Audit Log ----------------------------- */

export async function addLog(
  user: string,
  action: string,
  details: string,
  type: AuditLog['type'],
): Promise<void> {
  const log: AuditLog = {
    id: uid(),
    ts: Date.now(),
    timestamp: new Date().toLocaleString('tr-TR'),
    user,
    action,
    details,
    type,
  };
  await db.auditLogs.add(log);
  // Son 1000 kaydı tut (performans)
  const count = await db.auditLogs.count();
  if (count > 1000) {
    const oldest = await db.auditLogs.orderBy('ts').limit(count - 1000).primaryKeys();
    await db.auditLogs.bulkDelete(oldest);
  }
}

/* --------------------------- Stok Girişi ----------------------------- */

/** Ürün ekleme/giriş. Aynı SKU varsa miktarı artırır, yoksa yeni kayıt açar. */
export async function addProduct(
  newItem: Omit<InventoryItem, 'id' | 'lastUpdated'>,
  user: string,
  proof?: MovementProof,
): Promise<void> {
  await db.transaction('rw', db.inventory, db.shipments, db.auditLogs, async () => {
    const existing = await db.inventory.where('sku').equals(newItem.sku).first();
    if (existing) {
      await db.inventory.update(existing.id, {
        quantity: existing.quantity + newItem.quantity,
        lastUpdated: isoDay(),
      });
    } else {
      const item: InventoryItem = { ...newItem, id: uid(), lastUpdated: isoDay() };
      await db.inventory.add(item);
    }
    await db.shipments.add({
      id: trk(),
      ts: Date.now(),
      type: 'Giriş',
      date: nowTr(),
      item: newItem.name,
      category: newItem.category,
      location: newItem.location,
      quantity: newItem.quantity,
      status: 'Tamamlandı',
      personnel: user,
      ...(proof || {}),
    });
  });
  await addLog(user, 'Yeni Ürün Ekleme', `${newItem.name} (${newItem.sku}) envantere eklendi.`, 'inventory');
}

/** Mevcut bir kalemin stoğunu artırır (hızlı giriş). */
export async function materialEntry(
  itemId: string,
  quantity: number,
  user: string,
  proof?: MovementProof,
): Promise<void> {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) return;
  const item = await db.inventory.get(itemId);
  if (!item) return;
  await db.transaction('rw', db.inventory, db.shipments, async () => {
    await db.inventory.update(itemId, { quantity: item.quantity + qty, lastUpdated: isoDay() });
    await db.shipments.add({
      id: trk(), ts: Date.now(), type: 'Giriş', date: nowTr(),
      item: item.name, category: item.category, location: item.location,
      quantity: qty, status: 'Tamamlandı', personnel: user, ...(proof || {}),
    });
  });
  await addLog(user, 'Malzeme Girişi', `${item.name} için ${qty} birim giriş yapıldı.`, 'inventory');
}

/** Tekil hızlı çıkış (stok tablosundan). Stok asla eksiye düşmez. */
export async function materialExit(
  itemId: string,
  quantity: number,
  recipient: string,
  user: string,
): Promise<DeliveryResult> {
  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty <= 0) return { ok: false, error: 'Geçersiz adet.' };
  const item = await db.inventory.get(itemId);
  if (!item) return { ok: false, error: 'Ürün bulunamadı.' };
  if (item.quantity < qty) {
    return { ok: false, error: `Yetersiz stok: ${item.name} - mevcut ${item.quantity}, istenen ${qty}` };
  }
  await db.transaction('rw', db.inventory, db.shipments, async () => {
    await db.inventory.update(itemId, { quantity: item.quantity - qty, lastUpdated: isoDay() });
    await db.shipments.add({
      id: trk(), ts: Date.now(), type: 'Çıkış', date: nowTr(),
      item: item.name, category: item.category, location: item.location,
      quantity: qty, status: 'Tamamlandı', personnel: user, recipient,
    });
  });
  await addLog(user, 'Malzeme Çıkışı', `${item.name} için ${qty} birim çıkış. Alıcı: ${recipient}`, 'inventory');
  return { ok: true };
}

/* ------------------- Teslimat (Çıkış Sihirbazı) ---------------------- */

/**
 * Toplu teslimat onayı. ATOMİK: stok düşümü + shipment + delivery + deliveryItems
 * tek transaction içinde. Herhangi bir kalemde stok yetersizse TÜM işlem iptal edilir
 * (stok asla eksiye düşmez).
 */
export async function confirmDelivery(payload: DeliveryPayload, user: string): Promise<DeliveryResult> {
  const { receiverName, receiverGender, project, season, items, photoDataUrl, signatureDataUrl } = payload;

  if (!receiverName.trim()) return { ok: false, error: 'Teslim alan personel adı zorunludur.' };
  if (!photoDataUrl) return { ok: false, error: 'Fotoğraf zorunludur.' };
  if (!signatureDataUrl) return { ok: false, error: 'İmza zorunludur.' };
  const valid = items.filter((i) => i.quantity > 0);
  if (valid.length === 0) return { ok: false, error: 'En az bir ürün seçilmelidir.' };

  try {
    let resultError: string | null = null;
    const deliveryId = `DLV-${Date.now().toString(36).toUpperCase()}`;
    const ts = Date.now();
    const subType = project === 'temizlik' ? (season === 'kislik' ? 'Kışlık' : 'Yazlık') : '-';

    await db.transaction(
      'rw',
      db.inventory, db.shipments, db.deliveries, db.deliveryItems, db.auditLogs,
      async () => {
        // 1) Stok yeterlilik ön-kontrol (hepsi) — biri bile yetersizse rollback
        const matched: { item?: InventoryItem; line: { name: string; quantity: number } }[] = [];
        for (const line of valid) {
          const item = await db.inventory.where('name').equals(line.name).first();
          if (!item) {
            resultError = `Stokta bulunamadı: ${line.name}`;
            throw new Error(resultError);
          }
          if (item.quantity < line.quantity) {
            resultError = `Yetersiz stok: ${line.name} - mevcut ${item.quantity}, istenen ${line.quantity}`;
            throw new Error(resultError);
          }
          matched.push({ item, line });
        }

        // 2) Stok düş + çıkış shipment kayıtları
        for (const { item, line } of matched) {
          await db.inventory.update(item!.id, {
            quantity: item!.quantity - line.quantity,
            lastUpdated: isoDay(),
          });
          await db.shipments.add({
            id: trk(), ts: Date.now(), type: 'Çıkış', date: nowTr(),
            item: line.name, category: item!.category, location: item!.location,
            quantity: line.quantity, status: 'Tamamlandı', personnel: user, recipient: receiverName,
          });
        }

        // 3) deliveries + deliveryItems
        await db.deliveries.add({
          id: deliveryId, ts, project, projectLabel: PROJECT_LABELS[project], season, subType,
          receiverName, receiverGender, deliveredBy: user, deliveryDate: nowTr(),
          items: valid.map((i) => ({ name: i.name, quantity: i.quantity })),
          photoDataUrl, signatureDataUrl,
        });
        for (const { item, line } of matched) {
          await db.deliveryItems.add({
            deliveryId, itemId: item!.id, name: line.name, quantity: line.quantity,
          });
        }
      },
    );

    if (resultError) return { ok: false, error: resultError };
    await addLog(
      user, 'Teslimat Oluşturuldu',
      `${receiverName} → ${PROJECT_LABELS[project]}${subType !== '-' ? ' / ' + subType : ''} (${valid.length} kalem)`,
      'inventory',
    );
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Teslimat sırasında hata oluştu.' };
  }
}

/* --------------------------- Yönetim ---------------------------------- */

export async function resetData(user: string): Promise<void> {
  await db.transaction('rw', db.inventory, db.shipments, db.auditLogs, db.deliveries, db.deliveryItems, async () => {
    await Promise.all([
      db.inventory.clear(),
      db.shipments.clear(),
      db.deliveries.clear(),
      db.deliveryItems.clear(),
      db.auditLogs.clear(),
    ]);
  });
  await addLog(user, 'Veri Sıfırlama', 'Tüm envanter, sevkiyat ve teslimat verileri sıfırlandı.', 'system');
}

const SEED_FLAG = 'wms_seeded';
const MIGRATED_FLAG = 'wms_migrated_v1';

/**
 * Uygulama açılışında bir kez çağrılır:
 *  - localStorage'daki eski (inventory/shipments/auditLogs) verisini Dexie'ye taşır,
 *  - hâlâ boşsa demo veriyi (bir kez) yükler.
 */
export async function init(): Promise<void> {
  // 1) localStorage → Dexie tek seferlik migrasyon
  if (!localStorage.getItem(MIGRATED_FLAG)) {
    try {
      const inv = JSON.parse(localStorage.getItem('inventory') || '[]') as InventoryItem[];
      const shp = JSON.parse(localStorage.getItem('shipments') || '[]') as Shipment[];
      const lgs = JSON.parse(localStorage.getItem('auditLogs') || '[]') as AuditLog[];
      if (inv.length) await db.inventory.bulkPut(inv);
      if (shp.length) await db.shipments.bulkPut(shp.map((s, i) => ({ ...s, ts: s.ts ?? Date.now() - i })));
      if (lgs.length) await db.auditLogs.bulkPut(lgs.map((l, i) => ({ ...l, ts: l.ts ?? Date.now() - i })));
      if (inv.length || shp.length) localStorage.setItem(SEED_FLAG, 'true'); // mevcut veri varsa seed etme
    } catch {
      /* yok say */
    }
    localStorage.setItem(MIGRATED_FLAG, 'true');
  }

  // 2) İlk açılışta demo veri (bir kez)
  if (!localStorage.getItem(SEED_FLAG)) {
    const count = await db.inventory.count();
    if (count === 0) {
      await db.inventory.bulkAdd(SEED_INVENTORY);
    }
    localStorage.setItem(SEED_FLAG, 'true');
  }

  // 3a) Tekrarlayan sistem görevleri — sabit kimlikli, YOKSA ekle (idempotent).
  // Böylece uygulamayı önceden açmış kullanıcılarda da düzenli tekrar eden görevler garanti yer alır.
  const recurring = buildRecurringTasks('Sistem');
  for (let i = 0; i < recurring.length; i++) {
    const r = recurring[i];
    const exists = await db.tasks.get(r.id);
    if (!exists) await db.tasks.add({ ...r, ts: Date.now() + i });
  }

  // 3b) Tek seferlik kurulum görevleri — yalnız ilk kurulumda.
  const ONE_TIME_FLAG = 'wms_tasks_onetime_seeded';
  if (!localStorage.getItem(ONE_TIME_FLAG)) {
    const once = buildOneTimeTasks('Sistem');
    await db.tasks.bulkAdd(once.map((t, i) => ({ ...t, id: uid(), ts: Date.now() + 100 + i })));
    localStorage.setItem(ONE_TIME_FLAG, 'true');
  }

  // 4) Varsayılan kullanıcı hesapları (idempotent).
  await seedUsersIfEmpty();
}

/* --------------------------- İçe Aktarma ------------------------------ */

/**
 * Stok verisini içe aktarır. Modlar:
 *  - 'add'     : Mevcut ürüne (SKU veya ad eşleşmesi) miktarı EKLER; yoksa yeni kayıt.
 *  - 'upsert'  : Mevcut ürünün miktarını ve alanlarını gelen değerle GÜNCELLER (set); yoksa ekler.
 *  - 'replace' : TÜM envanteri siler ve gelen veriyle değiştirir.
 * Tümü tek transaction içinde (atomik).
 */
export async function importInventory(
  rows: ParsedInventoryRow[],
  mode: ImportMode,
  user: string,
): Promise<ImportResult> {
  if (!rows.length) return { ok: false, added: 0, updated: 0, total: 0, error: 'İçe aktarılacak satır bulunamadı.' };

  let added = 0;
  let updated = 0;

  try {
    await db.transaction('rw', db.inventory, db.shipments, db.auditLogs, async () => {
      if (mode === 'replace') {
        await db.inventory.clear();
      }

      for (const row of rows) {
        // Eşleşme: önce SKU, sonra ad.
        let existing: InventoryItem | undefined;
        if (mode !== 'replace') {
          existing = await db.inventory.where('sku').equals(row.sku).first();
          if (!existing) existing = await db.inventory.where('name').equals(row.name).first();
        }

        if (existing && mode === 'add') {
          await db.inventory.update(existing.id, {
            quantity: existing.quantity + row.quantity,
            lastUpdated: isoDay(),
          });
          updated++;
        } else if (existing && mode === 'upsert') {
          await db.inventory.update(existing.id, {
            name: row.name,
            category: row.category,
            quantity: row.quantity,
            unit: row.unit,
            location: row.location,
            criticalLevel: row.criticalLevel,
            expiryDate: row.expiryDate,
            lastUpdated: isoDay(),
          });
          updated++;
        } else {
          await db.inventory.add({
            id: uid(),
            name: row.name,
            sku: row.sku,
            category: row.category,
            quantity: row.quantity,
            unit: row.unit,
            location: row.location,
            criticalLevel: row.criticalLevel,
            expiryDate: row.expiryDate,
            lastUpdated: isoDay(),
          });
          added++;
        }
      }
    });

    const modeLabel = mode === 'add' ? 'Üzerine Ekle' : mode === 'upsert' ? 'Güncelle' : 'Tümünü Değiştir';
    await addLog(
      user,
      'Stok İçe Aktarma',
      `${rows.length} satır içe aktarıldı (${modeLabel}). Eklenen: ${added}, Güncellenen: ${updated}.`,
      'inventory',
    );
    return { ok: true, added, updated, total: rows.length };
  } catch (e: any) {
    return { ok: false, added, updated, total: rows.length, error: e?.message || 'İçe aktarma hatası.' };
  }
}

/* --------------------------- Görev & Hatırlatıcı ---------------------- */

export async function addTask(t: Omit<TaskItem, 'id' | 'ts'>): Promise<void> {
  await db.tasks.add({ ...t, id: uid(), ts: Date.now() });
}
export async function updateTask(id: string, patch: Partial<TaskItem>): Promise<void> {
  await db.tasks.update(id, patch);
}
export async function toggleTaskDone(id: string): Promise<void> {
  const t = await db.tasks.get(id);
  if (t) await db.tasks.update(id, { done: !t.done });
}
export async function deleteTask(id: string): Promise<void> {
  await db.tasks.delete(id);
}

/* --------------------------- Bildirimler (zil) ------------------------ */

/** Bildirim ekler. dedupeKey verilirse aynı anahtarlı kayıt varsa eklemez. */
export async function pushNotification(n: {
  title: string;
  message: string;
  type: NotificationItem['type'];
  dedupeKey?: string;
}): Promise<void> {
  if (n.dedupeKey) {
    const existing = await db.notifications.where('dedupeKey').equals(n.dedupeKey).first();
    if (existing) return;
  }
  await db.notifications.add({
    id: uid(), ts: Date.now(), read: false, pinned: false,
    title: n.title, message: n.message, type: n.type, dedupeKey: n.dedupeKey,
  });
  // En fazla 200 bildirim tut (sabitlenmişler korunur).
  const count = await db.notifications.count();
  if (count > 200) {
    const extras = await db.notifications.orderBy('ts').limit(count - 200).toArray();
    await db.notifications.bulkDelete(extras.filter((x) => !x.pinned).map((x) => x.id));
  }
}

export async function setNotificationRead(id: string, read: boolean): Promise<void> {
  await db.notifications.update(id, { read });
}
export async function toggleNotificationPin(id: string): Promise<void> {
  const n = await db.notifications.get(id);
  if (n) await db.notifications.update(id, { pinned: !n.pinned });
}
export async function markAllNotificationsRead(): Promise<void> {
  const all = await db.notifications.toArray();
  await db.notifications.bulkPut(all.map((n) => ({ ...n, read: true })));
}
export async function deleteNotification(id: string): Promise<void> {
  await db.notifications.delete(id);
}
export async function clearReadNotifications(): Promise<void> {
  const read = await db.notifications.filter((n) => n.read && !n.pinned).toArray();
  await db.notifications.bulkDelete(read.map((n) => n.id));
}

/* --------------------------- Kullanıcı Yönetimi (admin) --------------- */

const DEFAULT_USERS: UserAccount[] = [
  { id: 'user-admin',  username: 'admin',  name: 'Doğukan BARA', role: 'admin',     password: 'admin123',  createdAt: '' },
  { id: 'user-depocu', username: 'depocu', name: 'Hasan Koçak',  role: 'personnel', password: 'depocu123', createdAt: '' },
];

/** Varsayılan hesapları yoksa ekler (idempotent). */
export async function seedUsersIfEmpty(): Promise<void> {
  for (const u of DEFAULT_USERS) {
    const exists = await db.users.get(u.id);
    if (!exists) await db.users.add({ ...u, createdAt: isoDay() });
  }
}

/** Kullanıcı adı + şifre doğrular. Başarılıysa rol+ad döner, değilse null. */
export async function authenticate(username: string, password: string): Promise<AuthResult | null> {
  const u = await db.users.where('username').equals(username.trim().toLowerCase()).first()
    ?? await db.users.where('username').equals(username.trim()).first();
  if (!u || u.password !== password) return null;
  return { role: u.role, name: u.name, username: u.username };
}

export async function addUser(
  data: { username: string; name: string; role: UserAccount['role']; password: string },
  actor: string,
): Promise<{ ok: boolean; error?: string }> {
  const username = data.username.trim().toLowerCase();
  if (!username || !data.name.trim() || !data.password) return { ok: false, error: 'Tüm alanlar zorunludur.' };
  const existing = await db.users.where('username').equals(username).first();
  if (existing) return { ok: false, error: 'Bu kullanıcı adı zaten kullanımda.' };
  await db.users.add({
    id: uid(), username, name: data.name.trim(), role: data.role, password: data.password, createdAt: isoDay(),
  });
  await addLog(actor, 'Kullanıcı Ekleme', `${data.name} (${username}) — ${data.role} olarak eklendi.`, 'security');
  return { ok: true };
}

export async function deleteUser(id: string, actor: string): Promise<{ ok: boolean; error?: string }> {
  const u = await db.users.get(id);
  if (!u) return { ok: false, error: 'Kullanıcı bulunamadı.' };
  if (u.role === 'admin') {
    const adminCount = await db.users.where('role').equals('admin').count();
    if (adminCount <= 1) return { ok: false, error: 'Son yöneticiyi silemezsiniz.' };
  }
  await db.users.delete(id);
  await addLog(actor, 'Kullanıcı Silme', `${u.name} (${u.username}) silindi.`, 'security');
  return { ok: true };
}

export async function updateUser(
  id: string,
  patch: Partial<Pick<UserAccount, 'name' | 'role' | 'password'>>,
  actor: string,
): Promise<{ ok: boolean; error?: string }> {
  const u = await db.users.get(id);
  if (!u) return { ok: false, error: 'Kullanıcı bulunamadı.' };
  // Son yöneticinin rolü düşürülemez.
  if (u.role === 'admin' && patch.role && patch.role !== 'admin') {
    const adminCount = await db.users.where('role').equals('admin').count();
    if (adminCount <= 1) return { ok: false, error: 'Son yöneticinin rolü değiştirilemez.' };
  }
  await db.users.update(id, patch);
  await addLog(actor, 'Kullanıcı Güncelleme', `${u.name} (${u.username}) güncellendi.`, 'security');
  return { ok: true };
}

/* --------------------------- Toplu Giriş ------------------------------ */

/** Toplu malzeme girişi: her satır için merge/ekle + Giriş hareketi (ortak kanıt). Atomik. */
export async function bulkEntry(
  rows: BulkEntryRow[],
  user: string,
  proof?: MovementProof,
): Promise<{ ok: boolean; count: number; error?: string }> {
  const valid = rows.filter((r) => r.name.trim() && Number(r.quantity) > 0);
  if (!valid.length) return { ok: false, count: 0, error: 'Geçerli satır yok.' };
  try {
    await db.transaction('rw', db.inventory, db.shipments, db.auditLogs, async () => {
      for (const r of valid) {
        const qty = Number(r.quantity);
        const name = r.name.trim();
        let existing = r.sku ? await db.inventory.where('sku').equals(r.sku).first() : undefined;
        if (!existing) existing = await db.inventory.where('name').equals(name).first();
        const category = r.category || existing?.category || 'Diğer';
        const location = r.location || existing?.location || 'Ana Depo';
        if (existing) {
          await db.inventory.update(existing.id, { quantity: existing.quantity + qty, lastUpdated: isoDay() });
        } else {
          await db.inventory.add({
            id: uid(), name, sku: r.sku || name.slice(0, 3).toUpperCase() + '-' + Math.floor(1000 + Math.random() * 9000),
            category, quantity: qty, unit: r.unit || 'Adet', location, criticalLevel: 0, lastUpdated: isoDay(),
          });
        }
        await db.shipments.add({
          id: trk(), ts: Date.now(), type: 'Giriş', date: nowTr(),
          item: name, category, location, quantity: qty, status: 'Tamamlandı', personnel: user, ...(proof || {}),
        });
      }
    });
    await addLog(user, 'Toplu Malzeme Girişi', `${valid.length} kalem giriş yapıldı.`, 'inventory');
    return { ok: true, count: valid.length };
  } catch (e: any) {
    return { ok: false, count: 0, error: e?.message || 'Toplu giriş hatası.' };
  }
}

/* --------------------------- Hızlı/Toplu Çıkış ------------------------ */

/** Çoklu ürünü tek alıcıya hızlı çıkış. Stok asla eksiye düşmez (atomik ön-kontrol). */
export async function quickExit(
  lines: QuickExitLine[],
  recipient: string,
  user: string,
  proof?: MovementProof,
): Promise<DeliveryResult> {
  const valid = lines.filter((l) => l.name.trim() && Number(l.quantity) > 0);
  if (!recipient.trim()) return { ok: false, error: 'Alıcı adı zorunludur.' };
  if (!valid.length) return { ok: false, error: 'En az bir ürün seçilmelidir.' };
  try {
    let err: string | null = null;
    await db.transaction('rw', db.inventory, db.shipments, db.auditLogs, async () => {
      const matched: { item: InventoryItem; qty: number }[] = [];
      for (const l of valid) {
        const item = await db.inventory.where('name').equals(l.name).first();
        if (!item) { err = `Stokta bulunamadı: ${l.name}`; throw new Error(err); }
        if (item.quantity < l.quantity) { err = `Yetersiz stok: ${l.name} - mevcut ${item.quantity}, istenen ${l.quantity}`; throw new Error(err); }
        matched.push({ item, qty: Number(l.quantity) });
      }
      for (const { item, qty } of matched) {
        await db.inventory.update(item.id, { quantity: item.quantity - qty, lastUpdated: isoDay() });
        await db.shipments.add({
          id: trk(), ts: Date.now(), type: 'Çıkış', date: nowTr(),
          item: item.name, category: item.category, location: item.location,
          quantity: qty, status: 'Tamamlandı', personnel: user, recipient, ...(proof || {}),
        });
      }
    });
    if (err) return { ok: false, error: err };
    await addLog(user, 'Hızlı Toplu Çıkış', `${recipient} → ${valid.length} kalem çıkış.`, 'inventory');
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Çıkış hatası.' };
  }
}
