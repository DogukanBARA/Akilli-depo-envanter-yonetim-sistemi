# Roller ve Yetkiler

## 1. Depocu Hesabı
**Yapabilecekleri:**
- Anlık malzeme stoğu girişi yapabilir
  - Ürün adı
  - Ürün kategorisi
  - Adet
  - Bulunduğu konum (depo/raf bilgisi)
  - Giriş tarihi
- Malzeme çıkışı yapabilir (toplu, proje bazlı)
- Stok durumunu görüntüleyebilir
- Kendi yaptığı giriş/çıkış işlemlerinin geçmişini görebilir

**Göremeyecekleri:**
- Genel rapor ekranı (sadece yöneticiye özel)

## 2. Yönetici Hesabı
**Yapabilecekleri:**
- Depocunun yapabildiği her şeyi görebilir (izleme amaçlı, salt-okunur olabilir veya tam yetkili - karar verilecek)
- **Genel Rapor** ekranına erişebilir
  - Tüm giriş/çıkış hareketleri
  - Personel bazlı teslimat geçmişi
  - İmza/fotoğraf kanıtlarına erişim
- Excel formatında anlık rapor indirebilir
- (Opsiyonel ileride eklenebilir: kullanıcı yönetimi, kategori/kıyafet listesi düzenleme)

## Yetkilendirme Mantığı (Öneri)
- Basit oturum tabanlı giriş (kullanıcı adı + şifre)
- Rol bilgisi (`role: "depocu" | "yonetici"`) oturumda (session/JWT) tutulur
- Frontend tarafında rol bazlı menü gizleme
- Backend tarafında **mutlaka** rol kontrolü yapılmalı (frontend gizlemesi güvenlik için yeterli değildir)
  - Örn: `/api/rapor` endpoint'i sadece `role === "yonetici"` ise veri döndürür

## Notlar
- Sistemde sadece 2 sabit hesap olacağı belirtildiği için karmaşık bir kullanıcı yönetim paneline
  şu an ihtiyaç yok; ileride büyürse "kullanıcı ekle" özelliği eklenebilir.

---

## 🔧 Gerçek Uygulama (React)
- **Rol değerleri kodda İngilizce, arayüzde Türkçe:**
  | Kod (`UserRole`) | Arayüz Etiketi |
  |---|---|
  | `admin` | Yönetici (Doğukan BARA) |
  | `personnel` | Depocu (Hasan Koçak) |
- **Akış:** `Login.tsx` → `onLogin(role)` → `App.tsx` state → `Dashboard.tsx role={role}`.
- **UI gizleme:** `Dashboard.tsx` içinde `role === 'admin'` kontrolü ile **Rapor/Audit** menüleri gizlenir
  (hem masaüstü navbar hem mobil bottom-nav). Mevcut kodda bu desen zaten var — korunur.
- **Mantık katmanı (çift kontrol):** Rapor verisi/Excel üretimi `ReportView`'da `role==='admin'` değilse
  hiç çağrılmaz; `repo.ts` rapor fonksiyonları da rol parametresi alıp `personnel` için boş döner
  (frontend-only olduğundan "403" yerine erişim engeli + uyarı).
- **Not:** Gerçek auth backend yok; giriş demo amaçlıdır (2FA kodu `123456`). İleride Dexie `users`
  tablosu + hash eklenebilir.
