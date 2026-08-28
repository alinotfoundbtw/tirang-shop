import { useState } from 'react';
import { categories, SIZES } from '../data/products';
import { addProduct } from '../lib/catalog';
import { shrinkImage, storageUsed, asMB } from '../lib/images';
import { useShop } from '../lib/store';
import { fa } from '../lib/format';

/**
 * Adding a product, in full.
 *
 * Every field here is one retrieval reads (see FIELDS in lib/rag.js): name and
 * subtitle carry the most weight, then tags, category, colour names, fit and
 * fabric, then the description. A product saved with three of them is a
 * product the assistant cannot find and the filters cannot place, which is
 * why the form asks for the lot instead of three fields and a default.
 *
 * Photos are per colourway, because that is the shop's whole premise — a
 * colour without its own photograph is a tint filter, which is the thing this
 * catalog exists not to be.
 */

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const art = {
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  image: <><rect x="3" y="4.5" width="18" height="15" rx="2.5" /><path d="m4 17 5-5 4 4 3-2 4 4" /><circle cx="9" cy="9.5" r="1.4" /></>,
};

const FITS = ['اورسایز', 'رگولار', 'اسلیم', 'رگولار زنانه', 'رگولار بچگانه'];

const blankColor = () => ({ name: '', hex: '#141414', photos: [], stock: Object.fromEntries(SIZES.map((s) => [s, 0])) });

const BLANK = {
  name: '', subtitle: '', category: 'basic', price: '', oldPrice: '',
  fit: 'رگولار', gsm: '190', fabric: 'نخ پنبه ۱۰۰٪',
  model: 'قد مدل ۱۷۸ سانت، سایز M پوشیده',
  care: 'شست‌وشو با آب سرد، پشت‌ورو، بدون خشک‌کن',
  bio: '', tags: '', days: '5', banner: null,
  colors: [blankColor()],
};

