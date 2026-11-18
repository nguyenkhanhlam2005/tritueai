import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatWorkspace } from './components/ChatWorkspace';
import { ExportHtmlModal } from './components/ExportHtmlModal';
import { SidebarHistory } from './components/SidebarHistory';
import { StudyMaterialsPanel } from './components/StudyMaterialsPanel';
import {
  SAMPLE_TIMETABLE,
  TimetableWorkspace,
} from './components/TimetableWorkspace';
import { SUBJECT_MAP } from './data/subjects';
import type {
  ChatMessage,
  Conversation,
  StudyDocument,
  SubjectId,
  TimetableSlot,
  WorkspaceView,
} from './types';

const STORAGE_KEY_CONVERSATIONS = 'idk_ai_thcs_conversations_v1';
const STORAGE_KEY_ACTIVE_ID = 'idk_ai_thcs_active_id_v1';
const STORAGE_KEY_TIMETABLE = 'idk_ai_thcs_timetable_v1';
const STORAGE_KEY_API_BASE = 'idk_ai_thcs_api_base_v1';

function isStandaloneHtml(): boolean {
  if (typeof window === 'undefined') return false;
  const win = window as Window & { __TRI_TUE_IS_STANDALONE__?: boolean };
  return Boolean(win.__TRI_TUE_IS_STANDALONE__);
}

function getApiBase(): string {
  if (typeof window === 'undefined') return '';
  if (!isStandaloneHtml()) return '';
  try {
    const saved = localStorage.getItem(STORAGE_KEY_API_BASE)?.trim();
    if (saved) return saved.replace(/\/+$/, '');
  } catch {
    // Ignore storage errors
  }
  const win = window as Window & { __TRI_TUE_API_BASE__?: string };
  const injected =
    typeof win.__TRI_TUE_API_BASE__ === 'string'
      ? win.__TRI_TUE_API_BASE__.trim().replace(/\/+$/, '')
      : '';
  // Avoid broken localhost calls when hosted on a public HTTPS domain
  if (
    injected.startsWith('http://localhost') &&
    window.location.protocol === 'https:'
  ) {
    return '';
  }
  return injected;
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptyConversation(subject: SubjectId = 'toan'): Conversation {
  const now = Date.now();
  return {
    id: createId(),
    title: `Học ${SUBJECT_MAP[subject].name}`,
    subject,
    messages: [],
    documents: [],
    strictDocumentOnly: true,
    createdAt: now,
    updatedAt: now,
  };
}

function deriveConversationTitle(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= 48) return clean;
  return `${clean.slice(0, 45)}...`;
}

function loadInitialConversations(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    if (!raw) return [createEmptyConversation('toan')];
    const parsed = JSON.parse(raw) as Conversation[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [createEmptyConversation('toan')];
    }
    return parsed;
  } catch {
    return [createEmptyConversation('toan')];
  }
}

