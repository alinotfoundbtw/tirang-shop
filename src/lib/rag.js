/* ───────────────────────────────────────────────────────────────
   مشاور خرید — retrieval over the catalog.

   There is no model behind this and there is not going to be one, so
   this file is the whole assistant, not a fallback for one. Everything
   it can do it does from the catalog in memory: a few hundred items
   answer in under a millisecond, and the shop owner can read the code.

   Persian text breaks naive search in three specific ways, each handled
   below:
     1. ی/ك arrive in Arabic codepoints from half the keyboards in use
     2. نیم‌فاصله (ZWNJ) splits words that should match ("تی‌شرت", "طرح‌دار")
     3. shoppers type ۱۲۳ and 123 interchangeably

   Retrieval is BM25 over weighted fields, then the slots the shopper
   actually named — colour, size, budget, fit, category — are applied as
   hard preferences on top. The answer says which of those it honoured,
   because "here is a shirt" is not advice.
   ─────────────────────────────────────────────────────────────── */

/* Explicit .js extensions: Vite does not need them, plain Node does, and
   scripts/rag-eval.mjs runs this module directly to check retrieval without
   a browser. */
import { categories, faqs } from '../data/products.js';
import { allProducts, subscribe } from './catalog.js';
import { suggestSize, sizeFromHeight } from './sizing.js';
import { fa } from './format.js';

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
  گشاد: 'اورسایز', فری: 'اورسایز', لش: 'اورسایز', بزرگ: 'اورسایز', اوورسایز: 'اورسایز',
  تنگ: 'اسلیم', چسبان: 'اسلیم', جذب: 'اسلیم', بدنی: 'اسلیم',
  سیاه: 'مشکی', زغالی: 'مشکی', ذغالی: 'مشکی',
  سرمه: 'ابی', نفتی: 'ابی', فیروزه: 'ابی', اسمانی: 'ابی',
  طوسی: 'خاکستری', دودی: 'خاکستری', ملانژ: 'خاکستری',
  شیری: 'کرم', استخوانی: 'کرم', بژ: 'کرم',
  یشمی: 'سبز', زیتون: 'زیتونی', خاکی: 'زیتونی',
  گلبهی: 'صورتی', صورتی: 'صورتی',
  بچه: 'بچگانه', بچگونه: 'بچگانه', کودک: 'بچگانه', نوزاد: 'بچگانه', پسربچه: 'بچگانه', دختربچه: 'بچگانه',
  زنونه: 'زنانه', دخترونه: 'زنانه', دخترانه: 'زنانه', خانم: 'زنانه',
  مردونه: 'مردانه', پسرانه: 'مردانه', پسرونه: 'مردانه', اقا: 'مردانه',
  ارزون: 'ارزان', اقتصادی: 'ارزان', حراج: 'تخفیف', ارزانترین: 'ارزان',
  تابستون: 'تابستانی', زمستون: 'زمستانی',
  ورزش: 'ورزشی', باشگاه: 'ورزشی', دویدن: 'ورزشی', تمرین: 'ورزشی',
  لوگو: 'چاپ', سفارشی: 'چاپ', مرچ: 'چاپ', تیم: 'چاپ', شرکت: 'چاپ',
  پنبه: 'پنبه', نخی: 'پنبه', نخ: 'پنبه',
  تیشرط: 'تیشرت', تیشرت: 'تیشرت', شرت: 'تیشرت', تیشرتی: 'تیشرت',
  زوج: 'دونفره', جفت: 'دونفره', ست: 'دونفره',
  ساده: 'پایه', معمولی: 'پایه', بیسیک: 'پایه',
  طرحدار: 'طرح‌دار', طرح: 'طرح‌دار', چاپی: 'طرح‌دار',
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

/* ── Fuzzy matching ───────────────────────────────────── */

const near = (a, b) => {
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  return short.length >= 4 && long.length - short.length <= 3 && long.startsWith(short);
};

