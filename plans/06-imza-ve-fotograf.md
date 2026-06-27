# Fotoğraf ve E-İmza Modülü

## Fotoğraf Ekleme
- Teslimat onay adımında "Fotoğraf Ekle" alanı bulunur.
- Mobilde doğrudan kameradan çekim yapılabilmesi için `<input type="file" accept="image/*" capture="environment">`
  kullanılabilir.
- Masaüstünde dosya seçici olarak çalışır.
- Yüklenen fotoğraf sunucuda (örn. `/uploads/deliveries/{delivery_id}/photo.jpg`) saklanır,
  yolu `deliveries.photo_url` alanına yazılır.

## E-İmza Alanı
### Davranış
1. Kullanıcı "İmza Ekle" alanına dokunur/tıklar.
2. Ekrana **tam ekran boş bir sayfa** (modal veya yeni route) açılır.
3. Bu sayfada:
   - Üstte: **Teslim Alan: [Ad Soyad]** bilgisi otomatik gösterilir (önceki adımda girilmişti)
   - Ortada: Boş bir imza çizim alanı (canvas)
   - Personel parmağıyla (mobil) veya mouse ile (masaüstü) imza atar
   - Altta: "Temizle" ve "Onayla" butonları
4. "Onayla" basıldığında canvas, bir PNG görüntüsüne dönüştürülür ve sunucuya yüklenir.
5. Modal kapanır, ana çıkış formuna geri dönülür; imza küçük bir önizleme olarak gösterilir.

### Teknik Öneri
- HTML5 `<canvas>` + JavaScript (örn. `signature_pad` kütüphanesi gibi hafif bir çözüm)
- Canvas boyutu ekrana responsive uyarlanmalı (mobilde tam genişlik, dokunmatik hassasiyet yüksek)
- İmza PNG olarak `/uploads/deliveries/{delivery_id}/signature.png` yoluna kaydedilir
- Yol, `deliveries.signature_url` alanına yazılır

## Güvenlik / Doğrulama
- Fotoğraf ve imza alanları **zorunlu** olmalı; ikisi de tamamlanmadan "Teslimatı Onayla"
  butonu aktif olmamalı.
- İmza canvas'ı boşsa (hiç çizim yapılmamışsa) "Onayla" işlemi engellenmeli.

## Rapor ile Bağlantı
- Excel raporundaki her teslimat satırında, imza görüntüsüne giden bir **link** (URL) bulunur.
  Bu link tıklandığında imza/fotoğraf görseli tarayıcıda açılır (bkz. 07-rapor-ve-excel.md).

---

## 🔧 Gerçek Uygulama (React — Kendi Canvas Modülümüz)
> `signature_pad` paketi yerine **bağımlılıksız kendi canvas bileşenimiz** (daha hafif, kontrol bizde).
> Dosya yok — görüntüler **base64 dataURL** olarak Dexie `deliveries` kaydına gömülür (sunucu yok).

- **`src/components/SignaturePad.tsx` (YENİ):**
  - Tam ekran modal (`motion` ile aç/kapa). Üstte "Teslim Alan: {receiverName}".
  - `<canvas>` + Pointer Events (`pointerdown/move/up`) → mouse + dokunmatik tek kod yolu.
  - Retina için `devicePixelRatio` ölçekleme; responsive genişlik.
  - Butonlar: **Temizle** / **Onayla**. Boş canvas tespiti (hiç stroke yoksa Onayla pasif).
  - `onConfirm(dataUrl)` → `canvas.toDataURL('image/png')`.
- **`src/components/PhotoCapture.tsx` (YENİ):**
  - `<input type="file" accept="image/*" capture="environment">` (mobilde kamera, masaüstünde dosya).
  - Seçilen görsel `FileReader` ile dataURL'e çevrilir; küçük önizleme + "Değiştir/Kaldır".
  - Boyut sınırı: > ~2MB ise `<canvas>` ile yeniden boyutlandır/sıkıştır (IndexedDB şişmesin).
- **Zorunluluk:** `StockExitWizard` adım 4'te foto **ve** imza dolu olmadan "İleri/Onayla" **pasif**.
- **Saklama:** `deliveries.photoDataUrl`, `deliveries.signatureDataUrl` alanlarına yazılır.
- **Rapor bağlantısı:** Excel'de bu dataURL yerine, uygulamada teslimat detayında görsel açılır;
  Excel hücresinde "Görüntüle" notu + (opsiyonel) dataURL kısaltması (bkz. plan 07).
