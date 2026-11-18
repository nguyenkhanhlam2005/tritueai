import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  classifyGeminiError,
  createStreamWithRetry,
  getGeminiClient,
  REQUEST_TIMEOUT_MS,
  validateAndPrepareChatRequest,
  type ChatRequestBody,
} from '../server/geminiService';

type NodeReq = IncomingMessage & { body?: unknown };

async function readJsonBody(req: NodeReq): Promise<ChatRequestBody> {
  if (req.body && typeof req.body === 'object') {
    return req.body as ChatRequestBody;
  }
  if (typeof req.body === 'string') {
    return JSON.parse(req.body) as ChatRequestBody;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) return {};
  return JSON.parse(raw) as ChatRequestBody;
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: NodeReq, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Phương thức không được hỗ trợ.' });
    return;
  }

  const ai = getGeminiClient();
  if (!ai) {
    sendJson(res, 503, {
      error:
        'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Hãy thêm biến môi trường GEMINI_API_KEY trong phần cài đặt hosting.',
    });
    return;
  }

  let body: ChatRequestBody;
  try {
    body = await readJsonBody(req);
  } catch {
    sendJson(res, 400, { error: 'Dữ liệu yêu cầu không đúng định dạng JSON.' });
    return;
  }

  const prepared = validateAndPrepareChatRequest(body);
  if (!prepared.ok) {
    sendJson(res, prepared.status, { error: prepared.error });
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let clientDisconnected = false;
  res.on('close', () => {
    if (!res.writableEnded) {
      clientDisconnected = true;
      controller.abort();
    }
  });

  try {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
    res.write(': connected\n\n');

    const stream = await createStreamWithRetry(
      ai,
      prepared.contents,
      prepared.systemInstruction,
      controller.signal
    );

    let fullText = '';
    for await (const chunk of stream) {
      if (clientDisconnected) break;
      const delta = chunk.text;
      if (delta) {
        fullText += delta;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: delta })}\n\n`);
      }
    }

    if (!clientDisconnected) {
      if (!fullText.trim()) {
        res.write(
          `data: ${JSON.stringify({
            type: 'error',
            error: 'AI không trả về nội dung phản hồi. Vui lòng thử diễn đạt lại câu hỏi.',
          })}\n\n`
        );
      } else {
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      }
      res.end();
    }
  } catch (error) {
    if (clientDisconnected) return;
    const mapped = classifyGeminiError(error);
    console.error('[Trí Tuệ AI] Serverless Gemini API error:', error);
    if (!res.headersSent) {
      sendJson(res, mapped.status, { error: mapped.message });
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: mapped.message })}\n\n`);
      res.end();
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
