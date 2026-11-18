import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  Check,
  Copy,
  Download,
  Loader2,
  Menu,
  RefreshCw,
  Send,
  Square,
} from 'lucide-react';
import { SUBJECTS, SUBJECT_MAP } from '../data/subjects';
import type { ChatMessage, StudyDocument, SubjectId } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';

interface ChatWorkspaceProps {
  subject: SubjectId;
  messages: ChatMessage[];
  documents: StudyDocument[];
  strictDocumentOnly: boolean;
  isStreaming: boolean;
  errorMessage: string | null;
  isDocsPanelOpen: boolean;
  isStandalone: boolean;
  standaloneApiBase: string;
  onSaveStandaloneApiBase: (url: string) => void;
  onOpenMobileHistory: () => void;
  onToggleDocsPanel: () => void;
  onOpenTimetable: () => void;
  onOpenExportHtml: () => void;
  onChangeSubject: (subject: SubjectId) => void;
  onSendMessage: (text: string) => void;
  onStopStreaming: () => void;
  onRetryLast: () => void;
  onDismissError: () => void;
}

function formatMessageTime(timestamp: number): string {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function ChatWorkspace({
  subject,
  messages,
  documents,
  strictDocumentOnly,
  isStreaming,
  errorMessage,
  isDocsPanelOpen,
  isStandalone,
  standaloneApiBase,
  onSaveStandaloneApiBase,
  onOpenMobileHistory,
  onToggleDocsPanel,
  onOpenTimetable,
  onOpenExportHtml,
  onChangeSubject,
  onSendMessage,
  onStopStreaming,
  onRetryLast,
  onDismissError,
}: ChatWorkspaceProps) {
  const [input, setInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showServerUrlForm, setShowServerUrlForm] = useState(false);
  const [serverUrlDraft, setServerUrlDraft] = useState(standaloneApiBase);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const subjectInfo = SUBJECT_MAP[subject];
  const activeDocs = documents.filter((d) => d.enabled);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isStreaming) return;

    const trimmed = input.trim();
    if (!trimmed) {
      setValidationError('Bạn vui lòng nhập câu hỏi trước khi nhấn gửi.');
      textareaRef.current?.focus();
      return;
    }

    if (trimmed.length > 8000) {
      setValidationError(
        'Câu hỏi tối đa 8.000 ký tự. Nếu cần gửi bài đọc dài, bạn hãy thêm vào mục Tài liệu học tập.'
      );
      return;
    }

    setValidationError(null);
    setInput('');
    onSendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2000);
    } catch {
      // Ignore clipboard failure silently
    }
  };

  const canRetry =
    !isStreaming &&
    Boolean(errorMessage) &&
    messages.some((m) => m.role === 'user');

  return (
    <main className="flex-1 min-w-0 flex flex-col h-full bg-slate-50">
      {/* Workspace Toolbar: Mobile history trigger + Subject selector + Docs toggle */}
      <header className="bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5 shrink-0">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <button
              type="button"
              onClick={onOpenMobileHistory}
              aria-label="Mở lịch sử hội thoại"
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 shrink-0 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              role="tablist"
              aria-label="Chọn môn học THCS"
              className="flex items-center gap-1 overflow-x-auto study-scroll py-0.5 pr-2"
            >
              {SUBJECTS.map((subj) => {
                const isSelected = subj.id === subject;
                return (
                  <button
                    key={subj.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    disabled={isStreaming}
                    onClick={() => onChangeSubject(subj.id)}
                    className={`min-h-[38px] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {subj.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenTimetable}
              className="lg:hidden min-h-[38px] px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-sm font-medium text-slate-700 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              title="Mở thời khóa biểu"
            >
              <CalendarDays className="w-4 h-4 shrink-0 text-sky-600" />
              <span className="hidden sm:inline">Thời khóa biểu</span>
            </button>

            <button
              type="button"
              onClick={onOpenExportHtml}
              className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-sm font-medium text-slate-700 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 cursor-pointer"
              title="Xuất ứng dụng ra tệp HTML độc lập"
            >
              <Download className="w-4 h-4 shrink-0 text-sky-600" />
              <span className="hidden md:inline">Xuất HTML</span>
            </button>

            <button
              type="button"
              onClick={onToggleDocsPanel}
              aria-expanded={isDocsPanelOpen}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg border text-sm font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 cursor-pointer ${
                isDocsPanelOpen
                  ? 'bg-sky-50 border-sky-200 text-sky-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0 text-sky-600" />
              <span>Tài liệu</span>
              {activeDocs.length > 0 && (
                <span className="text-xs font-semibold tabular-nums text-sky-700">
                  ({activeDocs.length})
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Message stream */}
      <div className="flex-1 overflow-y-auto study-scroll px-4 sm:px-6 py-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            <section className="pt-4 sm:pt-8 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-7">
                <p className="text-xs font-medium text-sky-700 mb-1.5">
                  Trí Tuệ AI · Trợ giảng môn {subjectInfo.name}
                </p>
                <h1 className="text-2xl sm:text-[28px] font-semibold text-slate-900 tracking-tight leading-snug text-balance">
                  Chào bạn, hôm nay mình cùng học môn {subjectInfo.name} nhé
                </h1>
                <p className="text-sm sm:text-[15px] text-slate-600 mt-2.5 leading-relaxed max-w-2xl">
                  {subjectInfo.shortDescription}. Đặt câu hỏi bên dưới hoặc thêm tài liệu học tập để mình ưu tiên giải thích sát theo bài học của bạn.
                </p>

                <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={onToggleDocsPanel}
                    className="min-h-[40px] px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-sm font-medium text-slate-800 inline-flex items-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-sky-600" />
                    <span>
                      {activeDocs.length > 0
                        ? `Đang bật ${activeDocs.length} tài liệu tham khảo`
                        : 'Cung cấp tài liệu học tập'}
                    </span>
                  </button>
                  <span className="text-xs text-slate-500">
                    Hỗ trợ nhớ ngữ cảnh nhiều lượt hỏi – đáp liên tiếp
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <h2 className="text-xs font-semibold text-slate-500 px-1">
                  Gợi ý câu hỏi môn {subjectInfo.name}
                </h2>
                <div className="grid grid-cols-1 gap-2.5">
                  {subjectInfo.starterPrompts.map((promptText, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => onSendMessage(promptText)}
                      className="text-left p-4 rounded-xl bg-white border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
                    >
                      <span className="text-sm font-medium text-slate-800 leading-relaxed block">
                        {promptText}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          ) : (
            <div className="space-y-5">
              {messages.map((msg, index) => {
                const isLast = index === messages.length - 1;
                const isCurrentlyStreaming =
                  isLast && msg.role === 'model' && isStreaming;

                if (msg.role === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-[88%] sm:max-w-[78%]">
                        <div className="bg-sky-700 text-white rounded-2xl rounded-br-sm px-4 py-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                          {msg.text}
                        </div>
                        <p className="text-[11px] text-slate-400 text-right mt-1.5 tabular-nums">
                          Bạn · {formatMessageTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <article
                    key={msg.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
                  >
                    <div className="flex items-center justify-between gap-3 pb-3 mb-3.5 border-b border-slate-100">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 min-w-0">
                        <span className="font-semibold text-slate-900">
                          Trí Tuệ AI
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>Môn {subjectInfo.name}</span>
                        {msg.usedDocumentTitles &&
                          msg.usedDocumentTitles.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-sky-700 font-medium">
                                Tham khảo {msg.usedDocumentTitles.length} tài liệu
                              </span>
                            </>
                          )}
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">
                          {formatMessageTime(msg.createdAt)}
                        </span>
                      </div>

                      {!isCurrentlyStreaming && msg.text.trim().length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.text)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                        >
                          {copiedId === msg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Sao chép</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {msg.text ? (
                      <MarkdownRenderer content={msg.text} />
                    ) : (
                      <div className="flex items-center gap-2.5 text-sm text-slate-500 py-1">
                        <Loader2 className="w-4 h-4 animate-spin text-sky-600 shrink-0" />
                        <span>
                          {activeDocs.length > 0
                            ? 'Đang tra cứu tài liệu học tập và soạn câu trả lời...'
                            : 'Đang suy nghĩ và soạn câu trả lời...'}
                        </span>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {/* API / Network Error Banner */}
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl bg-red-50 border border-red-200 p-4 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 text-sm text-red-800">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  {(isStandalone ||
                    errorMessage.includes('404') ||
                    errorMessage.includes('file://')) && (
                    <button
                      type="button"
                      onClick={() => {
                        setServerUrlDraft(standaloneApiBase);
                        setShowServerUrlForm((prev) => !prev);
                      }}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-100/50 text-xs font-medium text-red-800 cursor-pointer whitespace-nowrap"
                    >
                      Đổi URL máy chủ
                    </button>
                  )}
                  {canRetry && (
                    <button
                      type="button"
                      onClick={onRetryLast}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Thử lại</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onDismissError}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-100/50 text-xs font-medium text-red-700 cursor-pointer whitespace-nowrap"
                  >
                    Đóng
                  </button>
                </div>
              </div>

              {showServerUrlForm && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    onSaveStandaloneApiBase(serverUrlDraft);
                    setShowServerUrlForm(false);
                  }}
                  className="pt-3 border-t border-red-200/80 flex flex-col sm:flex-row gap-2"
                >
                  <input
                    type="url"
                    value={serverUrlDraft}
                    onChange={(e) => setServerUrlDraft(e.target.value)}
                    placeholder="https://tri-tue-ai.vercel.app hoặc https://tri-tue-ai.onrender.com"
                    className="flex-1 min-h-[38px] px-3 py-1.5 rounded-lg border border-red-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                  <button
                    type="submit"
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium whitespace-nowrap cursor-pointer"
                  >
                    Lưu & thử lại
                  </button>
                </form>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom Input Composer */}
      <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3.5 shrink-0">
        <div className="max-w-3xl mx-auto">
          {validationError && (
            <p
              role="alert"
              className="text-xs text-red-600 mb-2 flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationError}</span>
            </p>
          )}

          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-slate-200 bg-slate-50 focus-within:bg-white focus-within:border-sky-600 focus-within:ring-2 focus-within:ring-sky-600/15 transition-colors"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (validationError) setValidationError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder={`Nhập câu hỏi môn ${subjectInfo.name} của bạn...`}
              aria-label="Nhập câu hỏi cho trợ lý học tập"
              className="w-full bg-transparent px-4 pt-3 pb-2 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none max-h-[160px]"
            />

            <div className="px-3 pb-2.5 pt-1 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0 text-xs text-slate-500">
                <button
                  type="button"
                  onClick={onToggleDocsPanel}
                  className="text-left hover:text-sky-700 transition-colors truncate cursor-pointer"
                >
                  {activeDocs.length > 0
                    ? `Ưu tiên ${activeDocs.length} tài liệu · ${
                        strictDocumentOnly
                          ? 'Chỉ bám sát tài liệu'
                          : 'Bổ sung THCS nếu thiếu'
                      }`
                    : 'Chưa gắn tài liệu · Nhấn để thêm tài liệu'}
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {input.length > 6000 && (
                  <span
                    className={`text-xs tabular-nums ${
                      input.length > 8000 ? 'text-red-600' : 'text-slate-400'
                    }`}
                  >
                    {input.length.toLocaleString('vi-VN')}/8.000
                  </span>
                )}

                {isStreaming ? (
                  <button
                    type="button"
                    onClick={onStopStreaming}
                    className="min-h-[38px] px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Dừng</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="min-h-[38px] px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi</span>
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
