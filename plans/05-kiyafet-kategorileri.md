# Proje Bazlı Kıyafet / Ekipman Dağılım Listeleri

Bu liste, malzeme çıkışı sırasında proje seçimine göre **otomatik olarak** önerilen
ürün ve adetleri tanımlar. Depocu bu adetleri varsayılan olarak görür, gerekirse değiştirebilir.

---

## 1. PROJE: TEMİZLİK

### 1.1 Yazlık Kıyafet Dağılımı
| Ürün | Adet | Not |
|---|---|---|
| Tişört | 2 | |
| Pantolon | 2 | |
| Ayakkabı | 1 | |
| Eşarp | 1 | **Sadece bayan personel için** |

### 1.2 Kışlık Kıyafet Dağılımı
| Ürün | Adet | Not |
|---|---|---|
| Tişört | 2 | |
| Pantolon | 2 | |
| Ayakkabı | 1 | |
| Polar | 1 | |
| Mont | 1 | |
| Boyunluk | 1 | |
| Eşarp | 1 | **Sadece bayan personel için** |

---

## 2. PROJE: TÜM VE ÇAY
> Not: Bu projede yaz/kış ayrımı **yoktur**, liste tüm sene boyunca sabittir (stabil).

| Ürün | Adet | Not |
|---|---|---|
| Gömlek | 2 | |
| Pantolon | 2 | |
| Ayakkabı | 1 | |
| Yelek | 1 | |
| Kravat | 1 | **Sadece erkek personel için** |
| Fular | 1 | **Sadece bayan personel için** |

---

## Uygulama Mantığı (Sistem Tarafı)
- Bu tablolar `project_kits` gibi bir referans tabloda (veya basitçe kod içinde sabit JSON olarak)
  tutulabilir:
```json
{
  "temizlik": {
    "yazlik": [
      {"urun": "Tişört", "adet": 2},
      {"urun": "Pantolon", "adet": 2},
      {"urun": "Ayakkabı", "adet": 1},
      {"urun": "Eşarp", "adet": 1, "cinsiyet": "kadin"}
    ],
    "kislik": [
      {"urun": "Tişört", "adet": 2},
      {"urun": "Pantolon", "adet": 2},
      {"urun": "Ayakkabı", "adet": 1},
      {"urun": "Polar", "adet": 1},
      {"urun": "Mont", "adet": 1},
      {"urun": "Boyunluk", "adet": 1},
      {"urun": "Eşarp", "adet": 1, "cinsiyet": "kadin"}
    ]
  },
  "tum_ve_cay": [
    {"urun": "Gömlek", "adet": 2},
    {"urun": "Pantolon", "adet": 2},
    {"urun": "Ayakkabı", "adet": 1},
    {"urun": "Yelek", "adet": 1},
    {"urun": "Kravat", "adet": 1, "cinsiyet": "erkek"},
    {"urun": "Fular", "adet": 1, "cinsiyet": "kadin"}
  ]
}
```
- Personelin cinsiyeti seçildiğinde, sistem `cinsiyet` etiketli ürünlerden sadece uygun olanı listeye ekler
  (örn. erkek personel seçilirse Kravat eklenir, Fular eklenmez).
- İleride yeni proje/kıyafet seti eklenmek istenirse, bu JSON yapısı kolayca genişletilebilir
  (kod değişikliği gerekmeden, bir ayarlar ekranı üzerinden yönetici tarafından düzenlenebilir hale
  de getirilebilir — opsiyonel gelişmiş özellik).

---

## 🔧 Gerçek Uygulama (React)
- **Dosya:** `src/data/kits.ts` — tip güvenli sabit yapı (planda gösterilen JSON birebir).

```ts
// src/data/kits.ts
export type Gender = 'erkek' | 'kadin';
export interface KitItem { urun: string; adet: number; cinsiyet?: Gender; }

export const KITS = {
  temizlik: {
    yazlik: [
      { urun: 'Tişört', adet: 2 }, { urun: 'Pantolon', adet: 2 },
      { urun: 'Ayakkabı', adet: 1 }, { urun: 'Eşarp', adet: 1, cinsiyet: 'kadin' },
    ],
    kislik: [
      { urun: 'Tişört', adet: 2 }, { urun: 'Pantolon', adet: 2 }, { urun: 'Ayakkabı', adet: 1 },
      { urun: 'Polar', adet: 1 }, { urun: 'Mont', adet: 1 }, { urun: 'Boyunluk', adet: 1 },
      { urun: 'Eşarp', adet: 1, cinsiyet: 'kadin' },
    ],
  },
  tum_ve_cay: [
    { urun: 'Gömlek', adet: 2 }, { urun: 'Pantolon', adet: 2 }, { urun: 'Ayakkabı', adet: 1 },
    { urun: 'Yelek', adet: 1 }, { urun: 'Kravat', adet: 1, cinsiyet: 'erkek' },
    { urun: 'Fular', adet: 1, cinsiyet: 'kadin' },
  ],
} as const;

// Cinsiyete göre filtre helper'ı
export function getKit(project: 'temizlik'|'tum_ve_cay', gender: Gender, season?: 'yazlik'|'kislik'): KitItem[] {
  const list = project === 'temizlik' ? KITS.temizlik[season ?? 'yazlik'] : KITS.tum_ve_cay;
  return list.filter(i => !i.cinsiyet || i.cinsiyet === gender);
}
```

- **Kullanım:** `StockExitWizard` adım 3'te `getKit(project, gender, season)` çağrılır; sonuç düzenlenebilir tabloya doldurulur.
- **Stok eşleme:** `urun` adı, `inventory.name` ile eşleştirilir (eşleşme yoksa "stokta yok" uyarısı; eksiye düşürülmez).
- **Genişletme:** yeni proje/sezon eklemek = bu dosyaya satır eklemek; UI otomatik adapte olur.
