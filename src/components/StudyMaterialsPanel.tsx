import { useRef, useState } from 'react';
import {
  BookOpen,
  FileText,
  Plus,
  Trash2,
  Upload,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import { SUBJECT_MAP } from '../data/subjects';
import type { StudyDocument, SubjectId } from '../types';

interface StudyMaterialsPanelProps {
  subject: SubjectId;
  documents: StudyDocument[];
  strictDocumentOnly: boolean;
  isOpen: boolean;
  onClose: () => void;
  onAddDocument: (doc: Omit<StudyDocument, 'id' | 'updatedAt'>) => void;
  onToggleDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onToggleStrictMode: (value: boolean) => void;
}

const MAX_FILE_BYTES = 512 * 1024; // 512KB plain text limit

export function StudyMaterialsPanel({
  subject,
  documents,
  strictDocumentOnly,
  isOpen,
  onClose,
  onAddDocument,
  onToggleDocument,
  onDeleteDocument,
  onToggleStrictMode,
}: StudyMaterialsPanelProps) {
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(documents.length === 0);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const subjectInfo = SUBJECT_MAP[subject];
  const activeCount = documents.filter((d) => d.enabled).length;

  const handleSubmitText = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedContent = contentInput.trim();
    if (!trimmedContent) {
      setFormError('Vui lòng nhập hoặc dán nội dung tài liệu học tập.');
      return;
    }

    if (trimmedContent.length > 60000) {
      setFormError('Nội dung tài liệu quá dài (tối đa 60.000 ký tự cho mỗi tài liệu).');
      return;
    }

    const finalTitle =
      titleInput.trim() ||
      `Ghi chú ${subjectInfo.name} #${documents.length + 1}`;

    onAddDocument({
      title: finalTitle,
      content: trimmedContent,
      enabled: true,
      sourceType: 'text',
    });

    setTitleInput('');
    setContentInput('');
    setShowAddForm(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (!['txt', 'md', 'csv'].includes(ext)) {
      setFormError(
        'Hiện hỗ trợ tải lên tệp văn bản (.txt, .md, .csv). Với PDF hoặc Word, bạn hãy sao chép nội dung và dán vào ô bên dưới.'
      );
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setFormError('Tệp vượt quá dung lượng cho phép (tối đa 512 KB).');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result.trim() : '';
      if (!text) {
        setFormError('Tệp được chọn không có nội dung văn bản.');
        return;
      }
      onAddDocument({
        title: file.name,
        content: text,
        enabled: true,
        sourceType: 'file',
      });
      setShowAddForm(false);
    };
    reader.onerror = () => {
      setFormError('Không thể đọc tệp từ thiết bị. Vui lòng thử lại.');
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleLoadSample = () => {
    setFormError(null);
    const sample = subjectInfo.sampleDocument;
    const alreadyExists = documents.some(
      (d) => d.title === sample.title && d.sourceType === 'sample'
    );
    if (alreadyExists) {
      setFormError(`Tài liệu mẫu môn ${subjectInfo.name} đã có trong danh sách.`);
      return;
    }
    onAddDocument({
      title: sample.title,
      content: sample.content,
      enabled: true,
      sourceType: 'sample',
    });
    setShowAddForm(false);
  };

  if (!isOpen) {
    return null;
  }

  const panelBody = (
    <div className="flex h-full flex-col bg-white border-l border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-600 shrink-0" />
            <h2 className="text-sm font-semibold text-slate-900 truncate">
              Tài liệu học tập
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
            {activeCount} đang bật · {documents.length} tổng số
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng khung tài liệu"
          className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-600 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Grounding preference */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={strictDocumentOnly}
            onChange={(e) => onToggleStrictMode(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-600 cursor-pointer"
          />
          <div className="text-xs leading-relaxed">
            <span className="font-medium text-slate-800 block">
              Chỉ trả lời dựa trên tài liệu đã bật
            </span>
            <span className="text-slate-500">
              {strictDocumentOnly
                ? 'Khi bật: AI ưu tiên tuyệt đối tài liệu và báo rõ nếu không tìm thấy thông tin.'
                : 'Khi tắt: AI ưu tiên tài liệu trước, nếu thiếu mới bổ sung kiến thức THCS.'}
            </span>
          </div>
        </label>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto study-scroll p-4 space-y-4">
        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddForm((prev) => !prev)}
            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-sky-600" />
            <span>{showAddForm ? 'Ẩn biểu mẫu' : 'Dán ghi chú mới'}</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-sky-600" />
            <span>Tải tệp (.txt/.md)</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.csv,text/plain,text/markdown"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={handleLoadSample}
            className="min-h-[38px] px-3 py-1.5 rounded-lg border border-sky-200 bg-sky-50 hover:bg-sky-100 text-xs font-medium text-sky-800 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            <span>Nạp tài liệu mẫu {subjectInfo.name}</span>
          </button>
        </div>

        {formError && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 leading-relaxed"
          >
            {formError}
          </div>
        )}

        {/* Paste form */}
        {showAddForm && (
          <form
            onSubmit={handleSubmitText}
            className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3"
          >
            <div>
              <label
                htmlFor="doc-title"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Tiêu đề tài liệu
              </label>
              <input
                id="doc-title"
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder={`Ví dụ: Tóm tắt bài ${subjectInfo.name}...`}
                maxLength={120}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent"
              />
            </div>

            <div>
              <label
                htmlFor="doc-content"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Nội dung tài liệu tham khảo
              </label>
              <textarea
                id="doc-content"
                rows={6}
                value={contentInput}
                onChange={(e) => setContentInput(e.target.value)}
                placeholder="Dán nội dung bài giảng, đoạn văn, công thức hoặc ghi chú học tập vào đây để Trí Tuệ AI ưu tiên sử dụng khi trả lời..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600 focus:border-transparent resize-y"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setFormError(null);
                }}
                className="min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/70 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="min-h-[36px] px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Lưu tài liệu
              </button>
            </div>
          </form>
        )}

        {/* Saved documents list */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold text-slate-500">
            Danh sách tài liệu trong cuộc trò chuyện
          </h3>

          {documents.length === 0 ? (
            <div className="p-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/50 text-center">
              <FileText className="w-6 h-6 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-700">
                Chưa có tài liệu nào được cung cấp
              </p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Bạn có thể dán ghi chú bài học, tải tệp văn bản lên hoặc nhấn{' '}
                <strong className="font-medium text-slate-700">
                  Nạp tài liệu mẫu {subjectInfo.name}
                </strong>{' '}
                để AI tra cứu và ưu tiên trả lời.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {documents.map((doc) => {
                const isExpanded = expandedDocId === doc.id;
                return (
                  <li
                    key={doc.id}
                    className={`rounded-xl border transition-colors ${
                      doc.enabled
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50 border-slate-200/70 opacity-75'
                    }`}
                  >
                    <div className="p-3 flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => onToggleDocument(doc.id)}
                        aria-label={
                          doc.enabled
                            ? `Tắt tài liệu ${doc.title}`
                            : `Bật tài liệu ${doc.title}`
                        }
                        title={doc.enabled ? 'Đang bật tham khảo' : 'Đang tạm tắt'}
                        className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          doc.enabled
                            ? 'bg-sky-600 border-sky-600 text-white'
                            : 'bg-white border-slate-300 text-transparent hover:border-slate-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 break-words leading-snug">
                          {doc.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
                          <span className="tabular-nums">
                            {doc.content.length.toLocaleString('vi-VN')} ký tự
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{doc.enabled ? 'Đang dùng' : 'Đã tắt'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedDocId(isExpanded ? null : doc.id)
                          }
                          aria-label={
                            isExpanded ? 'Thu gọn nội dung' : 'Xem nội dung tài liệu'
                          }
                          className="w-8 h-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDocument(doc.id)}
                          aria-label={`Xóa tài liệu ${doc.title}`}
                          className="w-8 h-8 rounded-md inline-flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100">
                        <pre className="text-xs font-sans whitespace-pre-wrap text-slate-700 bg-slate-50 p-2.5 rounded-lg max-h-56 overflow-y-auto study-scroll leading-relaxed">
                          {doc.content}
                        </pre>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop right rail */}
      <aside className="hidden xl:block w-[360px] shrink-0 h-full">
        {panelBody}
      </aside>

      {/* Tablet/Mobile drawer overlay */}
      <div className="fixed inset-0 z-40 xl:hidden flex justify-end">
        <div
          className="fixed inset-0 bg-slate-900/40"
          onClick={onClose}
          aria-hidden="true"
        />
        <aside className="relative z-10 w-[360px] max-w-[92vw] h-full shadow-xl">
          {panelBody}
        </aside>
      </div>
    </>
  );
}
