/**
 * Turns a picked file into something small enough to keep.
 *
 * Phone cameras hand over 3–8 MB JPEGs. localStorage gives the whole origin
 * about 5 MB, so storing what was picked would fill the shop with two
 * products. Everything is re-drawn through a canvas at a bounded size before
 * it is stored, which brings a photo to roughly 40–90 KB.
 *
 * Resolves to a data URL because that is what survives a reload without any
 * server: an object URL dies with the page, and a File cannot be serialised.
 */

export const MAX_EDGE = 900;   // the widest the shop ever displays a photo
export const QUALITY = 0.72;   // past this, the file grows faster than it looks better

export function shrinkImage(file, { maxEdge = MAX_EDGE, quality = QUALITY } = {}) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('این فایل عکس نیست.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      // A white ground, so a transparent PNG does not become a black rectangle
      // once it is flattened into JPEG.
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ dataUrl: canvas.toDataURL('image/jpeg', quality), width: w, height: h });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('عکس باز نشد. فایل دیگری را امتحان کنید.'));
    };
    img.src = url;
  });
}

/** Roughly how much of the origin's storage is already spoken for. */
export function storageUsed() {
  let bytes = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      bytes += (k.length + (localStorage.getItem(k)?.length ?? 0)) * 2; // UTF-16
    }
  } catch { return null; }
  return bytes;
}

export const asMB = (bytes) => (bytes / 1048576).toFixed(1);
