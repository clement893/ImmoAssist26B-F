/**
 * Schema Markup Utilities
 * Generate JSON-LD structured data for SEO
 */

export interface OrganizationSchema {
  name: string;
  url: string;
  logo?: string;
  description?: string;
  contactPoint?: {
    telephone?: string;
    contactType?: string;
    email?: string;
  };
  sameAs?: string[]; // Social media profiles
}

export interface WebSiteSchema {
  name: string;
  url: string;
  description?: string;
  potentialAction?: {
    '@type': string;
    target: {
      '@type': string;
      urlTemplate: string;
    };
  };
}

export interface BreadcrumbSchema {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export interface ArticleSchema {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
  };
  publisher: {
    name: string;
    logo?: string;
  };
}

/**
 * Generate Organization schema markup
 */
export function generateOrganizationSchema(data: OrganizationSchema): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: data.name,
    url: data.url,
    ...(data.logo && { logo: data.logo }),
    ...(data.description && { description: data.description }),
    ...(data.contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        ...(data.contactPoint.telephone && { telephone: data.contactPoint.telephone }),
        ...(data.contactPoint.contactType && { contactType: data.contactPoint.contactType }),
        ...(data.contactPoint.email && { email: data.contactPoint.email }),
      },
    }),
    ...(data.sameAs && data.sameAs.length > 0 && { sameAs: data.sameAs }),
  };
}

/**
 * Generate WebSite schema markup
 */
export function generateWebSiteSchema(data: WebSiteSchema): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: data.name,
    url: data.url,
    ...(data.description && { description: data.description }),
    ...(data.potentialAction && {
      potentialAction: {
        '@type': data.potentialAction['@type'],
        target: {
          '@type': data.potentialAction.target['@type'],
          urlTemplate: data.potentialAction.target.urlTemplate,
        },
      },
    }),
  };
}

/**
 * Generate BreadcrumbList schema markup
 */
export function generateBreadcrumbSchema(data: BreadcrumbSchema): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: data.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate Article schema markup
 */
export function generateArticleSchema(data: ArticleSchema): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: data.headline,
    description: data.description,
    ...(data.image && { image: data.image }),
    datePublished: data.datePublished,
    ...(data.dateModified && { dateModified: data.dateModified }),
    author: {
      '@type': 'Person',
      name: data.author.name,
      ...(data.author.url && { url: data.author.url }),
    },
    publisher: {
      '@type': 'Organization',
      name: data.publisher.name,
      ...(data.publisher.logo && { logo: data.publisher.logo }),
    },
  };
}

/**
 * Generate SoftwareApplication schema (for SaaS apps)
 */
export function generateSoftwareApplicationSchema(data: {
  name: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    price: string;
    priceCurrency: string;
  };
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
  };
}): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: data.name,
    applicationCategory: data.applicationCategory,
    operatingSystem: data.operatingSystem,
    offers: {
      '@type': 'Offer',
      price: data.offers.price,
      priceCurrency: data.offers.priceCurrency,
    },
    ...(data.aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: data.aggregateRating.ratingValue,
        ratingCount: data.aggregateRating.ratingCount,
      },
    }),
  };
}
