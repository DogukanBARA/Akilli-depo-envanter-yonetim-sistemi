/**
 * Dexie (IndexedDB) veri katmanı şeması.
 * Tarayıcı-yerel, sunucu gerektirmeyen, gerçek transaction destekli kalıcı depolama.
 * Tüm erişim `repo.ts` üzerinden yapılır — bileşenler doğrudan `db`'ye dokunmaz
 * (okuma için `useLiveQuery` hariç).
 */
import Dexie, { Table } from 'dexie';
import {
  InventoryItem,
  Shipment,
  AuditLog,
  Delivery,
  DeliveryItem,
  TaskItem,
  NotificationItem,
  UserAccount,
} from '../types';

export class WmsDB extends Dexie {
  inventory!: Table<InventoryItem, string>;
  shipments!: Table<Shipment, string>;
  auditLogs!: Table<AuditLog, string>;
  deliveries!: Table<Delivery, string>;
  deliveryItems!: Table<DeliveryItem, number>;
  tasks!: Table<TaskItem, string>;
  notifications!: Table<NotificationItem, string>;
  users!: Table<UserAccount, string>;

  constructor() {
    super('wmsDB');
    this.version(1).stores({
      // birincil anahtar + indekslenen alanlar
      inventory: 'id, sku, name, category, location, quantity',
      shipments: 'id, ts, type, date, category, personnel',
      auditLogs: 'id, ts, user, type',
      deliveries: 'id, ts, project, receiverGender',
      deliveryItems: '++autoId, deliveryId, itemId',
    });
    // v2: görev & hatırlatıcı tablosu (diğer tablolar korunur).
    this.version(2).stores({
      tasks: 'id, ts, dueAt, done',
    });
    // v3: bildirim (zil) tablosu.
    this.version(3).stores({
      notifications: 'id, ts, read, pinned, dedupeKey',
    });
    // v4: kullanıcı hesapları (yalnız admin yönetir).
    this.version(4).stores({
      users: 'id, &username, role',
    });
  }
}

export const db = new WmsDB();
