# 🎨 Template Customization Guide

Complete guide for customizing this template for your project.

---

## 📋 Quick Customization Checklist

- [ ] Update project name and branding
- [ ] Configure environment variables
- [ ] Customize theme colors and fonts
- [ ] Replace placeholder content
- [ ] Update metadata and SEO
- [ ] Configure authentication providers
- [ ] Set up payment processing (Stripe)
- [ ] Customize email templates
- [ ] Update legal pages (Privacy, Terms)
- [ ] Configure analytics and monitoring

---

## 🎯 Step-by-Step Customization

### 1. Project Branding

#### Update Package Name

```bash
# In root package.json
{
  "name": "your-project-name",
  "description": "Your project description"
}

# In apps/web/package.json
{
  "name": "@your-org/web",
  "description": "Your frontend description"
}
```

#### Update App Name

```bash
# In apps/web/src/app/[locale]/layout.tsx
const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Your App Name';
```

#### Update Logo and Favicon

- Replace `apps/web/public/favicon.ico`
- Update logo in Header component
- Add your logo to `apps/web/public/logo.png`

### 2. Theme Customization

#### Using Theme Editor (Recommended)

1. Navigate to `/admin/themes`
2. Select TemplateTheme or TemplateTheme2
3. Customize colors, fonts, and effects
4. Click "Sauvegarder" to apply

#### Manual Theme Configuration

```typescript
// Create custom theme in backend
// Or modify apps/web/src/lib/theme/default-theme-config.ts
```

### 3. Content Customization

#### Homepage Content

- Edit `apps/web/src/app/[locale]/page.tsx`
- Update Hero section text
- Modify features list
- Customize use cases

#### Footer Content

- Edit `apps/web/src/components/layout/Footer.tsx`
- Update links and social media
- Configure newsletter signup

### 4. Environment Variables

#### Frontend (.env.local)

```bash
NEXT_PUBLIC_APP_NAME=Your App Name
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://api.your-domain.com
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### Backend (.env)

```bash
APP_NAME=Your App Name
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SECRET_KEY=your-secret-key-32-chars-min
```

### 5. Authentication Providers

#### Google OAuth

```bash
# In backend .env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

#### GitHub OAuth

```bash
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

### 6. Payment Processing (Stripe)

```bash
# In backend .env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 7. Email Configuration

```bash
# In backend .env
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM=noreply@your-domain.com
EMAIL_FROM_NAME=Your App Name
```

### 8. Legal Pages

Create or update:

- `apps/web/src/app/[locale]/privacy/page.tsx`
- `apps/web/src/app/[locale]/terms/page.tsx`

### 9. SEO Configuration

#### Update Metadata

```typescript
// In apps/web/src/app/[locale]/layout.tsx
export const metadata: Metadata = {
  title: "Your App Name",
  description: "Your app description",
  keywords: "your, keywords, here",
};
```

#### Update Open Graph

```typescript
<meta property="og:title" content="Your App Name" />
<meta property="og:description" content="Your description" />
<meta property="og:image" content="/og-image.png" />
```

### 10. Analytics

#### Google Analytics

```bash
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

#### Sentry (Error Tracking)

```bash
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

---

## 🎨 Customization Examples

### Example 1: Change Primary Color

**Using Theme Editor:**

1. Go to `/admin/themes`
2. Select TemplateTheme
3. Change `primary_color` to your brand color
4. Save

**Manual:**

```typescript
// In theme config
{
  primary_color: "#your-color",
  // ... rest of config
}
```

### Example 2: Add Custom Component

```typescript
// Create apps/web/src/components/custom/YourComponent.tsx
export function YourComponent() {
  return <div>Your custom component</div>;
}

// Use in your pages
import { YourComponent } from '@/components/custom/YourComponent';
```

### Example 3: Add New Route

```typescript
// Create apps/web/src/app/[locale]/your-route/page.tsx
export default function YourRoute() {
  return <div>Your route content</div>;
}
```

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

## 🆘 Need Help?

- Check [README.md](./README.md) for setup instructions
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment guides
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines

---

**Happy Customizing! 🚀**
