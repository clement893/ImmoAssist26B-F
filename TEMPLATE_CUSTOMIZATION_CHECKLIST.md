# ✅ Template Customization Checklist

Use this checklist to customize the template for your project.

## 🔧 Basic Setup

- [ ] Clone repository and rename project
- [ ] Update `package.json` with your project name
- [ ] Update `apps/web/package.json` with your package name
- [ ] Update `packages/types/package.json` if needed
- [ ] Run `pnpm install` to install dependencies
- [ ] Configure environment variables (see `TEMPLATE_SETUP.md`)

## 🎨 Branding & Appearance

- [ ] Update site name in `apps/web/src/app/[locale]/layout.tsx`
- [ ] Replace favicon in `apps/web/public/favicon.ico`
- [ ] Replace logo in `apps/web/src/components/layout/Header.tsx`
- [ ] Update theme colors in `apps/web/src/lib/theme/`
- [ ] Customize default theme in database or seed data
- [ ] Update meta tags and SEO information

## 🔐 Security & Configuration

- [ ] Generate new `SECRET_KEY` for backend (min 32 characters)
- [ ] Generate new `JWT_SECRET` for frontend
- [ ] Update `FRONTEND_URL` in backend `.env`
- [ ] Configure CORS settings if needed
- [ ] Review and update security headers
- [ ] Set up SSL/TLS certificates for production

## 🗄️ Database

- [ ] Create PostgreSQL database
- [ ] Update `DATABASE_URL` in backend `.env`
- [ ] Run migrations: `cd backend && pnpm migrate:upgrade`
- [ ] Seed initial data (optional): `python -m app.scripts.seed_data`
- [ ] Review and customize database models if needed

## 🔌 Third-Party Integrations

### OAuth Providers (Optional)

- [ ] Configure Google OAuth (if using)
- [ ] Configure GitHub OAuth (if using)
- [ ] Configure Microsoft OAuth (if using)
- [ ] Add OAuth credentials to `.env.local`

### Payment Processing (Optional)

- [ ] Set up Stripe account
- [ ] Add Stripe keys to `.env.local`
- [ ] Configure Stripe webhooks
- [ ] Test payment flow

### Email Service (Optional)

- [ ] Set up SendGrid account
- [ ] Add SendGrid API key to backend `.env`
- [ ] Configure `SENDGRID_FROM_EMAIL`
- [ ] Test email sending

### Monitoring (Optional)

- [ ] Set up Sentry account
- [ ] Add Sentry DSN to `.env.local`
- [ ] Configure error tracking

## 📝 Content & Pages

- [ ] Review and customize homepage
- [ ] Update about/contact pages
- [ ] Customize error pages (404, 500, etc.)
- [ ] Remove example pages if not needed
- [ ] Remove test pages if not needed (`/test/api-connections`)
- [ ] Update legal pages (Privacy Policy, Terms of Service)

## 🧹 Cleanup

- [ ] Remove `TEMPLATE_SETUP.md` (or keep for reference)
- [ ] Remove `TEMPLATE_CUSTOMIZATION_CHECKLIST.md` (this file)
- [ ] Review and remove unused components
- [ ] Remove example data if not needed
- [ ] Clean up unused dependencies
- [ ] Update README.md with your project information
- [ ] Update CHANGELOG.md with your project's changes

## 🔄 Git Configuration

- [ ] Remove template repository remote: `git remote remove origin`
- [ ] Add your repository: `git remote add origin <your-repo-url>`
- [ ] Create initial commit with your changes
- [ ] Set up branch protection rules
- [ ] Configure CI/CD workflows

## 🚀 Deployment

- [ ] Set up frontend hosting (Vercel recommended)
- [ ] Set up backend hosting (Railway recommended)
- [ ] Configure environment variables in hosting platforms
- [ ] Set up custom domain (if applicable)
- [ ] Configure SSL certificates
- [ ] Test production deployment
- [ ] Set up monitoring and alerts

## 📚 Documentation

- [ ] Update README.md with your project details
- [ ] Update or remove template-specific documentation
- [ ] Add your own documentation
- [ ] Update API documentation if you modified endpoints
- [ ] Update component documentation if you modified components

## ✅ Final Verification

- [ ] All tests pass: `pnpm test`
- [ ] Type checking passes: `pnpm type-check`
- [ ] Linting passes: `pnpm lint`
- [ ] Build succeeds: `pnpm build`
- [ ] Frontend runs locally: `pnpm dev`
- [ ] Backend runs locally: `cd backend && uvicorn app.main:app --reload`
- [ ] Can create user account
- [ ] Can login/logout
- [ ] API endpoints accessible
- [ ] Database migrations work
- [ ] Production deployment works

## 🎉 You're Done!

Your template is now customized and ready for development!

---

**Note:** Keep a backup of the original template files if you might need to reference them later.
