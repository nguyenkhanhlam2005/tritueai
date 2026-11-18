import { GoogleGenAI, type Content } from '@google/genai';

export const PRIMARY_MODEL = 'gemini-4-hydrogen';
export const FALLBACK_MODELS = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;
export const MAX_DOCS_CHAR_LIMIT = 120_000;
export const MAX_HISTORY_MESSAGES = 30;
export const REQUEST_TIMEOUT_MS = 50_000;

export type SubjectId =
  | 'toan'
  | 'ngu-van'
  | 'tieng-anh'
  | 'khoa-hoc'
  | 'lich-su-dia-ly';

export interface IncomingMessage {
  role: 'user' | 'model';
  text: string;
}

export interface IncomingDocument {
  id: string;
  title: string;
  content: string;
}

export interface ChatRequestBody {
  subject?: SubjectId;
  messages?: IncomingMessage[];
  documents?: IncomingDocument[];
  strictDocumentOnly?: boolean;
}

export const SUBJECT_INSTRUCTIONS: Record<SubjectId, { label: string; guidance: string }> = {
  toan: {
    label: 'Toán',
    guidance:
      'Môn Toán THCS (Đại số, Số học, Hình học, Thống kê & Xác suất lớp 6–9). Giải bài toán từng bước rõ ràng, trình bày phép tính và định lý mạch lạc, sử dụng định dạng LaTeX ($...$ cho công thức cùng dòng, $$...$$ cho công thức riêng dòng) để công thức dễ đọc, và nêu cách kiểm tra lại kết quả.',
  },
  'ngu-van': {
    label: 'Ngữ văn',
    guidance:
      'Môn Ngữ văn THCS (Đọc hiểu văn bản, Tiếng Việt, Tập làm văn lớp 6–9). Phân tích mạch lạc theo luận điểm, chỉ rõ biện pháp tu từ, giá trị nội dung và nghệ thuật, gợi ý dàn ý chi tiết thay vì viết hộ máy móc toàn bộ bài kiểm tra.',
  },
  'tieng-anh': {
    label: 'Tiếng Anh',
    guidance:
      'Môn Tiếng Anh THCS (Từ vựng, Ngữ pháp, Đọc hiểu, Viết câu lớp 6–9). Giải thích quy tắc ngữ pháp bằng tiếng Việt dễ hiểu, kèm ví dụ minh họa bằng tiếng Anh có dịch nghĩa, phân tích lỗi sai thường gặp.',
  },
  'khoa-hoc': {
    label: 'Khoa học',
    guidance:
      'Môn Khoa học tự nhiên THCS (Vật lí, Hóa học, Sinh học lớp 6–9). Giải thích bản chất hiện tượng gắn với đời sống, ghi rõ đơn vị đo, công thức vật lí hoặc phương trình hóa học cân bằng đúng (nếu có).',
  },
  'lich-su-dia-ly': {
    label: 'Lịch sử và Địa lý',
    guidance:
      'Môn Lịch sử và Địa lý THCS (lớp 6–9). Trình bày khoa học theo mốc thời gian, bối cảnh – diễn biến – kết quả – ý nghĩa (đối với Lịch sử) hoặc đặc điểm tự nhiên – dân cư – kinh tế – bản đồ/số liệu (đối với Địa lý).',
  },
};

export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY');
}

