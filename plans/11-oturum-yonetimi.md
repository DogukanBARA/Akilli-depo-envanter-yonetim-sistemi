# 11 — Oturum Yönetimi (Kalıcı Giriş + Süre)

## Sorun
Sayfa yenilenince (F5) giriş unutuluyor; kullanıcı tekrar Landing/Login'e düşüyor.

## Hedef
- Giriş yapılmışsa **F5 sonrası doğrudan Dashboard** açılır (Landing/Login atlanır).
- Ayarlarda **oturum süresi** seçilir (30 / 60 / 120 / 240 dk). Süre dolana kadar tekrar login istenmez.
- Süre dolunca otomatik Login'e döner.
- Ayarlar'da bu sürenin **güvenlik nedeniyle** olduğu açıkça belirtilir.

## Gerçek Uygulama (React)
- **`src/lib/session.ts` (YENİ):**
  - `getDurationMin(): number` (varsayılan 60) · `setDurationMin(n)`
  - `saveSession(role)` → `localStorage['wms_auth'] = { role, loginAt, expiresAt }` (expiresAt = now + dk*60000)
  - `loadSession()` → süresi geçmemişse `{ role }`, geçmişse temizleyip `null`
  - `clearSession()`
- **`App.tsx`:** ilk `useState` initializer'da `loadSession()` çağrılır → varsa `isLoggedIn=true`, `showLanding=false`, rol geri yüklenir. `handleLogin` → `saveSession(role)`. `handleLogout` → `clearSession()`.
- **`SettingsView.tsx`:** "Oturum Süresi" seçeneği (`session.getDurationMin/setDurationMin`), güvenlik açıklaması:
  > "Oturum süresi, paylaşılan cihazlarda yetkisiz erişimi önlemek için güvenlik amacıyla sınırlanır. Süre dolduğunda yeniden giriş gerekir."
- **Süre bitişi denetimi:** Dashboard'da periyodik (örn. 60 sn) `loadSession()` kontrolü; null dönerse `onLogout()`.

## Kabul Kriteri
- F5 → giriş açıksa Dashboard. Süre dolmadan login istenmez. Süre dolunca login. Ayar kalıcı.
