import { useState } from 'react';
import { Link } from 'react-router-dom';
import { categories } from '../data/products';
import { removeProduct, isCustom, isEdited, resetProduct } from '../lib/catalog';
import { useCatalog } from '../lib/useCatalog';
import { normalize } from '../lib/rag';
import { useShop } from '../lib/store';
import { EmptyState } from '../components/States';
import ProductForm from './ProductForm';
import { toman, fa } from '../lib/format';

/**
 * The catalog, as the owner sees it.
 *
 * Products created here go into the same list the shop and the assistant read
 * (lib/catalog.js), so a product added on this screen is findable in search
 * before you have finished walking back to the storefront tab.
 *
 * Seed products cannot be deleted from here. They ship with the template and
 * live in a source file; a delete button that silently did nothing would be
 * worse than not offering one.
 */
export function Catalog() {
  const { toast } = useShop();
  const list = useCatalog();
  const [open, setOpen] = useState(false);
  /* Editing is a mode you enter on purpose, not a stepper sitting in the row.
     The old ± buttons meant a mis-tap on a phone silently changed stock, and
     nothing on screen said it had. */
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState('');

  const needle = normalize(q);
  const shown = needle
    ? list.filter((p) => normalize(`${p.name} ${p.subtitle} ${p.tags.join(' ')}`).includes(needle))
    : list;

  const mine = list.filter((p) => isCustom(p.id)).length;

  return (
    <>
      <div className="row between" style={{ flexWrap: 'wrap', gap: 'var(--s3)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--t-h1)' }}>محصولات</h1>
          <p className="muted" style={{ fontSize: 'var(--t-sm)' }}>
            {fa(list.length)} محصول{mine > 0 && <> · {fa(mine)} تای آن را خودتان اضافه کرده‌اید</>}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen((o) => !o)}>
          {open ? 'بستن' : 'محصول تازه'}
        </button>
      </div>

      {open && !editing && (
        <div className="panel">
          <h3>محصول تازه</h3>
          <ProductForm onDone={() => setOpen(false)} onCancel={() => setOpen(false)} />
        </div>
      )}

      {editing && (
        <div className="panel">
          <h3>ویرایش «{editing.name}»</h3>
          <p className="muted" style={{ fontSize: 'var(--t-sm)', marginBlockEnd: 'var(--s4)' }}>
            قیمت، موجودی هر سایز، رنگ‌ها، عکس‌ها و متن — همه قابل تغییرند. نشانی محصول عوض نمی‌شود.
          </p>
          <ProductForm editing={editing} onDone={() => setEditing(null)} onCancel={() => setEditing(null)} />
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
          <ul className="prod-rows">
            {shown.map((p) => {
              const own = isCustom(p.id);
              const photo = p.colors[0]?.photos[0];
              return (
                <li key={p.id}>
                  {photo ? <img src={photo} alt="" loading="lazy" decoding="async" /> : <span className="prod-blank" />}
                  <span className="prod-name">
                    <b>
                      <Link to={`/p/${p.slug}`}>{p.name}</Link>
                      {own && <span className="badge badge-new">افزودهٔ شما</span>}
                      {!own && isEdited(p.id) && <span className="badge">ویرایش‌شده</span>}
                    </b>
                    <small>
                      {categories.find((c) => c.slug === p.category)?.name} · {p.fit} ·{' '}
                      {fa(p.colors.length)} رنگ · موجودی {fa(p.stock)}
                    </small>
                  </span>
                  <b className="num prod-price">{toman(p.price, { unit: false })}</b>
                  <span className="prod-actions">
                    <button className="btn-quiet" onClick={() => { setEditing(p); setOpen(false); }}>
                      ویرایش
                    </button>
                    {own ? (
                      <button
                        className="btn-quiet danger"
                        onClick={() => { removeProduct(p.id); toast(`«${p.name}» حذف شد`, 'warn'); }}
                      >
                        حذف
                      </button>
                    ) : (
                      isEdited(p.id) && (
                        <button
                          className="btn-quiet"
                          onClick={() => { resetProduct(p.id); toast(`«${p.name}» به حالت اولیه برگشت`, 'warn'); }}
                        >
                          بازگردانی
                        </button>
                      )
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
