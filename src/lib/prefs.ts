/**
 * Kullanıcı tercihleri (localStorage). Görev "yaklaşma" bildirim süresi vb.
 */
const LEAD_KEY = 'wms_task_lead_min';
const DEFAULT_LEAD = 10;

/** Görev vaktine kaç dakika kala "yaklaşan görev" bildirimi düşsün. 0 = kapalı. */
export const LEAD_OPTIONS = [0, 5, 10, 15, 30, 60] as const;

export function getTaskLeadMin(): number {
  const raw = parseInt(localStorage.getItem(LEAD_KEY) || '', 10);
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_LEAD;
}

export function setTaskLeadMin(min: number): void {
  localStorage.setItem(LEAD_KEY, String(min));
}
