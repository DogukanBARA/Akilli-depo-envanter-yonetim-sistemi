import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ArrowLeft,
  CalendarClock,
  Bell,
  BellOff,
  Plus,
  Check,
  Trash2,
  Repeat,
  Pencil,
  Save,
  X,
} from 'lucide-react';
import { db } from '../lib/db';
import { addTask, toggleTaskDone, deleteTask, updateTask } from '../lib/repo';
import { TaskItem, TaskRepeat } from '../types';

export interface TaskCenterProps {
  userName: string;
  onBack: () => void;
}

/* ------------------------------ Yardımcılar ------------------------------ */

const WEEKDAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

const REPEAT_LABEL: Record<TaskRepeat, string> = {
  none: 'Tekrar yok',
  daily: 'Her gün',
  weekly: 'Haftalık',
};

/** datetime-local input için varsayılan değer (şimdi + 1 saat). */
function defaultDueLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/** ISO datetime'i tr-TR okunabilir biçime çevirir. */
function formatDue(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Tarihin gün başlangıcı (00:00) epoch ms. */
function dayStart(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Kayıtlı dueAt değerini datetime-local input biçimine (yyyy-MM-ddTHH:mm) çevirir. */
function toDueLocal(value: string): string {
  if (!value) return '';
  // Zaten datetime-local biçiminde ise olduğu gibi kullan.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return value.slice(0, 16);
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

/** Ortak input/label sınıfları (form ve düzenleme paneli paylaşır). */
const FIELD_INPUT =
  'w-full rounded-xl border border-[#e1e9ee] dark:border-white/10 bg-[#f0f4f7] dark:bg-[#2a3439] px-4 py-2.5 text-sm text-[#2a3439] dark:text-white placeholder-[#566166] focus:outline-none focus:ring-2 focus:ring-[#455f8a]/40';
const FIELD_LABEL = 'block text-xs font-semibold text-[#566166] dark:text-[#d6e3ff] mb-1.5';

/* ------------------------------ Bileşen ------------------------------ */

export default function TaskCenter({ userName, onBack }: TaskCenterProps) {
  const tasks = useLiveQuery(() => db.tasks.orderBy('dueAt').toArray(), [], [] as TaskItem[]);

  // Form durumu
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [dueAt, setDueAt] = useState(defaultDueLocal());
  const [repeat, setRepeat] = useState<TaskRepeat>('none');
  const [weekday, setWeekday] = useState<number>(new Date().getDay());
  const [sound, setSound] = useState(true);
  const [error, setError] = useState('');

  /* ----------------------------- Gruplama ----------------------------- */
  const { today, upcoming, completed } = useMemo(() => {
    const list = tasks ?? [];
    const now = new Date();
    const todayStart = dayStart(now);
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const today: TaskItem[] = [];
    const upcoming: TaskItem[] = [];
    const completed: TaskItem[] = [];

    for (const t of list) {
      if (t.done) {
        completed.push(t);
        continue;
      }
      const due = new Date(t.dueAt).getTime();
      if (isNaN(due) || due < todayEnd) {
        // Bugün ve geçmiş (gecikmiş dahil) → Bugün bölümü
        today.push(t);
      } else {
        upcoming.push(t);
      }
    }
    return { today, upcoming, completed };
  }, [tasks]);

  /* ----------------------------- Ekleme ----------------------------- */
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError('Görev başlığı zorunludur.');
      return;
    }
    if (!dueAt) {
      setError('Tarih ve saat zorunludur.');
      return;
    }
    setError('');
    await addTask({
      title: title.trim(),
      note: note.trim() || undefined,
      dueAt,
      repeat,
      weekday: repeat === 'weekly' ? weekday : undefined,
      done: false,
      sound,
      createdBy: userName,
    });
    // Formu sıfırla (tarih ve tekrar tercihlerini koru, başlık/notu temizle)
    setTitle('');
    setNote('');
  }

  const inputClass = FIELD_INPUT;
  const labelClass = FIELD_LABEL;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#455f8a] dark:text-[#d6e3ff] font-bold mb-6"
      >
        <ArrowLeft className="w-5 h-5" /> Geri
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-2xl bg-[#244069] flex items-center justify-center text-white shrink-0">
          <CalendarClock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-headline text-[#244069] dark:text-white">
            Görevler &amp; Hatırlatıcılar
          </h2>
          <p className="text-[#566166] dark:text-[#d6e3ff]/70 text-sm">
            Görev ekle, hatırlatıcı kur; zamanı gelince zil çalar.
          </p>
        </div>
      </div>

      {/* ----------------------------- Ekleme Formu ----------------------------- */}
      <form
        onSubmit={handleAdd}
        className="bg-white dark:bg-[#1e293b] rounded-2xl p-6 border border-[#e1e9ee] dark:border-white/10 mb-8 shadow-sm"
      >
        <h3 className="text-base font-bold font-headline text-[#244069] dark:text-white mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#455f8a] dark:text-[#d6e3ff]" /> Yeni Görev
        </h3>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>Başlık *</label>
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn. Stok sayımı yap"
            />
          </div>

          <div>
            <label className={labelClass}>Not</label>
            <textarea
              className={inputClass + ' resize-none'}
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="İsteğe bağlı açıklama"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Tarih &amp; Saat *</label>
              <input
                type="datetime-local"
                className={inputClass}
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Tekrar</label>
              <select
                className={inputClass}
                value={repeat}
                onChange={(e) => setRepeat(e.target.value as TaskRepeat)}
              >
                <option value="none">Tekrar yok</option>
                <option value="daily">Her gün</option>
                <option value="weekly">Haftalık</option>
              </select>
            </div>
          </div>

          <AnimatePresence>
            {repeat === 'weekly' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <label className={labelClass}>Gün</label>
                <div className="flex flex-wrap gap-2">
                  {WEEKDAYS.map((w, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setWeekday(i)}
                      className={
                        'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ' +
                        (weekday === i
                          ? 'bg-[#455f8a] text-white'
                          : 'bg-[#d6e3ff] dark:bg-[#2a3439] text-[#244069] dark:text-[#d6e3ff]')
                      }
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              type="button"
              onClick={() => setSound((s) => !s)}
              className={
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ' +
                (sound
                  ? 'bg-[#d9d7f8] dark:bg-[#455f8a]/40 text-[#244069] dark:text-[#d6e3ff]'
                  : 'bg-[#f0f4f7] dark:bg-[#2a3439] text-[#566166] dark:text-[#d6e3ff]/60')
              }
            >
              {sound ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              {sound ? 'Zil açık' : 'Zil kapalı'}
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#244069] hover:bg-[#455f8a] text-white text-sm font-bold transition-colors"
            >
              <Plus className="w-4 h-4" /> Görevi Ekle
            </button>
          </div>

          {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
        </div>
      </form>

      {/* ----------------------------- Listeler ----------------------------- */}
      <TaskSection title="Bugün" tasks={today} emptyText="Bugün için görev yok." highlightOverdue />
      <TaskSection title="Yaklaşan" tasks={upcoming} emptyText="Yaklaşan görev yok." />
      <TaskSection title="Tamamlanan" tasks={completed} emptyText="Henüz tamamlanan görev yok." />
    </div>
  );
}

/* ------------------------------ Bölüm ------------------------------ */

interface TaskSectionProps {
  title: string;
  tasks: TaskItem[];
  emptyText: string;
  highlightOverdue?: boolean;
}

const TaskSection: React.FC<TaskSectionProps> = ({ title, tasks, emptyText, highlightOverdue }) => {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-lg font-bold font-headline text-[#244069] dark:text-white">{title}</h3>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#d6e3ff] dark:bg-[#2a3439] text-[#455f8a] dark:text-[#d6e3ff]">
          {tasks.length}
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e1e9ee] dark:border-white/10 p-6 text-center text-sm text-[#566166] dark:text-[#d6e3ff]/60">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {tasks.map((t) => (
              <TaskCard key={t.id} task={t} highlightOverdue={highlightOverdue} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
};

/* ------------------------------ Kart ------------------------------ */

interface TaskCardProps {
  task: TaskItem;
  highlightOverdue?: boolean;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, highlightOverdue }) => {
  const overdue =
    highlightOverdue && !task.done && new Date(task.dueAt).getTime() < Date.now();

  // Düzenleme modu + taslak alanlar
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState(task.title);
  const [eNote, setENote] = useState(task.note ?? '');
  const [eDueAt, setEDueAt] = useState(toDueLocal(task.dueAt));
  const [eRepeat, setERepeat] = useState<TaskRepeat>(task.repeat);
  const [eWeekday, setEWeekday] = useState<number>(task.weekday ?? new Date().getDay());
  const [eSound, setESound] = useState<boolean>(task.sound);
  const [eError, setEError] = useState('');

  /** Düzenlemeye başla: taslağı görevin güncel değerleriyle doldur. */
  function startEdit() {
    setETitle(task.title);
    setENote(task.note ?? '');
    setEDueAt(toDueLocal(task.dueAt));
    setERepeat(task.repeat);
    setEWeekday(task.weekday ?? new Date().getDay());
    setESound(task.sound);
    setEError('');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setEError('');
  }

  async function saveEdit() {
    if (!eTitle.trim()) {
      setEError('Görev başlığı zorunludur.');
      return;
    }
    if (!eDueAt) {
      setEError('Tarih ve saat zorunludur.');
      return;
    }
    const dueChanged = eDueAt !== toDueLocal(task.dueAt);
    await updateTask(task.id, {
      title: eTitle.trim(),
      note: eNote.trim() || undefined,
      dueAt: eDueAt,
      repeat: eRepeat,
      weekday: eRepeat === 'weekly' ? eWeekday : undefined,
      sound: eSound,
      // dueAt değiştiyse yeni vakitte tekrar hatırlatabilmek için zil damgasını temizle.
      ...(dueChanged ? { remindedAt: undefined } : {}),
    });
    setEditing(false);
    setEError('');
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      className={
        'rounded-2xl p-4 border shadow-sm ' +
        (overdue
          ? 'border-red-400/60 bg-red-50 dark:bg-red-500/10 dark:border-red-500/40'
          : 'border-[#e1e9ee] dark:border-white/10 bg-white dark:bg-[#1e293b]')
      }
    >
      <div className="flex items-start gap-3">
        {/* Tamamla */}
        <button
          onClick={() => toggleTaskDone(task.id)}
          title={task.done ? 'Tamamlandı olarak işaretli' : 'Tamamla'}
          className={
            'mt-0.5 w-6 h-6 rounded-lg shrink-0 flex items-center justify-center border-2 transition-colors ' +
            (task.done
              ? 'bg-[#455f8a] border-[#455f8a] text-white'
              : 'border-[#566166]/40 text-transparent hover:border-[#455f8a]')
          }
        >
          <Check className="w-4 h-4" />
        </button>

        {/* İçerik */}
        <div className="flex-1 min-w-0">
          <p
            className={
              'font-semibold text-[#2a3439] dark:text-white break-words ' +
              (task.done ? 'line-through opacity-60' : '')
            }
          >
            {task.title}
          </p>
          {task.note && (
            <p className="text-sm text-[#566166] dark:text-[#d6e3ff]/70 mt-0.5 break-words">
              {task.note}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span
              className={
                'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ' +
                (overdue
                  ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300'
                  : 'bg-[#f0f4f7] dark:bg-[#2a3439] text-[#566166] dark:text-[#d6e3ff]')
              }
            >
              <CalendarClock className="w-3.5 h-3.5" />
              {formatDue(task.dueAt)}
              {overdue && ' · Gecikmiş'}
            </span>

            {task.repeat !== 'none' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#d9d7f8] dark:bg-[#455f8a]/30 text-[#244069] dark:text-[#d6e3ff]">
                <Repeat className="w-3.5 h-3.5" />
                {task.repeat === 'weekly' && task.weekday != null
                  ? WEEKDAYS[task.weekday]
                  : REPEAT_LABEL[task.repeat]}
              </span>
            )}

            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-[#d6e3ff] dark:bg-[#2a3439] text-[#455f8a] dark:text-[#d6e3ff]">
              {task.sound ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              {task.sound ? 'Zil' : 'Sessiz'}
            </span>
          </div>
        </div>

        {/* Eylemler: Düzenle + Sil */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => (editing ? cancelEdit() : startEdit())}
            title={editing ? 'Düzenlemeyi kapat' : 'Düzenle'}
            className={
              'mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ' +
              (editing
                ? 'bg-[#455f8a] text-white'
                : 'text-[#566166] dark:text-[#d6e3ff] hover:text-[#455f8a] hover:bg-[#d6e3ff]/60 dark:hover:bg-[#455f8a]/30')
            }
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => deleteTask(task.id)}
            title="Sil"
            className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center text-[#566166] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ----------------------------- Düzenleme Paneli ----------------------------- */}
      <AnimatePresence initial={false}>
        {editing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t border-[#e1e9ee] dark:border-white/10 space-y-4">
              <div>
                <label className={FIELD_LABEL}>Başlık *</label>
                <input
                  className={FIELD_INPUT}
                  value={eTitle}
                  onChange={(e) => setETitle(e.target.value)}
                  placeholder="Görev başlığı"
                />
              </div>

              <div>
                <label className={FIELD_LABEL}>Not</label>
                <textarea
                  className={FIELD_INPUT + ' resize-none'}
                  rows={2}
                  value={eNote}
                  onChange={(e) => setENote(e.target.value)}
                  placeholder="İsteğe bağlı açıklama"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={FIELD_LABEL}>Tarih &amp; Saat *</label>
                  <input
                    type="datetime-local"
                    className={FIELD_INPUT}
                    value={eDueAt}
                    onChange={(e) => setEDueAt(e.target.value)}
                  />
                </div>
                <div>
                  <label className={FIELD_LABEL}>Tekrar</label>
                  <select
                    className={FIELD_INPUT}
                    value={eRepeat}
                    onChange={(e) => setERepeat(e.target.value as TaskRepeat)}
                  >
                    <option value="none">Tekrar yok</option>
                    <option value="daily">Her gün</option>
                    <option value="weekly">Haftalık</option>
                  </select>
                </div>
              </div>

              <AnimatePresence>
                {eRepeat === 'weekly' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <label className={FIELD_LABEL}>Gün</label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((w, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEWeekday(i)}
                          className={
                            'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ' +
                            (eWeekday === i
                              ? 'bg-[#455f8a] text-white'
                              : 'bg-[#d6e3ff] dark:bg-[#2a3439] text-[#244069] dark:text-[#d6e3ff]')
                          }
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setESound((s) => !s)}
                  className={
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ' +
                    (eSound
                      ? 'bg-[#d9d7f8] dark:bg-[#455f8a]/40 text-[#244069] dark:text-[#d6e3ff]'
                      : 'bg-[#f0f4f7] dark:bg-[#2a3439] text-[#566166] dark:text-[#d6e3ff]/60')
                  }
                >
                  {eSound ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                  {eSound ? 'Zil açık' : 'Zil kapalı'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f0f4f7] dark:bg-[#2a3439] text-[#566166] dark:text-[#d6e3ff] text-sm font-bold hover:bg-[#e1e9ee] dark:hover:bg-[#2a3439]/70 transition-colors"
                  >
                    <X className="w-4 h-4" /> Vazgeç
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#244069] hover:bg-[#455f8a] text-white text-sm font-bold transition-colors"
                  >
                    <Save className="w-4 h-4" /> Kaydet
                  </button>
                </div>
              </div>

              {eError && <p className="text-sm font-semibold text-red-500">{eError}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