/**
 * Bounded edit distance. Persian typing is fast and wrong — «مشگی», «تیشرط»,
 * «اورسایس» — and prefix matching catches none of those because the damage is
 * in the middle or the end. Bails out as soon as the best possible result
 * exceeds `max`, so this stays cheap inside the scoring loop.
 */
function within(a, b, max) {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (row[j] < best) best = row[j];
    }
    if (best > max) return false;
    prev = row;
  }
  return prev[b.length] <= max;
}

/** One typo forgiven from four letters, two from seven. Shorter words are left
 *  alone: at three letters an edit turns one real word into another. */
const fuzzy = (a, b) => {
  if (a.length < 4 || b.length < 4) return false;
  return within(a, b, Math.min(a.length, b.length) >= 7 ? 2 : 1);
};

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

/* Rebuilt whenever the owner adds or removes a product. A product that the
   panel has created but retrieval has never seen is one the shop cannot find,
   which is the same as not having it. */
let INDEX = buildIndex(allProducts());
subscribe(() => { INDEX = buildIndex(allProducts()); COLOR_TOKENS.clear(); });

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

/* ── Vocabulary, read off the catalog rather than guessed ── */

/** token → the colour name exactly as the catalog spells it. */
const COLOR_VOCAB = (() => {
  const m = new Map();
  for (const p of allProducts()) {
    for (const c of p.colors) {
      for (const t of tokenize(c.name)) if (!m.has(t)) m.set(t, c.name);
    }
  }
  // Route the synonyms above at whatever the catalog actually calls that colour.
  for (const [word, canon] of Object.entries(SYNONYMS)) {
    const target = m.get(canon);
    if (target && !m.has(word)) m.set(word, target);
  }
  return m;
})();

const CATEGORY_VOCAB = (() => {
  const m = new Map();
  for (const c of categories) for (const t of tokenize(c.name)) if (!m.has(t)) m.set(t, c.slug);
  m.set('اورسایز', 'oversize');
  m.set('پایه', 'basic');
  m.set('طرح‌دار', 'graphic');
  m.set('زنانه', 'women');
  m.set('بچگانه', 'kids');
  m.set('پک', 'pack');
  return m;
})();

const FIT_WORDS = { اورسایز: 'اورسایز', رگولار: 'رگولار', اسلیم: 'اسلیم' };

/* Catalog colourways are compound: «مشکی و سفید», «خاکستری ملانژ», «آبی روشن».
   Someone asking for «مشکی» means that two-pack as well, so colours are
   compared by shared token rather than by whole string. Comparing the strings
   made the black-and-white pack score *worse* on a search for black. */
const COLOR_TOKENS = new Map();
const tokensOf = (name) => {
  let t = COLOR_TOKENS.get(name);
  if (!t) {
    t = new Set(tokenize(name));
    COLOR_TOKENS.set(name, t);
  }
  return t;
};
const sharesColor = (name, wanted) => {
  if (!wanted?.length) return false;
  const mine = tokensOf(name);
  return wanted.some((w) => {
    for (const t of tokensOf(w)) if (mine.has(t)) return true;
    return false;
  });
};

/* ── Slot extraction ──────────────────────────────────── */

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

/** Height and weight, so the shop's own sizing table can do the work. */
function readBody(raw) {
  const s = normalize(raw);
  const words = s.split(' ').filter(Boolean);
  const out = {};

  /* «بین ۲۰۰ تا ۵۰۰ هزار» is a budget, and its 200 is not a height — but it
     sits squarely in the plausible range for one, and reading it as one had
     the assistant answering «با قد ۲۰۰، سایز XXL می‌خورد». So a height needs
     a cue: a unit after it, «قد» before it, or a message with no money in it. */
  const priced = Boolean(readBudget(raw).min || readBudget(raw).max);
  for (let i = 0; i < words.length && !out.height; i++) {
    const n = Number(words[i]);
    if (!Number.isInteger(n) || n < 140 || n > 210) continue;
    const cued = /^سانت/.test(words[i + 1] || '') || /^قد/.test(words[i - 1] || '');
    if (cued || !priced) out.height = n;
  }

  // A weight is a two-digit number that is not the height it sits beside.
  const w = s.match(/\b([4-9]\d|1[0-4]\d)\s*(کیلو|کیلوگرم|kg)/);
  if (w) out.weight = +w[1];
  else if (out.height && !priced) {
    const bare = [...s.matchAll(/\b(\d{2,3})\b/g)].map((m) => +m[1]);
    const cand = bare.find((n) => n !== out.height && n >= 40 && n <= 149);
    if (cand) out.weight = cand;
  }
  return out;
}

