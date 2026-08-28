import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ask } from '../lib/rag';
import { Photo } from '../components/States';
import { useSeo } from '../lib/seo';
import { toman } from '../lib/format';

const OPENERS = [
  '۱۸۵ سانتمه، تیشرت گشاد مشکی',
  'زیر ۴۰۰ تومن چی دارید؟',
  'سایز XL موجود',
  'هدیهٔ تولد برای بچه',
  'چاپ لوگوی خودم',
  'تعویض سایز چطوریه؟',
];

const HELLO = {
  role: 'assistant',
  content:
    'سلام. قدت را بگو، بگو چه رنگ و چه تن‌خوری می‌خواهی و بودجه‌ات چقدر است — از بین موجودی واقعی، آن‌هایی که سایزش هم هست را نشانت می‌دهم.',
  picks: [],
};

export default function Ask() {
  useSeo({
    title: 'مشاور خرید',
    description: 'قد، رنگ، تن‌خور و بودجه‌تان را بگویید تا از بین موجودی واقعی فروشگاه انتخاب کنیم.',
    path: '/ask',
  });

  const [msgs, setMsgs] = useState([HELLO]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef(null);

  useEffect(() => {
    logRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [msgs, busy]);

  const send = async (question) => {
    const q = (question ?? text).trim();
    if (!q || busy) return;
    setText('');
    setBusy(true);
    const history = msgs.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content }));
    setMsgs((m) => [...m, { role: 'user', content: q }]);
    try {
      const { answer, picks, source } = await ask(q, history);
      setMsgs((m) => [...m, { role: 'assistant', content: answer, picks, source }]);
    } catch {
      setMsgs((m) => [
        ...m,
        { role: 'assistant', content: 'الان نتوانستم جواب بدهم. یک بار دیگر بپرس، یا مستقیم سراغ محصولات برو.', picks: [] },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="wrap bot">
      <div style={{ paddingBlockStart: 'var(--s4)' }}>
        <p className="eyebrow">مشاور خرید</p>
        <h1 style={{ fontSize: 'var(--t-h2)' }}>نمی‌دانی کدام؟ بپرس.</h1>
      </div>

      <div className="bot-log">
        {msgs.map((m, i) => (
          <div key={i} className={`bubble ${m.role === 'user' ? 'bubble-user' : 'bubble-bot'}`}>
            {m.content}
            {m.picks?.length > 0 && (
              <div className="bot-picks">
                {m.picks.map((p) => (
                  <Link className="pick" to={`/p/${p.slug}`} key={p.id}>
                    <Photo src={p.colors[0].photos[0]} alt={p.name} tone={p.colors[0].hex} sizes="44px" />
                    <span>
                      <b style={{ fontFamily: 'var(--font-display)' }}>{p.name}</b>
                      <br />
                      <small className="muted">{p.stock > 0 ? `${p.fit} · موجود` : 'سفارشی'}</small>
                    </span>
                    <b className="num" style={{ color: 'var(--wine)' }}>{toman(p.price, { unit: false })}</b>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="bubble bubble-bot">
            <span className="typing" aria-label="در حال نوشتن"><i /><i /><i /></span>
          </div>
        )}
        <div ref={logRef} />
      </div>

      <div className="suggestions bleed">
        {OPENERS.map((s) => (
          <button key={s} className="chip" onClick={() => send(s)} disabled={busy}>
            {s}
          </button>
        ))}
      </div>

      <form
        className="bot-form"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="مثلاً: ۱۷۵ سانتمه، تیشرت ساده سفید"
          aria-label="پرسش شما"
          disabled={busy}
        />
        <button className="btn btn-primary" type="submit" disabled={busy || !text.trim()}>
          بپرس
        </button>
      </form>

      <p className="muted" style={{ fontSize: 'var(--t-xs)', textAlign: 'center', paddingBlock: 'var(--s3)' }}>
        جواب‌ها فقط از روی محصولات همین فروشگاه ساخته می‌شوند.
      </p>
    </div>
  );
}