export default function ProductForm({ onDone, onCancel }) {
  const { toast } = useShop();
  const [f, setF] = useState(BLANK);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const set = (k) => (e) => { setF({ ...f, [k]: e.target.value }); setError(''); };
  const setColor = (i, patch) =>
    setF((cur) => ({ ...cur, colors: cur.colors.map((c, n) => (n === i ? { ...c, ...patch } : c)) }));

  const pickPhotos = async (i, files) => {
    setBusy(`در حال کوچک‌کردن ${fa(files.length)} عکس…`);
    try {
      const shrunk = [];
      for (const file of files) {
        const { dataUrl } = await shrinkImage(file);
        shrunk.push(dataUrl);
      }
      setColor(i, { photos: [...f.colors[i].photos, ...shrunk].slice(0, 4) });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const pickBanner = async (files) => {
    if (!files[0]) return;
    setBusy('در حال کوچک‌کردن بنر…');
    try {
      const { dataUrl } = await shrinkImage(files[0], { maxEdge: 1200 });
      setF((cur) => ({ ...cur, banner: dataUrl }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy('');
    }
  };

  const save = (e) => {
    e.preventDefault();
    if (f.name.trim().length < 3) return setError('اسم محصول را بنویسید.');
    if (!Number(f.price)) return setError('قیمت را بنویسید.');
    if (f.bio.trim().length < 20) return setError('توضیح را کامل‌تر بنویسید — همین متن را دستیار فروشگاه می‌خواند.');

    const colors = f.colors.filter((c) => c.name.trim());
    if (!colors.length) return setError('دست‌کم یک رنگ با اسم لازم است.');
    const noPhoto = colors.find((c) => c.photos.length === 0);
    if (noPhoto) return setError(`رنگ «${noPhoto.name}» عکس ندارد. هر رنگ عکس خودش را لازم دارد.`);

    const stamp = Date.now();
    const slugBase = f.name.trim().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '');
    const product = {
      id: `c${stamp}`,
      slug: `${slugBase}-${String(stamp).slice(-4)}`,
      name: f.name.trim(),
      subtitle: f.subtitle.trim() || `${f.fit} · ${f.gsm} گرم`,
      category: f.category,
      price: Number(f.price) * 1000,
      ...(Number(f.oldPrice) ? { oldPrice: Number(f.oldPrice) * 1000 } : {}),
      fit: f.fit,
      gsm: Number(f.gsm) || 190,
      fabric: f.fabric.trim(),
      model: f.model.trim(),
      care: f.care.trim(),
      rating: 5,
      sales: 0,
      days: Number(f.days) || 5,
      new: true,
      sizes: SIZES,
      colors: colors.map((c) => ({
        name: c.name.trim(),
        hex: c.hex,
        photos: c.photos,
        stock: Object.fromEntries(SIZES.map((s) => [s, Number(c.stock[s]) || 0])),
      })),
      stock: colors.reduce((sum, c) => sum + SIZES.reduce((n, s) => n + (Number(c.stock[s]) || 0), 0), 0),
      banner: f.banner,
      tone: colors[0].hex,
      bio: f.bio.trim(),
      // Split on both commas so a Persian keyboard and an English one agree.
      tags: f.tags.split(/[,،]/).map((t) => t.trim()).filter(Boolean),
    };

    const res = addProduct(product);
    if (!res.ok) return setError(res.error);
    toast(`«${product.name}» اضافه شد و در جست‌وجو پیدا می‌شود`);
    onDone?.(product);
  };

  const used = storageUsed();

  return (
    <form className="pform" onSubmit={save} noValidate>
      <section>
        <h4>پایه</h4>
        <div className="two">
          <label>
            <span className="label">اسم محصول</span>
            <input className="field" value={f.name} onChange={set('name')} placeholder="تیشرت اورسایز پایه" />
          </label>
          <label>
            <span className="label">زیرعنوان</span>
            <input className="field" value={f.subtitle} onChange={set('subtitle')} placeholder="نخ پنبه ۲۴۰ گرم، شانه افتاده" />
          </label>
        </div>
        <div className="two">
          <label>
            <span className="label">قیمت (هزار تومان)</span>
            <input className="field num" inputMode="numeric" value={f.price} onChange={set('price')} placeholder="۴۵۰" />
          </label>
          <label>
            <span className="label">قیمت قبل <small className="muted">(برای تخفیف، اختیاری)</small></span>
            <input className="field num" inputMode="numeric" value={f.oldPrice} onChange={set('oldPrice')} />
          </label>
        </div>
        <div className="two">
          <label>
            <span className="label">دسته</span>
            <select className="field" value={f.category} onChange={set('category')}>
              {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
            </select>
          </label>
          <label>
            <span className="label">تن‌خور</span>
            <select className="field" value={f.fit} onChange={set('fit')}>
              {FITS.map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
        </div>
      </section>

      <section>
        <h4>پارچه و مدل</h4>
        <div className="two">
          <label>
            <span className="label">وزن پارچه (گرم)</span>
            <input className="field num" inputMode="numeric" value={f.gsm} onChange={set('gsm')} />
          </label>
          <label>
            <span className="label">آماده‌سازی سفارشی (روز)</span>
            <input className="field num" inputMode="numeric" value={f.days} onChange={set('days')} />
          </label>
        </div>
        <label>
          <span className="label">جنس</span>
          <input className="field" value={f.fabric} onChange={set('fabric')} />
        </label>
        <label>
          <span className="label">مدل عکس</span>
          <input className="field" value={f.model} onChange={set('model')} />
        </label>
        <label>
          <span className="label">نگهداری</span>
          <input className="field" value={f.care} onChange={set('care')} />
        </label>
      </section>

      <section>
        <h4>متنی که دستیار می‌خواند</h4>
        <p className="pform-why">
          توضیح و برچسب‌ها بیشترین وزن را در جست‌وجو و مشاور خرید دارند. هرچه اینجا دقیق‌تر
          بنویسید، این محصول در جواب‌های بیشتری پیدا می‌شود.
        </p>
        <label>
          <span className="label">توضیح</span>
          <textarea
            className="field" rows="4" value={f.bio} onChange={set('bio')}
            placeholder="تن‌خور، جنس پارچه، و اینکه چه چیزی‌اش با بقیه فرق دارد."
          />
        </label>
        <label>
          <span className="label">برچسب‌ها <small className="muted">(با ویرگول جدا کنید)</small></span>
          <input className="field" value={f.tags} onChange={set('tags')} placeholder="اورسایز، روزمره، نخ پنبه، یونیسکس" />
        </label>
      </section>

      <section>
        <h4>عکس بنر <small className="muted">(اختیاری — برای بالای صفحهٔ محصول)</small></h4>
        <div className="drop">
          {f.banner ? (
            <div className="shot banner">
              <img src={f.banner} alt="" />
              <button type="button" onClick={() => setF({ ...f, banner: null })} aria-label="حذف بنر">
                <Icon d={art.x} size={14} />
              </button>
            </div>
          ) : (
            <label className="drop-zone">
              <Icon d={art.image} size={22} />
              <span>انتخاب عکس بنر</span>
              <input type="file" accept="image/*" onChange={(e) => pickBanner([...e.target.files])} />
            </label>
          )}
        </div>
      </section>

      <section>
        <div className="row between">
          <h4 style={{ margin: 0 }}>رنگ‌ها و موجودی</h4>
          <button type="button" className="btn-quiet" onClick={() => setF({ ...f, colors: [...f.colors, blankColor()] })}>
            <Icon d={art.plus} size={14} /> رنگ تازه
          </button>
        </div>

        {f.colors.map((c, i) => (
          <div className="cform" key={i}>
            <div className="two">
              <label>
                <span className="label">اسم رنگ</span>
                <input
                  className="field" value={c.name}
                  onChange={(e) => setColor(i, { name: e.target.value })}
                  placeholder="مشکی"
                />
              </label>
              <label>
                <span className="label">کد رنگ</span>
                <span className="hexrow">
                  <input type="color" value={c.hex} onChange={(e) => setColor(i, { hex: e.target.value })} aria-label="انتخاب رنگ" />
                  <input className="field num" dir="ltr" value={c.hex} onChange={(e) => setColor(i, { hex: e.target.value })} />
                </span>
              </label>
            </div>

            <span className="label">عکس‌های این رنگ</span>
            <div className="shots">
              {c.photos.map((src, n) => (
                <div className="shot" key={n}>
                  <img src={src} alt="" />
                  <button
                    type="button"
                    aria-label={`حذف عکس ${fa(n + 1)}`}
                    onClick={() => setColor(i, { photos: c.photos.filter((_, k) => k !== n) })}
                  >
                    <Icon d={art.x} size={13} />
                  </button>
                </div>
              ))}
              {c.photos.length < 4 && (
                <label className="drop-zone small">
                  <Icon d={art.image} size={18} />
                  <span>افزودن</span>
                  <input type="file" accept="image/*" multiple onChange={(e) => pickPhotos(i, [...e.target.files])} />
                </label>
              )}
            </div>

            <span className="label">موجودی هر سایز</span>
            <div className="stockrow">
              {SIZES.map((s) => (
                <label key={s}>
                  <small>{s}</small>
                  <input
                    className="field num" inputMode="numeric" value={c.stock[s]}
                    onChange={(e) => setColor(i, { stock: { ...c.stock, [s]: e.target.value } })}
                  />
                </label>
              ))}
            </div>

            {f.colors.length > 1 && (
              <button
                type="button" className="btn-quiet danger"
                onClick={() => setF({ ...f, colors: f.colors.filter((_, n) => n !== i) })}
              >
                حذف این رنگ
              </button>
            )}
          </div>
        ))}
      </section>

      {busy && <p className="pform-busy">{busy}</p>}
      {error && <p className="auth-error" role="alert">{error}</p>}

      <div className="row" style={{ gap: 'var(--s3)', flexWrap: 'wrap' }}>
        <button className="btn btn-primary grow" type="submit" disabled={Boolean(busy)}>ثبت محصول</button>
        <button className="btn btn-ghost" type="button" onClick={onCancel}>انصراف</button>
      </div>

      <p className="pform-note">
        عکس‌ها قبل از ذخیره تا {fa(900)} پیکسل کوچک می‌شوند و در همین مرورگر می‌مانند
        {used !== null && <> — الان حدود {fa(asMB(used))} مگابایت پر شده از حدود ۵</>}.
        تا وقتی سرور وصل نشده، محصول‌های تازه روی دستگاه‌های دیگر دیده نمی‌شوند.
      </p>
    </form>
  );
}
