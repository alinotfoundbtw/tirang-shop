/* Catalog for «تیرنگ» — a plain-and-graphic tee shop.

   Photos are served from our own origin, not hotlinked. images.pexels.com is
   unreachable from Iran without a VPN — which is most of this shop's customers
   — so hotlinking showed them a grid of "تصویر بارگذاری نشد" boxes. The files
   live in public/photos/ and are refreshed by scripts/fetch-photos.mjs.

   Every colorway carries its own photo set, which is what makes the
   swatch→image swap real rather than a tint filter. */

/* BASE_URL keeps this right under GitHub Pages, which serves the site from
   /tirang-shop/ rather than the domain root. fetch-photos.mjs asks Pexels for
   JPEG, so every vendored file is a .jpg regardless of its source format —
   `ext` now only picks which original to fetch, not what lands on disk. */
/* import.meta.env only exists under Vite; the ?? keeps this module importable
   from plain Node so retrieval can be evaluated outside the browser. */
const BASE = import.meta.env?.BASE_URL ?? '/';
const px = (id) => `${BASE}photos/${id}.jpg`;

export const SIZES = ['S', 'M', 'L', 'XL', 'XXL'];

export const categories = [
  { slug: 'oversize', name: 'اورسایز', note: 'تن‌خور آزاد' },
  { slug: 'basic', name: 'پایه و ساده', note: 'یقه گرد، هر روز' },
  { slug: 'graphic', name: 'طرح‌دار', note: 'چاپ سیلک' },
  { slug: 'women', name: 'زنانه', note: 'برش زنانه' },
  { slug: 'kids', name: 'بچگانه', note: 'نخ نرم' },
  { slug: 'pack', name: 'پک اقتصادی', note: 'دوتایی و سه‌تایی' },
];

