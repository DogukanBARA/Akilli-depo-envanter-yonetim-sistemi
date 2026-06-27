# Malzeme Çıkışı Akışı (Toplu Teslimat)

## Genel Akış Sırası
```
1. "Malzeme Çıkışı" sayfası açılır
2. Teslim alacak personelin Adı Soyadı girilir
3. Personelin PROJESİ seçilir:
      -> Temizlik
      -> Tüm ve Çay
4. Proje seçimine göre dinamik form açılır:
      -> Temizlik seçilirse: "Yazlık Kıyafet Dağılımı" / "Kışlık Kıyafet Dağılımı" seçilir
      -> Tüm ve Çay seçilirse: sabit liste direkt gösterilir (yaz/kış farkı yok)
5. Cinsiyet seçimi yapılır (Erkek / Kadın) -> cinsiyete özel ürünleri belirlemek için
      (Temizlik: Eşarp sadece kadın / Tüm ve Çay: Kravat erkek, Fular kadın)
6. Sistem otomatik olarak ilgili ürün+adet listesini ekrana getirir (aşağıdaki dosyada detaylı)
7. Depocu gerekirse adetleri kontrol eder/düzenler (varsayılan adetler önceden tanımlı)
8. "Devam Et" -> Fotoğraf yükleme alanı + E-İmza alanı açılır
9. Fotoğraf çekilir/yüklenir
10. E-İmza alanına tıklanır -> boş bir sayfa açılır (modal/yeni ekran)
    -> Personel bu sayfada: Adı Soyadı + İmza (parmak/mouse ile çizilen e-imza) girer
11. "Teslimatı Onayla" butonuna basılır
12. Sistem:
    a) İlgili ürünlerin stoğundan adetleri düşer (products.quantity -= adet)
    b) stock_movements tablosuna "cikis" kayıtları ekler
    c) deliveries + delivery_items kayıtlarını oluşturur
    d) Fotoğraf ve imza dosyalarını sunucuya/Storage'a kaydeder, URL'lerini deliveries tablosuna yazar
13. Anasayfadaki stok durumu anlık güncellenir
14. İşlem geçmişe (rapor) düşer
```

## Stok Yetersizliği Durumu
- Eğer seçilen üründen stokta yeterli adet yoksa:
  - Sistem uyarı verir ("Yetersiz stok: Tişört - mevcut 3, istenen 4")
  - Depocuya adet düzeltme veya işlemi iptal etme seçeneği sunulur
  - Onay verilmeden stok eksiye düşürülmez

## Mobil Uyumluluk Notları
- Proje/alt kategori seçimleri büyük dokunmatik kartlar (radio button yerine kart tasarımı önerilir)
- Adım adım (wizard/stepper) arayüz: 1) Personel Bilgisi 2) Proje/Kıyafet Seçimi 3) Ürün Listesi
  Onayı 4) Fotoğraf+İmza 5) Özet/Onay
- Her adımda "Geri" butonu olmalı

---

## 🔧 Gerçek Uygulama (React — Stepper Sihirbaz)
- **Bileşen:** `src/components/StockExitWizard.tsx` (YENİ). Dashboard'da `case 'exit'` artık bu sihirbazı render eder
  (mevcut `ShipmentTable type="Çıkış"` yerine). `onBack={() => setCurrentView('dashboard')}`.
- **State makinesi (tek bileşende `useState<step>`):**
  1. **Personel Bilgisi** — `receiverName` (Ad Soyad), `receiverGender` ('erkek'|'kadin').
  2. **Proje Seçimi** — kart: `Temizlik` / `Tüm ve Çay`. Temizlik ise alt seçim: `Yazlık` / `Kışlık`.
  3. **Ürün Listesi Onayı** — `kits.ts`'ten gelen liste cinsiyete göre filtrelenir; adetler düzenlenebilir.
     Her satırda **stok yeterlilik** göstergesi (mevcut/istenen). Yetersizse satır kırmızı + onay bloklu.
  4. **Fotoğraf + E-İmza** — `PhotoCapture` + `SignaturePad` (bkz. plan 06). İkisi de zorunlu.
  5. **Özet & Onay** — "Teslimatı Onayla".
- **Onay mantığı (`repo.confirmDelivery`)** — **Dexie transaction** içinde atomik:
  a) her kalem için `inventory.quantity -= adet` (asla < 0; yetersizse tüm işlem iptal),
  b) `shipments`'e her kalem için `type:'Çıkış'` hareketi (recipient = receiverName),
  c) `deliveries` + `deliveryItems` kaydı (foto/imza base64 dataURL olarak),
  d) `auditLogs`'a "Teslimat oluşturuldu" kaydı.
- **Reaktiflik:** işlem sonrası `useLiveQuery` ile stok/rapor otomatik güncellenir.
- **Tasarım:** büyük dokunmatik kartlar, üstte adım göstergesi (stepper), her adımda Geri/İleri,
  mevcut pastel palet + `motion` geçişleri. `prefers-reduced-motion` saygısı.