export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function buildSystemInstruction(
  subject: SubjectId,
  documents: IncomingDocument[],
  strictDocumentOnly: boolean
): string {
  const subjectMeta = SUBJECT_INSTRUCTIONS[subject];
  const hasDocuments = documents.length > 0;

  const baseRole = [
    'Bạn là "Trí Tuệ AI" – Trợ lý học tập và trợ giảng thông minh dành riêng cho học sinh Trung học cơ sở (THCS, lớp 6 đến lớp 9) tại Việt Nam.',
    'Phong cách giao tiếp: thân thiện, kiên nhẫn, khích lệ tinh thần tự học, ngôn ngữ tiếng Việt trong sáng, chính xác về mặt sư phạm và dễ hiểu với học sinh THCS.',
    `Môn học đang chọn: ${subjectMeta.label}.`,
    `Hướng dẫn chuyên môn môn ${subjectMeta.label}: ${subjectMeta.guidance}`,
    'Quy tắc trình bày: Sử dụng Markdown rõ ràng (tiêu đề nhỏ, gạch đầu dòng, in đậm ý chính, bảng biểu nếu cần) để học sinh dễ đọc và ghi chép.',
    'Quy tắc ngữ cảnh hội thoại: Luôn ghi nhớ các lượt hỏi – đáp trước đó trong cùng cuộc trò chuyện để giải thích tiếp nối tự nhiên khi học sinh hỏi lại hoặc đào sâu thêm.',
  ];

  if (!hasDocuments) {
    baseRole.push(
      'Hiện tại học sinh chưa đính kèm tài liệu tham khảo riêng. Hãy hướng dẫn dựa trên kiến thức chuẩn chương trình THCS.',
      'QUY TẮC TRUNG THỰC: Tuyệt đối không bịa đặt số liệu, sự kiện lịch sử, trích dẫn văn bản hay đáp án khi câu hỏi bị thiếu dữ kiện (ví dụ: đề bài thiếu số liệu, hoặc học sinh nhắc đến một tài liệu/đoạn văn chưa được cung cấp). Nếu thiếu thông tin để trả lời chính xác, hãy thông báo rõ phần thông tin còn thiếu và mời học sinh cung cấp thêm.'
    );
    return baseRole.join('\n\n');
  }

  const formattedDocs = documents
    .map((doc, idx) => {
      const safeTitle = doc.title.trim() || `Tài liệu ${idx + 1}`;
      return `=== TÀI LIỆU ${idx + 1}: ${safeTitle} ===\n${doc.content.trim()}\n=== HẾT TÀI LIỆU ${idx + 1} ===`;
    })
    .join('\n\n');

  const groundingRules = strictDocumentOnly
    ? [
        'CHẾ ĐỘ BÁM SÁT TÀI LIỆU ĐƯỢC CUNG CẤP (BẮT BUỘC TUÂN THỦ NGHIÊM NGẶT):',
        '1. ƯU TIÊN TUYỆT ĐỐI KIẾN THỨC TRONG TÀI LIỆU: Chỉ sử dụng thông tin, định nghĩa, công thức, ví dụ và dữ kiện có trong phần "TÀI LIỆU HỌC TẬP DO HỌC SINH CUNG CẤP" bên dưới để trả lời câu hỏi.',
        '2. TRÍCH DẪN NGUỒN RÕ RÀNG: Khi trả lời từ tài liệu, hãy nêu rõ thông tin được lấy từ tài liệu nào (ví dụ: "Theo **Tài liệu 1: ...**").',
        '3. KHÔNG TỰ TẠO CÂU TRẢ LỜI KHI KHÔNG TÌM THẤY THÔNG TIN: Nếu câu hỏi của học sinh hỏi về nội dung, chi tiết, khái niệm hoặc bài tập KHÔNG có trong các tài liệu được cung cấp (hoặc tài liệu không đủ dữ kiện để kết luận), bạn TUYỆT ĐỐI KHÔNG được dùng kiến thức bên ngoài hay suy diễn để tự tạo câu trả lời.',
        '   Thay vào đó, hãy trả lời trung thực và rõ ràng theo mẫu:',
        '   "Mình đã kiểm tra kỹ các tài liệu bạn cung cấp nhưng **không tìm thấy thông tin phù hợp** để trả lời câu hỏi này."',
        '   Sau đó nêu ngắn gọn phần thông tin đang thiếu và gợi ý học sinh bổ sung thêm tài liệu vào khung **Tài liệu học tập** (hoặc tắt chế độ "Chỉ trả lời từ tài liệu" nếu muốn hỏi kiến thức phổ thông THCS).',
        '4. Ngoại lệ duy nhất: Nếu học sinh chỉ chào hỏi ngắn hoặc nhờ giải thích/tóm tắt lại chính nội dung đã có trong tài liệu hoặc trong lượt trả lời trước đó dựa trên tài liệu, hãy hỗ trợ bình thường.',
      ]
    : [
        'QUY TẮC SỬ DỤNG TÀI LIỆU HỌC TẬP (ƯU TIÊN TÀI LIỆU):',
        '1. LUÔN ƯU TIÊN TÀI LIỆU ĐƯỢC CUNG CẤP TRƯỚC TIÊN: Khi học sinh đặt câu hỏi, hãy kiểm tra và ưu tiên lấy kiến thức, định nghĩa, phương pháp từ phần "TÀI LIỆU HỌC TẬP DO HỌC SINH CUNG CẤP" bên dưới, đồng thời nêu rõ tên tài liệu đã tham khảo.',
        '2. THÔNG BÁO RÕ NẾU KHÔNG TÌM THẤY TRONG TÀI LIỆU: Nếu câu hỏi không có trong tài liệu được cung cấp, bạn PHẢI thông báo rõ cho học sinh ngay đầu câu trả lời rằng: "Trong tài liệu bạn cung cấp hiện chưa có thông tin về phần này." Sau đó mới bổ sung giải thích theo kiến thức chương trình THCS (nếu có cơ sở chắc chắn) và tuyệt đối không bịa đặt rằng nội dung đó có trong tài liệu.',
        '3. Nếu cả trong tài liệu lẫn đề bài đều thiếu dữ kiện cần thiết để trả lời chính xác, hãy báo rõ thông tin còn thiếu thay vì tự đoán.',
      ];

  return [
    ...baseRole,
    ...groundingRules,
    '--- TÀI LIỆU HỌC TẬP DO HỌC SINH CUNG CẤP ---',
    formattedDocs,
  ].join('\n\n');
}

