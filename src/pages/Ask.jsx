import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { products } from '../data/products';
import { helpTopics } from '../data/help';
import Orb from '../components/Orb';
import { search } from '../lib/rag';
import { sizeFromHeight } from '../lib/sizing';
import { useSeo } from '../lib/seo';
import { toman, fa } from '../lib/format';

/**
 * مشاور خرید — a console, not a chat box.
 *
 * Typing at retrieval works, but it puts the burden on the shopper to guess
 * what this thing understands, and a blank prompt answers no question. The
 * questions are asked here instead, one at a time, and every answer is a tap
 * that maps straight onto a retrieval slot — so the search that runs at the
 * end is the same one a perfectly worded sentence would have produced.
 *
 * The second track answers "how do I do this here", which the catalog cannot.
 */

const Icon = ({ d, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const art = {
  spark: <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18" />,
  life: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.6" /><path d="m5.6 5.6 3.9 3.9M14.5 14.5l3.9 3.9M18.4 5.6l-3.9 3.9M9.5 14.5l-3.9 3.9" /></>,
  back: <path d="M14 5 7 12l7 7" />,
  again: <path d="M4 10a8 8 0 1 1 1.2 5M4 5v5h5" />,
  chevron: <path d="m9 5 7 7-7 7" />,
};

/* Each step writes one retrieval slot. `value: null` means "no preference",
   which writes nothing — the difference between an open search and one
   silently narrowed by a default nobody chose. */
const STEPS = [
  {
    key: 'who',
    q: 'برای کیست؟',
    hint: 'دستهٔ محصول را از این انتخاب می‌کنیم',
    options: [
      { label: 'خودم', value: null },
      { label: 'خانم‌ها', value: 'women' },
      { label: 'بچه', value: 'kids' },
      { label: 'هدیه', value: 'gift' },
      { label: 'پک چندتایی', value: 'pack' },
    ],
  },
  {
    key: 'fit',
    q: 'چه تن‌خوری دوست داری؟',
    hint: 'اورسایز آزادتر می‌ایستد، اسلیم به بدن می‌خورد',
    options: [
      { label: 'اورسایز', value: 'اورسایز' },
      { label: 'رگولار', value: 'رگولار' },
      { label: 'اسلیم', value: 'اسلیم' },
      { label: 'فرقی نمی‌کند', value: null },
    ],
  },
  {
    key: 'height',
    q: 'قدت چقدر است؟',
    hint: 'اندازهٔ پیشنهادی از روی همین حساب می‌شود',
    options: [
      { label: 'زیر ۱۶۵', value: 160 },
      { label: '۱۶۵ تا ۱۷۵', value: 170 },
      { label: '۱۷۵ تا ۱۸۳', value: 179 },
      { label: '۱۸۳ تا ۱۹۰', value: 186 },
      { label: 'بالای ۱۹۰', value: 193 },
      { label: 'نمی‌دانم', value: null },
    ],
  },
  {
    key: 'color',
    q: 'چه رنگی؟',
    hint: 'هر رنگ عکس خودش را دارد',
    swatches: true,
  },
  {
    key: 'budget',
    q: 'بودجه‌ات چقدر است؟',
    hint: 'قیمت‌ها برای یک عدد است',
    options: [
      { label: 'زیر ۴۰۰ هزار', value: { max: 400000 } },
      { label: '۴۰۰ تا ۶۰۰ هزار', value: { min: 400000, max: 600000 } },
      { label: 'بالای ۶۰۰ هزار', value: { min: 600000 } },
      { label: 'مهم نیست', value: null },
    ],
  },
];

/** Answers → the slot object retrieval already understands. */
function toSlots(a) {
  const slots = { colors: [], notColors: [] };
  if (a.who === 'gift') slots.gift = true;
  else if (a.who === 'pack') { slots.pack = true; slots.category = 'pack'; }
  else if (a.who) slots.category = a.who;
  if (a.fit) slots.fit = a.fit;
  if (a.height) {
    slots.height = a.height;
    slots.size = sizeFromHeight(a.height);
    slots.sizeSource = 'height';
  }
  if (a.color) slots.colors = [a.color];
  if (a.budget?.min) slots.min = a.budget.min;
  if (a.budget?.max) slots.max = a.budget.max;
  return slots;
}

/** The same words a shopper would have typed, so BM25 has something to score. */
function toQuery(a) {
  const bits = ['تیشرت'];
  if (a.fit) bits.push(a.fit);
  if (a.color) bits.push(a.color);
  if (a.who === 'women') bits.push('زنانه');
  if (a.who === 'kids') bits.push('بچگانه');
  if (a.who === 'gift') bits.push('هدیه');
  if (a.who === 'pack') bits.push('پک');
  return bits.join(' ');
}

const palette = (() => {
  const seen = new Map();
  products.forEach((p) => p.colors.forEach((c) => seen.set(c.name, c.hex)));
  return [...seen.entries()];
})();

export default function Ask() {
  useSeo({
    title: 'مشاور خرید',
    description: 'چند سؤال کوتاه تا تیشرتی که اندازه و رنگش موجود است — و راهنمای کار با سایت.',
    path: '/ask',
  });

  const [track, setTrack] = useState(null); // null | 'find' | 'help'
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [topic, setTopic] = useState(null);
  const [openEntry, setOpenEntry] = useState(null);

  const done = track === 'find' && step >= STEPS.length;

  const result = useMemo(() => {
    if (!done) return null;
    const slots = toSlots(answers);
    return { ...search(toQuery(answers), { limit: 6, slots }), slots };
  }, [done, answers]);

  const pick = (key, value) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setStep((s) => s + 1);
  };

  const restart = () => { setAnswers({}); setStep(0); };

  const current = STEPS[step];

  return (
    <div className="wrap console">
      <div className="console-head">
        <p className="eyebrow">مشاور خرید</p>
        <h1>
          {track === 'help' ? 'راهنمای سایت' : track === 'find' ? 'چند سؤال کوتاه' : 'چه کمکی از دستم برمی‌آید؟'}
        </h1>
        {track && (
          <button
            className="console-exit"
            onClick={() => { setTrack(null); restart(); setTopic(null); setOpenEntry(null); }}
          >
            <Icon d={art.back} size={15} />
            برگشت
          </button>
        )}
      </div>

      {/* ── Pick a track ── */}
      {!track && (
        <div className="console-stage">
          <Orb size={200} />
          <p className="console-say">
            بگو دنبال چه هستی — چند سؤال کوتاه می‌پرسم و از بین چیزهایی که واقعاً موجود است انتخاب
            می‌کنم. یا اگر جایی از سایت گیر کرده‌ای، همان را بپرس.
          </p>
        </div>
      )}

      {!track && (
        <div className="tracks">
          <button className="track" onClick={() => setTrack('find')}>
            <span className="track-art"><Icon d={art.spark} size={26} /></span>
            <b>تیشرت پیدا کن</b>
            <small>پنج سؤال، و بعد فقط چیزهایی که اندازه و رنگش واقعاً موجود است.</small>
            <span className="track-go"><Icon d={art.chevron} size={16} /></span>
          </button>
          <button className="track" onClick={() => setTrack('help')}>
            <span className="track-art"><Icon d={art.life} size={26} /></span>
            <b>راهنما و مشکل فنی</b>
            <small>کار با سایت، اندازه‌گیری، گالری، سبد خرید و چیزهایی که درست کار نمی‌کنند.</small>
            <span className="track-go"><Icon d={art.chevron} size={16} /></span>
          </button>
        </div>
      )}

      {/* ── Guided find ── */}
      {track === 'find' && (
        <div className="quiz">
          <Orb size={92} busy={!done} />
          <ol className="quiz-rail" aria-label="مراحل">
            {STEPS.map((s, i) => (
              <li key={s.key} className={i < step ? 'done' : i === step ? 'now' : ''}>
                <button
                  disabled={i > step}
                  onClick={() => setStep(i)}
                  aria-current={i === step}
                >
                  <span className="num">{fa(i + 1)}</span>
                  {i < step && <em>{labelFor(s, answers[s.key])}</em>}
                </button>
              </li>
            ))}
          </ol>

          {current && (
            <div className="quiz-card" key={current.key}>
              <p className="quiz-q">{current.q}</p>
              <p className="quiz-hint">{current.hint}</p>

              {current.swatches ? (
                <div className="quiz-colors">
                  {palette.map(([name, hex]) => (
                    <button
                      key={name}
                      className={`quiz-color ${answers.color === name ? 'on' : ''}`}
                      onClick={() => pick('color', name)}
                    >
                      <i style={{ background: hex }} />
                      {name}
                    </button>
                  ))}
                  <button className="chip" onClick={() => pick('color', null)}>فرقی نمی‌کند</button>
                </div>
              ) : (
                <div className="quiz-options">
                  {current.options.map((o) => (
                    <button
                      key={o.label}
                      className={`chip ${answers[current.key] === o.value ? 'on' : ''}`}
                      onClick={() => pick(current.key, o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {done && <Results result={result} answers={answers} onRestart={restart} />}
        </div>
      )}

      {/* ── Help ── */}
      {track === 'help' && (
        <div className="help">
          {!topic && (
            <div className="help-grid">
              {helpTopics.map((t) => (
                <button key={t.slug} className="help-topic" onClick={() => setTopic(t)}>
                  <b>{t.title}</b>
                  <small>{t.note}</small>
                  <span className="num">{fa(t.entries.length)} پاسخ</span>
                </button>
              ))}
            </div>
          )}

          {topic && (
            <>
              <button className="console-exit" onClick={() => { setTopic(null); setOpenEntry(null); }}>
                <Icon d={art.back} size={15} />
                همهٔ موضوع‌ها
              </button>
              <h2 className="help-title">{topic.title}</h2>
              <div className="help-list">
                {topic.entries.map((e) => (
                  <details
                    key={e.q}
                    className="accordion"
                    open={openEntry === e.q}
                    onToggle={(ev) => ev.currentTarget.open && setOpenEntry(e.q)}
                  >
                    <summary>{e.q}</summary>
                    <p>{e.a}</p>
                  </details>
                ))}
              </div>
              <p className="help-more">
                جوابت اینجا نبود؟ <Link to="/faq" className="link-more">سؤال‌های پرتکرار</Link> را ببین یا{' '}
                <a href="tel:+982100000000" className="link-more">تماس بگیر</a>.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function labelFor(step, value) {
  if (value === null || value === undefined) return 'مهم نیست';
  if (step.swatches) return value;
  const found = step.options?.find((o) => o.value === value || JSON.stringify(o.value) === JSON.stringify(value));
  return found?.label ?? String(value);
}

function Results({ result, answers, onRestart }) {
  const { hits, slots } = result;
  const size = slots.size;

  return (
    <div className="results">
      <div className="results-head">
        <div>
          <p className="eyebrow">نتیجه</p>
          <h2>
            {hits.length ? `${fa(hits.length)} تیشرت که به تو می‌خورد` : 'با این ترکیب چیزی نداریم'}
          </h2>
          {size && <p className="muted">اندازهٔ پیشنهادی: <b>{size}</b></p>}
        </div>
        <button className="btn btn-ghost" onClick={onRestart}>
          <Icon d={art.again} size={15} />
          از اول
        </button>
      </div>

      {hits.length === 0 && (
        <p className="results-empty">
          یکی از انتخاب‌ها را عوض کن — معمولاً رنگ یا بودجه است که همه‌چیز را می‌بندد. یا{' '}
          <Link to="/products" className="link-more">همهٔ تیشرت‌ها</Link> را ببین.
        </p>
      )}

      <div className="results-list">
        {hits.map(({ product: p, sizesOpen }) => {
          const colour =
            p.colors.find((c) => (!answers.color || c.name.includes(answers.color)) && (c.stock[size] ?? 0) > 0) ||
            p.colors[0];
          return (
            <Link key={p.id} to={`/p/${p.slug}`} className="result">
              <img src={colour.photos[0]} alt="" loading="lazy" decoding="async" />
              <div className="result-body">
                <b>{p.name}</b>
                <small className="muted">{p.fit} · {fa(p.gsm)} گرم · {colour.name}</small>
                <div className="result-why">
                  {size && (sizesOpen ?? []).includes(size) && <span>سایز {size} موجود</span>}
                  {answers.fit && String(p.fit).includes(answers.fit) && <span>{p.fit}</span>}
                  {answers.color && <span>{colour.name}</span>}
                  {p.stock === 0 && <span className="warn">سفارشی</span>}
                </div>
              </div>
              <span className="result-price num">{toman(p.price, { unit: false })}</span>
            </Link>
          );
        })}
      </div>

      {hits.length > 0 && (
        <Link to="/products" className="btn btn-ghost btn-block" style={{ marginBlockStart: 'var(--s4)' }}>
          دیدن همهٔ تیشرت‌ها
        </Link>
      )}
    </div>
  );
}
