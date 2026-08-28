import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { allProducts } from '../lib/catalog';
import { useAccount, validPhone } from '../lib/account';
import { useShop } from '../lib/store';
import { useSeo } from '../lib/seo';
import { fa } from '../lib/format';

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const art = {
  pin: <><path d="M12 21s-6-5.5-6-10a6 6 0 1 1 12 0c0 4.5-6 10-6 10Z" /><circle cx="12" cy="11" r="2.2" /></>,
  bell: <><path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9Z" /><path d="M10 18a2 2 0 0 0 4 0" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  send: <path d="M20.5 3.5 3.8 10.2c-.9.4-.9 1.6.1 1.9l4.6 1.4 1.7 5c.3.9 1.5 1 2 .2l2.3-3.4 4.4 3.2c.7.5 1.6.1 1.8-.7l3-13c.2-.9-.7-1.6-1.2-1.3Z" />,
  trash: <><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /></>,
  star: <path d="M12 3.6l2.6 5.3 5.8.85-4.2 4.1 1 5.75L12 16.9l-5.2 2.7 1-5.75-4.2-4.1 5.8-.85z" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="8" r="0.7" fill="currentColor" stroke="none" /></>,
};

const PROVINCES = [
  'تهران', 'البرز', 'اصفهان', 'فارس', 'خراسان رضوی', 'آذربایجان شرقی', 'آذربایجان غربی',
  'خوزستان', 'مازندران', 'گیلان', 'کرمان', 'قم', 'مرکزی', 'یزد', 'کرمانشاه', 'همدان',
  'گلستان', 'اردبیل', 'هرمزگان', 'قزوین', 'زنجان', 'لرستان', 'سیستان و بلوچستان',
  'کردستان', 'بوشهر', 'سمنان', 'چهارمحال و بختیاری', 'خراسان شمالی', 'خراسان جنوبی',
  'کهگیلویه و بویراحمد', 'ایلام',
];

const BLANK_ADDRESS = { label: 'خانه', receiver: '', phone: '', province: 'تهران', city: '', street: '', postal: '', isDefault: false };

const TABS = [
  { key: 'account', title: 'حساب', icon: art.user },
  { key: 'addresses', title: 'آدرس‌ها', icon: art.pin },
  { key: 'notify', title: 'اعلان‌ها', icon: art.bell },
];

export default function Profile() {
  const acc = useAccount();
  const { toast } = useShop();
  const [tab, setTab] = useState('account');

  useSeo({ title: 'پروفایل', path: '/profile', noindex: true });

  if (!acc.signedIn) return <Navigate to="/enter" replace />;

  return (
    <div className="wrap profile">
      <header className="profile-head">
        <span className="profile-avatar" aria-hidden="true">{acc.user.name.trim()[0]}</span>
        <div>
          <h1>{acc.user.name}</h1>
          <p className="muted num">{fa(acc.user.phone)}</p>
        </div>
        <button className="btn btn-ghost" onClick={() => { acc.signOut(); toast('خارج شدی', 'warn'); }}>
          خروج
        </button>
      </header>

      <nav className="profile-tabs" aria-label="بخش‌های پروفایل">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'on' : ''} aria-current={tab === t.key} onClick={() => setTab(t.key)}>
            <Icon d={t.icon} size={17} />
            {t.title}
          </button>
        ))}
      </nav>

      {tab === 'account' && <AccountTab acc={acc} />}
      {tab === 'addresses' && <AddressTab acc={acc} toast={toast} />}
      {tab === 'notify' && <NotifyTab acc={acc} toast={toast} />}
    </div>
  );
}

