import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  classifyGeminiError,
  createStreamWithRetry,
  getGeminiClient,
  isGeminiConfigured,
  REQUEST_TIMEOUT_MS,
  validateAndPrepareChatRequest,
  type ChatRequestBody,
} from './server/geminiService.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.use('/api', (req: Request, res: Response, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  let builtDistThisSession = false;

  app.get('/api/health', (_req: Request, res: Response) => {
    const appUrl =
      process.env.APP_URL && process.env.APP_URL !== 'MY_APP_URL'
        ? process.env.APP_URL.replace(/\/+$/, '')
        : '';
    res.json({ ok: true, configured: isGeminiConfigured(), appUrl });
  });

  app.get('/api/export-html', async (req: Request, res: Response) => {
    try {
      const distDir = path.resolve(__dirname, 'dist');
      const indexHtmlPath = path.join(distDir, 'index.html');

      if (!builtDistThisSession || !fs.existsSync(indexHtmlPath)) {
        const { build } = await import('vite');
        await build({ logLevel: 'silent' });
        builtDistThisSession = true;
      }

      if (!fs.existsSync(indexHtmlPath)) {
        res.status(500).json({ error: 'Không tìm thấy bản build để xuất HTML.' });
        return;
      }

      let html = fs.readFileSync(indexHtmlPath, 'utf-8');

      // Inline CSS + embed woff2 fonts cleanly
      const cssMatch = html.match(
        /<link\s+rel="stylesheet"[^>]*href="\/assets\/([^"]+\.css)"[^>]*>/i
      );
      if (cssMatch) {
        const cssPath = path.join(distDir, 'assets', cssMatch[1]);
        if (fs.existsSync(cssPath)) {
          let css = fs.readFileSync(cssPath, 'utf-8');
          css = css.replace(/url\(\/assets\/([^)]+\.woff2)\)/g, (_m, fontFile: string) => {
            const fontPath = path.join(distDir, 'assets', fontFile);
            if (!fs.existsSync(fontPath)) return '';
            const b64 = fs.readFileSync(fontPath).toString('base64');
            return `url(data:font/woff2;base64,${b64})`;
          });
          css = css.replace(/<\/style>/gi, '<\\/style>');
          html = html.replace(cssMatch[0], () => `<style>${css}</style>`);
        }
      }

      const requestedBase =
        typeof req.query.apiBase === 'string' ? req.query.apiBase.trim() : '';
      let validRequestedBase = '';
      if (requestedBase) {
        try {
          const parsed = new URL(requestedBase);
          if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            validRequestedBase = parsed.origin;
          }
        } catch {
          // Ignore invalid URL query param
        }
      }

      const apiOrigin = validRequestedBase || '';

      const scriptMatch = html.match(
        /<script\s+type="module"[^>]*src="\/assets\/([^"]+\.js)"[^>]*><\/script>/i
      );
      if (scriptMatch) {
        const jsPath = path.join(distDir, 'assets', scriptMatch[1]);
        if (fs.existsSync(jsPath)) {
          const js = fs
            .readFileSync(jsPath, 'utf-8')
            .replace(/<\/script>/gi, '<\\/script>');
          const bootstrap = `<script>window.__TRI_TUE_API_BASE__=${JSON.stringify(
            apiOrigin
          )};window.__TRI_TUE_IS_STANDALONE__=true;</script>`;
          html = html.replace(
            scriptMatch[0],
            () => `${bootstrap}<script type="module">${js}</script>`
          );
        }
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="tri-tue-ai.html"'
      );
      res.send(html);
    } catch (error) {
      console.error('[Trí Tuệ AI] Export HTML error:', error);
      res.status(500).json({
        error: 'Không thể tạo tệp HTML lúc này. Vui lòng thử lại.',
      });
    }
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error:
          'Chưa cấu hình GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập khóa API trong mục Settings > Secrets của AI Studio.',
      });
      return;
    }

    const prepared = validateAndPrepareChatRequest((req.body || {}) as ChatRequestBody);
    if (!prepared.ok) {
      res.status(prepared.status).json({ error: prepared.error });
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
      if (clientDisconnected) {
        return;
      }
      const mapped = classifyGeminiError(error);
      console.error('[Trí Tuệ AI] Gemini API error:', error);

      if (!res.headersSent) {
        res.status(mapped.status).json({ error: mapped.message });
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', error: mapped.message })}\n\n`);
        res.end();
      }
    } finally {
      clearTimeout(timeoutId);
    }
  });

  // Catch unhandled API routes cleanly
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Không tìm thấy đường dẫn API yêu cầu.' });
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req: Request, res: Response) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Ứng dụng chưa được build.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Trí Tuệ AI server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Trí Tuệ AI server:', err);
  process.exit(1);
});
