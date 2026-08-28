import { useState } from 'react';
import { products as seed, categories, orders as seedOrders } from '../data/products';
import { toman, fa } from '../lib/format';
import { normalize } from '../lib/rag';
import { useShop } from '../lib/store';
import { EmptyState } from '../components/States';

/* One definition of an empty form, because there used to be two and they
   disagreed. The reset wrote { category: 'shal', stock: '1' } — a category
   slug this shop does not have, and two fields the inputs are not bound to,
   while dropping the `fit` and `gsm` they are. After saving one product the
   category select fell blank and React switched those two inputs from
   controlled to uncontrolled. */
const BLANK = { name: '', price: '', category: 'basic', fit: 'رگولار', gsm: '190', bio: '' };

/* Adding a product is three fields and a save. Everything else has a sane
   default the owner can change later — a shop owner abandons a 20-field form. */
export function Catalog() {
  const { toast } = useShop();
  const [list, setList] = useState(seed);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [q, setQ] = useState('');

  const save = () => {
    if (!form.name.trim() || !form.price) return toast('اسم و قیمت لازم است');
    const stock = { S: 5, M: 8, L: 8, XL: 4, XXL: 2 };
    const p = {
      id: `n${Date.now()}`,
      slug: `new-${Date.now()}`,
      name: form.name.trim(),
      subtitle: `${form.fit} · ${form.gsm} گرم`,
      category: form.category,
      price: Number(form.price) * 1000,
      fit: form.fit,
      gsm: Number(form.gsm) || 190,
      fabric: 'نخ پنبه',
      model: 'قد مدل ۱۷۸ سانت، سایز M پوشیده',
      care: 'شست‌وشو با آب سرد، پشت‌ورو',
      rating: 5,
      sales: 0,
      days: 5,
      new: true,
      sizes: ['S', 'M', 'L', 'XL', 'XXL'],
      colors: [
        { name: 'مشکی', hex: '#141414', photos: [], stock },
        { name: 'سفید', hex: '#f4f2ee', photos: [], stock: { ...stock } },
      ],
      stock: Object.values(stock).reduce((a, b) => a + b, 0) * 2,
      tone: '#141414',
      bio: form.bio.trim() || `${form.name.trim()} با نخ پنبه.`,
      tags: ['جدید'],
    };
    setList([p, ...list]);
    setForm(BLANK);
    setOpen(false);
    toast(`«${p.name}» اضافه شد`);
  };

  const setStock = (id, by) =>
    setList((l) => l.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + by) } : p)));

  const needle = normalize(q);
  const shown = needle
    ? list.filter((p) => normalize(`${p.name} ${p.subtitle} ${p.tags.join(' ')}`).includes(needle))
    : list;

  return (
    <>
      <div className="row between" style={{ flexWrap: 'wrap', gap: 'var(--s3)' }}>
        <h1 style={{ fontSize: 'var(--t-h1)' }}>محصولات</h1>
        <button className="btn btn-primary" onClick={() => setOpen((o) => !o)}>
          {open ? 'بستن' : 'محصول تازه'}
        </button>
      </div>

      {open && (
        <div className="panel">
          <h3>محصول تازه</h3>
          <div style={{ display: 'grid', gap: 'var(--s3)' }}>
            <div>
              <label className="label" htmlFor="n">اسم محصول</label>
              <input id="n" className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="تیشرت اورسایز پایه" />
            </div>
            <div className="row" style={{ gap: 'var(--s3)', alignItems: 'flex-end' }}>
              <div className="grow">
                <label className="label" htmlFor="p">قیمت (هزار تومان)</label>
                <input id="p" className="field" inputMode="numeric" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="۴۵۰" />
              </div>
              <div className="grow">
                <label className="label" htmlFor="g">وزن پارچه (گرم)</label>
                <input id="g" className="field" inputMode="numeric" value={form.gsm} onChange={(e) => setForm({ ...form, gsm: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="label" htmlFor="f">تن‌خور</label>
              <select id="f" className="field" value={form.fit} onChange={(e) => setForm({ ...form, fit: e.target.value })}>
                {['رگولار', 'اورسایز', 'اسلیم'].map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="c">دسته</label>
              <select id="c" className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="b">توضیح — همین متن را دستیار فروشگاه می‌خواند</label>
              <textarea id="b" className="field" rows="3" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="تن‌خور، جنس پارچه، و اینکه چه چیزی‌اش با بقیه فرق دارد." />
            </div>
            <button className="btn btn-primary" onClick={save}>ثبت محصول</button>
          </div>
        </div>
      )}

      <div className="panel">
        <input
          className="field"
          type="search"
          aria-label="جست‌وجوی محصول"
          placeholder="جست‌وجوی محصول"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ marginBlockEnd: 'var(--s4)' }}
        />
        {shown.length === 0 ? (
          <EmptyState title="محصولی با این اسم نیست" body="اسم دیگری را امتحان کنید." />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr><th>محصول</th><th>دسته</th><th>قیمت</th><th>موجودی</th><th>فروش</th></tr>
              </thead>
              <tbody>
                {shown.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="muted">{categories.find((c) => c.slug === p.category)?.name}</td>
                    <td className="num">{toman(p.price, { unit: false })}</td>
                    <td>
                      <span className="qty">
                        <button onClick={() => setStock(p.id, -1)} aria-label={`کم‌کردن موجودی ${p.name}`}>−</button>
                        <span className="num">{fa(p.stock)}</span>
                        <button onClick={() => setStock(p.id, 1)} aria-label={`زیادکردن موجودی ${p.name}`}>+</button>
                      </span>
                    </td>
                    <td className="num muted">{fa(p.sales)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

const STATUS = { paid: ['پرداخت شده', 'paid'], sent: ['ارسال شده', 'sent'], wait: ['در انتظار پرداخت', 'wait'] };

export function Orders() {
  const [rows, setRows] = useState(seedOrders);
  const { toast } = useShop();
  const advance = (id) => {
    const order = rows.find((o) => o.id === id);
    if (!order || order.status === 'sent') return;
    const next = order.status === 'wait' ? 'paid' : 'sent';
    // Outside the updater on purpose: an updater has to be pure, and React 18
    // runs it twice in development — which fired this toast twice per click.
    setRows((r) => r.map((o) => (o.id === id ? { ...o, status: next } : o)));
    toast(`سفارش ${id} → ${STATUS[next][0]}`);
  };

  const revenue = rows.filter((o) => o.status !== 'wait').reduce((s, o) => s + o.total, 0);

  return (
    <>
      <h1 style={{ fontSize: 'var(--t-h1)' }}>سفارش‌ها</h1>
      <p className="muted" style={{ fontSize: 'var(--t-sm)' }}>
        {fa(rows.length)} سفارش · {toman(revenue)} تأییدشده
      </p>
      <div className="panel">
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>شماره</th><th>مشتری</th><th>شهر</th><th>مبلغ</th><th>وضعیت</th><th><span className="sr">اقدام</span></th></tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td className="num">{o.id}</td>
                  <td>{o.customer}</td>
                  <td className="muted">{o.city}</td>
                  <td className="num">{toman(o.total, { unit: false })}</td>
                  <td><span className={`pill ${o.status}`}>{STATUS[o.status][0]}</span></td>
                  <td>
                    {o.status !== 'sent' && (
                      <button className="btn-quiet" style={{ fontSize: 'var(--t-xs)' }} onClick={() => advance(o.id)}>
                        {o.status === 'wait' ? 'ثبت پرداخت' : 'ثبت ارسال'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
