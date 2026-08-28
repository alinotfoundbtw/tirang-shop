/**
 * Evaluates the shop assistant against questions people actually type.
 *
 * There is no model behind retrieval and there is not going to be one, so this
 * file is the only thing standing between a scoring tweak and a shop that
 * confidently recommends a colour it cannot ship. Run it after touching
 * src/lib/rag.js:
 *
 *   node scripts/rag-eval.mjs          summary
 *   node scripts/rag-eval.mjs -v       every case, with the answer text
 */
import { ask, search, slotsFromHistory } from '../src/lib/rag.js';
import { products } from '../src/data/products.js';

const verbose = process.argv.includes('-v');
const results = [];

/** `expect` receives { slots, answer, picks } and returns true, or a reason. */
async function check(name, question, history, expect) {
  const slots = slotsFromHistory(history, question);
  const { answer, picks } = await ask(question, history);
  let verdict;
  try {
    verdict = expect({ slots, answer, picks, hits: search(question, { slots }).hits });
  } catch (err) {
    verdict = `threw: ${err.message}`;
  }
  const pass = verdict === true;
  results.push({ name, question, pass, verdict, answer, picks, slots });
  if (verbose || !pass) {
    console.log(`${pass ? 'ok  ' : 'FAIL'}  ${name}`);
    console.log(`      q: ${question}`);
    if (!pass) console.log(`      why: ${verdict}`);
    if (verbose) {
      console.log(`      slots: ${JSON.stringify(pick(slots))}`);
      console.log(`      picks: ${picks.map((p) => p.name).join(' | ') || '—'}`);
      console.log(`      a: ${answer}`);
    }
    console.log('');
  }
}

const pick = (s) => {
  const out = {};
  for (const [k, v] of Object.entries(s)) {
    const empty = v === null || v === undefined || v === false || (Array.isArray(v) && !v.length);
    if (!empty) out[k] = v;
  }
  return out;
};

const has = (picks, frag) => picks.some((p) => p.name.includes(frag));

await check('height + fit + colour', '۱۸۵ سانتمه، تیشرت گشاد مشکی', [], ({ slots, picks }) => {
  if (slots.height !== 185) return `height ${slots.height}`;
  if (!slots.colors.includes('مشکی')) return `colors ${slots.colors}`;
  if (slots.fit !== 'اورسایز') return `fit ${slots.fit}`;
  if (!['L', 'XL'].includes(slots.size)) return `size ${slots.size}`;
  if (!picks.length) return 'no picks';
  return true;
});

await check('budget ceiling', 'زیر ۴۰۰ تومن چی دارید؟', [], ({ slots, picks }) => {
  if (slots.max !== 400000) return `max ${slots.max}`;
  if (!picks.length) return 'no picks';
  if (picks[0].price > 400000) return `top pick ${picks[0].price} over budget`;
  return true;
});

await check('budget range', 'بین ۲۰۰ تا ۵۰۰ هزار', [], ({ slots }) => {
  if (slots.min !== 200000 || slots.max !== 500000) return `min ${slots.min} max ${slots.max}`;
  return true;
});

await check('bare size + stock', 'سایز XL موجود', [], ({ slots, picks }) => {
  if (slots.size !== 'XL') return `size ${slots.size}`;
  if (!slots.inStock) return 'inStock not set';
  const bad = picks.find((p) => !p.colors.some((c) => (c.stock.XL ?? 0) > 0));
  return bad ? `recommended ${bad.name} with no XL` : true;
});

await check('gift for a child', 'هدیهٔ تولد برای بچه', [], ({ slots, picks }) => {
  if (!slots.gift) return 'gift not set';
  if (slots.category !== 'kids') return `category ${slots.category}`;
  if (!picks.length) return 'no picks';
  return true;
});

await check('custom print intent', 'چاپ لوگوی خودم', [], ({ slots, picks }) => {
  if (!slots.custom) return 'custom not set';
  if (!picks.length) return 'no picks';
  return true;
});

await check('policy question', 'تعویض سایز چطوریه؟', [], ({ answer }) =>
  answer.includes('هفت روز') ? true : `did not answer from the FAQ: ${answer.slice(0, 60)}`
);

await check('policy question 2', 'آب می‌رود؟', [], ({ answer }) =>
  answer.includes('آب‌رفتگی') ? true : `got: ${answer.slice(0, 60)}`
);

