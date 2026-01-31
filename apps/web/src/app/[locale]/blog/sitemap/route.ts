/**
 * Blog Sitemap Route
 *
 * Generates XML sitemap for blog posts.
 */

import { NextResponse } from 'next/server';
import { postsAPI } from '@/lib/api/posts';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Fetch all published posts
    const posts = await postsAPI.list({
      limit: 1000, // Sitemap limit
      status: 'published',
    });

    // Generate URL entries
    const blogUrl = `  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;

    const postUrls = posts
      .map((post) => {
        const lastmod = post.updated_at || post.published_at || post.created_at;
        return `  <url>
    <loc>${baseUrl}/blog/${post.slug}</loc>
    <lastmod>${new Date(lastmod).toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blogUrl}
${postUrls}
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    // Fallback to basic sitemap on error
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/blog</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>`;

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }
}
