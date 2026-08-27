const FA = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export const fa = (v) => String(v).replace(/\d/g, (d) => FA[+d]);

/** 385000 → «۳۸۵٬۰۰۰ تومان» */
export const toman = (n, { unit = true } = {}) =>
  fa(n.toLocaleString('en-US').replace(/,/g, '٬')) + (unit ? ' تومان' : '');

/** 6110000 → «۶٫۱ میلیون» — for dashboard tiles where digits would crowd */
export const short = (n) => {
  if (n >= 1_000_000) return fa((n / 1_000_000).toFixed(1).replace('.', '٫')) + ' م';
  if (n >= 1000) return fa(Math.round(n / 1000)) + ' هزار';
  return fa(n);
};

export const percent = (n) => fa(Math.abs(n).toFixed(1).replace('.', '٫')) + '٪';

export const off = (price, oldPrice) =>
  oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
