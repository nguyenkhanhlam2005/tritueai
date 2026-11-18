import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  FileCode2,
  Globe,
  Loader2,
  X,
} from 'lucide-react';

interface ExportHtmlModalProps {
  isOpen: boolean;
  apiBase: string;
  isStandalone: boolean;
  onClose: () => void;
}

export function ExportHtmlModal({
  isOpen,
  apiBase,
  isStandalone,
  onClose,
}: ExportHtmlModalProps) {
  const [activeTab, setActiveTab] = useState<'deploy' | 'html'>('deploy');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>(
    'idle'
  );
  const [targetBackendUrl, setTargetBackendUrl] = useState<string>(apiBase);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [blobUrl, setBlobUrl] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || activeTab !== 'html') return;

    let cancelled = false;
    let objectUrl = '';

    const prepareHtml = async () => {
      setStatus('loading');
      setErrorMsg(null);
      setCopied(false);

      try {
        let text = '';
        if (isStandalone) {
          const clone = document.documentElement.cloneNode(true) as HTMLElement;
          const rootEl = clone.querySelector('#root');
          if (rootEl) rootEl.innerHTML = '';
          text = `<!doctype html>\n${clone.outerHTML}`;
        } else {
          const query = targetBackendUrl.trim()
            ? `?apiBase=${encodeURIComponent(targetBackendUrl.trim())}`
            : '';
          const res = await fetch(`${apiBase}/api/export-html${query}`);
          if (!res.ok) {
            let msg = 'Không thể tạo tệp HTML lúc này. Vui lòng thử lại.';
            try {
              const errJson = (await res.json()) as { error?: string };
              if (errJson?.error) msg = errJson.error;
            } catch {
              // Ignore parse error
            }
            throw new Error(msg);
          }
          text = await res.text();
        }

        if (cancelled) return;

        const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
        objectUrl = URL.createObjectURL(blob);

        setHtmlContent(text);
        setBlobUrl(objectUrl);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Đã xảy ra lỗi khi chuẩn bị tệp HTML.'
        );
        setStatus('error');
      }
    };

    const timer = setTimeout(prepareHtml, isStandalone ? 0 : 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [isOpen, activeTab, apiBase, isStandalone, targetBackendUrl]);

  if (!isOpen) return null;

  const sizeKb = htmlContent
    ? `${(new Blob([htmlContent]).size / 1024).toFixed(0)} KB`
    : '';

  const handleCopyHtml = async () => {
    if (!htmlContent) return;
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setErrorMsg(
        'Trình duyệt không cho phép sao chép tự động. Bạn hãy nhấn nút Tải file tri-tue-ai.html bên dưới.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-html-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-slate-900/45"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileCode2 className="w-5 h-5 text-sky-600 shrink-0" />
            <h2
              id="export-html-title"
              className="text-base font-semibold text-slate-900 truncate"
            >
              Xuất bản thành trang web riêng
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng hộp thoại xuất trang web"
            className="w-9 h-9 rounded-lg inline-flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-5 pt-3 border-b border-slate-200 flex items-center gap-2 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('deploy')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'deploy'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Trang web riêng có AI (Khuyên dùng)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('html')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'html'
                ? 'border-sky-600 text-sky-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải 1 file HTML tĩnh</span>
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto study-scroll">
          {activeTab === 'deploy' ? (
            <div className="space-y-4 text-sm text-slate-700">
              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 leading-relaxed">
                Để nộp <strong>1 trang web riêng</strong> mà phần <strong>Hỏi đáp Gemini AI</strong> hoạt động không bị lỗi <code className="font-mono font-semibold">404</code>, bạn cần đưa toàn bộ thư mục dự án (đã tích hợp sẵn cấu hình cho <strong>Vercel</strong> và <strong>Render</strong>) lên web host miễn phí thay vì chỉ tải 1 file HTML.
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <p className="text-sm font-semibold text-slate-900">
                    Cách A: Đưa lên Vercel (miễn phí, có link .vercel.app riêng)
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 leading-relaxed">
                    <li>Tải mã nguồn dự án (<strong>Download app</strong> hoặc đưa lên GitHub từ AI Studio).</li>
                    <li>Vào <strong>vercel.com</strong> → <strong>Add New Project</strong> → chọn thư mục/repo dự án (đã có sẵn file <code className="font-mono">vercel.json</code> và <code className="font-mono">api/chat.ts</code>).</li>
                    <li>Trong mục <strong>Environment Variables</strong>, thêm biến <code className="font-mono font-semibold text-slate-800">GEMINI_API_KEY</code> rồi nhấn <strong>Deploy</strong>.</li>
                  </ol>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <p className="text-sm font-semibold text-slate-900">
                    Cách B: Đưa lên Render (miễn phí, có link .onrender.com riêng)
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 leading-relaxed">
                    <li>Đưa mã nguồn dự án lên GitHub.</li>
                    <li>Vào <strong>render.com</strong> → <strong>New Web Service</strong> (dự án đã có sẵn <code className="font-mono">render.yaml</code>).</li>
                    <li>Build Command: <code className="font-mono">npm install &amp;&amp; npm run build</code> · Start Command: <code className="font-mono">npm start</code>.</li>
                    <li>Thêm biến môi trường <code className="font-mono font-semibold text-slate-800">GEMINI_API_KEY</code> rồi nhấn <strong>Deploy</strong>.</li>
                  </ol>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Mẹo: Sau khi có link Vercel hoặc Render của riêng bạn, bạn có thể mở trực tiếp link đó làm trang web nộp bài, hoặc dán link đó vào tab <strong>Tải 1 file HTML tĩnh</strong> để file HTML kết nối về máy chủ riêng của bạn.
              </p>
            </div>
          ) : (
            <>
              {!isStandalone && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="export-backend-url"
                    className="block text-xs font-medium text-slate-700"
                  >
                    URL máy chủ riêng đã deploy (Vercel / Render, tùy chọn)
                  </label>
                  <input
                    id="export-backend-url"
                    type="url"
                    value={targetBackendUrl}
                    onChange={(e) => setTargetBackendUrl(e.target.value)}
                    placeholder="Ví dụ: https://tri-tue-ai.vercel.app hoặc https://tri-tue-ai.onrender.com"
                    className="w-full min-h-[38px] px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-600"
                  />
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Nếu bỏ trống, file HTML sẽ chạy hoàn toàn cục bộ trên trình duyệt (<strong>Thời khóa biểu</strong>, <strong>Tài liệu</strong>, <strong>Lịch sử</strong> dùng bình thường; phần <strong>Hỏi đáp AI</strong> chỉ hoạt động khi có máy chủ API đi kèm).
                  </p>
                </div>
              )}

              {status === 'loading' && (
                <div className="py-6 flex flex-col items-center justify-center gap-3 text-center">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Đang đóng gói ứng dụng thành 1 tệp HTML...
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Bao gồm giao diện, công thức toán học và thời khóa biểu.
                    </p>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div
                  role="alert"
                  className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-sm text-red-800"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              )}

              {status === 'ready' && (
                <>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-800">
                        tri-tue-ai.html
                      </span>
                      <span className="tabular-nums">Dung lượng: {sizeKb}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <strong>Thời khóa biểu</strong>, <strong>Tài liệu học tập</strong> và <strong>Lịch sử hội thoại</strong> hoạt động trực tiếp trên trình duyệt. Để <strong>Hỏi đáp AI</strong> chạy trên file HTML này, hãy nhập URL máy chủ Vercel/Render ở trên trước khi tải.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <a
                      href={
                        blobUrl ||
                        `${apiBase}/api/export-html${
                          targetBackendUrl.trim()
                            ? `?apiBase=${encodeURIComponent(targetBackendUrl.trim())}`
                            : ''
                        }`
                      }
                      download="tri-tue-ai.html"
                      className="flex-1 min-h-[42px] px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>Tải file tri-tue-ai.html</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyHtml}
                      className="min-h-[42px] px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm font-medium text-slate-800 inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="text-emerald-700">Đã sao chép mã HTML</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-slate-600 shrink-0" />
                          <span>Sao chép mã HTML</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
