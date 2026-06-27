# Genel Rapor ve Excel Export (Sadece Yönetici)

## Rapor Ekranı İçeriği
Yönetici girişinde anasayfada görünen "Genel Rapor" bölümü/sayfası şu bilgileri listeler:

- Tüm teslimat (çıkış) kayıtları, filtrelenebilir:
  - Tarih aralığı
  - Proje (Temizlik / Tüm ve Çay)
  - Personel adı (arama)
- Her satırda:
  - Teslim eden personel (depocu)
  - Teslim alan personel (ad soyad)
  - Proje / alt tür (yazlık-kışlık)
  - Ürünler ve adetleri
  - Teslim tarihi
  - İmza/fotoğraf görüntüsü linki

- Ayrıca genel stok özeti: kategori bazında toplam adet, kritik/düşük stok uyarıları (opsiyonel ileri seviye özellik)

## Excel Export
"Excel Olarak İndir" butonuna basıldığında, **o anki filtrelenmiş veri** ile bir `.xlsx` dosyası oluşturulur.

### Excel Sütun Yapısı
| Sütun | Açıklama |
|---|---|
| Teslim Eden Personel | Depocu adı |
| Teslim Alan Personel | Ad Soyad |
| Proje | Temizlik / Tüm ve Çay |
| Alt Tür | Yazlık / Kışlık / - |
| Ürünler | Ürün adı x Adet (birden fazla ürün varsa satır içinde listelenir veya her ürün için ayrı satır) |
| Toplam Adet | |
| Teslim Tarihi | |
| İmza/Fotoğraf Linki | Tıklanabilir hyperlink (görsele giden URL) |

> **Tasarım Notu:** Bir teslimatta birden fazla ürün olduğu için iki yaklaşım mümkündür:
> 1. Her ürün için ayrı satır + aynı "Teslimat ID" ile gruplama (analiz için daha uygun)
> 2. Tek satırda tüm ürünler "Tişört x2, Pantolon x2, Ayakkabı x1" şeklinde birleştirilmiş
>
> Önerilen: Varsayılan görünüm seçenek (2), detaylı analiz için seçenek (1) de filtre olarak sunulabilir.

## Teknik Öneri (Excel Üretimi)
- Backend tarafında Excel üretimi için PHP'de **PhpSpreadsheet** kütüphanesi kullanılabilir.
- Endpoint: `/api/rapor/excel?baslangic=...&bitis=...&proje=...`
- İndirme anlık (gerçek zamanlı veriden) üretilir, önceden oluşturulmuş statik dosya değildir.

## Yetki Kontrolü
- `/rapor` ve `/api/rapor/excel` endpoint'leri backend tarafında sadece `role = "yonetici"` ise
  erişime açılır; depocu bu adrese istek atarsa 403 Forbidden dönmelidir.

---

## 🔧 Gerçek Uygulama (React — Client-side Excel)
> Backend yok → Excel **tarayıcıda** `xlsx` (SheetJS, zaten kurulu) ile üretilir.

- **Bileşen:** `src/components/ReportView.tsx` (mevcut — güçlendirilecek). Dashboard `case 'reports'`, **sadece `role==='admin'`**.
- **Veri kaynağı:** `useLiveQuery` ile `db.deliveries` + `db.deliveryItems` (+ `shipments`). Filtreler client-side:
  tarih aralığı, proje, personel adı arama.
- **Excel üretimi `src/lib/excel.ts`:**
```ts
import * as XLSX from 'xlsx';
export function exportDeliveriesToExcel(rows: ReportRow[]) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Teslimatlar');
  XLSX.writeFile(wb, `rapor_${new Date().toISOString().slice(0,10)}.xlsx`);
}
```
- **Sütunlar:** Teslim Eden | Teslim Alan | Proje | Alt Tür | Ürünler ("Tişört x2, ...") | Toplam Adet | Tarih | Kanıt.
  Varsayılan: tek satırda birleşik ürünler (plandaki seçenek 2). "Detaylı" modda ürün-başına-satır (seçenek 1).
- **Kanıt (imza/foto):** dataURL Excel hücresine sığmaz → hücrede "Uygulamada Görüntüle" notu; görseller
  uygulama içi teslimat detay modalında açılır. (İstenirse ayrı: foto/imza dataURL'leri ayrı sheet'e yazılabilir.)
- **Yetki:** `personnel` rolü rapor menüsünü görmez; ReportView render guard'ı da rolü tekrar kontrol eder.
- **recharts:** rapor ekranında kategori bazlı stok/teslimat grafikleri (mevcut `recharts` ile).

---

## 🔁 İçe / Dışa Aktarma (IO) — `src/lib/io.ts`
> Tüm dışa aktarma **Blob + anchor** ile yapılır (XLSX.writeFile sandbox/iframe'de sessizce başarısız olabilir).

- **Dışa aktarma formatları:** **XLSX** (`XLSX.write` → ArrayBuffer → Blob), **CSV** (UTF-8 BOM'lu, `;` ayraçlı),
  **HTML** (markalı sunum raporu). Paylaşılan UI: `ExportMenu.tsx` (3 format dropdown).
- **Markalı HTML rapor (`buildBrandedHTML`):** sunum/yazdırma kalitesinde; köşede sabit **Precision Logistics
  antet imzası** (layout'u bozmaz), `@media print` desteği, zebra tablo, başlık + filtre özeti + kayıt sayacı.
- **Stok dışa aktarma:** `exportInventory(items, format)` — InventoryTable'daki `ExportMenu`'den çağrılır.
- **İçe aktarma:** `parseInventoryFile(file)` XLSX/CSV → `ParsedInventoryRow[]` (esnek TR/EN başlık eşleme).
  UI: `ImportDialog.tsx` (dosya → önizleme → mod → onay). `repo.importInventory(rows, mode)` **3 mod**:
  | Mod | Davranış |
  |---|---|
  | `add` (Üzerine Ekle) | Eşleşen üründe miktarı **ekler**, yoksa yeni kayıt |
  | `upsert` (Güncelle) | Eşleşen ürünü gelen değerle **set eder**, yoksa ekler |
  | `replace` (Tümünü Değiştir) | Tüm envanteri **siler**, dosyadakilerle değiştirir |
  Tümü tek Dexie **transaction** içinde + audit log.
