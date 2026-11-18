import {
  classifyGeminiError,
  createStreamWithRetry,
  getGeminiClient,
  REQUEST_TIMEOUT_MS,
  validateAndPrepareChatRequest,
  type ChatRequestBody,
} from '../../server/geminiService';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(status: number, payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Phương thức không được hỗ trợ.' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return jsonResponse(503, {
      error:
        'Chưa cấu hình GEMINI_API_KEY trên Netlify. Vào Site configuration → Environment variables để thêm GEMINI_API_KEY.',
    });
  }

  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return jsonResponse(400, { error: 'Dữ liệu yêu cầu không đúng định dạng JSON.' });
  }

  const prepared = validateAndPrepareChatRequest(body);
  if (!prepared.ok) {
    return jsonResponse(prepared.status, { error: prepared.error });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (req.signal) {
    req.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(streamController) {
      const sendEvent = (data: unknown) => {
        streamController.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        streamController.enqueue(encoder.encode(': connected\n\n'));

        const geminiStream = await createStreamWithRetry(
          ai,
          prepared.contents,
          prepared.systemInstruction,
          controller.signal
        );

        let fullText = '';
        for await (const chunk of geminiStream) {
          if (controller.signal.aborted) break;
          const delta = chunk.text;
          if (delta) {
            fullText += delta;
            sendEvent({ type: 'chunk', text: delta });
          }
        }

        if (!controller.signal.aborted) {
          if (!fullText.trim()) {
            sendEvent({
              type: 'error',
              error: 'AI không trả về nội dung phản hồi. Vui lòng thử diễn đạt lại câu hỏi.',
            });
          } else {
            sendEvent({ type: 'done' });
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          const mapped = classifyGeminiError(error);
          console.error('[Trí Tuệ AI] Netlify Gemini API error:', error);
          sendEvent({ type: 'error', error: mapped.message });
        }
      } finally {
        clearTimeout(timeoutId);
        try {
          streamController.close();
        } catch {
          // Stream may already be closed if client aborted
        }
      }
    },
    cancel() {
      clearTimeout(timeoutId);
      controller.abort();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
