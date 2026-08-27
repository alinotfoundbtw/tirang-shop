/* ───────────────────────────────────────────────────────────────
   مشاور خرید — retrieval over the catalog.

   Persian text breaks naive search in three specific ways, and each
   one is handled below:
     1. ی/ك arrive in Arabic codepoints from half the keyboards in use
     2. نیم‌فاصله (ZWNJ) splits words that should match ("تی‌شرت", "طرح‌دار")
     3. shoppers type ۱۲۳ and 123 interchangeably
   Everything is normalized to one canonical form before indexing.

   Scoring is BM25 over weighted fields. No embeddings, no vector DB:
   a catalog of a few hundred items fits in memory and answers in
   under a millisecond, and the shop owner can read the code.
   ─────────────────────────────────────────────────────────────── */

import { products, categories, faqs } from '../data/products';
import { fa } from './format';

const AR_FA = { ي: 'ی', ى: 'ی', ك: 'ک', ة: 'ه', ؤ: 'و', إ: 'ا', أ: 'ا', آ: 'ا' };
const DIGITS = { '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9', '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };

export function normalize(text = '') {
  return text
    .replace(/[يىكةؤإأآ]/g, (c) => AR_FA[c])
    .replace(/[۰-۹٠-٩]/g, (c) => DIGITS[c])
    .replace(/[\u200c\u200f\u200e]/g, ' ') // ZWNJ and direction marks → space
    .replace(/[\u064B-\u0652]/g, '') // harakat
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

const STOP = new Set(
  'و در به از که این آن با را برای یا هم می تا بر است هست بود شد یک هر چه اگر ولی اما نیز دارد دارم دارید داری کن کنم کنید بده بدید سلام ممنون لطفا خیلی چند چی چیه کدوم کدام میشه میخوام میخام باشه دنبال درباره حدود'
    .split(' ')
);

const stem = (w) => {
  let out = w
    .replace(/(هایی|های|ها|ترین|تری|تر)$/u, '')
    .replace(/(یی|ی)$/u, (m, o, s) => (s.length > 4 ? '' : m));
  // Possessive endings: «رنگش» and «سایزم» must reach «رنگ» and «سایز».
  // Applied to both the query and the catalog, so even an over-eager trim
  // stays consistent on both sides of the comparison.
  const trimmed = out.replace(/(شان|مان|تان|ش|ت|م)$/u, '');
  if (trimmed.length >= 3) out = trimmed;
  return out;
};

/* Shoppers type «گشاد», the catalog says «اورسایز». Without this map the two
   never meet, and the shop looks like it has no oversized tees. */
const SYNONYMS = {
  گشاد: 'اورسایز', فری: 'اورسایز', لش: 'اورسایز', بزرگ: 'اورسایز',
  تنگ: 'اسلیم', چسبان: 'اسلیم', جذب: 'اسلیم',
  سیاه: 'مشکی', مشکی: 'مشکی', سرمه: 'ابی', نفتی: 'ابی',
  بچه: 'بچگانه', بچگونه: 'بچگانه', کودک: 'بچگانه', نوزاد: 'بچگانه',
  زنونه: 'زنانه', دخترونه: 'زنانه', دخترانه: 'زنانه',
  مردونه: 'مردانه', پسرانه: 'مردانه', پسرونه: 'مردانه',
  ارزون: 'ارزان', اقتصادی: 'ارزان', حراج: 'تخفیف',
  تابستون: 'تابستانی', زمستون: 'زمستانی',
  ورزش: 'ورزشی', باشگاه: 'ورزشی', دویدن: 'ورزشی',
  لوگو: 'چاپ', سفارشی: 'چاپ', مرچ: 'چاپ', تیم: 'چاپ',
  پنبه: 'پنبه', نخی: 'پنبه',
  تیشرط: 'تیشرت', تیشرت: 'تیشرت', شرت: 'تیشرت',
  زوج: 'دونفره', جفت: 'دونفره', ست: 'دونفره',
};

const expand = (terms) => {
  const out = [...terms];
  for (const t of terms) {
    const syn = SYNONYMS[t];
    if (syn && !out.includes(syn)) out.push(syn);
  }
  return out;
};

export const tokenize = (text) =>
  normalize(text)
    .split(' ')
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem)
    .filter(Boolean);

/* ── Index ────────────────────────────────────────────── */

const catName = (slug) => categories.find((c) => c.slug === slug)?.name || '';

const FIELDS = [
  { get: (p) => `${p.name} ${p.subtitle}`, w: 3.2 },
  { get: (p) => p.tags.join(' '), w: 2.6 },
  { get: (p) => catName(p.category), w: 2.2 },
  { get: (p) => p.colors.map((c) => c.name).join(' '), w: 2 },
  { get: (p) => `${p.fit} ${p.fabric} ${p.sizes.join(' ')}`, w: 1.7 },
  { get: (p) => `${p.bio} ${p.care} ${p.model}`, w: 1 },
];

function buildIndex(docs) {
  const items = docs.map((doc) => {
    const tf = new Map();
    let len = 0;
    for (const f of FIELDS) {
      for (const t of tokenize(f.get(doc))) {
        tf.set(t, (tf.get(t) || 0) + f.w);
        len += f.w;
      }
    }
    return { doc, tf, len };
  });
  const avgLen = items.reduce((s, i) => s + i.len, 0) / (items.length || 1);
  const df = new Map();
  for (const it of items) for (const t of it.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
  const idf = new Map();
  for (const [t, n] of df) idf.set(t, Math.log(1 + (items.length - n + 0.5) / (n + 0.5)));
  return { items, avgLen, idf };
}

const INDEX = buildIndex(products);
/* The question line is what shoppers echo, so it counts triple against the
   answer body. Rare words carry the signal: «تعویض» appears in one entry and
   should decide the match, while «سایز» is in half of them and decides nothing. */
const FAQ_INDEX = (() => {
  const items = faqs.map((f) => {
    const tf = new Map();
    const put = (text, w) => {
      for (const t of tokenize(text)) tf.set(t, (tf.get(t) || 0) + w);
    };
    put(f.q, 3);
    put(f.a, 1);
    return { doc: f, tf, len: [...tf.values()].reduce((a, b) => a + b, 0) };
  });
  const df = new Map();
  for (const it of items) for (const t of it.tf.keys()) df.set(t, (df.get(t) || 0) + 1);
  const idf = new Map();
  for (const [t, n] of df) idf.set(t, Math.log(1 + items.length / n));
  return { items, idf };
})();

function countTf(text) {
  const tf = new Map();
  for (const t of tokenize(text)) tf.set(t, (tf.get(t) || 0) + 1);
  return tf;
}

/* ── Query understanding ──────────────────────────────── */

const NUM_WORDS = { یک: 1, دو: 2, سه: 3, چهار: 4, پنج: 5, شش: 6, هفت: 7, هشت: 8, نه: 9, ده: 10, صد: 100, نیم: 0.5 };

/**
 * «زیر ۳۰۰ تومن», «کمتر از نیم میلیون», «بین ۲۰۰ تا ۵۰۰ هزار» → { min, max } in toman.
 *
 * Walks whole tokens rather than scanning the raw string. A substring scan
 * finds «ده» inside «چنده» and «ساده» and silently caps every such question at
 * ten thousand toman — a bug worth the extra ten lines.
 */
export function readBudget(raw) {
  const words = normalize(raw).split(' ').filter(Boolean);
  const MULT = { میلیون: 1e6, ملیون: 1e6, میلیونی: 1e6, هزار: 1e3, هزارتومن: 1e3, هزارتومان: 1e3 };
  const MEASURE = /^(سانت|سانتی|سانتیمتر|متر|کیلو|کیلویی|گرم|سال|ساله|اینچ|درصد)/;
  const nums = [];

  for (let i = 0; i < words.length; i++) {
    // A token may be a bare number, a number word, or a glued «۳۰۰هزار».
    const m = words[i].match(/^(\d+(?:[.]\d+)?)(.*)$/);
    let value = m ? parseFloat(m[1]) : NUM_WORDS[words[i]];
    if (!isFinite(value)) continue;

    const glued = m?.[2] || '';
    const next = words[i + 1] || '';
    if (!glued && MEASURE.test(next)) continue; // a height or a weight, not a price

    const unit = MULT[glued] ? glued : MULT[next] ? next : null;
    if (unit) value *= MULT[unit];
    else if (value < 5000) value *= 1000; // shop-speak: «۳۰۰ تومن» means ۳۰۰ هزار
    if (value >= 10_000) nums.push(value);
  }

  if (!nums.length) return {};
  const s = ' ' + words.join(' ') + ' ';
  const between = /(بین|از)\s/.test(s) && nums.length > 1;
  if (between) return { min: Math.min(...nums), max: Math.max(...nums) };
  if (/(بالای|بیشتر|حداقل|گران)/.test(s)) return { min: Math.max(...nums) };
  if (/(زیر|کمتر|پایین|تا|حداکثر|ارزان|بودجه)/.test(s) || nums.length === 1) {
    return { max: Math.max(...nums) };
  }
  return {};
}

const readSize = (raw) => {
  const s = normalize(raw);
  const named = s.match(/\b(xxl|xl|2xl|l|m|s)\b/);
  if (named) return named[1].toUpperCase().replace('2XL', 'XXL');
  const height = s.match(/\b(1[5-9]\d)\b/);
  if (height) {
    const h = +height[1];
    if (h < 168) return 'S';
    if (h < 176) return 'M';
    if (h < 184) return 'L';
    if (h < 190) return 'XL';
    return 'XXL';
  }
  return null;
};

const readFilters = (raw) => {
  const s = normalize(raw);
  return {
    ...readBudget(raw),
    size: readSize(raw),
    inStock: /(موجود|الان|فوری|سریع|زود|همین امروز)/.test(s),
    gift: /(هدیه|کادو|کادوی|تولد|سیسمونی|ولنتاین|یلدا)/.test(s),
  };
};

/* ── Search ───────────────────────────────────────────── */

const K1 = 1.4;
const B = 0.7;

const near = (a, b) => {
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.length >= 4 && long.length - short.length <= 3 && long.startsWith(short);
};

export function search(query, { limit = 4 } = {}) {
  const terms = expand(tokenize(query));
  const f = readFilters(query);
  if (!terms.length && !f.max && !f.min) return { hits: [], filters: f, terms };

  const scored = INDEX.items.map(({ doc, tf, len }) => {
    let score = 0;
    const matched = [];
    for (const t of terms) {
      let freq = tf.get(t) || 0;
      if (!freq) {
        // Prefix match absorbs plural/suffix drift («کیفی» → «کیف»). Bounded on
        // purpose: without the length guard, «گردن» starts matching «گرد» and
        // the tablecloth turns up in a search for scarves.
        for (const [key, v] of tf) {
          if (!near(key, t)) continue;
          freq = Math.max(freq, v * 0.6);
          break;
        }
      }
      if (!freq) continue;
      matched.push(t);
      const idf = INDEX.idf.get(t) ?? 1.2;
      score += idf * ((freq * (K1 + 1)) / (freq + K1 * (1 - B + B * (len / INDEX.avgLen))));
    }

    // Business signals, applied after relevance so they break ties only
    if (f.gift && doc.tags.includes('هدیه')) score += 1.4;
    if (f.size) {
      const has = doc.colors.some((c) => (c.stock[f.size] ?? 0) > 0);
      score += has ? 1.3 : -3.5; // no point recommending a size they can't get
    }
    if (f.inStock && doc.stock > 0) score += 1.2;
    if (doc.stock === 0) score -= f.inStock ? 6 : 0.9;
    if (f.max && doc.price > f.max) score -= 4;
    if (f.min && doc.price < f.min) score -= 3;
    score += Math.min(doc.sales, 200) / 900; // gentle popularity nudge

    return { product: doc, score, matched };
  });

  const ranked = scored.sort((a, b) => b.score - a.score);
  const best = ranked[0]?.score ?? 0;
  // Absolute floor kills junk; relative floor keeps a long tail of weak matches
  // from padding out an otherwise confident answer.
  let hits = ranked.filter((h) => h.score >= 1.5 && h.score >= best * 0.28).slice(0, limit);

  // «چیزی که الان موجود باشه» carries no product words at all — only a
  // constraint. Browse by the constraint instead of returning nothing.
  if (!hits.length && (f.inStock || f.gift || f.max || f.min || f.size)) {
    hits = products
      .filter(
        (p) =>
          (!f.inStock || p.stock > 0) &&
          (!f.size || p.colors.some((c) => (c.stock[f.size] ?? 0) > 0)) &&
          (!f.gift || p.tags.includes('هدیه')) &&
          (!f.max || p.price <= f.max) &&
          (!f.min || p.price >= f.min)
      )
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit)
      .map((product) => ({ product, score: 2.6, matched: [] }));
  }

  return { hits, filters: f, terms };
}

export function searchFaq(query) {
  const terms = tokenize(query);
  if (!terms.length) return null;
  let best = null;
  for (const { doc, tf, len } of FAQ_INDEX.items) {
    let s = 0;
    for (const t of terms) {
      let hit = 0;
      for (const [key, v] of tf) {
        if (key === t) { hit = v; break; }
        if (near(key, t)) hit = Math.max(hit, v * 0.6);
      }
      if (hit) s += hit * (FAQ_INDEX.idf.get(t) ?? 1.4);
    }
    // Normalised by document length too, or the longest answer wins every
    // question just by containing more words.
    const norm = s / Math.sqrt(len);
    if (!best || norm > best.score) best = { doc, score: norm };
  }
  return best && best.score >= 0.9 ? best.doc : null;
}

/* ── Grounded context for the model ───────────────────── */

export function buildContext(hits, faq) {
  const lines = hits.map(({ product: p }, i) =>
    [
      `[${i + 1}] ${p.name}`,
      `دسته: ${catName(p.category)}`,
      `قیمت: ${p.price} تومان`,
      `موجودی: ${p.stock > 0 ? `${p.stock} عدد` : `ناموجود، سفارش ${p.days} روزه`}`,
      `تن‌خور: ${p.fit} · وزن پارچه ${p.gsm} گرم`,
      `رنگ و موجودی هر سایز: ${p.colors
        .map((c) => `${c.name} (${p.sizes.map((s) => `${p.sizeLabels?.[s] ?? s}:${c.stock[s] ?? 0}`).join(' ')})`)
        .join(' | ')}`,
      `جنس: ${p.fabric}`,
      `مدل: ${p.model}`,
      `نگهداری: ${p.care}`,
      `توضیح: ${p.bio}`,
    ].join('\n')
  );
  if (faq) lines.push(`[راهنما] ${faq.q}\n${faq.a}`);
  return lines.join('\n\n');
}

/* ── Offline answer ───────────────────────────────────────
   Runs when there is no API key, when the request fails, and in
   any offline demo. The shop is never left without an answer. */

export function localAnswer(query, { hits, filters }, faq) {
  const constrained = Boolean(filters.size || filters.max || filters.min || filters.gift || filters.inStock);
  // A policy question ("does it shrink?") should get the policy, not a product
  // it happens to share two words with — unless the shopper named a size or a
  // budget, in which case they want products.
  if (faq && !constrained && (hits.length === 0 || hits[0].score < 2.5)) return faq.a;
  if (!hits.length) {
    return 'چیزی که دقیقاً بخورد پیدا نکردم. اگر رنگ، اندازه یا بودجه‌تان را بگویید دوباره می‌گردم — یا از دستهٔ «همهٔ محصولات» رد شوید.';
  }

  const [top, ...rest] = hits;
  const p = top.product;
  const bits = [];

  const k = (v) => fa(Math.round(v / 1000));
  if (filters.min && filters.max) bits.push(`بین ${k(filters.min)} تا ${k(filters.max)} هزار تومان`);
  else if (filters.max) bits.push(`زیر ${k(filters.max)} هزار تومان`);
  else if (filters.min) bits.push(`بالای ${k(filters.min)} هزار تومان`);
  if (filters.gift) bits.push('برای هدیه');
  if (filters.size) bits.push(`با سایز ${filters.size} موجود`);
  if (filters.inStock) bits.push('از بین موجودها');

  let out = bits.length
    ? `${bits.join(' و ')}، «${p.name}» را پیشنهاد می‌کنم.`
    : `«${p.name}» نزدیک‌ترین چیز به چیزی است که پرسیدید.`;

  out += ' ' + p.bio.split('.')[0] + '.';

  if (p.stock > 0) {
    const open = p.sizes.filter((s) => p.colors.some((c) => (c.stock[s] ?? 0) > 0));
    const shown = open.map((s) => p.sizeLabels?.[s] ?? s).join('، ');
    out += ` سایزهای موجود: ${shown} — یکی دو روز کاری ارسال می‌شود.`;
  } else {
    out += ` آمادهٔ ارسال ندارد؛ سفارشی‌اش حدود ${fa(p.days)} روز کاری طول می‌کشد.`;
  }

  if (rest.length) {
    out += ` اگر نخورد، ${rest
      .slice(0, 2)
      .map((h) => `«${h.product.name}»`)
      .join(' یا ')} هم در همین حال‌وهواست.`;
  }
  if (faq) out += ' ' + faq.a;
  return out;
}

/* ── The one call the UI makes ────────────────────────── */

export async function ask(question, history = []) {
  const result = search(question);
  const faq = searchFaq(question);
  const strong = result.hits.filter((h) => h.score >= 2.5);
  const picks = (faq && strong.length === 0 ? [] : result.hits).map((h) => h.product);

  try {
    const res = await fetch('/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question,
        context: buildContext(result.hits, faq),
        history: history.slice(-6),
      }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (data?.answer) return { answer: data.answer, picks, source: 'model' };
    throw new Error('empty');
  } catch {
    return { answer: localAnswer(question, result, faq), picks, source: 'local' };
  }
}