const raw = [
  {
    id: 'p1', slug: 'oversize-basic', name: 'تیشرت اورسایز پایه',
    subtitle: 'نخ پنبه ۲۴۰ گرم، شانه افتاده',
    category: 'oversize', price: 585000, oldPrice: 690000,
    fit: 'اورسایز', gsm: 240, fabric: 'نخ پنبه ۱۰۰٪ پنبه‌ریز',
    model: 'قد مدل ۱۸۴ سانت، سایز L پوشیده',
    care: 'شست‌وشو با آب سرد، پشت‌ورو، بدون خشک‌کن',
    rating: 4.8, sales: 412, days: 5, new: false,
    colors: [
      { name: 'مشکی', hex: '#141414', photos: [px(8532616), px(9558595), px(8791990)], stock: { S: 6, M: 9, L: 4, XL: 3, XXL: 0 } },
      { name: 'سفید', hex: '#f4f2ee', photos: [px(18257675), px(17858295), px(12025472)], stock: { S: 3, M: 7, L: 8, XL: 2, XXL: 1 } },
      { name: 'زیتونی', hex: '#5f6b4a', photos: [px(9594692), px(26563051)], stock: { S: 0, M: 4, L: 5, XL: 4, XXL: 2 } },
    ],
    tags: ['اورسایز', 'پایه', 'روزمره', 'پرفروش', 'نخ پنبه', 'یونیسکس'],
    bio: 'تیشرت اورسایز با پارچهٔ ۲۴۰ گرمی که سنگین می‌ایستد و بعد از چند بار شست‌وشو شل نمی‌شود. خط شانه پایین‌تر از معمول دوخته شده تا تن‌خور آزاد بدهد. اگر تن‌خور معمولی می‌خواهید، یک سایز کوچک‌تر بگیرید.',
  },
  {
    id: 'p2', slug: 'crew-neck-classic', name: 'تیشرت یقه گرد کلاسیک',
    subtitle: 'برش رگولار، دوخت دوسوزنه',
    category: 'basic', price: 395000,
    fit: 'رگولار', gsm: 180, fabric: 'نخ پنبه پنجاه‌پنجاه',
    model: 'قد مدل ۱۷۸ سانت، سایز M پوشیده',
    care: 'ماشین لباسشویی، برنامهٔ ملایم ۳۰ درجه',
    rating: 4.6, sales: 638, days: 4, new: false,
    colors: [
      { name: 'سفید', hex: '#f4f2ee', photos: [px(8217461), px(7597490), px(806626)], stock: { S: 8, M: 12, L: 10, XL: 5, XXL: 3 } },
      { name: 'مشکی', hex: '#141414', photos: [px(9558583), px(9558593)], stock: { S: 5, M: 8, L: 6, XL: 4, XXL: 2 } },
      { name: 'خاکستری ملانژ', hex: '#8b8d8a', photos: [px(4429288)], stock: { S: 2, M: 3, L: 0, XL: 0, XXL: 0 } },
    ],
    tags: ['پایه', 'ارزان', 'رگولار', 'اداری', 'زیرپوشی', 'پرفروش'],
    bio: 'ساده‌ترین تیشرت مجموعه و همان که بیشترین فروش را دارد. پارچهٔ ۱۸۰ گرمی سبک است و برای تابستان و پوشیدن زیر پیراهن مناسب. یقه ریب‌بافت دارد تا بعد از چند شست‌وشو گشاد نشود.',
  },
  {
    id: 'p3', slug: 'women-basic-tee', name: 'تیشرت زنانه پایه',
    subtitle: 'برش زنانه، آستین کوتاه‌تر',
    category: 'women', price: 420000, oldPrice: 480000,
    fit: 'رگولار زنانه', gsm: 190, fabric: 'نخ پنبه با ۵٪ الاستان',
    model: 'قد مدل ۱۶۸ سانت، سایز S پوشیده',
    care: 'شست‌وشو با آب سرد، اتوی ملایم',
    rating: 4.7, sales: 356, days: 4, new: false,
    colors: [
      { name: 'سفید', hex: '#f4f2ee', photos: [px(8217291), px(9558752), px(9558716)], stock: { S: 7, M: 9, L: 5, XL: 2, XXL: 0 } },
      { name: 'مشکی', hex: '#141414', photos: [px(9985771), px(8672062)], stock: { S: 6, M: 6, L: 3, XL: 1, XXL: 0 } },
      { name: 'صورتی', hex: '#e8a3ad', photos: [px(9558761), px(8801076)], stock: { S: 4, M: 5, L: 2, XL: 0, XXL: 0 } },
    ],
    tags: ['زنانه', 'پایه', 'کشسان', 'روزمره', 'بهاری'],
    bio: 'برش زنانه با کمی تنگی در پهلو و آستین کوتاه‌تر از مدل یونیسکس. پنج درصد الاستان دارد، پس کش می‌آید و فرمش را پس می‌گیرد. سایزبندی روی اندام واقعی خوابیده، نه فری‌سایز.',
  },
  {
    id: 'p4', slug: 'street-graphic', name: 'تیشرت گرافیکی خیابانی',
    subtitle: 'چاپ سیلک، طرح محدود',
    category: 'graphic', price: 650000,
    fit: 'اورسایز', gsm: 220, fabric: 'نخ پنبه، چاپ سیلک آب‌پایه',
    model: 'قد مدل ۱۸۰ سانت، سایز L پوشیده',
    care: 'پشت‌ورو بشویید تا چاپ سالم بماند',
    rating: 4.9, sales: 187, days: 8, new: true,
    colors: [
      { name: 'مشکی', hex: '#141414', photos: [px(15258903, 'png'), px(15258905, 'png'), px(34741024)], stock: { S: 3, M: 5, L: 6, XL: 2, XXL: 0 } },
      { name: 'کرم', hex: '#ded5c4', photos: [px(34741029), px(18739741)], stock: { S: 2, M: 4, L: 3, XL: 1, XXL: 0 } },
    ],
    tags: ['طرح‌دار', 'خیابانی', 'جدید', 'اورسایز', 'محدود', 'چاپ'],
    bio: 'چاپ سیلک آب‌پایه که روی پارچه می‌نشیند و مثل چاپ پلاستیزول روی سینه سفت نمی‌شود. هر طرح در شمار محدود چاپ می‌شود و بعد از تمام‌شدن تکرار نمی‌شود.',
  },
  {
    id: 'p5', slug: 'two-pack-mono', name: 'پک دوتایی مشکی و سفید',
    subtitle: 'دو تیشرت پایه، یک قیمت',
    category: 'pack', price: 690000, oldPrice: 790000,
    fit: 'رگولار', gsm: 180, fabric: 'نخ پنبه پنجاه‌پنجاه',
    model: 'قد مدل ۱۷۵ سانت، سایز M پوشیده',
    care: 'ماشین لباسشویی، رنگ‌ها را جدا بشویید',
    rating: 4.5, sales: 294, days: 4, new: false,
    colors: [
      { name: 'مشکی و سفید', hex: '#575757', photos: [px(18186105), px(4440572)], stock: { S: 6, M: 10, L: 8, XL: 4, XXL: 2 } },
    ],
    tags: ['پک', 'ارزان', 'پایه', 'صرفه‌جویی', 'هدیه'],
    bio: 'دو تیشرت پایه در یک بسته، حدود صد هزار تومان ارزان‌تر از خرید جداگانه. هر دو یک سایز ارسال می‌شوند. ساده‌ترین راه برای پر کردن کشوی تیشرت.',
  },
  {
    id: 'p6', slug: 'sport-tee', name: 'تیشرت اسپرت مردانه',
    subtitle: 'خنک، برای تمرین و پیاده‌روی',
    category: 'basic', price: 460000,
    fit: 'اسلیم', gsm: 160, fabric: 'نخ پنبه با الیاف خنک‌کننده',
    model: 'قد مدل ۱۸۲ سانت، سایز L پوشیده',
    care: 'شست‌وشو با آب سرد، بدون نرم‌کننده',
    rating: 4.4, sales: 221, days: 5, new: false,
    colors: [
      { name: 'سفید', hex: '#f4f2ee', photos: [px(806626), px(11735074)], stock: { S: 4, M: 8, L: 7, XL: 3, XXL: 1 } },
      { name: 'مشکی', hex: '#141414', photos: [px(8791990), px(8225750)], stock: { S: 3, M: 6, L: 5, XL: 3, XXL: 1 } },
      { name: 'آبی روشن', hex: '#8fb4d6', photos: [px(9225880)], stock: { S: 2, M: 3, L: 2, XL: 0, XXL: 0 } },
    ],
    tags: ['ورزشی', 'اسلیم', 'تابستانی', 'خنک', 'تمرین'],
    bio: 'سبک‌ترین تیشرت مجموعه با پارچهٔ ۱۶۰ گرمی و بافت باز که عرق را نگه نمی‌دارد. برش اسلیم است و به بدن می‌خورد؛ برای تن‌خور آزاد سراغ مدل اورسایز بروید.',
  },
  {
    id: 'p7', slug: 'yellow-summer', name: 'تیشرت زرد تابستانی',
    subtitle: 'رنگ ثابت، بدون رنگ‌پس‌دادن',
    category: 'basic', price: 430000,
    fit: 'رگولار', gsm: 190, fabric: 'نخ پنبه رنگ‌ثابت',
    model: 'قد مدل ۱۷۰ سانت، سایز M پوشیده',
    care: 'بار اول جدا بشویید',
    rating: 4.5, sales: 143, days: 6, new: true,
    colors: [
      { name: 'زرد', hex: '#e8c33f', photos: [px(9007809), px(3760852)], stock: { S: 5, M: 6, L: 4, XL: 2, XXL: 0 } },
    ],
    tags: ['رنگی', 'تابستانی', 'جدید', 'زرد', 'روشن'],
    bio: 'زرد پررنگی که در آفتاب نمی‌پرد. رنگرزی راکتیو شده، پس بعد از ده بار شست‌وشو هم همان رنگ می‌ماند. بار اول جدا بشویید.',
  },
  {
    id: 'p8', slug: 'red-statement', name: 'تیشرت قرمز',
    subtitle: 'یک رنگ، بدون طرح',
    category: 'basic', price: 445000,
    fit: 'رگولار', gsm: 190, fabric: 'نخ پنبه رنگ‌ثابت',
    model: 'قد مدل ۱۶۵ سانت، سایز S پوشیده',
    care: 'بار اول جدا بشویید',
    rating: 4.6, sales: 168, days: 6, new: false,
    colors: [
      { name: 'قرمز', hex: '#c0392f', photos: [px(8089961), px(8146450)], stock: { S: 4, M: 5, L: 3, XL: 1, XXL: 0 } },
    ],
    tags: ['رنگی', 'قرمز', 'روزمره', 'جسورانه'],
    bio: 'قرمز خالص بدون هیچ چاپ و لوگویی. با شلوار جین تیره و کفش سفید بهترین ترکیب را می‌دهد. همان پارچهٔ ۱۹۰ گرمی مدل زرد.',
  },
  {
    id: 'p9', slug: 'cafe-merch', name: 'تیشرت مرچ کافه',
    subtitle: 'سفارش گروهی و لوگوی شما',
    category: 'graphic', price: 520000,
    fit: 'رگولار', gsm: 200, fabric: 'نخ پنبه، چاپ تک‌رنگ',
    model: 'قد مدل ۱۷۶ سانت، سایز M پوشیده',
    care: 'پشت‌ورو بشویید',
    rating: 4.7, sales: 96, days: 10, new: false,
    colors: [
      { name: 'سفید', hex: '#f4f2ee', photos: [px(32963962), px(32963961)], stock: { S: 0, M: 0, L: 0, XL: 0, XXL: 0 } },
    ],
    tags: ['مرچ', 'سفارشی', 'گروهی', 'لوگو', 'کسب‌وکار', 'چاپ'],
    bio: 'برای کافه، تیم و رویداد: لوگوی خودتان روی تیشرت پایه چاپ می‌شود. حداقل سفارش ده عدد و آماده‌سازی حدود ده روز کاری. فعلاً موجودی آماده ندارد و فقط سفارشی گرفته می‌شود.',
  },
  {
    id: 'p10', slug: 'kids-graphic', name: 'تیشرت بچگانه طرح‌دار',
    subtitle: 'نخ نرم، چاپ بی‌خطر',
    category: 'kids', price: 285000,
    fit: 'رگولار بچگانه', gsm: 170, fabric: 'نخ پنبه نرم، بدون فرمالدئید',
    model: 'اندازه‌ها بر اساس قد کودک',
    care: 'ماشین لباسشویی، برنامهٔ ظریف',
    rating: 4.8, sales: 208, days: 5, new: false,
    colors: [
      { name: 'سفید', hex: '#f4f2ee', photos: [px(38402003)], stock: { S: 9, M: 7, L: 5, XL: 0, XXL: 0 } },
      { name: 'سبز', hex: '#5f7f5c', photos: [px(18739741)], stock: { S: 6, M: 6, L: 4, XL: 0, XXL: 0 } },
    ],
    sizeLabels: { S: '۴-۵ سال', M: '۶-۷ سال', L: '۸-۹ سال' },
    tags: ['بچگانه', 'کودک', 'هدیه', 'نرم', 'طرح‌دار'],
    bio: 'نخ نرم‌تر از مدل بزرگسال و چاپ آب‌پایه بدون فرمالدئید. سایزها بر اساس سن نوشته شده‌اند، نه S و M. برای پوست حساس کودک آزمایش شده.',
  },
  {
    id: 'p11', slug: 'couple-set', name: 'ست دونفره',
    subtitle: 'دو تیشرت هم‌رنگ، دو سایز جدا',
    category: 'pack', price: 880000, oldPrice: 980000,
    fit: 'رگولار', gsm: 190, fabric: 'نخ پنبه',
    model: 'قد مدل‌ها ۱۸۰ و ۱۶۷ سانت',
    care: 'شست‌وشو با آب سرد',
    rating: 4.6, sales: 118, days: 6, new: true,
    colors: [
      { name: 'سفید', hex: '#f4f2ee', photos: [px(8217431), px(6256271)], stock: { S: 4, M: 6, L: 5, XL: 3, XXL: 1 } },
    ],
    tags: ['ست', 'دونفره', 'هدیه', 'جدید', 'سالگرد'],
    bio: 'دو تیشرت هم‌رنگ که سایزهایشان را جدا انتخاب می‌کنید — در توضیح سفارش سایز نفر دوم را بنویسید. انتخاب رایج برای سالگرد و هدیهٔ زوجی.',
  },
  {
    id: 'p12', slug: 'color-three-pack', name: 'پک سه‌تایی رنگی',
    subtitle: 'سه رنگ به انتخاب شما',
    category: 'pack', price: 1180000, oldPrice: 1350000,
    fit: 'رگولار', gsm: 190, fabric: 'نخ پنبه رنگ‌ثابت',
    model: 'قد مدل ۱۷۸ سانت، سایز M پوشیده',
    care: 'رنگ‌ها را بار اول جدا بشویید',
    rating: 4.7, sales: 87, days: 6, new: false,
    colors: [
      { name: 'ترکیب رنگی', hex: '#7a8fb8', photos: [px(18265937), px(5995816), px(4646580)], stock: { S: 3, M: 5, L: 5, XL: 2, XXL: 1 } },
    ],
    tags: ['پک', 'رنگی', 'صرفه‌جویی', 'سه‌تایی'],
    bio: 'سه تیشرت پایه با حدود ۱۷۰ هزار تومان تخفیف نسبت به خرید تکی. رنگ‌ها را هنگام ثبت سفارش در توضیحات بنویسید؛ اگر ننویسید مشکی، سفید و خاکستری ارسال می‌شود.',
  },
];