export type PreparedChatResult =
  | {
      ok: true;
      contents: Content[];
      systemInstruction: string;
    }
  | {
      ok: false;
      status: number;
      error: string;
    };

export function validateAndPrepareChatRequest(body: ChatRequestBody): PreparedChatResult {
  const subject = body?.subject;
  if (!subject || !(subject in SUBJECT_INSTRUCTIONS)) {
    return {
      ok: false,
      status: 400,
      error: 'Môn học không hợp lệ. Vui lòng chọn một trong các môn học THCS được hỗ trợ.',
    };
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const validMessages = rawMessages
    .filter(
      (m): m is IncomingMessage =>
        Boolean(m) &&
        (m.role === 'user' || m.role === 'model') &&
        typeof m.text === 'string' &&
        m.text.trim().length > 0
    )
    .slice(-MAX_HISTORY_MESSAGES);

  if (validMessages.length === 0) {
    return {
      ok: false,
      status: 400,
      error: 'Vui lòng nhập nội dung câu hỏi trước khi gửi.',
    };
  }

  const lastMessage = validMessages[validMessages.length - 1];
  if (lastMessage.role !== 'user') {
    return {
      ok: false,
      status: 400,
      error: 'Tin nhắn cuối cùng phải là câu hỏi từ học sinh.',
    };
  }

  if (lastMessage.text.trim().length > 8000) {
    return {
      ok: false,
      status: 400,
      error:
        'Câu hỏi quá dài (tối đa 8.000 ký tự). Vui lòng rút gọn hoặc đưa phần nội dung dài vào mục Tài liệu học tập.',
    };
  }

  const rawDocs = Array.isArray(body.documents) ? body.documents : [];
  const validDocs: IncomingDocument[] = [];
  let totalDocChars = 0;

  for (const d of rawDocs) {
    if (!d || typeof d.content !== 'string') continue;
    const trimmed = d.content.trim();
    if (!trimmed) continue;
    if (totalDocChars + trimmed.length > MAX_DOCS_CHAR_LIMIT) {
      return {
        ok: false,
        status: 400,
        error: `Tổng dung lượng tài liệu tham khảo đang vượt quá giới hạn (${MAX_DOCS_CHAR_LIMIT.toLocaleString('vi-VN')} ký tự). Vui lòng tắt bớt hoặc rút gọn tài liệu.`,
      };
    }
    totalDocChars += trimmed.length;
    validDocs.push({
      id: typeof d.id === 'string' ? d.id : String(validDocs.length + 1),
      title:
        typeof d.title === 'string'
          ? d.title.slice(0, 120)
          : `Tài liệu ${validDocs.length + 1}`,
      content: trimmed,
    });
  }

  const strictDocumentOnly = body.strictDocumentOnly !== false;
  const systemInstruction = buildSystemInstruction(subject, validDocs, strictDocumentOnly);

  const contents: Content[] = validMessages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text.trim() }],
  }));

  return {
    ok: true,
    contents,
    systemInstruction,
  };
}

