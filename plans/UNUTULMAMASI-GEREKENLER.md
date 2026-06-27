# 🚫 UNUTULMAMASI GEREKENLER — Kırmızı Çizgiler

> Her ajan / geliştirici **iş başlamadan önce** bu dosyayı okur. Buradaki ❌ kuralları **asla** ihlal edilmez.

---

## ❌ KESİNLİKLE YAPILMAYACAKLAR

1. **❌ Font değiştirme.** Bu projede font **Inter + Manrope** kalır. Bai Jamjuree'ye veya başka fonta geçme.
   `src/index.css` içindeki `@theme` font tanımlarına dokunma.
2. **❌ GSAP / ScrollTrigger** veya ağır animasyon kütüphanesi ekleme. Animasyon için mevcut **`motion`** (Framer)
   veya vanilla `IntersectionObserver` + `requestAnimationFrame` kullan.
3. **❌ Stok eksiye düşürme.** Çıkışta stok yetersizse işlem **bloklanır**, uyarı verilir.
4. **❌ İmza veya fotoğraf boşken "Teslimatı Onayla"yı aktif etme.** İkisi de zorunlu.
5. **❌ Tailwind v4 syntax'ını v3 gibi yazma.** `tailwind.config.js` yok; tema `@theme` bloğunda (`src/index.css`).
   Renkler mevcut paletten: `#455f8a`, `#d6e3ff`, `#d9d7f8`, `#d3e4fe`, `#566166`, `#f0f4f7`.
6. **❌ Aynı dosyayı iki ajan aynı anda düzenleme.** Dosya sahipliği MASTER-PLAN'daki tabloya göredir.
   **`Dashboard.tsx`, `App.tsx`, `types.ts`, `index.css` yalnızca WP0/çekirdek ajanına aittir.**
7. **❌ `node_modules`, `package-lock.json` elle düzenleme.** Sadece `npm install <paket>` ile.
8. **❌ HMR/Vite config bozma.** `vite.config.ts` içindeki HMR ayarına dokunma (AI Studio uyumu).
9. **❌ localStorage'ı yeni veri kaynağı olarak kullanma.** Yeni veriler **Dexie** üzerinden (`repo.ts`).
   (Mevcut ayar anahtarları — darkMode, settings — localStorage'da kalabilir; iş verisi Dexie'ye gider.)
10. **❌ Mevcut tasarım dilini bozma.** Renk/spacing/gölge/motion korunur; rastgele yeni stil getirme.
11. **❌ TR karakter/encoding bozma.** Dosyalar UTF-8. Türkçe metinleri bozma.

---

## ✅ MUTLAKA YAPILACAKLAR

1. **✅ TR yanıt & TR arayüz metinleri.** Tüm kullanıcı metinleri Türkçe.
2. **✅ Veri tek kaynaktan:** Dexie + `repo.ts`. Reaktiflik için `useLiveQuery` (dexie-react-hooks).
3. **✅ Rol kontrolü çift katman:** UI'da menü gizleme + mantıkta (`role === 'admin'`) erişim kontrolü.
4. **✅ Her teslimat:** stok düşümü + `shipments` (çıkış) kaydı + `deliveries`/`delivery_items` + audit log — tek akışta.
5. **✅ İş bitince `tsc --noEmit` ve `npm run build` TEMİZ olmalı.** Tip hatası = iş tamamlanmamış demektir.
6. **✅ Yeni bileşenler mevcut bileşen desenini taklit eder** (motion, lucide ikon, dark mode sınıfları, props imzaları).
7. **✅ Tasarım rötuşu için** `[skill:tasarim-ogeleri]` skill'i (metin yerleşim / mikro hizalama) kullanılabilir.
8. **✅ Kıyafet kitleri `src/data/kits.ts`'ten** gelir; cinsiyet etiketli ürünler doğru filtrelenir
   (Temizlik: Eşarp→kadın · Tüm&Çay: Kravat→erkek, Fular→kadın).
9. **✅ Excel client-side** `xlsx` ile üretilir (zaten kurulu); imza/foto linki hücrede.
10. **✅ Tüm dışa aktarma `src/lib/io.ts` üzerinden** (Blob + anchor; `XLSX.writeFile` KULLANMA — sandbox'ta
    sessiz başarısız olur). Formatlar: XLSX/CSV/HTML. HTML rapor markalı (köşede Precision Logistics anteti).
11. **✅ İçe aktarma `ImportDialog` + `repo.importInventory(rows, mode)`** ile; modlar: add / upsert / replace.
12. **✅ Oturum kalıcılığı `src/lib/session.ts`** üzerinden (localStorage `wms_auth` + `wms_session_min`).
    F5 sonrası giriş açıksa Dashboard; süre dolunca login. Ayarlarda güvenlik notu zorunlu.
13. **✅ Görev/hatırlatıcı `db.tasks` (Dexie v2)** + `TaskCenter`. Zil = Web Audio beep (harici ses dosyası YOK).
    Zamanlayıcı Dashboard'da tek noktada; tekrar eden görev tetiklenince `dueAt` ötelenir.
14. **✅ HTML rapor mobil-uyumlu kalır** (`io.ts` kart düzeni) — bozma.
15. **✅ Giriş/çıkış kanıtı opsiyonel alanlar** (`Shipment.photoDataUrl/note/supplier`) geriye uyumlu eklenir;
    stok asla eksiye düşmez; tüm toplu işlemler Dexie transaction + audit log.
16. **❌ Dexie şema sürümünü düşürme.** Yeni tablo/alan için `.version(2)` ekle, mevcut v1'i bozma.

---

## 🧪 Verifier Kontrol Listesi (gün sonu FINISH öncesi)
- [ ] `npm run lint` (tsc --noEmit) → 0 hata
- [ ] `npm run build` → başarılı
- [ ] Font hâlâ Inter/Manrope mi? (index.css değişmemiş)
- [ ] Tüm yeni view'lar Dashboard switch'ine bağlı mı?
- [ ] Rol gate'leri çalışıyor mu (personnel rapor görmemeli)?
- [ ] Stok eksiye düşüyor mu? (düşmemeli)
- [ ] İmza/foto zorunluluğu çalışıyor mu?
- [ ] Bu dosyadaki ❌ maddelerinden ihlal var mı?