/* Derived fields the storefront, the retrieval index, and the panel all read. */
export const products = raw.map((p) => {
  const sizes = p.sizeLabels ? Object.keys(p.sizeLabels) : SIZES;
  const stock = p.colors.reduce(
    (sum, c) => sum + Object.values(c.stock).reduce((a, b) => a + b, 0),
    0
  );
  return {
    ...p,
    sizes,
    stock,
    photos: p.colors[0].photos,
    tone: p.colors[0].hex,
    stockOf: (colorName, size) =>
      p.colors.find((c) => c.name === colorName)?.stock[size] ?? 0,
  };
});

export const faqs = [
  { q: 'سایزم را چطور انتخاب کنم؟', a: 'در صفحهٔ هر محصول جدول اندازه هست و قد و سایز مدل هم نوشته شده. اگر بین دو سایز مانده‌اید: برای مدل اورسایز سایز کوچک‌تر و برای مدل اسلیم سایز بزرگ‌تر را بگیرید. ابزار «سایزم را پیدا کن» هم با قد و وزن پیشنهاد می‌دهد.' },
  { q: 'تعویض سایز دارید؟', a: 'بله. تا هفت روز، اگر تیشرت پوشیده و شسته نشده و برچسبش سر جایش باشد، سایزش را رایگان عوض می‌کنیم. هزینهٔ پست رفت‌وبرگشت تعویض سایز با ماست.' },
  { q: 'ارسال چقدر طول می‌کشد؟', a: 'تهران یک تا دو روز کاری، شهرستان دو تا چهار روز کاری. سفارش‌های چاپ سفارشی بعد از تأیید طرح حدود ده روز کاری آماده می‌شوند.' },
  { q: 'رنگ‌ها بعد از شست‌وشو می‌روند؟', a: 'رنگرزی راکتیو است و رنگ‌پس‌دادن ندارد. با این حال بار اول تیشرت‌های پررنگ را جدا بشویید و همیشه با آب سرد و پشت‌ورو بشویید تا چاپ و رنگ سالم بماند.' },
  { q: 'آب می‌رود؟', a: 'پارچه پیش‌شست شده، پس آب‌رفتگی زیر سه درصد است. با خشک‌کن یا آب داغ همین سه درصد هم بیشتر می‌شود؛ توی سایه پهن کنید.' },
  { q: 'چاپ سفارشی با لوگوی خودم می‌گیرید؟', a: 'بله، از ده عدد به بالا. فایل طرح را بفرستید تا قیمت و زمان را بگوییم. چاپ سیلک آب‌پایه است و روی پارچه سفت نمی‌شود.' },
  { q: 'پرداخت چطور است؟', a: 'پرداخت آنلاین با کارت‌های شتاب. پرداخت در محل فقط برای تهران و با هزینهٔ اضافه فعال است.' },
];