const readSizeWord = (raw) => {
  const s = normalize(raw);
  const named = s.match(/(?:^|\s)(xxl|2xl|xl|l|m|s)(?:\s|$)/);
  if (named) return named[1].toUpperCase().replace('2XL', 'XXL');
  // Children's sizes are spoken in years: «برای بچهٔ ۷ ساله».
  const years = s.match(/\b(\d{1,2})\s*(?:سال|ساله)/);
  if (years) {
    const y = +years[1];
    if (y <= 5) return 'S';
    if (y <= 7) return 'M';
    if (y <= 9) return 'L';
  }
  return null;
};

/** Colours asked for, and colours ruled out. */
function readColors(raw) {
  const words = normalize(raw).split(' ').filter(Boolean);
  const want = new Set();
  const avoid = new Set();
  /* Two shapes, and they have to be kept apart. A refusal that trails
     («مشکی نمی‌خوام») and one that leads («بجز مشکی»). Checking both
     directions for both word sets would make «مشکی نه، سفید» rule out the
     white as well, which is the opposite of what was said. */
  const LEAD = /^(بجز|بغیر|غیر|جز|بدون)$/;
  const TRAIL = /^(نمی|نخوا|نه|نباشه|نباش)/;
  words.forEach((w, i) => {
    const hit = COLOR_VOCAB.get(stem(w)) || COLOR_VOCAB.get(w);
    if (!hit) return;
    const negated = LEAD.test(words[i - 1] || '') || TRAIL.test(words[i + 1] || '');
    (negated ? avoid : want).add(hit);
  });
  return { colors: [...want], notColors: [...avoid] };
}

function readSlots(raw) {
  const s = normalize(raw);
  const terms = tokenize(raw).map((t) => SYNONYMS[t] || t);
  const body = readBody(raw);
  const { colors, notColors } = readColors(raw);

  let category = null;
  let fit = null;
  for (const t of terms) {
    if (!category && CATEGORY_VOCAB.has(t)) category = CATEGORY_VOCAB.get(t);
    if (!fit && FIT_WORDS[t]) fit = FIT_WORDS[t];
  }

  /* A height is a size the shopper does not know the name of. Keeping the
     derivation separate from a size they typed lets the answer explain
     itself only when it actually guessed. */
  let size = readSizeWord(raw);
  let sizeSource = size ? 'stated' : null;
  if (!size && body.height) {
    size = sizeFromHeight(body.height);
    sizeSource = 'height';
  }

  return {
    ...readBudget(raw),
    size,
    sizeSource,
    height: body.height,
    weight: body.weight,
    colors,
    notColors,
    category,
    fit,
    inStock: /(موجود|الان|فوری|سریع|زود|همین امروز|انبار)/.test(s),
    gift: /(هدیه|کادو|کادوی|تولد|سیسمونی|ولنتاین|یلدا|سالگرد)/.test(s),
    custom: /(چاپ|لوگو|سفارشی|مرچ|تیم|شرکت|گروهی)/.test(s),
    pack: /(پک|بسته|دوتای|سه تای|سه‌تای|چندتای|عمده)/.test(s),
  };
}

const HAS_CONSTRAINT = (f) =>
  Boolean(f.size || f.max || f.min || f.gift || f.inStock || f.colors?.length || f.category || f.fit || f.height);

/* ── Conversation memory ──────────────────────────────────
   «۱۸۵ سانتمه» and then «مشکی داری؟» are one request split over two
   messages. Without this the second turn forgets the height and offers a
   size that will be sent back. Newer turns win; a slot is only inherited
   when the current turn is silent about it. */

