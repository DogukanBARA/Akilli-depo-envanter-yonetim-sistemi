# 10 — Landing Page (Tanıtım Sayfası) — E-E-A-T & Marka Bütünlüğü

## Amaç
Uygulamaya giriş öncesi, sistemi **tanıtan** ve güven veren tek sayfalık bir landing. Aynı tasarım dili
(Inter+Manrope fontları, mevcut pastel palet, `motion` animasyonları, dark mode). E-E-A-T sinyalleri:
uzmanlık (özellik derinliği), otorite (gerçek rol/akış anlatımı), güven (audit log, e-imza, güvenlik).

## Gerçek Uygulama (React)
- **Dosya:** `src/components/Landing.tsx`
- **Route:** `App.tsx` içinde, giriş yapılmadan önce `showLanding` state'i ile gösterilir.
  Akış: `Landing` → "Giriş Yap" CTA → `Login` → `Dashboard`.
- Animasyon: `motion` (Framer) — `whileInView`, `initial/animate`. Ağır kütüphane yok.
- İkonlar: `lucide-react` (Package, ShieldCheck, FileSpreadsheet, PenTool, Boxes, BarChart3, Moon).

## Bölümler (Sıra)
1. **Hero** — Logo + başlık ("Akıllı Depo & Lojistik Yönetim Sistemi") + alt başlık + 2 CTA (Giriş Yap / Özellikler).
2. **Özellik Kartları (grid)** — her biri ikon + başlık + kısa açıklama:
   - Anlık Stok Takibi (Dexie reaktif)
   - Malzeme Çıkış Sihirbazı (proje→kıyafet→cinsiyet→imza)
   - E-İmza & Fotoğraf ile Zimmet Kanıtı
   - Rol Tabanlı Erişim (Yönetici / Depocu)
   - Denetim Günlüğü (Audit Log)
   - Excel Raporlama (tek tık)
   - Kritik Stok Uyarıları
   - Karanlık Mod & Responsive
3. **Süreç Akışı (Nasıl Çalışır)** — 3-4 adımlı görsel akış (mermaid mantığını UI kartlarına dök):
   `Giriş → Stok Yönet → Teslimat + İmza → Raporla`.
4. **Rol Vitrin** — Yönetici vs Depocu yetki karşılaştırma tablosu/iki kart.
5. **Güven Bandı** — "Tüm işlemler denetim günlüğüne kaydedilir", "E-imza ile yasal kanıt", "Veriler cihazında (IndexedDB)".
6. **Kapanış CTA** — "Hemen Başla" → Login.
7. **Footer** — marka, sürüm, teknoloji rozeti.

## Tasarım Kuralları
- Hero ve kartlarda mevcut renkler: `#455f8a` (vurgu metin), `#d6e3ff`/`#d9d7f8`/`#d3e4fe` (kart zeminleri).
- Headline'lar `font-headline` (Manrope), gövde `font-sans` (Inter).
- Mobile-first; grid `sm:grid-cols-2 lg:grid-cols-4`.
- `prefers-reduced-motion` saygısı; performans için `viewport={{ once: true }}`.

## Kabul Kriteri
- Landing → Login → Dashboard akışı kesintisiz.
- `tsc` temiz, build başarılı, mevcut tasarım diliyle %100 tutarlı.