export function classifyGeminiError(error: unknown): { status: number; message: string } {
  const errObj = error as {
    status?: number;
    code?: number | string;
    message?: string;
    name?: string;
  };
  const rawMsg = errObj?.message || String(error || '');
  const status = typeof errObj?.status === 'number' ? errObj.status : 500;

  if (errObj?.name === 'AbortError' || rawMsg.includes('aborted') || rawMsg.includes('timeout')) {
    return {
      status: 504,
      message: 'Hệ thống AI phản hồi quá thời gian chờ. Vui lòng thử gửi lại câu hỏi.',
    };
  }

  if (
    status === 400 &&
    (rawMsg.includes('API_KEY_INVALID') || rawMsg.toLowerCase().includes('api key'))
  ) {
    return {
      status: 400,
      message:
        'API key Gemini chưa hợp lệ. Vui lòng kiểm tra lại GEMINI_API_KEY trong phần cấu hình Secrets / biến môi trường.',
    };
  }

  if (status === 403 || rawMsg.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message:
        'Không có quyền truy cập Gemini API. Vui lòng kiểm tra lại khóa API trong phần Secrets / biến môi trường.',
    };
  }

  if (status === 404 || rawMsg.includes('NOT_FOUND')) {
    return {
      status: 404,
      message: `Không tìm thấy mô hình AI (${PRIMARY_MODEL}). Vui lòng thử lại sau.`,
    };
  }

  if (status === 429 || rawMsg.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'Hạn mức yêu cầu tạm thời của Gemini API đã hết (429). Vui lòng đợi vài giây rồi thử lại, hoặc dùng API key có bật thanh toán để tăng hạn mức.',
    };
  }

  if (status === 503 || rawMsg.includes('UNAVAILABLE') || rawMsg.includes('high demand')) {
    return {
      status: 503,
      message: 'Máy chủ Gemini API đang quá tải tạm thời. Vui lòng nhấn Thử lại sau vài giây.',
    };
  }

  if (status >= 500 || rawMsg.includes('fetch failed') || rawMsg.includes('ECONNREFUSED')) {
    return {
      status: 502,
      message: 'Không thể kết nối tới máy chủ Gemini API lúc này. Vui lòng thử lại sau giây lát.',
    };
  }

  return {
    status: status >= 400 && status < 600 ? status : 500,
    message: 'Đã xảy ra lỗi khi xử lý câu hỏi với Gemini API. Vui lòng thử lại.',
  };
}

function isRetryableError(error: unknown): boolean {
  const errObj = error as { status?: number; message?: string };
  const status = errObj?.status;
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  const msg = (errObj?.message || '').toLowerCase();
  return msg.includes('fetch failed') || msg.includes('econnreset') || msg.includes('etimedout');
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRetryDelayMs(error: unknown): number | null {
  const raw = String((error as { message?: string })?.message || '');
  const match = raw.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (!match) return null;
  const seconds = Number(match[1]);
  if (!Number.isFinite(seconds) || seconds <= 0) return null;
  return Math.min(Math.ceil(seconds * 1000), 8000);
}

export async function createStreamWithRetry(
  ai: GoogleGenAI,
  contents: Content[],
  systemInstruction: string,
  abortSignal: AbortSignal
) {
  let lastError: unknown;

  for (const modelName of FALLBACK_MODELS) {
    const delays = [1000, 2500];

    for (let attempt = 0; attempt <= delays.length; attempt++) {
      if (abortSignal.aborted) {
        throw new Error('Request aborted');
      }
      try {
        return await ai.models.generateContentStream({
          model: modelName,
          contents,
          config: {
            systemInstruction,
          },
        });
      } catch (error) {
        lastError = error;
        const errObj = error as { status?: number; message?: string };
        const status = errObj?.status;
        const msg = errObj?.message || '';
        console.warn(
          `[Trí Tuệ AI] Model ${modelName} attempt ${attempt} failed (${status ?? 'unknown'}): ${msg.slice(0, 220)}`
        );

        const isQuotaOrOverload =
          status === 429 ||
          status === 503 ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('UNAVAILABLE');

        if (modelName !== FALLBACK_MODELS[FALLBACK_MODELS.length - 1] && isQuotaOrOverload) {
          if (attempt >= 1) {
            break;
          }
        }

        if (attempt < delays.length && isRetryableError(error) && !abortSignal.aborted) {
          const hintedDelay = extractRetryDelayMs(error);
          const waitMs = hintedDelay ?? delays[attempt];
          await sleep(waitMs);
          continue;
        }
        break;
      }
    }
  }

  throw lastError;
}