function AccountTab({ acc }) {
  const mine = acc.myReviews;
  return (
    <>
      <div className="panel">
        <h3>مشخصات</h3>
        <dl className="spec">
          <dt>نام</dt><dd>{acc.user.name}</dd>
          <dt>موبایل</dt><dd className="num">{fa(acc.user.phone)}</dd>
          {acc.user.email && <><dt>ایمیل</dt><dd dir="ltr">{acc.user.email}</dd></>}
          <dt>عضویت</dt><dd>{new Date(acc.user.joined).toLocaleDateString('fa-IR')}</dd>
        </dl>
      </div>

      <div className="panel">
        <h3>خریدهای من</h3>
        <p className="muted" style={{ fontSize: 'var(--t-sm)', marginBlockEnd: 'var(--s3)' }}>
          وضعیت هر سفارش، کد پیگیری پرداخت و کد رهگیری مرسوله.
        </p>
        <Link to="/orders" className="btn btn-ghost">دیدن خریدهای اخیر</Link>
      </div>

      <div className="panel">
        <h3>نظرهای من</h3>
        {mine.length === 0 ? (
          <p className="panel-empty">هنوز نظری ننوشته‌ای. از صفحهٔ هر تیشرت می‌توانی بنویسی.</p>
        ) : (
          <ul className="my-reviews">
            {mine.map((r) => {
              const p = allProducts().find((x) => x.id === r.product);
              return (
                <li key={r.id}>
                  <div className="row between">
                    {p ? <Link to={`/p/${p.slug}`} className="link-more">{p.name}</Link> : <span>{r.product}</span>}
                    <span className="my-stars" aria-label={`${r.rating} از ۵`}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Icon key={n} d={art.star} size={13} />
                      )).slice(0, r.rating)}
                    </span>
                  </div>
                  <p>{r.body}</p>
                  <button className="btn-quiet" style={{ fontSize: 'var(--t-xs)' }} onClick={() => acc.removeReview(r.product)}>
                    حذف
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="profile-note">
        <Icon d={art.info} size={15} />
        <span>
          این حساب فقط در همین مرورگر ذخیره شده است. تا وقتی سرور وصل نشده، سفارش‌ها و آدرس‌ها
          بین دستگاه‌ها همگام نمی‌شوند.
        </span>
      </p>
    </>
  );
}

function AddressTab({ acc, toast }) {
  const [draft, setDraft] = useState(null);
  const [error, setError] = useState('');

  const set = (k) => (e) => { setDraft({ ...draft, [k]: e.target.value }); setError(''); };

  const save = (e) => {
    e.preventDefault();
    if (draft.receiver.trim().length < 2) return setError('نام تحویل‌گیرنده را بنویس.');
    if (!validPhone(draft.phone)) return setError('شمارهٔ تماس باید با ۰۹ شروع شود و ۱۱ رقم باشد.');
    if (draft.city.trim().length < 2) return setError('شهر را بنویس.');
    if (draft.street.trim().length < 6) return setError('نشانی را کامل‌تر بنویس.');
    acc.saveAddress(draft);
    toast(draft.id ? 'آدرس به‌روز شد' : 'آدرس اضافه شد');
    setDraft(null);
  };

  return (
    <>
      <div className="panel">
        <div className="row between" style={{ marginBlockEnd: 'var(--s4)' }}>
          <h3 style={{ margin: 0 }}>آدرس‌های من</h3>
          {!draft && (
            <button className="btn btn-primary" onClick={() => { setDraft({ ...BLANK_ADDRESS, receiver: acc.user.name, phone: acc.user.phone }); setError(''); }}>
              آدرس تازه
            </button>
          )}
        </div>

        {acc.addresses.length === 0 && !draft && (
          <p className="panel-empty">هنوز آدرسی ثبت نکرده‌ای. برای تحویل سفارش لازم است.</p>
        )}

        <ul className="address-list">
          {acc.addresses.map((a) => (
            <li key={a.id} className={a.isDefault ? 'on' : ''}>
              <div className="address-top">
                <b>{a.label}</b>
                {a.isDefault ? (
                  <span className="badge">پیش‌فرض</span>
                ) : (
                  <button className="btn-quiet" style={{ fontSize: 'var(--t-xs)' }} onClick={() => acc.setDefaultAddress(a.id)}>
                    پیش‌فرض کن
                  </button>
                )}
              </div>
              <p>{a.province} · {a.city}</p>
              <p className="muted">{a.street}</p>
              <p className="muted num">{a.receiver} — {fa(a.phone)}{a.postal && <> · کدپستی {fa(a.postal)}</>}</p>
              <div className="address-actions">
                <button className="btn-quiet" style={{ fontSize: 'var(--t-xs)' }} onClick={() => { setDraft(a); setError(''); }}>ویرایش</button>
                <button
                  className="btn-quiet danger"
                  style={{ fontSize: 'var(--t-xs)' }}
                  onClick={() => { acc.removeAddress(a.id); toast('آدرس حذف شد', 'warn'); }}
                >
                  <Icon d={art.trash} size={14} />
                  حذف
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {draft && (
        <div className="panel">
          <h3>{draft.id ? 'ویرایش آدرس' : 'آدرس تازه'}</h3>
          <form onSubmit={save} className="address-form" noValidate>
            <div className="two">
              <label>
                <span className="label">عنوان</span>
                <input className="field" value={draft.label} onChange={set('label')} placeholder="خانه، محل کار…" />
              </label>
              <label>
                <span className="label">استان</span>
                <select className="field" value={draft.province} onChange={set('province')}>
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </label>
            </div>
            <div className="two">
              <label>
                <span className="label">تحویل‌گیرنده</span>
                <input className="field" value={draft.receiver} onChange={set('receiver')} autoComplete="name" />
              </label>
              <label>
                <span className="label">شمارهٔ تماس</span>
                <input className="field num" value={draft.phone} onChange={set('phone')} inputMode="tel" dir="ltr" />
              </label>
            </div>
            <div className="two">
              <label>
                <span className="label">شهر</span>
                <input className="field" value={draft.city} onChange={set('city')} />
              </label>
              <label>
                <span className="label">کدپستی <small className="muted">(اختیاری)</small></span>
                <input className="field num" value={draft.postal} onChange={set('postal')} inputMode="numeric" dir="ltr" />
              </label>
            </div>
            <label>
              <span className="label">نشانی</span>
              <textarea className="field" rows="3" value={draft.street} onChange={set('street')} placeholder="خیابان، کوچه، پلاک، واحد" />
            </label>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <div className="row" style={{ gap: 'var(--s3)' }}>
              <button className="btn btn-primary grow" type="submit">ذخیره</button>
              <button className="btn btn-ghost" type="button" onClick={() => setDraft(null)}>انصراف</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function NotifyTab({ acc, toast }) {
  const [handle, setHandle] = useState(acc.notify.telegram.handle);
  const n = acc.notify;

  const rows = [
    { key: 'newProduct', title: 'محصول تازه', note: 'وقتی مدل یا رنگ تازه‌ای اضافه شد' },
    { key: 'restock', title: 'برگشتن به انبار', note: 'وقتی سایزی که می‌خواستی دوباره موجود شد' },
    { key: 'orders', title: 'وضعیت سفارش', note: 'پرداخت، ارسال و تحویل' },
  ];

  return (
    <>
      <div className="panel">
        <h3>چه چیزهایی خبرم کن</h3>
        <ul className="notify-list">
          {rows.map((r) => (
            <li key={r.key}>
              <span>
                <b>{r.title}</b>
                <small>{r.note}</small>
              </span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={n[r.key]}
                  onChange={(e) => acc.setNotify({ [r.key]: e.target.checked })}
                  aria-label={r.title}
                />
                <i />
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <h3><Icon d={art.send} size={17} /> تلگرام</h3>
        <p className="muted" style={{ fontSize: 'var(--t-sm)', marginBlockEnd: 'var(--s4)' }}>
          به‌جای پیامک، خبرها را در تلگرام بگیر. آیدی‌ات را بنویس و ذخیره کن.
        </p>

        <label>
          <span className="label">آیدی تلگرام</span>
          <span className="auth-input">
            <span className="muted" style={{ paddingInlineStart: 4 }}>@</span>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace(/^@/, ''))}
              placeholder="username"
              dir="ltr"
              autoComplete="off"
            />
          </span>
        </label>

        <div className="row" style={{ gap: 'var(--s3)', marginBlockStart: 'var(--s4)', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => {
              acc.setNotify({ telegram: { handle: handle.trim(), linked: false } });
              toast(handle.trim() ? 'آیدی ذخیره شد' : 'آیدی پاک شد');
            }}
          >
            ذخیرهٔ آیدی
          </button>
          {n.telegram.handle && (
            <span className="notify-state">
              ذخیره شده: <span dir="ltr">@{n.telegram.handle}</span> — در انتظار اتصال ربات
            </span>
          )}
        </div>

        {/* The one thing this page must not do is imply that messages are
            going out. Nothing sends until a bot process exists to send it. */}
        <p className="profile-note" style={{ marginBlockStart: 'var(--s5)' }}>
          <Icon d={art.info} size={15} />
          <span>
            این تنظیم فعلاً فقط ذخیره می‌شود و هیچ پیامی فرستاده نمی‌شود. برای فعال‌شدنش یک ربات
            تلگرام لازم است که سمت سرور اجرا شود: ربات با <span dir="ltr">BotFather</span> ساخته
            می‌شود، شما یک بار به آن <span dir="ltr">/start</span> می‌دهید تا شناسه‌تان ثبت شود، و
            سرور موقع اضافه‌شدن محصول تازه پیام را می‌فرستد. تا آن موقع این صفحه فقط ترجیح شما را
            نگه می‌دارد.
          </span>
        </p>
      </div>
    </>
  );
}
