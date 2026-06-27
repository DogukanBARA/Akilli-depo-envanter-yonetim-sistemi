# 14 — Toplu Giriş/Çıkış + Kanıt (Fatura/Foto)

## Hedef
- **Malzeme Giriş** ve **Malzeme Çıkış** bölümlerine **toplu işlem** ekle.
- Girişlerde **kanıt** (fatura/foto) ve detay (not, tedarikçi) ekleyebilme.

## Gerçek Uygulama (React + Dexie)
### Tip genişletme (`types.ts` — Shipment'e opsiyonel alanlar)
```ts
photoDataUrl?: string;   // kanıt foto/fatura
note?: string;           // açıklama
supplier?: string;       // tedarikçi (giriş)
```
(Geriye dönük uyumlu; mevcut kayıtlar etkilenmez.)

### Malzeme Giriş — `StockEntry.tsx` (YENİ; Dashboard `case 'entry'`)
- **Tekli / Toplu** sekmesi.
- **Tekli:** mevcut/yeni ürün seç, adet, konum, **tedarikçi, not, fatura/foto** (PhotoCapture).
- **Toplu:** çok satırlı grid (ürün, adet, konum) + ortak kanıt (fatura foto) + not → tek işlemde Dexie'ye.
- `repo.materialEntry`/`addProduct` opsiyonel `proof` parametresi alır (photoDataUrl/note/supplier shipment'e yazılır).
- Mevcut giriş geçmişi (`ShipmentTable Giriş`) altta gösterilebilir.

### Malzeme Çıkış — Toplu/Hızlı Çıkış
- `case 'exit'` girişine **mod seçimi:** "Kit Sihirbazı" (mevcut `StockExitWizard`) | "Hızlı Toplu Çıkış" (`QuickExit.tsx`).
- **`QuickExit.tsx` (YENİ):** envanterden çoklu ürün+adet seçimi, alıcı adı, opsiyonel foto/imza, tek işlemde
  `repo` ile stok düşümü (atomik; stok eksiye düşmez). Kanıt opsiyonel.

### Repo
- `materialEntry(itemId, qty, user, proof?)` ve `addProduct(item, user, proof?)` → shipment'e kanıt alanlarını yazar.
- `bulkEntry(rows, user, proof?)` (opsiyonel) toplu giriş için.
- `quickExit(lines, recipient, user, proof?)` toplu çıkış (transaction; her satır stok kontrolü).

## Kurallar
- Stok asla eksiye düşmez. Kanıt opsiyonel ama girişte önerilir. Fatura foto ~2MB üstü sıkıştırılır (PhotoCapture).

## Kabul Kriteri
- Girişte tekli+toplu+kanıt çalışır. Çıkışta sihirbaz + hızlı toplu çıkış seçilebilir. Hepsi Dexie'de atomik + audit log.
