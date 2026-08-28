/* ───────────────────────────────────────────────────────────────
   SAMPLE REVIEWS — placeholder content, not real customers.

   Written to fill the template until real reviews exist. Nobody here
   bought anything and none of these names belong to anyone; the UI
   labels the section as نمونه so a visitor is not misled either.
   Replace this file wholesale when the shop has real ones — the
   component reads nothing but the shape below.

   The ratings are kept in step with `rating` on each product in
   products.js. If you edit one, edit the other, or the average printed
   on the product page will disagree with the stars beside it.
   ─────────────────────────────────────────────────────────────── */

/** @typedef {{ id, product, name, rating, date, size, note, body, helpful }} Review */
export const reviews = [
  // p1 — تیشرت اورسایز پایه (4.8)
  { id: 'r1', product: 'p1', name: 'سامان', rating: 5, date: '۲ شهریور', size: 'L', note: 'قد ۱۸۲، وزن ۷۸', body: 'دقیقاً همان تن‌خوری که دنبالش بودم. پارچه‌اش سنگین است و بعد از سه بار شست‌وشو هنوز فرم دارد. یقه‌اش شل نشده.', helpful: 24 },
  { id: 'r2', product: 'p1', name: 'نگار', rating: 5, date: '۲۸ مرداد', size: 'M', note: 'قد ۱۶۸', body: 'برای تن‌خور اورسایز سایز M گرفتم و اندازه شد. رنگ زیتونی‌اش دقیقاً همان چیزی است که در عکس دیدم.', helpful: 17 },
  { id: 'r3', product: 'p1', name: 'پویا', rating: 4, date: '۱۹ مرداد', size: 'XL', note: 'قد ۱۹۰، وزن ۹۲', body: 'کیفیتش عالی است، فقط آستینش کمی بلندتر از چیزی بود که انتظار داشتم. اگر آستین کوتاه‌تر می‌خواهید یک سایز پایین‌تر بگیرید.', helpful: 31 },

  // p2 — تیشرت یقه گرد کلاسیک (4.6)
  { id: 'r4', product: 'p2', name: 'مهدی', rating: 5, date: '۵ شهریور', size: 'L', note: 'قد ۱۷۸، وزن ۷۴', body: 'ساده و بی‌دردسر. سه تا سفارش دادم در سه رنگ. برای هر روز همین کافی است.', helpful: 12 },
  { id: 'r5', product: 'p2', name: 'الهام', rating: 4, date: '۳۰ مرداد', size: 'M', note: '', body: 'خوب است ولی سفیدش کمی نازک‌تر از رنگ‌های تیره است. زیرش لباس روشن بپوشید.', helpful: 28 },
  { id: 'r6', product: 'p2', name: 'رضا', rating: 5, date: '۱۴ مرداد', size: 'XL', note: 'قد ۱۸۵', body: 'جدول اندازه‌شان درست است. طبق همان سایز گرفتم و نیازی به تعویض نشد.', helpful: 9 },

  // p3 — تیشرت زنانه پایه (4.7)
  { id: 'r7', product: 'p3', name: 'سارا', rating: 5, date: '۱ شهریور', size: 'S', note: 'قد ۱۶۲', body: 'برش زنانه‌اش واقعاً زنانه است، نه یک تیشرت مردانهٔ کوچک‌شده. کشسانی‌اش هم بعد از شستن نرفت.', helpful: 21 },
  { id: 'r8', product: 'p3', name: 'مریم', rating: 4, date: '۲۲ مرداد', size: 'M', note: '', body: 'رنگ صورتی‌اش کمی روشن‌تر از عکس است، ولی قشنگ است. جنسش نرم و خنک است.', helpful: 14 },

  // p4 — تیشرت گرافیکی خیابانی (4.9)
  { id: 'r9', product: 'p4', name: 'آرش', rating: 5, date: '۷ شهریور', size: 'L', note: 'قد ۱۸۰', body: 'چاپش اصلاً روی پارچه سفت نیست، انگار بخشی از خودش است. بعد از شست‌وشو هم ترک نخورد.', helpful: 33 },
  { id: 'r10', product: 'p4', name: 'کیانا', rating: 5, date: '۲۶ مرداد', size: 'M', note: 'قد ۱۷۰', body: 'طرحش دقیقاً همان است که در عکس بود. اورسایز است، اگر تن‌خور معمولی می‌خواهید یک سایز پایین بگیرید.', helpful: 19 },

  // p5 — پک دوتایی مشکی و سفید (4.5)
  { id: 'r11', product: 'p5', name: 'حسین', rating: 5, date: '۳ شهریور', size: 'L', note: '', body: 'از خرید جداگانه ارزان‌تر درآمد و هر دو یک کیفیت‌اند. برای شروع کمد بهترین گزینه است.', helpful: 26 },
  { id: 'r12', product: 'p5', name: 'زهرا', rating: 4, date: '۱۸ مرداد', size: 'M', note: '', body: 'خوب بود، فقط کاش می‌شد سایز هر کدام را جدا انتخاب کرد.', helpful: 22 },

  // p6 — تیشرت اسپرت مردانه (4.4)
  { id: 'r13', product: 'p6', name: 'بابک', rating: 4, date: '۳۱ مرداد', size: 'XL', note: 'قد ۱۸۴، وزن ۸۶', body: 'اسلیم است و واقعاً به بدن می‌خورد. یک سایز بالاتر گرفتم و درست شد. برای باشگاه خنک است.', helpful: 18 },
  { id: 'r14', product: 'p6', name: 'امید', rating: 5, date: '۱۲ مرداد', size: 'L', note: '', body: 'عرق را خوب می‌کشد و سنگین نمی‌شود. بعد از تمرین هم فرمش را از دست نداد.', helpful: 11 },

  // p7 — تیشرت زرد تابستانی (4.5)
  { id: 'r15', product: 'p7', name: 'نیما', rating: 5, date: '۲۹ مرداد', size: 'L', note: '', body: 'زردش جیغ نیست، خیلی تمیز است. برای تابستان سبک و خنک.', helpful: 15 },
  { id: 'r16', product: 'p7', name: 'شیما', rating: 4, date: '۱۰ مرداد', size: 'M', note: '', body: 'قشنگ است ولی رنگ روشن است و لک را نشان می‌دهد. با آب سرد بشویید.', helpful: 13 },

  // p8 — تیشرت قرمز (4.6)
  { id: 'r17', product: 'p8', name: 'فرید', rating: 5, date: '۴ شهریور', size: 'M', note: 'قد ۱۷۴', body: 'قرمزش بعد از دو بار شستن هیچ رنگی پس نداد. دقیقاً همان قرمز عکس.', helpful: 20 },

  // p9 — تیشرت مرچ کافه (4.7)
  { id: 'r18', product: 'p9', name: 'کافه ثمر', rating: 5, date: '۲۵ مرداد', size: 'L', note: 'سفارش ۲۰ عددی', body: 'برای تیم کافه سفارش دادیم. طرح را تأیید کردند، ده روز کاری بعد تحویل گرفتیم و کیفیت چاپ روی همه یکسان بود.', helpful: 29 },

  // p10 — تیشرت بچگانه طرح‌دار (4.8)
  { id: 'r19', product: 'p10', name: 'مادر آرتین', rating: 5, date: '۶ شهریور', size: 'M', note: 'برای ۷ ساله', body: 'نخش واقعاً نرم‌تر از بزرگسال است. بچه‌ام حساسیت پوستی دارد و مشکلی پیش نیامد.', helpful: 34 },
  { id: 'r20', product: 'p10', name: 'سپیده', rating: 4, date: '۱۶ مرداد', size: 'L', note: 'برای ۹ ساله', body: 'اندازه‌اش درست بود. فقط چون بچه سریع قد می‌کشد، شاید بهتر بود یک سایز بالاتر می‌گرفتم.', helpful: 16 },

  // p11 — ست دونفره (4.6)
  { id: 'r21', product: 'p11', name: 'یاسمن', rating: 5, date: '۸ شهریور', size: 'M', note: 'سایز دوم L', body: 'برای سالگردمان گرفتم. در توضیح سفارش سایز نفر دوم را نوشتم و درست فرستادند.', helpful: 23 },

  // p12 — پک سه‌تایی رنگی (4.7)
  { id: 'r22', product: 'p12', name: 'محمد', rating: 5, date: '۲۷ مرداد', size: 'XL', note: '', body: 'سه رنگ، یک قیمت. هر سه یک جنس‌اند و هیچ‌کدام بعد از شست‌وشو آب نرفت.', helpful: 25 },
];

/** Newest first, so the product page shows the most recent read first. */
export const reviewsFor = (productId) => reviews.filter((r) => r.product === productId);

/** Average and per-star counts, computed rather than stored so they cannot drift. */
export function reviewSummary(productId) {
  const list = reviewsFor(productId);
  if (!list.length) return null;
  const total = list.reduce((s, r) => s + r.rating, 0);
  const stars = [5, 4, 3, 2, 1].map((n) => ({ n, count: list.filter((r) => r.rating === n).length }));
  return { count: list.length, average: total / list.length, stars };
}
