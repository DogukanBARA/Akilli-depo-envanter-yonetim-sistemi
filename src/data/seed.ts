/**
 * Demo/başlangıç envanteri. Yalnızca ilk açılışta (bir kez) yüklenir.
 * "Veri Sıfırla" sonrası tekrar yüklenmez (wms_seeded bayrağı repo.ts'te yönetilir).
 */
import { InventoryItem } from '../types';

const today = new Date().toISOString().split('T')[0];

export const SEED_INVENTORY: InventoryItem[] = [
  { id: 'seed-tisort',   name: 'Tişört',   sku: 'TS-001', category: 'Tişört',   quantity: 120, unit: 'Adet', location: 'Depo A - Raf 1', lastUpdated: today, criticalLevel: 30 },
  { id: 'seed-pantolon', name: 'Pantolon', sku: 'PN-001', category: 'Pantolon', quantity: 90,  unit: 'Adet', location: 'Depo A - Raf 2', lastUpdated: today, criticalLevel: 25 },
  { id: 'seed-ayakkabi', name: 'Ayakkabı', sku: 'AY-001', category: 'Ayakkabı', quantity: 45,  unit: 'Çift', location: 'Depo A - Raf 3', lastUpdated: today, criticalLevel: 15 },
  { id: 'seed-esarp',    name: 'Eşarp',    sku: 'ES-001', category: 'Eşarp',    quantity: 20,  unit: 'Adet', location: 'Depo B - Raf 1', lastUpdated: today, criticalLevel: 10 },
  { id: 'seed-polar',    name: 'Polar',    sku: 'PL-001', category: 'Polar',    quantity: 35,  unit: 'Adet', location: 'Depo B - Raf 1', lastUpdated: today, criticalLevel: 12 },
  { id: 'seed-mont',     name: 'Mont',     sku: 'MN-001', category: 'Mont',     quantity: 8,   unit: 'Adet', location: 'Depo B - Raf 2', lastUpdated: today, criticalLevel: 10 },
  { id: 'seed-boyunluk', name: 'Boyunluk', sku: 'BY-001', category: 'Boyunluk', quantity: 50,  unit: 'Adet', location: 'Depo B - Raf 2', lastUpdated: today, criticalLevel: 15 },
  { id: 'seed-gomlek',   name: 'Gömlek',   sku: 'GM-001', category: 'Gömlek',   quantity: 60,  unit: 'Adet', location: 'Ana Depo',       lastUpdated: today, criticalLevel: 20 },
  { id: 'seed-yelek',    name: 'Yelek',    sku: 'YL-001', category: 'Yelek',    quantity: 40,  unit: 'Adet', location: 'Ana Depo',       lastUpdated: today, criticalLevel: 15 },
  { id: 'seed-kravat',   name: 'Kravat',   sku: 'KR-001', category: 'Kravat',   quantity: 25,  unit: 'Adet', location: 'Ana Depo',       lastUpdated: today, criticalLevel: 10 },
  { id: 'seed-fular',    name: 'Fular',    sku: 'FL-001', category: 'Fular',    quantity: 18,  unit: 'Adet', location: 'Ana Depo',       lastUpdated: today, criticalLevel: 10 },
];
