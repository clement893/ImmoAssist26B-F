import { NextResponse } from 'next/server';
import { BASE_URL, getAllPages } from '@/config/sitemap';

export async function GET() {
  // Get all pages (excluding auth-required pages for public sitemap)
  const publicPages = getAllPages().filter((page) => !page.requiresAuth);

  // Add sitemap page itself
  const pages = [
    ...publicPages.map((page) => ({
      path: page.path,
      priority: page.priority || 0.5,
      changefreq: page.changefreq || 'monthly',
    })),
    { path: '/sitemap', priority: 0.5, changefreq: 'monthly' },
  ];

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${pages
  .map(
    (page) => `  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
