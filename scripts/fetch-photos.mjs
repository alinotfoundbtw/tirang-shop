/**
 * Vendors the catalog's photos into public/photos/.
 *
 * The shop is served to Iran, where images.pexels.com is unreachable without a
 * VPN while github.io is not — so hotlinking meant a storefront of grey
 * "تصویر بارگذاری نشد" boxes for the actual customers. These are the same
 * files, served from the same origin as the site.
 *
 * Run it whenever the catalog gains a photo. From a blocked network it will
 * fail on every URL; the deploy workflow runs it on a GitHub runner instead.
 */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';

const SRC = new URL('../src/data/products.js', import.meta.url);
const OUT = new URL('../public/photos/', import.meta.url);

// Matches the px() helper in the catalog: px(123) or px(123, 'png').
const CALL = /px\((\d+)(?:\s*,\s*'([a-z]+)')?\)/g;

const remote = (id, ext) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.${ext}?auto=compress&cs=tinysrgb&w=900`;

/** Trust the bytes, not the requested extension — auto=compress re-encodes. */
function sniff(buf) {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  if (buf.subarray(0, 4).toString() === 'RIFF' && buf.subarray(8, 12).toString() === 'WEBP') return 'webp';
  return null;
}

const source = await readFile(SRC, 'utf8');
const wanted = new Map();
for (const [, id, ext] of source.matchAll(CALL)) if (!wanted.has(id)) wanted.set(id, ext || 'jpeg');

await mkdir(OUT, { recursive: true });
const already = new Set(await readdir(OUT).catch(() => []));

const failed = [];
let fetched = 0;
let bytes = 0;

for (const [id, ext] of wanted) {
  if ([...already].some((f) => f.startsWith(`${id}.`))) continue;
  try {
    const res = await fetch(remote(id, ext), { headers: { 'user-agent': 'tirang-shop/vendor-photos' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const kind = sniff(buf);
    if (!kind) throw new Error(`unrecognised image data (${res.headers.get('content-type')})`);
    await writeFile(new URL(`${id}.${kind}`, OUT), buf);
    fetched += 1;
    bytes += buf.length;
  } catch (err) {
    failed.push(`${id}: ${err.message}`);
  }
}

const present = await readdir(OUT);
console.log(`catalog needs ${wanted.size} photos`);
console.log(`fetched ${fetched} this run (${(bytes / 1048576).toFixed(2)} MB), ${present.length} on disk`);

const kinds = present.reduce((acc, f) => {
  const k = f.split('.').pop();
  acc[k] = (acc[k] || 0) + 1;
  return acc;
}, {});
console.log('extensions:', JSON.stringify(kinds));

if (failed.length) {
  console.error(`\n${failed.length} failed:`);
  for (const f of failed) console.error('  ' + f);
  process.exit(1);
}