function mergeSlots(older, newer) {
  const out = { ...older };
  for (const [k, v] of Object.entries(newer)) {
    const empty = v === null || v === undefined || v === false || (Array.isArray(v) && !v.length);
    if (!empty) out[k] = v;
  }
  return out;
}

export function slotsFromHistory(history = [], question = '') {
  const asked = history.filter((m) => m.role === 'user').slice(-4);
  let slots = {};
  for (const m of asked) slots = mergeSlots(slots, readSlots(m.content || ''));
  const now = readSlots(question);
  // A fresh budget or colour replaces the old one rather than stacking with it.
  if (now.max || now.min) { delete slots.max; delete slots.min; }
  if (now.colors.length) slots.colors = [];
  return mergeSlots(slots, now);
}

/* ── Search ───────────────────────────────────────────── */

const K1 = 1.4;
const B = 0.7;

/** Sizes of this product that exist in at least one colour the shopper allows. */
function openSizes(p, f) {
  const usable = p.colors.filter(
    (c) => (!f.colors?.length || sharesColor(c.name, f.colors)) && !sharesColor(c.name, f.notColors)
  );
  const pool = usable.length ? usable : p.colors;
  return p.sizes.filter((s) => pool.some((c) => (c.stock[s] ?? 0) > 0));
}

export function search(query, { limit = 4, slots } = {}) {
  const terms = expand(tokenize(query));
  const f = slots || readSlots(query);
  if (!terms.length && !HAS_CONSTRAINT(f)) return { hits: [], filters: f, terms };

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
      if (!freq) {
        // Last resort, and discounted hard: a typo is a weaker signal than a word.
        for (const [key, v] of tf) {
          if (!fuzzy(key, t)) continue;
          freq = Math.max(freq, v * 0.45);
          break;
        }
      }
      if (!freq) continue;
      matched.push(t);
      const idf = INDEX.idf.get(t) ?? 1.2;
      score += idf * ((freq * (K1 + 1)) / (freq + K1 * (1 - B + B * (len / INDEX.avgLen))));
    }

    /* Slots the shopper named are preferences, applied after relevance.
       They are deliberately larger than the BM25 range for hard misses:
       recommending a colour the shop cannot ship is worse than being
       slightly off-topic. */
    const sizesOpen = openSizes(doc, f);

    if (f.colors?.length) {
      const has = doc.colors.some((c) => sharesColor(c.name, f.colors));
      score += has ? 2.2 : -4;
    }
    if (f.notColors?.length && doc.colors.every((c) => sharesColor(c.name, f.notColors))) score -= 4;

    if (f.category) score += doc.category === f.category ? 1.8 : -0.8;
    if (f.fit) score += String(doc.fit).includes(f.fit) ? 1.6 : -1;
    if (f.pack) score += doc.category === 'pack' ? 2 : -0.6;
    if (f.custom) score += doc.tags.some((t) => ['چاپ', 'سفارشی', 'مرچ', 'لوگو'].includes(t)) ? 2.4 : -0.5;
    if (f.gift && doc.tags.includes('هدیه')) score += 1.4;

    if (f.size) {
      // Must exist in a colour they did not rule out, not merely somewhere.
      score += sizesOpen.includes(f.size) ? 1.6 : -3.5;
    }
    if (f.inStock && doc.stock > 0) score += 1.2;
    if (doc.stock === 0) score -= f.inStock ? 6 : 0.9;
    if (f.max && doc.price > f.max) score -= 4;
    if (f.min && doc.price < f.min) score -= 3;
    score += Math.min(doc.sales, 200) / 900; // gentle popularity nudge

    return { product: doc, score, matched, sizesOpen };
  });

  const ranked = scored.sort((a, b) => b.score - a.score);
  const best = ranked[0]?.score ?? 0;
  // Absolute floor kills junk; relative floor keeps a long tail of weak matches
  // from padding out an otherwise confident answer.
  let hits = ranked.filter((h) => h.score >= 1.5 && h.score >= best * 0.28).slice(0, limit);

  // «چیزی که الان موجود باشه» carries no product words at all — only a
  // constraint. Browse by the constraint instead of returning nothing.
  if (!hits.length && HAS_CONSTRAINT(f)) {
    hits = allProducts()
      .filter(
        (p) =>
          (!f.inStock || p.stock > 0) &&
          (!f.size || openSizes(p, f).includes(f.size)) &&
          (!f.gift || p.tags.includes('هدیه')) &&
          (!f.category || p.category === f.category) &&
          (!f.fit || String(p.fit).includes(f.fit)) &&
          (!f.colors?.length || p.colors.some((c) => sharesColor(c.name, f.colors))) &&
          (!f.max || p.price <= f.max) &&
          (!f.min || p.price >= f.min)
      )
      .sort((a, b) => b.sales - a.sales)
      .slice(0, limit)
      .map((product) => ({ product, score: 2.6, matched: [], sizesOpen: openSizes(product, f) }));
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
        if (near(key, t) || fuzzy(key, t)) hit = Math.max(hit, v * 0.6);
      }
      if (hit) s += hit * (FAQ_INDEX.idf.get(t) ?? 1.4);
    }
    // Normalised by document length too, or the longest answer wins every
    // question just by containing more words.
    const norm = s / Math.sqrt(len);
    if (!best || norm > best.score) best = { doc, score: norm };
  }
  return best && best.score >= FAQ_MIN ? best : null;
}

