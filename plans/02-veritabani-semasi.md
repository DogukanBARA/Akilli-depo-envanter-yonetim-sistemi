# Veritabanı Şeması (Öneri)

> Not: İlişkisel bir veritabanı (PostgreSQL / MySQL) önerilir çünkü stok adetleri gibi sayısal
> alanlarda eşzamanlılık (concurrency) kontrolü ve transaction desteği önemlidir.

## 1. `users` (Kullanıcılar)
| Alan | Tip | Açıklama |
|---|---|---|
| id | INT (PK) | |
| username | VARCHAR | |
| password_hash | VARCHAR | |
| role | ENUM('depocu','yonetici') | |
| created_at | DATETIME | |

## 2. `categories` (Ürün Kategorileri)
| Alan | Tip | Açıklama |
|---|---|---|
| id | INT (PK) | |
| name | VARCHAR | Örn: "Tişört", "Pantolon", "Ayakkabı", "Eşarp" vb. |

## 3. `products` (Ürünler / Stok Kalemleri)
| Alan | Tip | Açıklama |
|---|---|---|
| id | INT (PK) | |
| name | VARCHAR | Ürün adı |
| category_id | INT (FK) | |
| location | VARCHAR | Bulunduğu konum/raf |
| quantity | INT | **Anlık stok adedi** |
| created_at | DATETIME | İlk giriş tarihi |
| updated_at | DATETIME | Son güncelleme |

## 4. `stock_movements` (Stok Hareketleri – Giriş/Çıkış Logu)
| Alan | Tip | Açıklama |
|---|---|---|
| id | INT (PK) | |
| product_id | INT (FK) | |
| type | ENUM('giris','cikis') | |
| quantity | INT | Hareket adedi |
| date | DATETIME | |
| performed_by | INT (FK -> users) | İşlemi yapan depocu |
| delivery_id | INT (FK -> deliveries, nullable) | Çıkış ise teslimat kaydına bağlanır |

## 5. `projects` (Proje Türleri)
| Alan | Tip | Açıklama |
|---|---|---|
| id | INT (PK) | |
| name | VARCHAR | "Temizlik", "Tüm ve Çay" |

## 6. `deliveries` (Teslimatlar / Çıkış Zimmet Kayıtları)
| Alan | Tip | Açıklama |
|---|---|---|
| id | INT (PK) | |
| project_id | INT (FK) | Temizlik / Tüm ve Çay |
| sub_type | VARCHAR | Örn: "Yazlık", "Kışlık" (Temizlik için), Tüm ve Çay'da boş/sabit |
| receiver_name | VARCHAR | Teslim alan personelin adı soyadı |
| receiver_gender | ENUM('erkek','kadin') | Cinsiyete özel ürün ayrımı için (eşarp/kravat/fular) |
| delivered_by | INT (FK -> users) | Teslim eden depocu |
| photo_url | VARCHAR | Yüklenen fotoğraf dosya yolu |
| signature_url | VARCHAR | İmza görüntüsü (PNG) dosya yolu |
| delivery_date | DATETIME | |

## 7. `delivery_items` (Teslimat İçindeki Ürün Kalemleri)
| Alan | Tip | Açıklama |
|---|---|---|
| id | INT (PK) | |
| delivery_id | INT (FK) | |
| product_id | INT (FK) | |
| quantity | INT | O üründen kaç adet verildiği |

---

## İlişki Özeti
```
users 1---N stock_movements
products 1---N stock_movements
projects 1---N deliveries
deliveries 1---N delivery_items
products 1---N delivery_items
deliveries 1---N stock_movements (çıkış tipi olanlar)
```

## Stok Güncelleme Mantığı
- Giriş yapıldığında: `products.quantity += girilen_adet` + `stock_movements` kaydı (type=giris)
- Çıkış yapıldığında (teslimat onaylanınca): her `delivery_item` için
  `products.quantity -= verilen_adet` + `stock_movements` kaydı (type=cikis, delivery_id bağlı)
- Bu işlemler bir **transaction** içinde yapılmalı (ya hepsi başarılı olur ya hiçbiri) ki stok
  tutarsızlığı oluşmasın.

---

## 🔧 Gerçek Uygulama (Dexie / IndexedDB)
> İlişkisel DB yerine **Dexie.js** kullanılır. Dexie gerçek transaction (`db.transaction('rw', ...)`)
> destekler — stok tutarsızlığı önlenir. Şema `src/lib/db.ts`:

```ts
// src/lib/db.ts
import Dexie, { Table } from 'dexie';
import { InventoryItem, Shipment, AuditLog, Delivery, DeliveryItem } from '../types';

export class WmsDB extends Dexie {
  inventory!: Table<InventoryItem, string>;
  shipments!: Table<Shipment, string>;
  auditLogs!: Table<AuditLog, string>;
  deliveries!: Table<Delivery, string>;
  deliveryItems!: Table<DeliveryItem, number>;

  constructor() {
    super('wmsDB');
    this.version(1).stores({
      inventory:     'id, name, category, location, quantity',
      shipments:     'id, type, date, category, personnel',
      auditLogs:     'id, timestamp, user, type',
      deliveries:    'id, projectId, receiverGender, deliveryDate',
      deliveryItems: '++id, deliveryId, itemId',
    });
  }
}
export const db = new WmsDB();
```

- **Tablo eşleme:** plandaki `products`→`inventory`, `stock_movements`→`shipments` (mevcut tip),
  `deliveries`/`delivery_items` yeni eklenir. `categories`/`projects` sabit listedir (Dexie tablosu gerekmez).
- **Yeni tipler** `types.ts`'e eklenir: `Delivery`, `DeliveryItem`, `ProjectType`, `Gender`.
- **Atomik teslimat:** çıkış işlemi `db.transaction('rw', db.inventory, db.shipments, db.deliveries, db.deliveryItems, ...)`
  içinde yapılır → stok düşümü + shipment + delivery hepsi birlikte commit/rollback.
- **Reaktiflik:** bileşenler `useLiveQuery(() => db.inventory.toArray())` ile veriyi canlı dinler.
- **Repository:** tüm erişim `src/lib/repo.ts` üzerinden (bileşenler doğrudan `db`'ye dokunmaz).
- **Migrasyon:** ilk açılışta localStorage'daki eski `inventory`/`shipments` varsa Dexie'ye taşınır (one-time).
