/* The shop's sizing rules, in one place.
   Kept out of store.jsx so that retrieval — which has no business importing
   React — can reach the same table the «سایزم را پیدا کن» widget uses. Two
   copies of this would drift, and the drift would only show up as returns. */

export const SIZE_SCALE = ['S', 'M', 'L', 'XL', 'XXL'];

/** Height alone, when that is all the shopper offered. */
export function sizeFromHeight(height) {
  if (!height) return null;
  if (height < 168) return 'S';
  if (height < 176) return 'M';
  if (height < 184) return 'L';
  if (height < 190) return 'XL';
  return 'XXL';
}

/** Height + build → the size most people that shape end up keeping.
 *  Deliberately advisory: it names a size and says why, then gets out of the way. */
export function suggestSize({ height, weight, fit }) {
  if (!height || !weight) return null;
  const bmi = weight / (height / 100) ** 2;
  let idx = 1;
  if (height < 165) idx = 0;
  else if (height < 175) idx = 1;
  else if (height < 183) idx = 2;
  else idx = 3;
  if (bmi > 27) idx += 1;
  if (bmi < 19) idx -= 1;
  if (fit === 'اسلیم') idx += 1;
  if (String(fit).includes('اورسایز')) idx -= 1;
  idx = Math.max(0, Math.min(SIZE_SCALE.length - 1, idx));
  const note = String(fit).includes('اورسایز')
    ? 'این مدل اورسایز است، برای همین یک سایز پایین‌تر پیشنهاد شد.'
    : fit === 'اسلیم'
      ? 'این مدل اسلیم است و به بدن می‌خورد، برای همین یک سایز بالاتر پیشنهاد شد.'
      : 'برای تن‌خور آزادتر یک سایز بالاتر بگیرید.';
  return { size: SIZE_SCALE[idx], note };
}
