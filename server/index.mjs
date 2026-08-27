/**
 * Answer endpoint for سررشته.
 *
 * The browser sends the question plus the catalog rows that retrieval already
 * picked. This process holds the API key and the system prompt, so a visitor
 * can neither read the key nor rewrite the shop's instructions.
 *
 *   ANTHROPIC_API_KEY=sk-... npm run api
 *
 * With no key set, this still runs and returns 503 — the client then answers
 * from src/lib/rag.js locally, so the shop keeps working either way.
 */
import { createServer } from 'node:http';

const PORT = process.env.PORT || 8787;
const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.MODEL || 'claude-sonnet-4-6';

const SYSTEM = `تو مشاور فروش فروشگاه تیشرت «تیرنگ» هستی.

قواعد:
- فقط از اطلاعات محصولاتی که در بخش «کاتالوگ» می‌آید جواب بده. قیمت، رنگ، سایز و موجودی‌ای که آنجا نیست را از خودت نساز.
- موجودی هر سایز جداگانه آمده. اگر سایزی صفر است، بگو همان سایز تمام شده و سایز یا رنگ دیگری پیشنهاد بده.
- اگر مشتری قدش را گفت، سایز را بر همان اساس پیشنهاد بده و بگو چرا. برای مدل اورسایز یک سایز پایین‌تر و برای اسلیم یک سایز بالاتر.
- فارسی محاوره‌ای مؤدب و کوتاه بنویس. حداکثر سه جمله، مگر مقایسه خواسته باشند.
- نام محصول را دقیقاً مثل کاتالوگ و داخل گیومه بنویس.
- هیچ‌وقت تخفیف، ارسال رایگان یا قولی که در کاتالوگ نیست نده.`;

const json = (res, code, body) => {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
};

const buckets = new Map(); // naive per-IP rate limit: 20 questions / 5 min
function allowed(ip) {
  const now = Date.now();
  const b = buckets.get(ip)?.filter((t) => now - t < 300_000) ?? [];
  b.push(now);
  buckets.set(ip, b);
  return b.length <= 20;
}

createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.url !== '/api/ask' || req.method !== 'POST') return json(res, 404, { error: 'not found' });
  if (!KEY) return json(res, 503, { error: 'ANTHROPIC_API_KEY تنظیم نشده' });

  const ip = req.socket.remoteAddress || 'x';
  if (!allowed(ip)) return json(res, 429, { error: 'تعداد پرسش زیاد شد، چند دقیقه بعد دوباره بپرسید' });

  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 20_000) return json(res, 413, { error: 'too large' });
  }

  try {
    const { question, context, history = [] } = JSON.parse(body || '{}');
    if (!question || typeof question !== 'string') return json(res, 400, { error: 'question لازم است' });

    const messages = [
      ...history
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: String(m.content).slice(0, 2000) })),
      {
        role: 'user',
        content: `کاتالوگ:\n${context || '(چیزی پیدا نشد)'}\n\nپرسش مشتری: ${question.slice(0, 500)}`,
      },
    ];

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: MODEL, max_tokens: 500, system: SYSTEM, messages }),
    });

    if (!r.ok) return json(res, 502, { error: `upstream ${r.status}` });
    const data = await r.json();
    const answer = (data.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();
    return json(res, 200, { answer });
  } catch (e) {
    return json(res, 500, { error: e.message });
  }
}).listen(PORT, () => console.log(`مشاور API → http://localhost:${PORT}`));
