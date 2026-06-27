# Lojistik & Depo Takip Sistemi - Genel Bakış

## Proje Amacı
Şirket içi malzeme/kıyafet stoğunun takip edildiği, personele yapılan zimmet/teslimat işlemlerinin
dijital imza ve fotoğraf ile kayıt altına alındığı, responsive (mobil uyumlu) bir web uygulaması.

## Temel Özellikler
- Anlık stok takibi (giriş/çıkış sonrası otomatik güncelleme)
- 2 rol: **Depocu** ve **Yönetici**
- Malzeme girişi (ürün adı, kategori, adet, konum, giriş tarihi)
- Toplu malzeme çıkışı (proje bazlı, personel bazlı)
- Proje türüne göre dinamik kıyafet/ekipman seçenekleri (Temizlik / TÜM ve Çay)
- Mevsime göre değişen kıyafet listesi (Temizlik için yazlık/kışlık)
- Teslim alan personel bilgisi + fotoğraf + e-imza (boş sayfa üzerine el yazısı imza)
- Anlık Excel rapor indirme (yönetici)
- İmza ekran görüntüsünün linki rapora dahil edilir

## Sayfa / Modül Listesi
1. **Giriş (Login)** – Depocu / Yönetici girişi
2. **Anasayfa (Dashboard)**
   - Stok durumu (özet kartlar/tablo)
   - Malzeme girişi (buton/form linki)
   - Malzeme çıkışı (buton/form linki)
   - Genel rapor (sadece Yönetici görür)
3. **Malzeme Girişi Sayfası**
4. **Malzeme Çıkışı Sayfası** (proje seçimi → dinamik form → personel bilgisi → imza/foto)
5. **Stok Listesi / Detay Sayfası**
6. **Rapor Sayfası (Yönetici)** – filtreleme + Excel indirme

## Bu Plan Setindeki Dosyalar
| Dosya | İçerik |
|---|---|
| 00-genel-bakis.md | Bu dosya |
| 01-roller-ve-yetkiler.md | Depocu/Yönetici yetkileri |
| 02-veritabani-semasi.md | Tablo/koleksiyon yapıları |
| 03-malzeme-girisi.md | Stok girişi akışı |
| 04-malzeme-cikisi-akisi.md | Çıkış formu, proje seçimi mantığı |
| 05-kiyafet-kategorileri.md | Temizlik ve TÜM/Çay kıyafet listeleri (detaylı) |
| 06-imza-ve-fotograf.md | E-imza alanı ve fotoğraf yükleme tasarımı |
| 07-rapor-ve-excel.md | Rapor ekranı ve Excel export formatı |
| 08-teknik-mimari.md | Önerilen teknoloji yığını ve responsive yapı |
| 09-yol-haritasi.md | Geliştirme sırası / fazlar |
| 10-landing-page.md | Tanıtım (landing) sayfası planı |
| _NAVIGASYON.md | Ana navigasyon / indeks (BURADAN BAŞLA) |
| UNUTULMAMASI-GEREKENLER.md | Kırmızı çizgiler (yap/yapma) |

---

## 🔧 Gerçek Uygulama (React 19 + Dexie) — GÜNCEL MİMARİ (BAĞLAYICI)
> ⚠️ Bu plan seti başlangıçta Laravel/PHP varsaymıştı. **Gerçek proje frontend-only React'tir.**

- **Yığın:** React 19 + TypeScript + Vite + Tailwind v4 + `motion` + `lucide-react` + `recharts` + `xlsx`.
- **Veri katmanı:** **Dexie.js (IndexedDB)** — sunucu yok, tarayıcı-yerel, `useLiveQuery` ile anlık reaktif.
  Repository soyutlaması `src/lib/repo.ts`. (İleride gerçek backend gerekirse yalnız bu dosya değişir.)
- **Font:** Inter (gövde) + Manrope (başlık) — **değiştirilmez** (projeye özel karar).
- **Roller:** kod değeri `admin` / `personnel`; arayüz etiketi "Yönetici" / "Depocu".
- **Modüller → kod:** Login, Dashboard (kabuk), InventoryTable, StockExitWizard (yeni), ProductForm,
  ReportView, SignaturePad+PhotoCapture (yeni), AuditLogView, SettingsView, ProfileView, Landing (yeni).
- Navigasyon ve kırmızı çizgiler: **[_NAVIGASYON.md](./_NAVIGASYON.md)** ·
  **[UNUTULMAMASI-GEREKENLER.md](./UNUTULMAMASI-GEREKENLER.md)**
