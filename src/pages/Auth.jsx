import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Orb from '../components/Orb';
import { useAccount, validPhone } from '../lib/account';
import { useShop } from '../lib/store';
import { useSeo } from '../lib/seo';
import { fa } from '../lib/format';

/**
 * ورود و ثبت‌نام — demo only.
 *
 * Phone number, no password, no code. That is not a shortcut around the real
 * thing: the plan is an SMS one-time code, so a password field would be a
 * control that never ships, and a password box on a public URL invites someone
 * to type one they use elsewhere into a localStorage demo. The page says
 * plainly what it is rather than dressing up as a real sign-in.
 */

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d}
  </svg>
);
const art = {
  phone: <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 5 5l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16.5 16.5 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  mail: <><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="8" r="0.7" fill="currentColor" stroke="none" /></>,
};

export default function Auth() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'signin');
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [error, setError] = useState('');
  const { signIn, signUp, signedIn, user } = useAccount();
  const { toast } = useShop();
  const navigate = useNavigate();

  useSeo({
    title: mode === 'signup' ? 'ثبت‌نام' : 'ورود',
    description: 'ورود به حساب کاربری تیرنگ.',
    path: '/enter',
    noindex: true,
  });

  const set = (k) => (e) => { setForm({ ...form, [k]: e.target.value }); setError(''); };

  const submit = (e) => {
    e.preventDefault();
    if (!validPhone(form.phone)) return setError('شمارهٔ موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد.');

    if (mode === 'signup') {
      if (form.name.trim().length < 2) return setError('اسمت را بنویس.');
      signUp(form);
      toast(`خوش آمدی، ${form.name.trim()}`);
      navigate('/profile');
      return;
    }

    const res = signIn(form.phone);
    if (!res.ok) {
      setError('با این شماره حسابی در این مرورگر ساخته نشده. اول ثبت‌نام کن.');
      return;
    }
    toast('وارد شدی');
    navigate('/profile');
  };

  if (signedIn) {
    return (
      <div className="wrap auth">
        <div className="auth-done">
          <Orb size={120} />
          <h1>سلام {user.name}</h1>
          <p className="muted">با شمارهٔ <span className="num">{fa(user.phone)}</span> وارد شده‌ای.</p>
          <div className="row" style={{ gap: 'var(--s3)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/profile" className="btn btn-primary">رفتن به پروفایل</Link>
            <Link to="/products" className="btn btn-ghost">ادامهٔ خرید</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap auth">
      <div className="auth-card">
        <div className="auth-art">
          <Orb size={150} />
          <h2>تیرنگ</h2>
          <p>
            یک حساب برای نگه‌داشتن آدرس‌ها، سفارش‌ها و اینکه وقتی چیزی تازه آمد خبردار شوی.
          </p>
        </div>

        <div className="auth-form">
          <div className="auth-tabs" role="tablist">
            <button role="tab" aria-selected={mode === 'signin'} onClick={() => { setMode('signin'); setError(''); }}>
              ورود
            </button>
            <button role="tab" aria-selected={mode === 'signup'} onClick={() => { setMode('signup'); setError(''); }}>
              ثبت‌نام
            </button>
            <span className={`auth-ink ${mode}`} aria-hidden="true" />
          </div>

          <form onSubmit={submit} noValidate>
            {mode === 'signup' && (
              <label className="auth-field">
                <span className="label">اسمت</span>
                <span className="auth-input">
                  <Icon d={art.user} />
                  <input value={form.name} onChange={set('name')} placeholder="مثلاً نگار" autoComplete="name" />
                </span>
              </label>
            )}

            <label className="auth-field">
              <span className="label">شمارهٔ موبایل</span>
              <span className="auth-input">
                <Icon d={art.phone} />
                <input
                  value={form.phone}
                  onChange={set('phone')}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  dir="ltr"
                />
              </span>
            </label>

            {mode === 'signup' && (
              <label className="auth-field">
                <span className="label">ایمیل <small className="muted">(اختیاری)</small></span>
                <span className="auth-input">
                  <Icon d={art.mail} />
                  <input value={form.email} onChange={set('email')} type="email" autoComplete="email" placeholder="you@example.com" dir="ltr" />
                </span>
              </label>
            )}

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="btn btn-primary btn-block" type="submit">
              {mode === 'signup' ? 'ساختن حساب' : 'ورود'}
            </button>
          </form>

          <p className="auth-swap">
            {mode === 'signup' ? 'قبلاً ثبت‌نام کرده‌ای؟ ' : 'حساب نداری؟ '}
            <button className="link-more" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError(''); }}>
              {mode === 'signup' ? 'وارد شو' : 'ثبت‌نام کن'}
            </button>
          </p>

          {/* Not fine print. Anyone typing a real number deserves to know what
              this does and does not do before they type it. */}
          <p className="auth-note">
            <Icon d={art.info} size={15} />
            <span>
              این نسخهٔ آزمایشی است: نه کدی پیامک می‌شود و نه رمزی گرفته می‌شود. حساب فقط در همین
              مرورگر ساخته می‌شود و جایی فرستاده نمی‌شود — با پاک‌کردن دادهٔ سایت از بین می‌رود.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
