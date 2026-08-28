/**
 * Finds candidate catalog photos and saves small previews to .candidates/.
 *
 * Needs a Pexels API key in PEXELS_API_KEY (free, from pexels.com/api). The
 * key is required rather than optional: scraping the public search pages
 * returns 403 to every datacenter IP, so a GitHub runner cannot do it either —
 * and the workstation cannot reach pexels.com at all, which is the whole
 * reason scripts/fetch-photos.mjs exists.
 *
 *   PEXELS_API_KEY=... node scripts/find-photos.mjs "oversize t-shirt" "kids tee"
 *
 * Writes nothing to the catalog. Look at the previews first, then add the ids
 * you want to src/data/products.js and run the vendor workflow.
 */
import { mkdir, writeFile } from 'node:fs/promises';

const OUT = new URL('../.candidates/', import.meta.url);
const KEY = process.env.PEXELS_API_KEY;
const queries = process.argv.slice(2);

if (!KEY) {
  console.error('PEXELS_API_KEY is not set — get a free key at https://www.pexels.com/api/');
  process.exit(1);
}
if (!queries.length) {
  console.error('give at least one search term');
  process.exit(1);
}

const PER_QUERY = 12;
const seen = new Set();
const found = [];

for (const q of queries) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=${PER_QUERY}&orientation=portrait`;
  try {
    const res = await fetch(url, { headers: { Authorization: KEY } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    let kept = 0;
    for (const photo of data.photos ?? []) {
      const id = String(photo.id);
      if (seen.has(id)) continue;
      seen.add(id);
      found.push({ id, q, preview: photo.src?.medium, credit: photo.photographer });
      kept += 1;
    }
    console.log(`"${q}" → ${kept} candidates`);
  } catch (err) {
    console.error(`search "${q}" failed: ${err.message}`);
  }
}

await mkdir(OUT, { recursive: true });
let saved = 0;
for (const { id, preview } of found) {
  if (!preview) continue;
  try {
    const res = await fetch(preview);
    if (!res.ok) continue;
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(new URL(`${id}.jpg`, OUT), buf);
    saved += 1;
  } catch { /* one dead preview is not worth stopping for */ }
}

console.log(`\nsaved ${saved} previews to .candidates/`);
console.log('ids:', found.map((f) => f.id).join(' '));
