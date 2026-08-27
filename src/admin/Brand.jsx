import { useEffect, useState } from 'react';
import { useShop } from '../lib/store';

const VARS = [
  ['ink', 'متن', '#14161b'],
  ['paper', 'پس‌زمینه', '#f8f7f4'],
  ['blush', 'کارت و جداکننده', '#eceae4'],
  ['wine', 'رنگ اصلی', '#2b45e0'],
  ['cherry', 'رنگ تأکید', '#ff5a1f'],
  ['sand', 'برچسب‌ها', '#dfe3f7'],
];

/* Each preset is one shop identity. Swapping it re-skins the whole storefront
   because nothing in the CSS hard-codes a color. */
const PRESETS = {
  'تیرنگ — تیشرت': ['#14161b', '#f8f7f4', '#eceae4', '#2b45e0', '#ff5a1f', '#dfe3f7'],
  'مینیمال تیره': ['#f0efec', '#121316', '#1e2027', '#8fa0ff', '#ff8a5c', '#2a2e3d'],
  'گل و گیاه': ['#14201a', '#f7faf6', '#e6efe6', '#2f5d3f', '#79a04c', '#dfe8cd'],
  'کافه و قهوه': ['#20160f', '#faf5ef', '#efe3d6', '#5b3a21', '#b5762c', '#e8d2ae'],
  'آرایشی و بهداشتی': ['#1d1620', '#fbf7fb', '#f0e6f2', '#5b2b63', '#b3499a', '#ecd9e8'],
}; 

const FONTS = {
  'مربا + استعداد': ["'Morabba', 'Vazirmatn', sans-serif", "'Estedad', 'Vazirmatn', sans-serif"],
  'وزیرمتن (همه‌جا)': ["'Vazirmatn', sans-serif", "'Vazirmatn', sans-serif"],
  'استعداد (همه‌جا)': ["'Estedad', 'Vazirmatn', sans-serif", "'Estedad', 'Vazirmatn', sans-serif"],
};

export default function Brand() {
  const { toast } = useShop();
  const [colors, setColors] = useState(PRESETS['تیرنگ — تیشرت']);
  const [font, setFont] = useState('مربا + استعداد');
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    VARS.forEach(([name], i) => root.style.setProperty(`--${name}`, colors[i]));
    const [display, body] = FONTS[font];
    root.style.setProperty('--font-display', display);
    root.style.setProperty('--font-body', body);
    dark ? root.setAttribute('data-theme', 'dark') : root.removeAttribute('data-theme');
  }, [colors, font, dark]);

  const snippet = `:root {\n${VARS.map(([n], i) => `  --${n}: ${colors[i]};`).join('\n')}\n  --font-display: ${FONTS[font][0]};\n  --font-body: ${FONTS[font][1]};\n}`;

  return (
    <>
      <p className="eyebrow">قالب</p>
      <h1 style={{ fontSize: 'var(--t-h1)' }}>ظاهر فروشگاه</h1>
      <p className="muted" style={{ fontSize: 'var(--t-sm)', maxWidth: '52ch' }}>
        هر تغییری اینجا همان لحظه روی کل سایت اعمال می‌شود. کل هویت بصری فروشگاه از همین شش رنگ و دو
        فونت ساخته شده — بقیهٔ کدها رنگ ثابتی ندارند.
      </p>

      <div className="panel">
        <h3>قالب آماده</h3>
        <div className="suggestions">
          {Object.entries(PRESETS).map(([name, v]) => (
            <button
              key={name}
              className="chip"
              aria-pressed={colors.join() === v.join()}
              onClick={() => setColors(v)}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 99,
                  background: v[3],
                  marginInlineEnd: 6,
                }}
              />
              {name}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>رنگ‌ها</h3>
        {VARS.map(([name, label], i) => (
          <div className="color-row" key={name}>
            <span>{label}</span>
            <code className="muted" style={{ direction: 'ltr', fontSize: 'var(--t-xs)' }}>{colors[i]}</code>
            <input
              type="color"
              value={colors[i]}
              aria-label={label}
              onChange={(e) => setColors(colors.map((c, j) => (j === i ? e.target.value : c)))}
            />
          </div>
        ))}
      </div>

      <div className="panel">
        <h3>فونت</h3>
        <div className="suggestions">
          {Object.keys(FONTS).map((f) => (
            <button key={f} className="chip" aria-pressed={font === f} onClick={() => setFont(f)}>
              {f}
            </button>
          ))}
        </div>
        <label className="row" style={{ marginBlockStart: 'var(--s4)', gap: 'var(--s2)' }}>
          <input type="checkbox" checked={dark} onChange={(e) => setDark(e.target.checked)} />
          <span>حالت تاریک</span>
        </label>
      </div>

      <div className="panel">
        <h3>برای تحویل به توسعه‌دهنده</h3>
        <div className="code">{snippet}</div>
        <button
          className="btn btn-ghost"
          style={{ marginBlockStart: 'var(--s3)' }}
          onClick={() => {
            navigator.clipboard?.writeText(snippet);
            toast('در حافظه کپی شد');
          }}
        >
          کپی در حافظه
        </button>
        <p className="muted" style={{ fontSize: 'var(--t-xs)', marginBlockStart: 'var(--s2)' }}>
          این را در <code>src/styles/tokens.css</code> بگذارید تا تغییر دائمی شود.
        </p>
      </div>
    </>
  );
}
