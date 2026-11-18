import { useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Download,
  Menu,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from 'lucide-react';
import type {
  SessionId,
  SubjectId,
  TimetableSlot,
  WeekdayId,
} from '../types';

interface TimetableWorkspaceProps {
  slots: TimetableSlot[];
  onOpenMobileHistory: () => void;
  onSwitchToChat: () => void;
  onOpenExportHtml: () => void;
  onAskAiAboutSubject: (subjectId: SubjectId, contextNote?: string) => void;
  onSaveSlot: (slot: Omit<TimetableSlot, 'id'>, editId?: string) => void;
  onDeleteSlot: (id: string) => void;
  onResetSampleTimetable: () => void;
  onClearTimetable: () => void;
}

export const WEEKDAYS: { id: WeekdayId; label: string; short: string; jsDay: number }[] = [
  { id: 'mon', label: 'Thứ 2', short: 'T2', jsDay: 1 },
  { id: 'tue', label: 'Thứ 3', short: 'T3', jsDay: 2 },
  { id: 'wed', label: 'Thứ 4', short: 'T4', jsDay: 3 },
  { id: 'thu', label: 'Thứ 5', short: 'T5', jsDay: 4 },
  { id: 'fri', label: 'Thứ 6', short: 'T6', jsDay: 5 },
  { id: 'sat', label: 'Thứ 7', short: 'T7', jsDay: 6 },
];

const DEFAULT_PERIOD_TIMES: Record<SessionId, Record<number, string>> = {
  morning: {
    1: '07:15 – 08:00',
    2: '08:05 – 08:50',
    3: '09:05 – 09:50',
    4: '09:55 – 10:40',
    5: '10:45 – 11:30',
  },
  afternoon: {
    1: '13:30 – 14:15',
    2: '14:20 – 15:05',
    3: '15:20 – 16:05',
    4: '16:10 – 16:55',
  },
};

const SUBJECT_OPTIONS: { name: string; linkedSubjectId?: SubjectId }[] = [
  { name: 'Toán', linkedSubjectId: 'toan' },
  { name: 'Ngữ văn', linkedSubjectId: 'ngu-van' },
  { name: 'Tiếng Anh', linkedSubjectId: 'tieng-anh' },
  { name: 'Khoa học', linkedSubjectId: 'khoa-hoc' },
  { name: 'Lịch sử và Địa lý', linkedSubjectId: 'lich-su-dia-ly' },
  { name: 'Tin học' },
  { name: 'GDCD' },
  { name: 'Công nghệ' },
  { name: 'Thể dục' },
  { name: 'Âm nhạc' },
  { name: 'Mĩ thuật' },
  { name: 'Sinh hoạt lớp' },
];

export const SAMPLE_TIMETABLE: TimetableSlot[] = [
  { id: 's-mon-m1', day: 'mon', session: 'morning', period: 1, timeRange: '07:15 – 08:00', subjectName: 'Chào cờ', room: 'Sân trường' },
  { id: 's-mon-m2', day: 'mon', session: 'morning', period: 2, timeRange: '08:05 – 08:50', subjectName: 'Toán', linkedSubjectId: 'toan', room: 'P.201', note: 'Đại số' },
  { id: 's-mon-m3', day: 'mon', session: 'morning', period: 3, timeRange: '09:05 – 09:50', subjectName: 'Ngữ văn', linkedSubjectId: 'ngu-van', room: 'P.201' },
  { id: 's-mon-m4', day: 'mon', session: 'morning', period: 4, timeRange: '09:55 – 10:40', subjectName: 'Tiếng Anh', linkedSubjectId: 'tieng-anh', room: 'P.201' },
  { id: 's-tue-m1', day: 'tue', session: 'morning', period: 1, timeRange: '07:15 – 08:00', subjectName: 'Khoa học', linkedSubjectId: 'khoa-hoc', room: 'Phòng TN', note: 'Thực hành' },
  { id: 's-tue-m2', day: 'tue', session: 'morning', period: 2, timeRange: '08:05 – 08:50', subjectName: 'Khoa học', linkedSubjectId: 'khoa-hoc', room: 'P.201' },
  { id: 's-tue-m3', day: 'tue', session: 'morning', period: 3, timeRange: '09:05 – 09:50', subjectName: 'Lịch sử và Địa lý', linkedSubjectId: 'lich-su-dia-ly', room: 'P.201' },
  { id: 's-tue-m4', day: 'tue', session: 'morning', period: 4, timeRange: '09:55 – 10:40', subjectName: 'Toán', linkedSubjectId: 'toan', room: 'P.201', note: 'Hình học' },
  { id: 's-tue-a1', day: 'tue', session: 'afternoon', period: 1, timeRange: '13:30 – 14:15', subjectName: 'Tin học', room: 'Phòng Máy 1' },
  { id: 's-wed-m1', day: 'wed', session: 'morning', period: 1, timeRange: '07:15 – 08:00', subjectName: 'Ngữ văn', linkedSubjectId: 'ngu-van', room: 'P.201' },
  { id: 's-wed-m2', day: 'wed', session: 'morning', period: 2, timeRange: '08:05 – 08:50', subjectName: 'Ngữ văn', linkedSubjectId: 'ngu-van', room: 'P.201' },
  { id: 's-wed-m3', day: 'wed', session: 'morning', period: 3, timeRange: '09:05 – 09:50', subjectName: 'Tiếng Anh', linkedSubjectId: 'tieng-anh', room: 'P.201' },
  { id: 's-wed-m4', day: 'wed', session: 'morning', period: 4, timeRange: '09:55 – 10:40', subjectName: 'GDCD', room: 'P.201' },
  { id: 's-thu-m1', day: 'thu', session: 'morning', period: 1, timeRange: '07:15 – 08:00', subjectName: 'Toán', linkedSubjectId: 'toan', room: 'P.201' },
  { id: 's-thu-m2', day: 'thu', session: 'morning', period: 2, timeRange: '08:05 – 08:50', subjectName: 'Toán', linkedSubjectId: 'toan', room: 'P.201' },
  { id: 's-thu-m3', day: 'thu', session: 'morning', period: 3, timeRange: '09:05 – 09:50', subjectName: 'Lịch sử và Địa lý', linkedSubjectId: 'lich-su-dia-ly', room: 'P.201' },
  { id: 's-thu-m4', day: 'thu', session: 'morning', period: 4, timeRange: '09:55 – 10:40', subjectName: 'Công nghệ', room: 'P.201' },
  { id: 's-thu-a1', day: 'thu', session: 'afternoon', period: 1, timeRange: '13:30 – 14:15', subjectName: 'Thể dục', room: 'Nhà đa năng' },
  { id: 's-fri-m1', day: 'fri', session: 'morning', period: 1, timeRange: '07:15 – 08:00', subjectName: 'Tiếng Anh', linkedSubjectId: 'tieng-anh', room: 'P.201' },
  { id: 's-fri-m2', day: 'fri', session: 'morning', period: 2, timeRange: '08:05 – 08:50', subjectName: 'Khoa học', linkedSubjectId: 'khoa-hoc', room: 'P.201' },
  { id: 's-fri-m3', day: 'fri', session: 'morning', period: 3, timeRange: '09:05 – 09:50', subjectName: 'Ngữ văn', linkedSubjectId: 'ngu-van', room: 'P.201' },
  { id: 's-fri-m4', day: 'fri', session: 'morning', period: 4, timeRange: '09:55 – 10:40', subjectName: 'Âm nhạc', room: 'Phòng Nhạc' },
  { id: 's-sat-m1', day: 'sat', session: 'morning', period: 1, timeRange: '07:15 – 08:00', subjectName: 'Toán', linkedSubjectId: 'toan', room: 'P.201', note: 'Ôn tập tuần' },
  { id: 's-sat-m2', day: 'sat', session: 'morning', period: 2, timeRange: '08:05 – 08:50', subjectName: 'Lịch sử và Địa lý', linkedSubjectId: 'lich-su-dia-ly', room: 'P.201' },
  { id: 's-sat-m3', day: 'sat', session: 'morning', period: 3, timeRange: '09:05 – 09:50', subjectName: 'Sinh hoạt lớp', room: 'P.201' },
];

function getTodayWeekdayId(): WeekdayId {
  const jsDay = new Date().getDay();
  const match = WEEKDAYS.find((d) => d.jsDay === jsDay);
  return match ? match.id : 'mon';
}

export function TimetableWorkspace({
  slots,
  onOpenMobileHistory,
  onSwitchToChat,
  onOpenExportHtml,
  onAskAiAboutSubject,
  onSaveSlot,
  onDeleteSlot,
  onResetSampleTimetable,
  onClearTimetable,
}: TimetableWorkspaceProps) {
  const todayId = useMemo(() => getTodayWeekdayId(), []);
  const [selectedMobileDay, setSelectedMobileDay] = useState<WeekdayId>(todayId);
  const [sessionFilter, setSessionFilter] = useState<'all' | SessionId>('all');
  const [confirmClear, setConfirmClear] = useState(false);

  // Modal state for Add / Edit
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDay, setFormDay] = useState<WeekdayId>(todayId);
  const [formSession, setFormSession] = useState<SessionId>('morning');
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formTimeRange, setFormTimeRange] = useState<string>('07:15 – 08:00');
  const [formSubjectChoice, setFormSubjectChoice] = useState<string>('Toán');
  const [formCustomSubject, setFormCustomSubject] = useState<string>('');
  const [formRoom, setFormRoom] = useState<string>('');
  const [formNote, setFormNote] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date());
  }, []);

  const todaySlots = useMemo(
    () =>
      slots
        .filter((s) => s.day === todayId)
        .sort((a, b) => {
          if (a.session !== b.session) return a.session === 'morning' ? -1 : 1;
          return a.period - b.period;
        }),
    [slots, todayId]
  );

  const slotLookup = useMemo(() => {
    const map = new Map<string, TimetableSlot>();
    for (const s of slots) {
      map.set(`${s.day}:${s.session}:${s.period}`, s);
    }
    return map;
  }, [slots]);

  const openAddModal = (
    day: WeekdayId = todayId,
    session: SessionId = 'morning',
    period: number = 1
  ) => {
    setEditingId(null);
    setFormDay(day);
    setFormSession(session);
    setFormPeriod(period);
    setFormTimeRange(DEFAULT_PERIOD_TIMES[session][period] ?? '07:15 – 08:00');
    setFormSubjectChoice('Toán');
    setFormCustomSubject('');
    setFormRoom('');
    setFormNote('');
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (slot: TimetableSlot) => {
    setEditingId(slot.id);
    setFormDay(slot.day);
    setFormSession(slot.session);
    setFormPeriod(slot.period);
    setFormTimeRange(slot.timeRange);
    const known = SUBJECT_OPTIONS.some((o) => o.name === slot.subjectName);
    if (known) {
      setFormSubjectChoice(slot.subjectName);
      setFormCustomSubject('');
    } else {
      setFormSubjectChoice('__custom__');
      setFormCustomSubject(slot.subjectName);
    }
    setFormRoom(slot.room ?? '');
    setFormNote(slot.note ?? '');
    setFormError(null);
    setModalOpen(true);
  };

  const handleSessionOrPeriodChange = (nextSession: SessionId, nextPeriod: number) => {
    setFormSession(nextSession);
    const maxPeriod = nextSession === 'morning' ? 5 : 4;
    const clamped = Math.min(Math.max(1, nextPeriod), maxPeriod);
    setFormPeriod(clamped);
    setFormTimeRange(DEFAULT_PERIOD_TIMES[nextSession][clamped] ?? '');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const resolvedName =
      formSubjectChoice === '__custom__'
        ? formCustomSubject.trim()
        : formSubjectChoice;

    if (!resolvedName) {
      setFormError('Vui lòng chọn hoặc nhập tên môn học.');
      return;
    }

    const existingConflict = slots.find(
      (s) =>
        s.day === formDay &&
        s.session === formSession &&
        s.period === formPeriod &&
        s.id !== editingId
    );
    if (existingConflict) {
      const dayLabel = WEEKDAYS.find((d) => d.id === formDay)?.label ?? '';
      const sessionLabel = formSession === 'morning' ? 'buổi sáng' : 'buổi chiều';
      setFormError(
        `${dayLabel} (${sessionLabel}, Tiết ${formPeriod}) đã có môn "${existingConflict.subjectName}". Vui lòng chọn tiết khác hoặc chỉnh sửa tiết hiện có.`
      );
      return;
    }

    const matchedSubject = SUBJECT_OPTIONS.find((o) => o.name === resolvedName);

    onSaveSlot(
      {
        day: formDay,
        session: formSession,
        period: formPeriod,
        timeRange: formTimeRange.trim() || DEFAULT_PERIOD_TIMES[formSession][formPeriod] || '',
        subjectName: resolvedName,
        linkedSubjectId: matchedSubject?.linkedSubjectId,
        room: formRoom.trim() || undefined,
        note: formNote.trim() || undefined,
      },
      editingId ?? undefined
    );

    setModalOpen(false);
  };

  const sessionsToRender: { id: SessionId; label: string; periods: number[] }[] = [
    { id: 'morning', label: 'Buổi sáng', periods: [1, 2, 3, 4, 5] },
    { id: 'afternoon', label: 'Buổi chiều', periods: [1, 2, 3, 4] },
  ].filter((sec) => sessionFilter === 'all' || sec.id === sessionFilter) as {
    id: SessionId;
    label: string;
    periods: number[];
  }[];

  return (
    <main className="flex-1 min-w-0 flex flex-col h-full bg-slate-50">
      {/* Top Toolbar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onOpenMobileHistory}
              aria-label="Mở thanh điều hướng"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-sky-600 shrink-0" />
                <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                  Thời khóa biểu THCS
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onSwitchToChat}
              className="lg:hidden min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
              <span>Hỏi AI</span>
            </button>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'all', label: 'Cả ngày' },
                  { id: 'morning', label: 'Sáng' },
                  { id: 'afternoon', label: 'Chiều' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSessionFilter(opt.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    sessionFilter === opt.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onOpenExportHtml}
              className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs sm:text-sm font-medium text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              title="Xuất ứng dụng ra tệp HTML độc lập"
            >
              <Download className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="hidden sm:inline">Xuất HTML</span>
            </button>

            <button
              type="button"
              onClick={() => openAddModal(todayId, 'morning', 1)}
              className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>Thêm tiết học</span>
            </button>
          </div>
        </div>
      </header>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto study-scroll px-4 sm:px-6 py-5">
        <div className="max-w-6xl mx-auto space-y-5">
          {/* Today Overview Strip */}
          <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-medium text-sky-700 capitalize">
                  {todayFormatted}
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  Hôm nay có {todaySlots.length} tiết
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">
                  Tổng tuần: {slots.length} tiết
                </span>
              </div>
              <p className="text-sm text-slate-700">
                {todaySlots.length > 0
                  ? `Các môn hôm nay: ${Array.from(
                      new Set(todaySlots.map((s) => s.subjectName))
                    ).join(', ')}.`
                  : 'Hôm nay chưa có tiết học nào được lên lịch. Nhấn "Thêm tiết học" để cập nhật.'}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={onResetSampleTimetable}
                className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Nạp lịch mẫu</span>
              </button>

              {slots.length > 0 &&
                (confirmClear ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClearTimetable();
                        setConfirmClear(false);
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium whitespace-nowrap cursor-pointer"
                    >
                      Xác nhận xóa
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="min-h-[36px] px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 whitespace-nowrap cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 text-xs font-medium text-slate-600 whitespace-nowrap cursor-pointer"
                  >
                    Xóa tất cả
                  </button>
                ))}
            </div>
          </section>

          {/* Desktop Weekly Grid Table (lg and up) */}
          <section className="hidden lg:block space-y-5">
            {sessionsToRender.map((sec) => (
              <div
                key={sec.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {sec.label}
                  </h2>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {sec.periods.length} tiết
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/40">
                        <th className="w-28 px-3 py-2.5 text-left text-xs font-semibold text-slate-500 border-r border-slate-200">
                          Tiết / Giờ
                        </th>
                        {WEEKDAYS.map((day) => {
                          const isToday = day.id === todayId;
                          return (
                            <th
                              key={day.id}
                              className={`px-3 py-2.5 text-left text-xs font-semibold border-r last:border-r-0 border-slate-200 ${
                                isToday
                                  ? 'bg-sky-50/80 text-sky-900'
                                  : 'text-slate-700'
                              }`}
                            >
                              <span>{day.label}</span>
                              {isToday && (
                                <span className="ml-1.5 font-normal text-sky-700">
                                  · Hôm nay
                                </span>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-200">
                      {sec.periods.map((period) => {
                        const defaultTime =
                          DEFAULT_PERIOD_TIMES[sec.id][period] ?? '';
                        return (
                          <tr key={period} className="align-top">
                            <td className="px-3 py-3 border-r border-slate-200 bg-slate-50/30">
                              <div className="text-xs font-semibold text-slate-800 tabular-nums">
                                Tiết {period}
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                                {defaultTime}
                              </div>
                            </td>

                            {WEEKDAYS.map((day) => {
                              const slot = slotLookup.get(
                                `${day.id}:${sec.id}:${period}`
                              );
                              const isToday = day.id === todayId;

                              return (
                                <td
                                  key={day.id}
                                  className={`p-2 border-r last:border-r-0 border-slate-200 min-h-[86px] ${
                                    isToday ? 'bg-sky-50/25' : ''
                                  }`}
                                >
                                  {slot ? (
                                    <div className="group rounded-lg border border-slate-200 bg-white p-2.5 hover:border-sky-300 transition-colors">
                                      <div className="flex items-start justify-between gap-1">
                                        <p className="text-sm font-semibold text-slate-900 leading-snug break-words">
                                          {slot.subjectName}
                                        </p>
                                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => openEditModal(slot)}
                                            aria-label={`Sửa tiết ${slot.subjectName}`}
                                            className="w-6 h-6 rounded inline-flex items-center justify-center text-slate-400 hover:text-sky-700 hover:bg-sky-50 cursor-pointer"
                                          >
                                            <Pencil className="w-3 h-3" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => onDeleteSlot(slot.id)}
                                            aria-label={`Xóa tiết ${slot.subjectName}`}
                                            className="w-6 h-6 rounded inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </div>

                                      {(slot.room || slot.note) && (
                                        <p className="text-[11px] text-slate-500 mt-1 break-words">
                                          {[slot.room, slot.note]
                                            .filter(Boolean)
                                            .join(' · ')}
                                        </p>
                                      )}

                                      {slot.linkedSubjectId && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            onAskAiAboutSubject(
                                              slot.linkedSubjectId!,
                                              slot.note
                                            )
                                          }
                                          className="mt-2 text-[11px] font-medium text-sky-700 hover:text-sky-800 inline-flex items-center gap-1 cursor-pointer"
                                        >
                                          <span>Học với AI</span>
                                          <ArrowRight className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openAddModal(day.id, sec.id, period)
                                      }
                                      aria-label={`Thêm tiết học ${day.label} ${sec.label} tiết ${period}`}
                                      className="w-full min-h-[68px] rounded-lg border border-dashed border-transparent hover:border-slate-300 hover:bg-slate-100/70 flex items-center justify-center text-slate-300 hover:text-slate-600 transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </section>

          {/* Mobile & Tablet Day-by-Day View (< lg) */}
          <section className="lg:hidden space-y-4">
            <div className="flex items-center gap-1 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto">
              {WEEKDAYS.map((day) => {
                const isSelected = day.id === selectedMobileDay;
                const isToday = day.id === todayId;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setSelectedMobileDay(day.id)}
                    className={`flex-1 min-w-[54px] min-h-[40px] px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{day.label}</span>
                    {isToday && !isSelected && (
                      <span className="block text-[10px] text-sky-700 font-normal">
                        Hôm nay
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {sessionsToRender.map((sec) => (
              <div
                key={sec.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {sec.label}
                  </h2>
                  <span className="text-xs text-slate-500">
                    {WEEKDAYS.find((d) => d.id === selectedMobileDay)?.label}
                  </span>
                </div>

                <ul className="divide-y divide-slate-100">
                  {sec.periods.map((period) => {
                    const slot = slotLookup.get(
                      `${selectedMobileDay}:${sec.id}:${period}`
                    );
                    const defaultTime =
                      DEFAULT_PERIOD_TIMES[sec.id][period] ?? '';

                    return (
                      <li key={period} className="p-3.5">
                        {slot ? (
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-xs text-slate-500 tabular-nums">
                                <span className="font-semibold text-slate-700">
                                  Tiết {period}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {slot.timeRange}
                                </span>
                              </div>
                              <p className="text-base font-semibold text-slate-900 mt-1">
                                {slot.subjectName}
                              </p>
                              {(slot.room || slot.note) && (
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {[slot.room, slot.note]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </p>
                              )}
                              {slot.linkedSubjectId && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onAskAiAboutSubject(
                                      slot.linkedSubjectId!,
                                      slot.note
                                    )
                                  }
                                  className="mt-2 text-xs font-medium text-sky-700 hover:text-sky-800 inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <span>Ôn tập môn này với Trí Tuệ AI</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => openEditModal(slot)}
                                aria-label={`Sửa tiết ${slot.subjectName}`}
                                className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-sky-700 hover:bg-sky-50 cursor-pointer"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteSlot(slot.id)}
                                aria-label={`Xóa tiết ${slot.subjectName}`}
                                className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs text-slate-400 tabular-nums">
                              Tiết {period} · {defaultTime} · Trống
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                openAddModal(selectedMobileDay, sec.id, period)
                              }
                              className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Thêm</span>
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="timetable-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div
            className="fixed inset-0 bg-slate-900/45"
            onClick={() => setModalOpen(false)}
            aria-hidden="true"
          />

          <div className="relative z-10 w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2
                id="timetable-modal-title"
                className="text-base font-semibold text-slate-900"
              >
                {editingId ? 'Chỉnh sửa tiết học' : 'Thêm tiết học mới'}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Đóng hộp thoại"
                className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {formError && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed"
                >
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="tt-day"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Ngày học
                  </label>
                  <select
                    id="tt-day"
                    value={formDay}
                    onChange={(e) => setFormDay(e.target.value as WeekdayId)}
                    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    {WEEKDAYS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="tt-session"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Buổi học
                  </label>
                  <select
                    id="tt-session"
                    value={formSession}
                    onChange={(e) =>
                      handleSessionOrPeriodChange(
                        e.target.value as SessionId,
                        formPeriod
                      )
                    }
                    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    <option value="morning">Buổi sáng</option>
                    <option value="afternoon">Buổi chiều</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="tt-period"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Tiết học
                  </label>
                  <select
                    id="tt-period"
                    value={formPeriod}
                    onChange={(e) =>
                      handleSessionOrPeriodChange(
                        formSession,
                        Number(e.target.value)
                      )
                    }
                    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  >
                    {(formSession === 'morning'
                      ? [1, 2, 3, 4, 5]
                      : [1, 2, 3, 4]
                    ).map((p) => (
                      <option key={p} value={p}>
                        Tiết {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="tt-time"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Khung giờ
                  </label>
                  <input
                    id="tt-time"
                    type="text"
                    value={formTimeRange}
                    onChange={(e) => setFormTimeRange(e.target.value)}
                    placeholder="07:15 – 08:00"
                    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="tt-subject"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Môn học
                </label>
                <select
                  id="tt-subject"
                  value={formSubjectChoice}
                  onChange={(e) => setFormSubjectChoice(e.target.value)}
                  className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                >
                  {SUBJECT_OPTIONS.map((subj) => (
                    <option key={subj.name} value={subj.name}>
                      {subj.name}
                      {subj.linkedSubjectId ? ' (Có trợ giảng AI)' : ''}
                    </option>
                  ))}
                  <option value="__custom__">Môn học khác (tự nhập)...</option>
                </select>
              </div>

              {formSubjectChoice === '__custom__' && (
                <div>
                  <label
                    htmlFor="tt-custom-subject"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Nhập tên môn học
                  </label>
                  <input
                    id="tt-custom-subject"
                    type="text"
                    value={formCustomSubject}
                    onChange={(e) => setFormCustomSubject(e.target.value)}
                    placeholder="Ví dụ: Hoạt động trải nghiệm"
                    maxLength={60}
                    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="tt-room"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Phòng học (tùy chọn)
                  </label>
                  <input
                    id="tt-room"
                    type="text"
                    value={formRoom}
                    onChange={(e) => setFormRoom(e.target.value)}
                    placeholder="Ví dụ: P.204"
                    maxLength={40}
                    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>

                <div>
                  <label
                    htmlFor="tt-note"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    Ghi chú (tùy chọn)
                  </label>
                  <input
                    id="tt-note"
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Ví dụ: Mang compa"
                    maxLength={80}
                    className="w-full min-h-[40px] px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="min-h-[40px] px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium transition-colors cursor-pointer"
                >
                  {editingId ? 'Lưu thay đổi' : 'Thêm tiết học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
