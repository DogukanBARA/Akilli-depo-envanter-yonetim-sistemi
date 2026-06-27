# Teknik Mimari Önerisi

## Genel Yapı
- **Backend:** PHP (kullanıcının PHP web programlama altyapısına uygun şekilde — Laravel önerilir,
  ölçeklenebilir ve hızlı geliştirme sağlar; saf PHP de mümkün ama Laravel ile auth, ORM (Eloquent),
  migration gibi araçlar hazır gelir)
- **Veritabanı:** MySQL / MariaDB
- **Frontend:** Blade (Laravel) + Bootstrap 5 veya Tailwind CSS (responsive grid sistemi için)
  - Mobil uyumluluk için mutlaka mobile-first CSS yaklaşımı
- **Anlık Güncelleme (Stok):**
  - Basit yöntem: Sayfa içinde periyodik AJAX (fetch) ile stok verisini yeniden çekme (örn. her 5-10 sn)
  - Daha gelişmiş: WebSocket / Laravel Echo + Pusher (gerçek zamanlı, opsiyonel ileri seviye)
- **E-İmza:** `signature_pad` JS kütüphanesi (canvas tabanlı, hafif, mobil dokunmatik destekli)
- **Fotoğraf Yükleme:** Standart dosya/kamera input + sunucu tarafı dosya saklama (`storage/app/public`)
- **Excel Export:** PhpSpreadsheet (Laravel ile `maatwebsite/excel` paketi kullanılabilir)
- **Kimlik Doğrulama:** Laravel'in yerleşik auth sistemi + rol alanı (basit 2 rollü yapı)

## Responsive Tasarım Prensipleri
- Mobilde: tek sütun, büyük dokunmatik alanlar, alt navigasyon menüsü (bottom nav) düşünülebilir
- Tablet/Masaüstü: yan menü (sidebar) + içerik alanı
- Form akışları (özellikle malzeme çıkışı) mobilde **stepper/wizard** yapısı ile adım adım ilerlemeli

## Klasör/Modül Yapısı (Laravel Örneği)
```
app/
  Models/ (User, Product, Category, Project, Delivery, DeliveryItem, StockMovement)
  Http/Controllers/
    AuthController.php
    DashboardController.php
    StockInController.php
    StockOutController.php
    ReportController.php
resources/views/
  auth/
  dashboard/
  stock-in/
  stock-out/   (wizard adımları için alt view'lar)
  reports/
routes/web.php
```

## Güvenlik Notları
- Tüm form girişlerinde CSRF koruması (Laravel'de varsayılan)
- Rol bazlı route middleware (`role:yonetici`)
- Dosya yükleme alanlarında dosya tipi/boyutu doğrulaması (sadece resim, max boyut sınırı)
- SQL injection koruması için ORM (Eloquent) kullanımı, ham SQL'den kaçınma

---

## 🔧 Gerçek Uygulama — GÜNCEL & BAĞLAYICI MİMARİ
> ⚠️ Yukarıdaki Laravel/PHP bölümü **gelecekteki opsiyonel backend** için referanstır.
> **Gerçekte kullanılan mimari aşağıdadır.**

### Yığın
- **Frontend:** React 19 + TypeScript + Vite 6 + **Tailwind v4** (`@theme` ile, `tailwind.config.js` YOK).
- **Veri:** **Dexie.js (IndexedDB)** — sunucu yok, tarayıcı-yerel kalıcı depolama. SQLite ruhunda,
  gerçek transaction destekli, `useLiveQuery` (dexie-react-hooks) ile **anlık reaktif**.
- **Animasyon:** `motion` (Framer). **GSAP/ScrollTrigger YASAK.**
- **İkon:** `lucide-react`. **Grafik:** `recharts`. **Excel:** `xlsx` (client-side).
- **E-İmza:** kendi `<canvas>` + Pointer Events bileşeni (harici paket yok).
- **Font:** Inter + Manrope (`src/index.css` `@theme` — değiştirilmez).

### Klasör Yapısı (gerçek)
```
src/
  App.tsx                  # Landing → Login → Dashboard akışı
  main.tsx, index.css      # giriş + Tailwind tema/font
  types.ts                 # tüm TS arayüzleri
  lib/
    db.ts                  # Dexie şema
    repo.ts                # repository (tek veri erişim noktası)
    excel.ts               # xlsx export
  data/
    kits.ts                # kıyafet kit sabitleri
    categories.ts          # kategori listesi
    seed.ts                # demo/başlangıç verisi
  components/
    Landing.tsx (yeni) Login.tsx Dashboard.tsx
    InventoryTable.tsx ShipmentTable.tsx ProductForm.tsx
    StockExitWizard.tsx (yeni) SignaturePad.tsx (yeni) PhotoCapture.tsx (yeni)
    ReportView.tsx SettingsView.tsx ProfileView.tsx AuditLogView.tsx
```

### Responsive (mevcut desen korunur)
- Mobilde alt navigasyon (bottom-nav) + tek sütun; masaüstünde üst navbar. Çıkış akışı stepper.

### Güvenlik (frontend bağlamı)
- Rol kontrolü çift katman (UI gizleme + render/repo guard). Dosya yükleme: sadece `image/*`, boyut sıkıştırma.
- Gerçek auth/CSRF yok (frontend-only); ileride backend eklenirse bu bölümün Laravel kısmı devreye alınır.
