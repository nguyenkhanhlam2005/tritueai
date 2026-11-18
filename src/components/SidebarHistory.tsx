import {
  CalendarDays,
  Download,
  Loader2,
  MessageSquare,
  MessageSquarePlus,
  Trash2,
  X,
} from 'lucide-react';
import { SUBJECT_MAP } from '../data/subjects';
import type { Conversation, WorkspaceView } from '../types';

interface SidebarHistoryProps {
  conversations: Conversation[];
  activeId: string;
  activeView: WorkspaceView;
  timetableCount: number;
  isExportingHtml: boolean;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onChangeView: (view: WorkspaceView) => void;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAllConversations: () => void;
  onExportHtml: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Vừa xong';
  if (diffMins < 60) return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(timestamp));
}

export function SidebarHistory({
  conversations,
  activeId,
  activeView,
  timetableCount,
  isExportingHtml,
  isOpenMobile,
  onCloseMobile,
  onChangeView,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onClearAllConversations,
  onExportHtml,
}: SidebarHistoryProps) {
  const content = (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Brand + View switch + New chat CTA */}
      <div className="p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="font-bold text-xl tracking-tight text-slate-900 whitespace-nowrap block">
              Trí Tuệ AI
            </span>
            <p className="text-xs text-slate-500 mt-0.5 truncate">
              Trợ lý học tập THCS
            </p>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Đóng thanh điều hướng"
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workspace Navigation */}
        <nav aria-label="Chức năng chính" className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => {
              onChangeView('chat');
              onCloseMobile();
            }}
            className={`min-h-[36px] px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeView === 'chat'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 shrink-0 text-sky-600" />
            <span>Hỏi đáp AI</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onChangeView('timetable');
              onCloseMobile();
            }}
            className={`min-h-[36px] px-2.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeView === 'timetable'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5 shrink-0 text-sky-600" />
            <span>Thời khóa biểu</span>
            {timetableCount > 0 && (
              <span className="text-[11px] text-slate-400 tabular-nums">
                ({timetableCount})
              </span>
            )}
          </button>
        </nav>

        <button
          type="button"
          onClick={() => {
            onChangeView('chat');
            onNewConversation();
            onCloseMobile();
          }}
          className="w-full min-h-[40px] px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 focus-visible:ring-offset-2 cursor-pointer"
        >
          <MessageSquarePlus className="w-4 h-4 shrink-0" />
          <span>Cuộc trò chuyện mới</span>
        </button>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto study-scroll px-3 py-3">
        <div className="flex items-center justify-between px-2 mb-2">
          <h2 className="text-xs font-semibold text-slate-500">
            Lịch sử hội thoại
          </h2>
          <span className="text-xs text-slate-400 tabular-nums">
            {conversations.length}
          </span>
        </div>

        {conversations.length === 0 ? (
          <div className="px-3 py-8 text-center">
            <MessageSquare className="w-6 h-6 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500">
              Chưa có cuộc trò chuyện nào được lưu.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {conversations.map((conv) => {
              const isActive = conv.id === activeId;
              const subjectName = SUBJECT_MAP[conv.subject]?.name ?? 'Học tập';
              const msgCount = conv.messages.length;
              const docCount = conv.documents.filter((d) => d.enabled).length;

              return (
                <li key={conv.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeView('chat');
                      onSelectConversation(conv.id);
                      onCloseMobile();
                    }}
                    className={`w-full text-left px-3 py-2.5 pr-10 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 ${
                      isActive
                        ? 'bg-sky-50 text-slate-900 border border-sky-200'
                        : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <p
                      className={`text-sm font-medium truncate ${
                        isActive ? 'text-sky-900' : 'text-slate-800'
                      }`}
                    >
                      {conv.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500 truncate">
                      <span>{subjectName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{msgCount} tin</span>
                      {docCount > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{docCount} tài liệu</span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{formatRelativeTime(conv.updatedAt)}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    aria-label={`Xóa cuộc trò chuyện ${conv.title}`}
                    title="Xóa cuộc trò chuyện"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Footer actions */}
      <div className="p-3 border-t border-slate-200 space-y-1.5">
        <button
          type="button"
          disabled={isExportingHtml}
          onClick={onExportHtml}
          className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          {isExportingHtml ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
              <span>Đang xuất tệp HTML...</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>Xuất trang web (.html)</span>
            </>
          )}
        </button>

        {conversations.length > 1 && (
          <button
            type="button"
            onClick={onClearAllConversations}
            className="w-full min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 transition-colors text-center cursor-pointer"
          >
            Xóa toàn bộ lịch sử
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed column */}
      <aside className="hidden lg:block w-[280px] shrink-0 h-full">
        {content}
      </aside>

      {/* Mobile slide-over drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[290px] max-w-[85vw] h-full shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