await check('greeting', 'سلام', [], ({ answer, picks }) => {
  if (picks.length) return 'greeting returned products';
  return answer.includes('سلام') ? true : `got: ${answer.slice(0, 40)}`;
});

await check('thanks', 'ممنون', [], ({ picks }) => (picks.length ? 'thanks returned products' : true));

await check('typo tolerance', 'تیشرت مشگی', [], ({ picks }) =>
  picks.length ? true : 'a one-letter typo returned nothing'
);

await check('negation, trailing', 'مشکی نمی‌خوام', [], ({ slots }) =>
  slots.notColors.includes('مشکی') ? true : `notColors ${JSON.stringify(slots.notColors)}`
);

await check('negation, leading', 'بجز مشکی چی داری', [], ({ slots }) =>
  slots.notColors.includes('مشکی') ? true : `notColors ${JSON.stringify(slots.notColors)}`
);

await check('negation must not spill', 'مشکی نه، سفید', [], ({ slots }) => {
  if (!slots.notColors.includes('مشکی')) return 'مشکی not ruled out';
  if (slots.notColors.includes('سفید')) return 'سفید wrongly ruled out';
  return true;
});

await check(
  'memory across turns',
  'مشکی داری؟',
  [{ role: 'user', content: '۱۸۵ سانتمه' }, { role: 'assistant', content: '...' }],
  ({ slots }) => {
    if (slots.height !== 185) return 'forgot the height from the previous turn';
    if (!slots.colors.includes('مشکی')) return `colors ${slots.colors}`;
    return true;
  }
);

await check(
  'a new budget replaces the old',
  'زیر ۳۰۰ تومن',
  [{ role: 'user', content: 'زیر ۹۰۰ تومن' }],
  ({ slots }) => (slots.max === 300000 ? true : `max ${slots.max}`)
);

await check('pack category', 'پک اقتصادی می‌خوام', [], ({ slots, picks }) => {
  if (slots.category !== 'pack') return `category ${slots.category}`;
  return has(picks, 'پک') ? true : `picks ${picks.map((p) => p.name)}`;
});

await check('colour is actually stocked', 'تیشرت زرد', [], ({ picks }) => {
  if (!picks.length) return 'no picks';
  return picks[0].colors.some((c) => c.name === 'زرد') ? true : `${picks[0].name} has no yellow`;
});

await check('kids by years', 'برای بچهٔ ۷ ساله', [], ({ slots }) =>
  slots.size === 'M' ? true : `size ${slots.size} (expected M for age 7)`
);

await check('nonsense stays honest', 'قیمت دلار چنده', [], ({ answer }) =>
  answer.length > 10 ? true : 'empty answer'
);

await check('answer explains itself', 'تیشرت مشکی سایز L', [], ({ answer }) =>
  answer.includes('چون') ? true : `no reason given: ${answer.slice(0, 80)}`
);

/* Every recommendation must be shippable: never lead with a product whose
   requested size is out of stock in every colour the shopper allowed. */
await check('never recommends an unshippable size', 'سایز XXL مشکی', [], ({ picks, slots }) => {
  if (!picks.length) return true; // saying nothing is allowed; lying is not
  const top = picks[0];
  // Compound colourways count: «مشکی و سفید» satisfies a request for «مشکی».
  const ok = top.colors.some(
    (c) => (!slots.colors.length || slots.colors.some((w) => c.name.includes(w) || w.includes(c.name))) && (c.stock[slots.size] ?? 0) > 0
  );
  return ok ? true : `led with ${top.name}, which has no ${slots.size} in ${slots.colors.join('/')}`;
});

/* ── Retrieval sanity over the whole catalog ── */
let nameMisses = 0;
for (const p of products) {
  const { hits } = search(p.name);
  if (hits[0]?.product.id !== p.id) nameMisses += 1;
}
results.push({
  name: 'every product is findable by its own name',
  question: '(all products)',
  pass: nameMisses === 0,
  verdict: nameMisses === 0 ? true : `${nameMisses} of ${products.length} did not rank first`,
});
if (nameMisses) console.log(`FAIL  every product is findable by its own name — ${nameMisses} missed\n`);

const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) {
  console.log('failing: ' + failed.map((f) => f.name).join(', '));
  process.exit(1);
}
