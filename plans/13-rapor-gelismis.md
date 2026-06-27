# 13 — Gelişmiş Rapor & Günlük Hareket Raporu

## Sorun
Genel Rapor'da **"Raporu İndir" butonu deaktif** (teslimat yokken `disabled`). Ayrıca rapor yalnız
teslimatları kapsıyor; **tüm hareketlerin (giriş+çıkış) günlük detaylı** raporu yok.

## Hedef
- İndirme butonu, **indirilebilir veri varsa** aktif olsun (teslimat YA DA hareket).
- **Günlük Detaylı Hareket Raporu:** seçilen güne ait tüm `shipments` (Giriş/Çıkış) + teslimatlar; tip, ürün,
  adet, personel, alıcı, konum, saat. XLSX/CSV/HTML (markalı, mobil-uyumlu — bkz. plan 07/io.ts).
- Rapor türü seçimi: **Teslimatlar** | **Günlük Hareketler** | **Stok Envanteri**.

## Gerçek Uygulama (React)
- **`ReportView.tsx`** (güçlendir, props imzası korunur): 
  - Rapor türü sekmesi/seçici. "Günlük Hareketler" için tarih seçici (varsayılan bugün) → o güne ait
    `shipments` filtrelenir (date alanı). 
  - `ExportMenu` her zaman görünür; `disabled` yalnızca **gerçekten 0 satır** olduğunda.
  - HTML çıktısı `io.ts/buildBrandedHTML` (mobil-uyumlu) üzerinden; başlığa tarih/tür yansır.
  - recharts özetleri korunur; günlük hareket için küçük giriş/çıkış özeti eklenebilir.
- **io.ts:** gerekirse `exportRows` çağrıları yeni kolon setleriyle (Saat, Tip, Ürün, Adet, Personel, Alıcı, Konum).

## Kabul Kriteri
- Buton uygun veri varken aktif. 3 rapor türü XLSX/CSV/HTML indirilebilir. Günlük hareketler eksiksiz ve detaylı.