/** Sure enough to answer a question with, on its own. */
const FAQ_MIN = 0.9;
/* Sure enough to volunteer alongside a product. «سایز XL موجود» matches the
   sizing entry on the word «سایز» alone, and stapling that whole paragraph
   onto a product answer buries the product. Only a policy the shopper plainly
   asked about clears this bar. */
const FAQ_VOLUNTEER = 2.2;

/* ── Small talk and out-of-scope ──────────────────────────
   A shop assistant that answers «سلام» with a t-shirt looks broken. These
   are matched on the whole message, so «سلام، شلوار دارید؟» still routes
   to retrieval. */

const SMALL_TALK = [
  { test: /^(سلام|درود|سلام علیکم|های|هی|وقت بخیر|روز بخیر|شب بخیر)$/, say: 'سلام! بگو دنبال چه تیشرتی هستی — قد و وزنت، رنگی که دوست داری، یا بودجه‌ات. از بین چیزهایی که واقعاً موجود است انتخاب می‌کنم.' },
  { test: /^(ممنون|مرسی|سپاس|دمت گرم|عالی|خوبه|تشکر|مچکرم)/, say: 'خواهش می‌کنم. اگر رنگ یا سایز دیگری خواستی، بگو.' },
  { test: /^(خداحافظ|بای|فعلا)/, say: 'موفق باشی. هر وقت خواستی برگرد.' },
  { test: /^(خوبی|چطوری|حالت چطوره)/, say: 'خوبم، ممنون. بگو چه تیشرتی می‌خواهی تا پیدایش کنم.' },
];

function smallTalk(raw) {
  const s = normalize(raw);
  for (const { test, say } of SMALL_TALK) if (test.test(s)) return say;
  return null;
}

/* ── Explaining the pick ──────────────────────────────────
   The page promises «با دلیل نشانت می‌دهد». These are the reasons, and each
   one is a fact from the row rather than a flourish. */

function reasons(hit, f) {
  const p = hit.product;
  const out = [];

  if (f.colors?.length) {
    const shared = p.colors.filter((c) => sharesColor(c.name, f.colors)).map((c) => c.name);
    if (shared.length) out.push(`${shared.join(' و ')} دارد`);
  }
  if (f.size) {
    const colour = p.colors.find(
      (c) => (c.stock[f.size] ?? 0) > 0 && (!f.colors?.length || sharesColor(c.name, f.colors))
    );
    if (colour) out.push(`سایز ${p.sizeLabels?.[f.size] ?? f.size} در رنگ ${colour.name} موجود است`);
  }
  if (f.fit && String(p.fit).includes(f.fit)) out.push(`تن‌خورش ${p.fit} است`);
  if (f.max && p.price <= f.max) out.push(`زیر بودجه‌ات درمی‌آید`);
  if (f.custom && p.tags.some((t) => ['چاپ', 'سفارشی', 'مرچ', 'لوگو'].includes(t))) out.push('چاپ سفارشی می‌خورد');
  if (f.gift && p.tags.includes('هدیه')) out.push('برای هدیه بسته‌بندی می‌شود');
  return out;
}

