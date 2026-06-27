/**
 * Oturum kalıcılığı (plan 11). Frontend-only: localStorage'da süreli oturum tutulur.
 * F5 sonrası geçerli oturum varsa Dashboard açılır; süre dolunca temizlenir.
 */
import { UserRole } from '../types';

const AUTH_KEY = 'wms_auth';
const DURATION_KEY = 'wms_session_min';
const DEFAULT_MIN = 60;

export const DURATION_OPTIONS = [30, 60, 120, 240] as const;

interface AuthRecord {
  role: UserRole;
  name?: string;
  loginAt: number;
  expiresAt: number;
}

export function getDurationMin(): number {
  const raw = parseInt(localStorage.getItem(DURATION_KEY) || '', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MIN;
}

export function setDurationMin(min: number): void {
  localStorage.setItem(DURATION_KEY, String(min));
}

/** Girişte oturumu kaydeder (süre = seçili dakika). */
export function saveSession(role: UserRole, name?: string): void {
  const now = Date.now();
  const rec: AuthRecord = { role, name, loginAt: now, expiresAt: now + getDurationMin() * 60_000 };
  localStorage.setItem(AUTH_KEY, JSON.stringify(rec));
}

/** Geçerli (süresi dolmamış) oturumu döndürür; yoksa/expired ise temizler ve null döner. */
export function loadSession(): { role: UserRole; name?: string } | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const rec = JSON.parse(raw) as AuthRecord;
    if (!rec.expiresAt || Date.now() >= rec.expiresAt) {
      localStorage.removeItem(AUTH_KEY);
      return null;
    }
    return { role: rec.role, name: rec.name };
  } catch {
    localStorage.removeItem(AUTH_KEY);
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(AUTH_KEY);
}
