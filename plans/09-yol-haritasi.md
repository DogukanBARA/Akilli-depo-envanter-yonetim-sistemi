# Geliştirme Yol Haritası (Önerilen Fazlar)

## Faz 1 – Temel Altyapı
- [ ] Proje kurulumu (Laravel + veritabanı bağlantısı)
- [ ] `users` tablosu + giriş/çıkış (login) sistemi
- [ ] Rol bazlı yönlendirme (Depocu / Yönetici)
- [ ] Responsive temel layout (header, menü, içerik alanı)

## Faz 2 – Stok Yönetimi
- [ ] `categories`, `products` tabloları
- [ ] Malzeme girişi formu ve kayıt mantığı
- [ ] Anasayfada anlık stok durumu listesi/kartları
- [ ] Stok hareketleri (`stock_movements`) loglama

## Faz 3 – Malzeme Çıkışı (Teslimat) Akışı
- [ ] `projects`, `deliveries`, `delivery_items` tabloları
- [ ] Personel bilgisi + proje seçimi adımı
- [ ] Temizlik (yazlık/kışlık) ve Tüm-Çay kıyafet listelerinin otomatik getirilmesi
- [ ] Cinsiyete özel ürün filtresi (eşarp/kravat/fular)
- [ ] Stok yeterlilik kontrolü ve düşme mantığı

## Faz 4 – Fotoğraf ve E-İmza
- [ ] Fotoğraf yükleme alanı (kamera desteği)
- [ ] E-imza canvas modülü (boş sayfa, ad-soyad + imza)
- [ ] Dosyaların sunucuda saklanması ve teslimat kaydına bağlanması

## Faz 5 – Raporlama
- [ ] Yönetici rapor ekranı (filtreleme: tarih, proje, personel)
- [ ] İmza/fotoğraf linklerinin rapor satırlarına eklenmesi
- [ ] Excel export (PhpSpreadsheet/Laravel Excel entegrasyonu)

## Faz 6 – Cilalama ve Test
- [ ] Mobil cihazlarda gerçek test (özellikle imza ve kamera)
- [ ] Performans testi (büyük stok/teslimat verisiyle)
- [ ] Kullanıcı kabul testi (gerçek depocu ile deneme)
- [ ] Hata senaryoları (yetersiz stok, boş imza, eksik form) testleri

## İleride Eklenebilecekler (Opsiyonel/Gelecek Fazlar)
- Çoklu depocu/yönetici hesabı desteği
- Kritik stok seviyesi bildirimleri (e-posta/SMS)
- Kıyafet setlerinin yönetici panelinden düzenlenebilmesi (kod değişikliği gerektirmeden)
- Geçmiş teslimatların PDF olarak da indirilebilmesi

---

## 🔧 Gerçek Uygulama — GÜNCEL DURUM & PARALEL YOL HARİTASI
> Laravel fazları yerine, mevcut React projesine entegrasyon iş paketleri (WP). Durum işaretli.

### ✅ Zaten Var (mevcut kod ~3200 satır)
- [x] Login (2FA demo, remember-me), Dashboard kabuğu, dark mode, bildirim, kritik stok modalı
- [x] InventoryTable, ShipmentTable, ProductForm, ReportView, SettingsView, ProfileView, AuditLogView
- [x] localStorage kalıcılık (→ Dexie'ye taşınacak)

### 🔄 / ⏳ İş Paketleri (paralel)
- **WP0 — Çekirdek:** `dexie` kur, `db.ts`/`repo.ts`/`kits.ts`/`categories.ts`/`seed.ts`, `types.ts` genişlet,
  Dashboard veri katmanını `useLiveQuery`+repo'ya taşı, scaffolding. *(önce; herkes buna bağlı)*
- **WP1 — Çıkış Sihirbazı:** `StockExitWizard.tsx` (5 adım) + Dashboard `case 'exit'` bağla.
- **WP2 — İmza/Foto:** `SignaturePad.tsx`, `PhotoCapture.tsx`.
- **WP3 — Rapor/Excel:** `ReportView.tsx` güçlendir + `excel.ts`.
- **WP4 — Stok/Envanter:** `ProductForm.tsx`, `InventoryTable.tsx` repo entegrasyonu + kritik stok.
- **WP5 — Landing:** `Landing.tsx` + `App.tsx` route.
- **WP6 — Rol/Audit:** `Login.tsx`, `AuditLogView.tsx`, `SettingsView.tsx` hizalama.
- **Verifier:** `tsc --noEmit` + `npm run build` + plan/unutulmamasi uyum → FINISH.

### Çalışma Prensibi
WP0 tamamlanır → WP1–WP6 **paralel** (çakışmasız dosya sahipliği) → tek **Verifier** ajan teyit → FINISH → README.
