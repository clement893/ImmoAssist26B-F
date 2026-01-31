# SEO and Marketing Features Guide

This guide covers all SEO enhancements and marketing tools added to the template.

## Table of Contents

1. [SEO Features](#seo-features)
2. [Marketing Tools](#marketing-tools)
3. [Configuration](#configuration)
4. [Usage Examples](#usage-examples)

## SEO Features

### 1. Enhanced Sitemap Generation

**Location:** `apps/web/src/app/sitemap.xml/route.ts`

- Automatically generates XML sitemap from page configuration
- Filters out auth-required pages for public sitemap
- Includes proper XML namespaces for news, images, videos
- Cached for performance (1 hour cache, 24h stale-while-revalidate)

**Access:** `/sitemap.xml`

### 2. Robots.txt

**Location:** `apps/web/src/app/robots.txt/route.ts`

- Automatically generated robots.txt
- Blocks admin, dashboard, API routes
- Points to sitemap location

**Access:** `/robots.txt`

### 3. Schema Markup (JSON-LD)

**Location:** `apps/web/src/lib/seo/schemaMarkup.ts`

Supports multiple schema types:

- **Organization** - Company/brand information
- **WebSite** - Website metadata with search action
- **BreadcrumbList** - Navigation breadcrumbs
- **Article** - Blog posts and articles
- **SoftwareApplication** - SaaS app information

**Usage:**

```typescript
import { generateOrganizationSchema } from "@/lib/seo/schemaMarkup";

const schema = generateOrganizationSchema({
  name: "My Company",
  url: "https://example.com",
  logo: "https://example.com/logo.png",
  description: "Company description",
});
```

**Component:** `<SchemaMarkup>` automatically injects schema into page head.

### 4. Open Graph Tags

**Location:** `apps/web/src/lib/seo/openGraph.ts`

- Automatically generates Open Graph metadata
- Twitter Card support
- Image optimization
- Article metadata support

**Usage:**

```typescript
import { generateOpenGraphMetadata } from "@/lib/seo/openGraph";

export const metadata = generateOpenGraphMetadata({
  title: "Page Title",
  description: "Page description",
  url: "/page-path",
  images: [{ url: "/og-image.png", width: 1200, height: 630 }],
});
```

## Marketing Tools

### 1. Newsletter Signup

**Backend:** `backend/app/services/newsletter_service.py`  
**API:** `backend/app/api/v1/endpoints/newsletter.py`  
**Frontend:** `apps/web/src/components/marketing/NewsletterSignup.tsx`

**Features:**

- SendGrid Marketing Contacts integration
- Subscribe/unsubscribe endpoints
- Custom fields support
- Source tracking

**Usage:**

```tsx
import { NewsletterSignup } from "@/components/marketing";

<NewsletterSignup
  placeholder="Enter your email"
  buttonText="Subscribe"
  showNameFields={true}
  source="homepage"
  onSuccess={() => console.log("Subscribed!")}
/>;
```

**API Endpoints:**

- `POST /api/v1/newsletter/subscribe` - Subscribe to newsletter
- `POST /api/v1/newsletter/unsubscribe` - Unsubscribe
- `GET /api/v1/newsletter/status/{email}` - Check subscription status

### 2. Lead Capture Forms

**Frontend:** `apps/web/src/components/marketing/LeadCaptureForm.tsx`

**Features:**

- Customizable fields (name, email, phone, company, message)
- Automatic submission to SendGrid
- Source tracking
- Success/error handling

**Usage:**

```tsx
import { LeadCaptureForm } from "@/components/marketing";

<LeadCaptureForm
  title="Get Started"
  description="Fill out the form below"
  fields={["name", "email", "phone", "message"]}
  source="landing_page"
  onSubmit={(data) => console.log("Lead captured:", data)}
/>;
```

### 3. A/B Testing

**Location:** `apps/web/src/lib/marketing/abTesting.ts`

**Features:**

- Client-side variant assignment
- Persistent variant storage (localStorage)
- Conversion tracking
- Results analysis

**Usage:**

```typescript
import {
  getABTestVariant,
  trackABTestConversion,
} from "@/lib/marketing/abTesting";

// Get variant
const variant = getABTestVariant("homepage_cta", [
  { id: "control", name: "Control", weight: 50 },
  { id: "variant_a", name: "Variant A", weight: 50 },
]);

// Track conversion
trackABTestConversion("homepage_cta", variant, "button_click");
```

### 4. Google Analytics Integration

**Location:** `apps/web/src/lib/marketing/analytics.ts`  
**Component:** `apps/web/src/components/marketing/GoogleAnalytics.tsx`

**Features:**

- Automatic page view tracking
- Custom event tracking
- Conversion tracking
- Newsletter/lead tracking helpers

**Usage:**

```typescript
import { trackEvent, trackNewsletterSignup } from "@/lib/marketing/analytics";

// Track custom event
trackEvent("button_click", {
  button_name: "signup",
  location: "header",
});

// Track newsletter signup
trackNewsletterSignup("homepage");
```

**Component:** `<GoogleAnalytics>` automatically initializes and tracks page views.

## Configuration

### Environment Variables

**Frontend (.env.local):**

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_APP_NAME=Your App Name
NEXT_PUBLIC_APP_DESCRIPTION=Your app description
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**Backend (.env):**

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Your App Name
SENDGRID_NEWSLETTER_LIST_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### SendGrid Setup

1. Create a SendGrid account
2. Generate an API key with "Full Access" or "Marketing" permissions
3. Create a Marketing Contacts list
4. Get the list ID from SendGrid dashboard
5. Add verified sender email

## Usage Examples

### Complete Landing Page with SEO and Marketing

```tsx
import { Metadata } from "next";
import { generateOpenGraphMetadata } from "@/lib/seo/openGraph";
import { SchemaMarkup } from "@/components/seo";
import { NewsletterSignup, LeadCaptureForm } from "@/components/marketing";

export const metadata: Metadata = generateOpenGraphMetadata({
  title: "Welcome to Our SaaS",
  description: "The best SaaS solution for your business",
  url: "/",
  images: [{ url: "/og-image.png", width: 1200, height: 630 }],
});

export default function LandingPage() {
  return (
    <>
      <SchemaMarkup
        type="organization"
        data={{
          name: "My SaaS",
          url: "https://example.com",
          description: "SaaS description",
        }}
      />

      <div>
        <h1>Welcome</h1>

        <NewsletterSignup source="landing_page" showNameFields={true} />

        <LeadCaptureForm
          title="Request Demo"
          fields={["name", "email", "company", "message"]}
          source="demo_request"
        />
      </div>
    </>
  );
}
```

### A/B Testing Example

```tsx
"use client";

import { useEffect, useState } from "react";
import {
  getABTestVariant,
  trackABTestConversion,
} from "@/lib/marketing/abTesting";

export function CTAButton() {
  const [variant, setVariant] = useState<string>("control");

  useEffect(() => {
    const testVariant = getABTestVariant("cta_button", [
      { id: "control", name: "Control", weight: 50 },
      { id: "red", name: "Red Button", weight: 50 },
    ]);
    setVariant(testVariant);
  }, []);

  const handleClick = () => {
    trackABTestConversion("cta_button", variant, "click");
    // Handle click...
  };

  return (
    <button
      onClick={handleClick}
      className={variant === "red" ? "bg-red-500" : "bg-blue-500"}
    >
      Sign Up
    </button>
  );
}
```

## Best Practices

1. **SEO:**
   - Always include Open Graph images (1200x630px recommended)
   - Use descriptive titles and descriptions
   - Add schema markup for important pages
   - Keep sitemap updated

2. **Newsletter:**
   - Always include source tracking
   - Handle errors gracefully
   - Show success/error messages
   - Respect user privacy (GDPR compliance)

3. **A/B Testing:**
   - Test one variable at a time
   - Run tests for sufficient sample size
   - Document test results
   - Clean up old tests

4. **Analytics:**
   - Track meaningful events
   - Use consistent naming conventions
   - Respect user privacy
   - Review analytics regularly

## Troubleshooting

### Newsletter not working

- Check SendGrid API key is set
- Verify list ID is correct
- Check SendGrid dashboard for errors
- Ensure sender email is verified

### Analytics not tracking

- Verify GA measurement ID is set
- Check browser console for errors
- Ensure ad blockers aren't blocking
- Verify gtag is loaded

### Schema markup not appearing

- Check browser dev tools > Elements
- Look for `<script type="application/ld+json">`
- Verify schema is valid JSON
- Test with Google Rich Results Test
