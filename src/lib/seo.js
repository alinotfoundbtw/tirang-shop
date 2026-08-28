import { useEffect } from 'react';

const SITE = 'تیرنگ';
const ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';

const meta = (selector, attr, value) => {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    const [, key, val] = selector.match(/\[(\w+)="([^"]+)"\]/) || [];
    if (key) el.setAttribute(key, val);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

/**
 * Per-route SEO. Client-side rendering means crawlers see this after hydration —
 * fine for Google, not for every social scraper. For a client that needs
 * guaranteed crawlability, move this project to Next.js and port the hook to
 * generateMetadata(); the component tree stays identical.
 */
export function useSeo({ title, description, image, path, jsonLd, noindex }) {
  useEffect(() => {
    const full = title ? `${title} | ${SITE}` : SITE;
    document.title = full;

    if (description) meta('meta[name="description"]', 'content', description);
    meta('meta[property="og:title"]', 'content', full);
    if (description) meta('meta[property="og:description"]', 'content', description);
    meta('meta[property="og:url"]', 'content', ORIGIN + (path || window.location.pathname));
    if (image) meta('meta[property="og:image"]', 'content', image);
    meta('meta[name="robots"]', 'content', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = ORIGIN + (path || window.location.pathname);

    let script = document.getElementById('route-jsonld');
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'route-jsonld';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, image, path, noindex, JSON.stringify(jsonLd)]);
}

/* `rating` is the summary computed from the review entries actually rendered
   on the page. It used to be { p.rating, reviewCount: p.sales } — sales are not
   reviews, and structured data that claims a rating the page does not show is a
   claim made to search engines and nobody else. Omitted entirely when there are
   no reviews to back it. */
export const productLd = (p, url, rating) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: p.name,
  description: p.bio,
  sku: p.id,
  image: p.colors?.[0]?.photos ?? [],
  color: p.colors?.map((c) => c.name).join('، '),
  size: p.sizes?.join('، '),
  brand: { '@type': 'Brand', name: SITE },
  ...(rating?.count
    ? {
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: Number(rating.average.toFixed(1)),
          reviewCount: rating.count,
        },
      }
    : {}),
  offers: {
    '@type': 'Offer',
    price: p.price,
    priceCurrency: 'IRR',
    availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
    itemCondition: 'https://schema.org/NewCondition',
    url,
  },
});

export const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((it, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: it.name,
    item: ORIGIN + it.path,
  })),
});

export const faqLd = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});
