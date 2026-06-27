# Malzeme Girişi Akışı

## Form Alanları (Sıralı)
1. **Ürün Adı** (metin / mevcut üründen seçim)
2. **Ürün Kategorisi** (dropdown – sabit kategori listesi: Tişört, Pantolon, Ayakkabı, Eşarp,
   Polar, Mont, Boyunluk, Gömlek, Yelek, Kravat, Fular vb.)
3. **Adet** (sayısal giriş)
4. **Bulunduğu Konum** (metin veya dropdown – Depo A / Raf 3 gibi)
5. **Giriş Tarihi** (tarih seçici, varsayılan: bugün)

## Akış
1. Depocu "Malzeme Girişi" sayfasını açar.
2. Yukarıdaki formu doldurur.
3. "Kaydet" butonuna basar.
4. Sistem kontrol eder:
   - Aynı ürün adı + kategori + konum kombinasyonu zaten var mı?
     - **Varsa:** mevcut `products` kaydının `quantity` alanına eklenen adet eklenir (stok artışı).
     - **Yoksa:** yeni bir `products` kaydı oluşturulur.
5. `stock_movements` tablosuna `type = "giris"` olarak log kaydı eklenir.
6. Anasayfadaki **Stok Durumu** widget'ı anlık olarak güncellenir (sayfa yenilenmeden,
   örn. AJAX/fetch ile veya WebSocket ile gerçek zamanlı güncelleme).

## Doğrulama Kuralları
- Adet alanı 0'dan büyük olmalı.
- Ürün adı ve kategori boş bırakılamaz.
- Giriş tarihi gelecek bir tarih olamaz (opsiyonel kısıtlama).

## Ekran Önerisi (Mobil Uyumlu)
- Tek sütun form (mobilde tam genişlik inputlar)
- Büyük dokunmatik butonlar
- Kategori seçimi için arama yapılabilir dropdown (çok kategori olursa kolaylık sağlar)

---

## 🔧 Gerçek Uygulama (React)
- **Bileşen:** `src/components/ProductForm.tsx` (mevcut — güçlendirilecek). Dashboard'da `case 'add'`.
- **Alanlar (`InventoryItem`):** `name`, `category`, `sku`, `quantity`, `unit`, `location`,
  `criticalLevel`, opsiyonel `expiryDate`. `id` = `crypto.randomUUID()`, `lastUpdated` = ISO tarih.
- **Kategoriler:** sabit liste `src/data/categories.ts` (Tişört, Pantolon, Ayakkabı, Eşarp, Polar,
  Mont, Boyunluk, Gömlek, Yelek, Kravat, Fular...). Aranabilir dropdown.
- **Kayıt mantığı (`repo.addStock`):** aynı `name+category+location` varsa `quantity += adet` (güncelle),
  yoksa yeni kayıt. Ardından `shipments`'e `type:'Giriş'` hareketi + `auditLogs`'a kayıt — Dexie transaction içinde.
- **Reaktif güncelleme:** Dashboard `useLiveQuery` kullandığı için stok kartları **otomatik** tazelenir
  (manuel state push'a gerek kalmaz; mevcut `handleAddProduct` repo çağrısına indirgenir).
- **Doğrulama:** adet > 0, name/category zorunlu, gelecek tarih engeli (opsiyonel). Inline hata mesajları.
- **Tasarım:** mevcut form stili (pastel kartlar, `motion`) korunur; mobile-first tek sütun.
