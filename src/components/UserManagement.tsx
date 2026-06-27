import React, { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Boxes,
  Trash2,
  KeyRound,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { db } from '../lib/db';
import { addUser, deleteUser, updateUser } from '../lib/repo';
import { UserAccount, UserRole } from '../types';

export interface UserManagementProps {
  actor: string;
  onBack: () => void;
}

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Yönetici',
  personnel: 'Depocu',
};

function formatDate(value: string): string {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

interface NewUserForm {
  username: string;
  name: string;
  role: UserRole;
  password: string;
}

const EMPTY_FORM: NewUserForm = { username: '', name: '', role: 'personnel', password: '' };

export default function UserManagement({ actor, onBack }: UserManagementProps) {
  const users = useLiveQuery(
    () => db.users.toArray(),
    [],
    [] as UserAccount[],
  );

  const [form, setForm] = useState<NewUserForm>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rowError, setRowError] = useState<Record<string, string>>({});

  const sorted = useMemo(
    () =>
      [...users].sort((a, b) => {
        if (a.role !== b.role) return a.role === 'admin' ? -1 : 1;
        return a.name.localeCompare(b.name, 'tr');
      }),
    [users],
  );

  const setRowMsg = (id: string, msg: string) => {
    setRowError((prev) => ({ ...prev, [id]: msg }));
    if (!msg) {
      setRowError((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    if (!form.username.trim() || !form.name.trim() || !form.password) {
      setFormError('Tüm alanlar zorunludur.');
      return;
    }
    setSubmitting(true);
    const res = await addUser(
      {
        username: form.username,
        name: form.name,
        role: form.role,
        password: form.password,
      },
      actor,
    );
    setSubmitting(false);
    if (!res.ok) {
      setFormError(res.error || 'Kullanıcı eklenemedi.');
      return;
    }
    setFormSuccess(`${form.name.trim()} eklendi.`);
    setForm(EMPTY_FORM);
  };

  const handleToggleRole = async (u: UserAccount) => {
    setRowMsg(u.id, '');
    const nextRole: UserRole = u.role === 'admin' ? 'personnel' : 'admin';
    const res = await updateUser(u.id, { role: nextRole }, actor);
    if (!res.ok) setRowMsg(u.id, res.error || 'Rol değiştirilemedi.');
  };

  const handleResetPassword = async (u: UserAccount) => {
    setRowMsg(u.id, '');
    const next = window.prompt(`${u.name} için yeni şifre girin:`, '');
    if (next === null) return;
    if (!next.trim()) {
      setRowMsg(u.id, 'Şifre boş olamaz.');
      return;
    }
    const res = await updateUser(u.id, { password: next }, actor);
    if (!res.ok) setRowMsg(u.id, res.error || 'Şifre sıfırlanamadı.');
    else setRowMsg(u.id, '');
  };

  const handleDelete = async (u: UserAccount) => {
    setRowMsg(u.id, '');
    const ok = window.confirm(`${u.name} (@${u.username}) kullanıcısını silmek istediğinize emin misiniz?`);
    if (!ok) return;
    const res = await deleteUser(u.id, actor);
    if (!res.ok) setRowMsg(u.id, res.error || 'Kullanıcı silinemedi.');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20 max-w-3xl mx-auto"
    >
      {/* Başlık */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors text-[#455f8a] dark:text-[#d6e3ff] shrink-0"
            aria-label="Geri"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl sm:text-2xl font-bold text-[#2a3439] dark:text-white font-headline truncate">
            Kullanıcı Yönetimi
          </h2>
        </div>
        <span className="inline-flex items-center gap-2 px-3 py-2 bg-[#d6e3ff]/50 dark:bg-white/10 rounded-full text-sm font-bold text-[#244069] dark:text-[#d6e3ff] shrink-0">
          <Users className="w-4 h-4" />
          {users.length} kullanıcı
        </span>
      </div>

      {/* Bilgi notu */}
      <div className="flex items-start gap-3 rounded-2xl p-4 bg-[#d9d7f8]/40 dark:bg-white/5 border border-[#d9d7f8] dark:border-white/10">
        <ShieldCheck className="w-5 h-5 text-[#455f8a] dark:text-[#d6e3ff] shrink-0 mt-0.5" />
        <p className="text-sm text-[#566166] dark:text-gray-300">
          Kullanıcı ekleme/çıkarma ve yetkilendirme yalnız sistem yöneticisi tarafından yapılır.
        </p>
      </div>

      {/* Yeni kullanıcı ekleme formu */}
      <form
        onSubmit={handleAdd}
        className="bg-white dark:bg-[#1e293b] rounded-2xl p-5 sm:p-6 shadow-sm border border-[#e1e9ee] dark:border-white/10 space-y-4"
      >
        <div className="flex items-center gap-2 text-[#244069] dark:text-white">
          <UserPlus className="w-5 h-5" />
          <h3 className="text-base sm:text-lg font-bold font-headline">Yeni Kullanıcı Ekle</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#717c82] dark:text-gray-400 mb-1.5">
              Ad Soyad
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Örn. Ayşe Yılmaz"
              className="w-full px-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#717c82] dark:text-gray-400 mb-1.5">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="örn. ayse"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full px-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#717c82] dark:text-gray-400 mb-1.5">
              Rol
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
              className="w-full px-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white appearance-none cursor-pointer font-bold"
            >
              <option value="personnel">Depocu</option>
              <option value="admin">Yönetici</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#717c82] dark:text-gray-400 mb-1.5">
              Şifre
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full px-4 py-3 bg-[#f7f9fb] dark:bg-white/5 border-none rounded-xl focus:ring-2 focus:ring-[#455f8a]/20 outline-none text-[#2a3439] dark:text-white"
            />
          </div>
        </div>

        <AnimatePresence>
          {formError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-3"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {formError}
            </motion.div>
          )}
          {formSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl px-4 py-3"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {formSuccess}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-[#455f8a] text-white hover:bg-[#244069] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-4 h-4" />
          {submitting ? 'Ekleniyor...' : 'Kullanıcı Ekle'}
        </button>
      </form>

      {/* Liste */}
      {sorted.length === 0 ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-2xl p-12 text-center shadow-sm border border-[#e1e9ee] dark:border-white/10">
          <Users className="w-12 h-12 text-[#e1e9ee] dark:text-white/10 mx-auto mb-4" />
          <p className="text-[#717c82] dark:text-gray-500 font-medium">Henüz kullanıcı bulunmuyor.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {sorted.map((u) => {
              const isAdmin = u.role === 'admin';
              const RoleIcon = isAdmin ? ShieldCheck : Boxes;
              return (
                <motion.div
                  key={u.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-[#1e293b] border border-[#e1e9ee] dark:border-white/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-11 h-11 rounded-xl bg-[#f7f9fb] dark:bg-white/5 flex items-center justify-center">
                      <RoleIcon
                        className={`w-5 h-5 ${
                          isAdmin ? 'text-[#455f8a] dark:text-[#d6e3ff]' : 'text-[#566166] dark:text-gray-300'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-[#2a3439] dark:text-white break-words">
                          {u.name}
                        </h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isAdmin
                              ? 'bg-[#d6e3ff] text-[#244069] dark:bg-[#455f8a] dark:text-white'
                              : 'bg-[#f0f4f7] text-[#566166] dark:bg-white/10 dark:text-gray-300'
                          }`}
                        >
                          <RoleIcon className="w-3 h-3" />
                          {ROLE_LABEL[u.role]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-[#566166] dark:text-gray-400 break-words">@{u.username}</p>
                      <p className="mt-1 text-xs text-[#717c82] dark:text-gray-500">
                        Oluşturma: {formatDate(u.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Satır hatası */}
                  <AnimatePresence>
                    {rowError[u.id] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 mt-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 rounded-xl px-4 py-2.5"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {rowError[u.id]}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Aksiyonlar */}
                  <div className="flex flex-wrap items-center justify-end gap-1.5 mt-3 pt-3 border-t border-[#f0f4f7] dark:border-white/5">
                    <button
                      onClick={() => handleToggleRole(u)}
                      title={isAdmin ? 'Depocu yap' : 'Yönetici yap'}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#566166] dark:text-gray-300 hover:bg-[#f0f4f7] dark:hover:bg-white/10 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      {isAdmin ? 'Depocu Yap' : 'Yönetici Yap'}
                    </button>
                    <button
                      onClick={() => handleResetPassword(u)}
                      title="Şifre sıfırla"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#566166] dark:text-gray-300 hover:bg-[#f0f4f7] dark:hover:bg-white/10 transition-colors"
                    >
                      <KeyRound className="w-4 h-4" />
                      Şifre Sıfırla
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      title="Sil"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Sil
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
