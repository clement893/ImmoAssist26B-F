/**
 * Blog RSS Feed Route
 *
 * Generates RSS feed for blog posts.
 */

import { NextResponse } from 'next/server';
import { postsAPI } from '@/lib/api/posts';

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const siteName = process.env.NEXT_PUBLIC_APP_NAME || 'Blog';
    const siteDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Latest blog posts';

    // Fetch published posts
    const posts = await postsAPI.list({
      limit: 50,
      status: 'published',
    });

    // Generate RSS items
    const items = posts
      .map((post) => {
        const postUrl = `${baseUrl}/blog/${post.slug}`;
        const pubDate = post.published_at
          ? new Date(post.published_at).toUTCString()
          : new Date(post.created_at).toUTCString();

        return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description><![CDATA[${post.excerpt || ''}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${post.author_name ? `<author>${post.author_name}</author>` : ''}
      ${post.category_name ? `<category>${post.category_name}</category>` : ''}
    </item>`;
      })
      .join('\n');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${baseUrl}/blog</link>
    <description>${siteDescription}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/rss" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    // Fallback to empty RSS feed on error
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const siteName = process.env.NEXT_PUBLIC_APP_NAME || 'Blog';
    const siteDescription = process.env.NEXT_PUBLIC_APP_DESCRIPTION || 'Latest blog posts';

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${baseUrl}/blog</link>
    <description>${siteDescription}</description>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/blog/rss" rel="self" type="application/rss+xml"/>
  </channel>
</rss>`;

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  }
}