function loadInitialTimetable(): TimetableSlot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TIMETABLE);
    if (!raw) return SAMPLE_TIMETABLE;
    const parsed = JSON.parse(raw) as TimetableSlot[];
    if (!Array.isArray(parsed)) return SAMPLE_TIMETABLE;
    return parsed;
  } catch {
    return SAMPLE_TIMETABLE;
  }
}

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>(
    loadInitialConversations
  );
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>(
    loadInitialTimetable
  );
  const [activeView, setActiveView] = useState<WorkspaceView>('chat');
  const [activeId, setActiveId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
      return saved || '';
    } catch {
      return '';
    }
  });

  const [isMobileHistoryOpen, setIsMobileHistoryOpen] = useState(false);
  const [isDocsPanelOpen, setIsDocsPanelOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1280;
    }
    return true;
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [standaloneApiBase, setStandaloneApiBase] = useState<string>(getApiBase);

  const abortControllerRef = useRef<AbortController | null>(null);

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? conversations[0];

  useEffect(() => {
    if (activeConversation && activeConversation.id !== activeId) {
      setActiveId(activeConversation.id);
    }
  }, [activeConversation, activeId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_CONVERSATIONS,
        JSON.stringify(conversations)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [conversations]);

  useEffect(() => {
    try {
      if (activeConversation?.id) {
        localStorage.setItem(STORAGE_KEY_ACTIVE_ID, activeConversation.id);
      }
    } catch {
      // Ignore storage errors
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY_TIMETABLE,
        JSON.stringify(timetableSlots)
      );
    } catch {
      // Ignore storage errors
    }
  }, [timetableSlots]);

  const updateConversation = useCallback(
    (convId: string, updater: (prev: Conversation) => Conversation) => {
      setConversations((prevList) =>
        prevList.map((conv) => (conv.id === convId ? updater(conv) : conv))
      );
    },
    []
  );

  const handleNewConversation = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setErrorMessage(null);
    const currentSubject = activeConversation?.subject ?? 'toan';
    const nextConv = createEmptyConversation(currentSubject);
    setConversations((prev) => [nextConv, ...prev]);
    setActiveId(nextConv.id);
  };

  const handleSelectConversation = (id: string) => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setErrorMessage(null);
    setActiveId(id);
  };

  const handleDeleteConversation = (id: string) => {
    if (isStreaming && activeConversation?.id === id) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setConversations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fallback = createEmptyConversation('toan');
        setActiveId(fallback.id);
        return [fallback];
      }
      if (activeId === id) {
        setActiveId(remaining[0].id);
      }
      return remaining;
    });
  };

  const handleClearAllConversations = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setErrorMessage(null);
    const fresh = createEmptyConversation(activeConversation?.subject ?? 'toan');
    setConversations([fresh]);
    setActiveId(fresh.id);
  };

  const handleChangeSubject = (subject: SubjectId) => {
    if (!activeConversation) return;
    updateConversation(activeConversation.id, (conv) => ({
      ...conv,
      subject,
      title:
        conv.messages.length === 0
          ? `Học ${SUBJECT_MAP[subject].name}`
          : conv.title,
      updatedAt: Date.now(),
    }));
  };

  const handleAddDocument = (
    docData: Omit<StudyDocument, 'id' | 'updatedAt'>
  ) => {
    if (!activeConversation) return;
    const newDoc: StudyDocument = {
      ...docData,
      id: createId(),
      updatedAt: Date.now(),
    };
    updateConversation(activeConversation.id, (conv) => ({
      ...conv,
      documents: [newDoc, ...conv.documents],
      updatedAt: Date.now(),
    }));
  };

  const handleToggleDocument = (docId: string) => {
    if (!activeConversation) return;
    updateConversation(activeConversation.id, (conv) => ({
      ...conv,
      documents: conv.documents.map((d) =>
        d.id === docId ? { ...d, enabled: !d.enabled } : d
      ),
      updatedAt: Date.now(),
    }));
  };

  const handleDeleteDocument = (docId: string) => {
    if (!activeConversation) return;
    updateConversation(activeConversation.id, (conv) => ({
      ...conv,
      documents: conv.documents.filter((d) => d.id !== docId),
      updatedAt: Date.now(),
    }));
  };

  const handleToggleStrictMode = (value: boolean) => {
    if (!activeConversation) return;
    updateConversation(activeConversation.id, (conv) => ({
      ...conv,
      strictDocumentOnly: value,
      updatedAt: Date.now(),
    }));
  };

  const executeChatStream = async (
    convId: string,
    subject: SubjectId,
    historyForApi: { role: 'user' | 'model'; text: string }[],
    activeDocs: StudyDocument[],
    strictDocumentOnly: boolean,
    assistantMsgId: string,
    overrideApiBase?: string
  ) => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsStreaming(true);
    setErrorMessage(null);

    const targetBase = isStandaloneHtml()
      ? (overrideApiBase ?? standaloneApiBase)
      : '';

    try {
      if (
        typeof window !== 'undefined' &&
        window.location.protocol === 'file:' &&
        !targetBase
      ) {
        throw new Error(
          'Bạn đang mở trực tiếp tệp HTML từ máy tính (file://) nên chưa có máy chủ Node.js xử lý Gemini API. Hãy chạy máy chủ (npm start tại http://localhost:3000) rồi nhập URL máy chủ, hoặc dùng trực tiếp trang web đã Share/Publish trên AI Studio.'
        );
      }

      const response = await fetch(`${targetBase}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          subject,
          messages: historyForApi,
          documents: activeDocs.map((d) => ({
            id: d.id,
            title: d.title,
            content: d.content,
          })),
          strictDocumentOnly,
        }),
      });

      if (!response.ok) {
        let serverError = '';
        try {
          const errJson = (await response.json()) as { error?: string };
          if (errJson?.error) serverError = errJson.error;
        } catch {
          // Non-JSON response (e.g. 404 from static web host without Express backend)
        }
        if (!serverError) {
          if (response.status === 404) {
            serverError =
              'Không tìm thấy máy chủ API (/api/chat - 404). Trang web chỉ có 1 file HTML tĩnh không thể tự chạy Gemini API. Để làm trang web riêng có AI hoạt động, hãy triển khai toàn bộ mã nguồn dự án lên Vercel hoặc Render (đã có sẵn api/chat.ts và server.ts), hoặc nhập URL máy chủ đã triển khai vào nút Đổi URL máy chủ.';
          } else {
            serverError = `Lỗi máy chủ (${response.status}). Vui lòng thử lại.`;
          }
        }
        throw new Error(serverError);
      }

      if (!response.body) {
        throw new Error('Không nhận được luồng phản hồi từ máy chủ.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulated = '';
      let streamError: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const rawEvent of events) {
          const line = rawEvent
            .split('\n')
            .find((l) => l.startsWith('data: '));
          if (!line) continue;

          try {
            const payload = JSON.parse(line.slice(6)) as {
              type: 'chunk' | 'done' | 'error';
              text?: string;
              error?: string;
            };

            if (payload.type === 'chunk' && payload.text) {
              accumulated += payload.text;
              const nextText = accumulated;
              updateConversation(convId, (conv) => ({
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === assistantMsgId ? { ...m, text: nextText } : m
                ),
                updatedAt: Date.now(),
              }));
            } else if (payload.type === 'error') {
              streamError =
                payload.error || 'Đã xảy ra lỗi khi nhận phản hồi từ AI.';
            }
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }

      if (streamError) {
        throw new Error(streamError);
      }

      if (!accumulated.trim()) {
        throw new Error(
          'AI không trả về câu trả lời. Vui lòng thử gửi lại câu hỏi.'
        );
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User manually stopped generation: keep partial answer if any, or remove empty placeholder
        updateConversation(convId, (conv) => ({
          ...conv,
          messages: conv.messages.filter(
            (m) => !(m.id === assistantMsgId && !m.text.trim())
          ),
        }));
      } else {
        let message: string;
        if (err instanceof TypeError) {
          if (
            targetBase &&
            (targetBase.includes('ais-dev-') || targetBase.includes('ais-pre-'))
          ) {
            message = `Link xem trước của AI Studio (${targetBase}) chặn gọi API từ tên miền khác để bảo vệ API key. Hãy truy cập trực tiếp link Share/Publish trên AI Studio, hoặc nhập URL máy chủ Node.js riêng của bạn.`;
          } else if (targetBase) {
            message = `Không thể kết nối tới máy chủ backend (${targetBase}). Hãy kiểm tra xem máy chủ Node.js (server.ts) đã chạy chưa.`;
          } else {
            message =
              'Mất kết nối mạng hoặc máy chủ không phản hồi. Vui lòng kiểm tra kết nối và thử lại.';
          }
        } else {
          message =
            err instanceof Error
              ? err.message
              : 'Đã xảy ra lỗi không xác định khi gọi API.';
        }

        setErrorMessage(message);
        // Remove empty placeholder assistant bubble on error
        updateConversation(convId, (conv) => ({
          ...conv,
          messages: conv.messages.filter(
            (m) => !(m.id === assistantMsgId && !m.text.trim())
          ),
        }));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!activeConversation || isStreaming) return;

    const convId = activeConversation.id;
    const activeDocs = activeConversation.documents.filter((d) => d.enabled);

    const userMsg: ChatMessage = {
      id: createId(),
      role: 'user',
      text,
      createdAt: Date.now(),
    };

    const assistantMsg: ChatMessage = {
      id: createId(),
      role: 'model',
      text: '',
      createdAt: Date.now(),
      usedDocumentTitles: activeDocs.map((d) => d.title),
    };

    const historyForApi = [
      ...activeConversation.messages
        .filter((m) => m.text.trim().length > 0 && !m.isError)
        .map((m) => ({ role: m.role, text: m.text })),
      { role: 'user' as const, text },
    ];

    const isFirstMessage = activeConversation.messages.length === 0;

    updateConversation(convId, (conv) => ({
      ...conv,
      title: isFirstMessage ? deriveConversationTitle(text) : conv.title,
      messages: [...conv.messages, userMsg, assistantMsg],
      updatedAt: Date.now(),
    }));

    await executeChatStream(
      convId,
      activeConversation.subject,
      historyForApi,
      activeDocs,
      activeConversation.strictDocumentOnly,
      assistantMsg.id
    );
  };

  const handleRetryLast = async (overrideApiBase?: string) => {
    if (!activeConversation || isStreaming) return;
    const msgs = activeConversation.messages;
    if (msgs.length === 0) return;

    // Trim any trailing empty model message and find up to the last user message
    let lastUserIndex = -1;
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'user') {
        lastUserIndex = i;
        break;
      }
    }
    if (lastUserIndex === -1) return;

    const trimmedMessages = msgs.slice(0, lastUserIndex + 1);
    const activeDocs = activeConversation.documents.filter((d) => d.enabled);
    const assistantMsg: ChatMessage = {
      id: createId(),
      role: 'model',
      text: '',
      createdAt: Date.now(),
      usedDocumentTitles: activeDocs.map((d) => d.title),
    };

    const historyForApi = trimmedMessages
      .filter((m) => m.text.trim().length > 0)
      .map((m) => ({ role: m.role, text: m.text }));

    updateConversation(activeConversation.id, (conv) => ({
      ...conv,
      messages: [...trimmedMessages, assistantMsg],
      updatedAt: Date.now(),
    }));

    await executeChatStream(
      activeConversation.id,
      activeConversation.subject,
      historyForApi,
      activeDocs,
      activeConversation.strictDocumentOnly,
      assistantMsg.id,
      overrideApiBase
    );
  };

  const handleStopStreaming = () => {
    abortControllerRef.current?.abort();
  };

  const handleSaveTimetableSlot = (
    slotData: Omit<TimetableSlot, 'id'>,
    editId?: string
  ) => {
    setTimetableSlots((prev) => {
      if (editId) {
        return prev.map((s) => (s.id === editId ? { ...slotData, id: editId } : s));
      }
      return [...prev, { ...slotData, id: createId() }];
    });
  };

  const handleDeleteTimetableSlot = (id: string) => {
    setTimetableSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const handleResetSampleTimetable = () => {
    setTimetableSlots(SAMPLE_TIMETABLE);
  };

  const handleClearTimetable = () => {
    setTimetableSlots([]);
  };

  const handleAskAiAboutSubject = (subjectId: SubjectId, contextNote?: string) => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setErrorMessage(null);
    const existingEmpty = conversations.find(
      (c) => c.messages.length === 0 && c.subject === subjectId
    );
    if (existingEmpty) {
      setActiveId(existingEmpty.id);
    } else {
      const nextConv = createEmptyConversation(subjectId);
      if (contextNote) {
        nextConv.title = `Ôn ${SUBJECT_MAP[subjectId].name} · ${contextNote}`;
      }
      setConversations((prev) => [nextConv, ...prev]);
      setActiveId(nextConv.id);
    }
    setActiveView('chat');
  };

  const handleExportHtml = () => {
    setIsExportModalOpen(true);
  };

  const handleSaveStandaloneApiBase = (nextUrl: string) => {
    const cleaned = nextUrl.trim().replace(/\/+$/, '');
    setStandaloneApiBase(cleaned);
    try {
      if (cleaned) {
        localStorage.setItem(STORAGE_KEY_API_BASE, cleaned);
      } else {
        localStorage.removeItem(STORAGE_KEY_API_BASE);
      }
    } catch {
      // Ignore storage errors
    }
    setErrorMessage(null);
    void handleRetryLast(cleaned);
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-50 text-slate-900">
      <SidebarHistory
        conversations={conversations}
        activeId={activeConversation.id}
        activeView={activeView}
        timetableCount={timetableSlots.length}
        isExportingHtml={false}
        isOpenMobile={isMobileHistoryOpen}
        onCloseMobile={() => setIsMobileHistoryOpen(false)}
        onChangeView={setActiveView}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onClearAllConversations={handleClearAllConversations}
        onExportHtml={handleExportHtml}
      />

      {activeView === 'chat' ? (
        <>
          <ChatWorkspace
            subject={activeConversation.subject}
            messages={activeConversation.messages}
            documents={activeConversation.documents}
            strictDocumentOnly={activeConversation.strictDocumentOnly}
            isStreaming={isStreaming}
            errorMessage={errorMessage}
            isDocsPanelOpen={isDocsPanelOpen}
            isStandalone={isStandaloneHtml()}
            standaloneApiBase={standaloneApiBase}
            onSaveStandaloneApiBase={handleSaveStandaloneApiBase}
            onOpenMobileHistory={() => setIsMobileHistoryOpen(true)}
            onToggleDocsPanel={() => setIsDocsPanelOpen((prev) => !prev)}
            onOpenTimetable={() => setActiveView('timetable')}
            onOpenExportHtml={handleExportHtml}
            onChangeSubject={handleChangeSubject}
            onSendMessage={handleSendMessage}
            onStopStreaming={handleStopStreaming}
            onRetryLast={() => void handleRetryLast()}
            onDismissError={() => setErrorMessage(null)}
          />

          <StudyMaterialsPanel
            subject={activeConversation.subject}
            documents={activeConversation.documents}
            strictDocumentOnly={activeConversation.strictDocumentOnly}
            isOpen={isDocsPanelOpen}
            onClose={() => setIsDocsPanelOpen(false)}
            onAddDocument={handleAddDocument}
            onToggleDocument={handleToggleDocument}
            onDeleteDocument={handleDeleteDocument}
            onToggleStrictMode={handleToggleStrictMode}
          />
        </>
      ) : (
        <TimetableWorkspace
          slots={timetableSlots}
          onOpenMobileHistory={() => setIsMobileHistoryOpen(true)}
          onSwitchToChat={() => setActiveView('chat')}
          onOpenExportHtml={handleExportHtml}
          onAskAiAboutSubject={handleAskAiAboutSubject}
          onSaveSlot={handleSaveTimetableSlot}
          onDeleteSlot={handleDeleteTimetableSlot}
          onResetSampleTimetable={handleResetSampleTimetable}
          onClearTimetable={handleClearTimetable}
        />
      )}

      <ExportHtmlModal
        isOpen={isExportModalOpen}
        apiBase={getApiBase()}
        isStandalone={isStandaloneHtml()}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
