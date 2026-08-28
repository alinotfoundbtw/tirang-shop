/**
 * Finds candidate catalog photos on Pexels and saves small previews.
 *
 * Runs on a GitHub runner, because Pexels is unreachable from Iran — the same
 * reason scripts/fetch-photos.mjs exists. The previews come back as an artifact
 * so a human (or a model that can see images) can judge them before any ID goes
 * into the catalog. Nothing here writes to the catalog.
 *
 *   node scripts/find-photos.mjs "t-shirt" "plain tee" ...
 */
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = new URL('../.candidates/', import.meta.url);
const queries = process.argv.slice(2);
if (!queries.length) {
  console.error('give at least one search term');
  process.exit(1);
}

const UA = { 'user-agent': 'Mozilla/5.0 (compatible; tirang-shop/photo-scout)' };
const seen = new Set();
const found = [];

for (const q of queries) {
  const url = `https://www.pexels.com/search/${encodeURIComponent(q)}/`;
  let html;
  try {
    const res = await fetch(url, { headers: UA });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    console.error(`search "${q}" failed: ${err.message}`);
    continue;
  }
  // Both the srcset URLs and the anchor hrefs carry the numeric id.
  const ids = new Set([...html.matchAll(/\/photos\/(\d{4,9})\//g)].map((m) => m[1]));
  let kept = 0;
  for (const id of ids) {
    if (seen.has(id) || kept >= 14) continue;
    seen.add(id);
    found.push({ id, q });
    kept += 1;
  }
  console.log(`"${q}" → ${kept} candidates`);
}

await mkdir(OUT, { recursive: true });
let saved = 0;
for (const { id, q } of found) {
  const src = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fm=jpg&w=360`;
  try {
    const res = await fetch(src, { headers: UA });
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf[0] !== 0xff || buf[1] !== 0xd8) continue; // not a JPEG
    await writeFile(new URL(`${id}.jpg`, OUT), buf);
    saved += 1;
  } catch { /* a dead id is not worth stopping for */ }
}

console.log(`\nsaved ${saved} previews to .candidates/`);
console.log('ids:', found.map((f) => f.id).join(' '));