/* ── Admin demo data ─────────────────────────────────── */
export const revenueSeries = [
  { day: '۲ مرداد', revenue: 18400000, orders: 41 },
  { day: '۹ مرداد', revenue: 22100000, orders: 49 },
  { day: '۱۶ مرداد', revenue: 19800000, orders: 44 },
  { day: '۲۳ مرداد', revenue: 27500000, orders: 61 },
  { day: '۳۰ مرداد', revenue: 25900000, orders: 57 },
  { day: '۶ شهریور', revenue: 33200000, orders: 74 },
  { day: '۱۳ شهریور', revenue: 38600000, orders: 86 },
];

export const orders = [
  { id: '۱۴۰۵-۱۰۴۲', customer: 'امیر رستمی', city: 'تهران', items: 3, total: 1425000, status: 'sent', date: '۱۳ شهریور' },
  { id: '۱۴۰۵-۱۰۴۱', customer: 'نگار شریفی', city: 'کرج', items: 1, total: 585000, status: 'paid', date: '۱۳ شهریور' },
  { id: '۱۴۰۵-۱۰۴۰', customer: 'محمد کاویانی', city: 'مشهد', items: 2, total: 1105000, status: 'wait', date: '۱۲ شهریور' },
  { id: '۱۴۰۵-۱۰۳۹', customer: 'سارا ملکی', city: 'شیراز', items: 4, total: 1780000, status: 'paid', date: '۱۲ شهریور' },
  { id: '۱۴۰۵-۱۰۳۸', customer: 'رضا حیدری', city: 'اصفهان', items: 1, total: 650000, status: 'sent', date: '۱۱ شهریور' },
  { id: '۱۴۰۵-۱۰۳۷', customer: 'الهام نوروزی', city: 'تبریز', items: 2, total: 880000, status: 'sent', date: '۱۱ شهریور' },
];

/* Which size sells and which size comes back — the number that decides the next
   production run. */
export const sizeCurve = [
  { size: 'S', sold: 118, returned: 9 },
  { size: 'M', sold: 264, returned: 14 },
  { size: 'L', sold: 231, returned: 21 },
  { size: 'XL', sold: 96, returned: 12 },
  { size: 'XXL', sold: 34, returned: 3 },
];

export const botGaps = [
  { q: 'تیشرت آستین بلند دارید؟', count: 47, has: false },
  { q: 'سایز XXXL', count: 31, has: false },
  { q: 'تیشرت یقه هفت', count: 26, has: false },
  { q: 'رنگ سرمه‌ای', count: 22, has: false },
  { q: 'ارسال به خارج از ایران', count: 12, has: false },
];