/* ── The answer ───────────────────────────────────────── */

export function localAnswer(query, { hits, filters: f }, faq) {
  const chat = smallTalk(query);
  if (chat) return chat;

  const constrained = HAS_CONSTRAINT(f);
  // A policy question ("does it shrink?") should get the policy, not a product
  // it happens to share two words with — unless the shopper named a size or a
  // budget, in which case they want products.
  if (faq && !constrained && (hits.length === 0 || hits[0].score < 2.5)) return faq.doc.a;

  if (!hits.length) {
    const tried = [];
    if (f.colors?.length) tried.push(`رنگ ${f.colors.join(' یا ')}`);
    if (f.size) tried.push(`سایز ${f.size}`);
    if (f.max) tried.push(`زیر ${fa(Math.round(f.max / 1000))} هزار تومان`);
    return tried.length
      ? `با ${tried.join(' و ')} چیزی موجود ندارم. اگر یکی از این‌ها را بردارید دوباره می‌گردم.`
      : 'چیزی که دقیقاً بخورد پیدا نکردم. اگر رنگ، اندازه یا بودجه‌تان را بگویید دوباره می‌گردم — یا از دستهٔ «همهٔ محصولات» رد شوید.';
  }

  const [top, ...rest] = hits;
  const p = top.product;
  const out = [];

  // If they gave a body but no size, the shop's own table names one.
  let advised = null;
  if (f.sizeSource === 'height' && f.height) {
    // With a weight too, the shop's own table refines the guess per fit.
    advised = f.weight
      ? suggestSize({ height: f.height, weight: f.weight, fit: p.fit })
      : { size: f.size, note: 'اگر تن‌خور آزادتر می‌خواهی یک سایز بالاتر بگیر.' };
  }

  const why = reasons(top, f);
  out.push(
    why.length
      ? `«${p.name}» را پیشنهاد می‌کنم چون ${why.join('، ')}.`
      : `«${p.name}» نزدیک‌ترین چیز به چیزی است که پرسیدید.`
  );

  out.push(p.bio.split('.')[0] + '.');

  if (advised) {
    const body = f.weight ? `قد ${fa(f.height)} و وزن ${fa(f.weight)}` : `قد ${fa(f.height)}`;
    out.push(`با ${body}، سایز ${advised.size} می‌خورد. ${advised.note}`);
  }

  if (p.stock > 0) {
    const shown = (top.sizesOpen ?? openSizes(p, f)).map((s) => p.sizeLabels?.[s] ?? s).join('، ');
    if (shown) out.push(`سایزهای موجود: ${shown} — یکی دو روز کاری ارسال می‌شود.`);
  } else {
    out.push(`آمادهٔ ارسال ندارد؛ سفارشی‌اش حدود ${fa(p.days)} روز کاری طول می‌کشد.`);
  }

  if (rest.length) {
    out.push(
      `اگر نخورد، ${rest.slice(0, 2).map((h) => `«${h.product.name}»`).join(' یا ')} هم در همین حال‌وهواست.`
    );
  }
  if (faq && faq.score >= FAQ_VOLUNTEER) out.push(faq.doc.a);
  return out.join(' ');
}

/* ── The one call the UI makes ────────────────────────── */

export async function ask(question, history = []) {
  // Slots carry across turns; the text query is only this message.
  const slots = slotsFromHistory(history, question);
  const result = search(question, { slots });
  const faq = searchFaq(question);
  const strong = result.hits.filter((h) => h.score >= 2.5);
  const chat = smallTalk(question);
  const picks = chat || (faq && strong.length === 0) ? [] : result.hits.map((h) => h.product);

  return { answer: localAnswer(question, result, faq), picks, source: 'local' };
}
