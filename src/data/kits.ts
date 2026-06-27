/**
 * Proje bazlı kıyafet/ekipman kit tanımları (plan 05).
 * Cinsiyet etiketli ürünler yalnızca uygun cinsiyette listeye eklenir.
 */
import { Gender, ProjectType, Season } from '../types';

export interface KitItem {
  urun: string;
  adet: number;
  cinsiyet?: Gender; // tanımlıysa yalnız o cinsiyet için
}

export const KITS = {
  temizlik: {
    yazlik: [
      { urun: 'Tişört', adet: 2 },
      { urun: 'Pantolon', adet: 2 },
      { urun: 'Ayakkabı', adet: 1 },
      { urun: 'Eşarp', adet: 1, cinsiyet: 'kadin' },
    ],
    kislik: [
      { urun: 'Tişört', adet: 2 },
      { urun: 'Pantolon', adet: 2 },
      { urun: 'Ayakkabı', adet: 1 },
      { urun: 'Polar', adet: 1 },
      { urun: 'Mont', adet: 1 },
      { urun: 'Boyunluk', adet: 1 },
      { urun: 'Eşarp', adet: 1, cinsiyet: 'kadin' },
    ],
  },
  tum_ve_cay: [
    { urun: 'Gömlek', adet: 2 },
    { urun: 'Pantolon', adet: 2 },
    { urun: 'Ayakkabı', adet: 1 },
    { urun: 'Yelek', adet: 1 },
    { urun: 'Kravat', adet: 1, cinsiyet: 'erkek' },
    { urun: 'Fular', adet: 1, cinsiyet: 'kadin' },
  ],
} as const;

/**
 * Proje + cinsiyet (+ temizlik için sezon) için kit listesini döndürür.
 * Cinsiyet etiketli ürünlerden yalnız uygun olanlar dahil edilir.
 */
export function getKit(
  project: ProjectType,
  gender: Gender,
  season?: Season,
): KitItem[] {
  const list: readonly KitItem[] =
    project === 'temizlik' ? KITS.temizlik[season ?? 'yazlik'] : KITS.tum_ve_cay;
  return list
    .filter((i) => !i.cinsiyet || i.cinsiyet === gender)
    .map((i) => ({ ...i }));
}
