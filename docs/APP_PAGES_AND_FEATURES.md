# 📋 Application Pages and Features - Complete List

This document provides a comprehensive list of all pages and features available in the Next.js Full-Stack Template application.

## 🔍 Legend

- **🔵 DB + Backend** - Requires Database connection AND Backend API
- **🟢 Backend Only** - Requires Backend API only (no direct DB access)
- **🟡 Static** - Static page, no database/backend connection needed
- **🔴 Test/Demo** - Test or demo page (may connect to backend for testing)
- **⚪ Component Showcase** - Component showcase page (no backend connection)

---

## 🏠 Public Pages

## 🏠 Public Pages

### Homepage

- **`/`** 🟡 Static - Landing page with features showcase
- **`/pricing`** 🟢 Backend Only - Pricing plans and subscription information (fetches plans from API)

### Authentication

- **`/auth/login`** 🟢 Backend Only - User login page (authenticates via API)
- **`/auth/register`** 🟢 Backend Only - User registration page (creates user via API)
- **`/auth/callback`** 🟢 Backend Only - OAuth callback handler (processes OAuth tokens)
- **`/auth/google/test`** 🔴 Test/Demo - Google OAuth test page

### Blog

- **`/blog`** 🔵 DB + Backend - Blog listing page (fetches posts from DB)
- **`/blog/[slug]`** 🔵 DB + Backend - Individual blog post (fetches from DB)
- **`/blog/archive/[year]`** 🔵 DB + Backend - Blog archive by year (queries DB)
- **`/blog/author/[author]`** 🔵 DB + Backend - Blog posts by author (queries DB)
- **`/blog/category/[category]`** 🔵 DB + Backend - Blog posts by category (queries DB)
- **`/blog/tag/[tag]`** 🔵 DB + Backend - Blog posts by tag (queries DB)
- **`/blog/rss`** 🔵 DB + Backend - RSS feed (generates from DB content)
- **`/blog/sitemap`** 🔵 DB + Backend - Blog sitemap (generates from DB)

---

## 👤 User Dashboard & Profile

### Dashboard

- **`/dashboard`** 🔵 DB + Backend - Main dashboard overview (fetches user data, stats)
- **`/dashboard/analytics`** 🔵 DB + Backend - Analytics dashboard (queries analytics data)
- **`/dashboard/activity`** 🔵 DB + Backend - User activity feed (fetches activity logs)
- **`/dashboard/insights`** 🔵 DB + Backend - Insights and reports (generates insights from DB)
- **`/dashboard/projects`** 🔵 DB + Backend - Project management (CRUD operations)
- **`/dashboard/reports`** 🔵 DB + Backend - Report generation and viewing (queries report data)
- **`/dashboard/become-superadmin`** 🟢 Backend Only - Super admin request page (sends request via API)

### Profile

- **`/profile`** 🔵 DB + Backend - User profile overview (fetches user data)
- **`/profile/settings`** 🔵 DB + Backend - Profile settings (updates user profile)
- **`/profile/security`** 🔵 DB + Backend - Security settings (password, MFA - updates DB)
- **`/profile/activity`** 🔵 DB + Backend - Personal activity log (queries activity table)
- **`/profile/notifications`** 🔵 DB + Backend - Notification preferences (reads/updates preferences)
- **`/profile/notifications-list`** 🔵 DB + Backend - Notification history (fetches notifications)

---

## ⚙️ Settings

### User Settings

- **`/settings`** 🔵 DB + Backend - Settings overview (fetches all settings)
- **`/settings/general`** 🔵 DB + Backend - General settings (reads/updates user settings)
- **`/settings/preferences`** 🔵 DB + Backend - User preferences (theme, language - stored in DB)
- **`/settings/security`** 🔵 DB + Backend - Security settings (password, MFA, 2FA - updates DB)
- **`/settings/notifications`** 🔵 DB + Backend - Notification settings (reads/updates notification preferences)
- **`/settings/billing`** 🔵 DB + Backend - Billing and subscription management (Stripe integration, DB storage)
- **`/settings/api`** 🔵 DB + Backend - API key management (CRUD API keys in DB)
- **`/settings/integrations`** 🔵 DB + Backend - Third-party integrations (stores integration configs)
- **`/settings/team`** 🔵 DB + Backend - Team management (team CRUD operations)
- **`/settings/organization`** 🔵 DB + Backend - Organization settings (reads/updates org data)

---

## 🛡️ Admin Panel

### Admin Dashboard

- **`/admin`** 🔵 DB + Backend - Admin dashboard overview (fetches system stats)
- **`/admin/statistics`** 🔵 DB + Backend - System statistics (aggregates data from DB)
- **`/admin/settings`** 🔵 DB + Backend - Admin settings (reads/updates system settings)

### User Management

- **`/admin/users`** 🔵 DB + Backend - User management (CRUD operations on users table)
- **`/admin/teams`** 🔵 DB + Backend - Team management (CRUD operations on teams)
- **`/admin/organizations`** 🔵 DB + Backend - Organization management (CRUD operations on organizations)
- **`/admin/invitations`** 🔵 DB + Backend - User invitation management (manages invitations in DB)

### System Management

- **`/admin/rbac`** 🔵 DB + Backend - Role-Based Access Control management (roles, permissions in DB)
- **`/admin/themes`** 🔵 DB + Backend - Theme management and customization (themes stored in DB)
- **`/admin/logs`** 🔵 DB + Backend - System logs and audit trail (queries audit_logs table)
- **`/admin/tenancy`** 🔵 DB + Backend - Multi-tenancy management (tenant configuration in DB)

---

## 📊 Content Management System (CMS)

### Content Management

- **`/content`** 🔵 DB + Backend - Content dashboard (aggregates content stats)
- **`/content/posts`** 🔵 DB + Backend - Blog posts management (CRUD posts in DB)
- **`/content/posts/[id]/edit`** 🔵 DB + Backend - Edit blog post (reads/updates post)
- **`/content/pages`** 🔵 DB + Backend - Pages management (CRUD pages in DB)
- **`/content/pages/[slug]/edit`** 🔵 DB + Backend - Edit page (reads/updates page)
- **`/content/pages/[slug]/preview`** 🔵 DB + Backend - Preview page (fetches page data)
- **`/content/media`** 🔵 DB + Backend - Media library (manages media files, metadata in DB)
- **`/content/categories`** 🔵 DB + Backend - Category management (CRUD categories)
- **`/content/tags`** 🔵 DB + Backend - Tag management (CRUD tags)
- **`/content/templates`** 🔵 DB + Backend - Content templates (templates stored in DB)
- **`/content/schedule`** 🔵 DB + Backend - Scheduled content (scheduled_posts table)

### Pages

- **`/pages/[slug]`** 🔵 DB + Backend - Dynamic page rendering (fetches page from DB)

---

## 📝 Forms & Surveys

### Forms

- **`/forms`** 🔵 DB + Backend - Forms listing (fetches forms from DB)
- **`/forms/[id]/submissions`** 🔵 DB + Backend - Form submissions viewer (queries submissions table)

### Surveys

- **`/surveys`** 🔵 DB + Backend - Surveys listing (fetches surveys from DB)
- **`/surveys/[id]/preview`** 🔵 DB + Backend - Survey preview (fetches survey data)
- **`/surveys/[id]/results`** 🔵 DB + Backend - Survey results (aggregates responses from DB)

---

## 🛒 E-Commerce & ERP

### ERP Dashboard

- **`/erp/dashboard`** 🔵 DB + Backend - ERP main dashboard (aggregates ERP data)
- **`/erp/clients`** 🔵 DB + Backend - Client management (CRUD clients in DB)
- **`/erp/orders`** 🔵 DB + Backend - Order management (CRUD orders, order_items tables)
- **`/erp/invoices`** 🔵 DB + Backend - Invoice management (CRUD invoices, integrates with Stripe)
- **`/erp/inventory`** 🔵 DB + Backend - Inventory management (product inventory in DB)
- **`/erp/reports`** 🔵 DB + Backend - ERP reports (generates reports from DB data)

### Subscriptions

- **`/subscriptions`** 🔵 DB + Backend - Subscription management (subscriptions table, Stripe sync)
- **`/subscriptions/success`** 🟢 Backend Only - Subscription success page (processes Stripe webhook)

### Stripe Integration

- **`/stripe/test`** 🔴 Test/Demo - Stripe test page (tests Stripe integration)

---

## 💼 Client Portal

- **`/client/dashboard`** 🔵 DB + Backend - Client dashboard (fetches client-specific data)
- **`/client/projects`** 🔵 DB + Backend - Client projects (queries projects for client)
- **`/client/invoices`** 🔵 DB + Backend - Client invoices (fetches client invoices)
- **`/client/tickets`** 🔵 DB + Backend - Support tickets (client ticket management)

---

## 🎯 Onboarding

- **`/onboarding`** 🟢 Backend Only - Onboarding overview (checks onboarding status)
- **`/onboarding/welcome`** 🟡 Static - Welcome step (static content)
- **`/onboarding/profile`** 🔵 DB + Backend - Profile setup (saves profile to DB)
- **`/onboarding/preferences`** 🔵 DB + Backend - Preferences setup (saves preferences to DB)
- **`/onboarding/team`** 🔵 DB + Backend - Team setup (creates team in DB)
- **`/onboarding/complete`** 🟢 Backend Only - Completion page (marks onboarding complete)

---

## 📚 Help & Support

### Help Center

- **`/help`** 🟡 Static - Help center homepage (static content)
- **`/help/faq`** 🔵 DB + Backend - Frequently Asked Questions (can be dynamic from DB)
- **`/help/guides`** 🔵 DB + Backend - User guides (guides stored in DB)
- **`/help/videos`** 🔵 DB + Backend - Video tutorials (video metadata in DB)
- **`/help/contact`** 🟢 Backend Only - Contact support (sends contact form via API)

### Support Tickets

- **`/help/tickets`** 🔵 DB + Backend - Support tickets listing (queries tickets table)
- **`/help/tickets/[id]`** 🔵 DB + Backend - Individual ticket view (fetches ticket, messages)

---

## 📊 Monitoring & Analytics

### Monitoring Dashboard

- **`/monitoring`** 🔵 DB + Backend - Monitoring overview (aggregates monitoring data)
- **`/monitoring/performance`** 🔵 DB + Backend - Performance metrics (queries performance logs)
- **`/monitoring/errors`** 🔵 DB + Backend - Error tracking (fetches error logs from DB/Sentry)

---

## 🔍 SEO & Search

- **`/seo`** 🔵 DB + Backend - SEO management and optimization (SEO metadata in DB)
- **`/sitemap`** 🔵 DB + Backend - Sitemap viewer (generates sitemap from DB content)
- **`/menus`** 🔵 DB + Backend - Menu management (menu structure stored in DB)

---

## 🧪 Testing & Development

### Examples

- **`/examples`** 🟡 Static - Examples overview (static showcase)
- **`/examples/dashboard`** 🔴 Test/Demo - Dashboard example (may use mock data)
- **`/examples/auth`** 🔴 Test/Demo - Authentication examples (demo only)
- **`/examples/crud`** 🔵 DB + Backend - CRUD operations example (full DB operations)
- **`/examples/data-table`** 🔵 DB + Backend - Data table example (fetches real data)
- **`/examples/file-upload`** 🟢 Backend Only - File upload example (uploads to backend)
- **`/examples/modal`** 🟡 Static - Modal examples (UI demo)
- **`/examples/onboarding`** 🟡 Static - Onboarding example (UI demo)
- **`/examples/search`** 🔵 DB + Backend - Search functionality example (searches DB)
- **`/examples/settings`** 🔵 DB + Backend - Settings example (reads/updates settings)
- **`/examples/toast`** 🟡 Static - Toast notifications example (UI demo)
- **`/examples/api-fetching`** 🟢 Backend Only - API fetching examples (API calls)

### Test Pages

- **`/test-sentry`** 🔴 Test/Demo - Sentry error testing (tests error tracking)
- **`/sentry/test`** 🔴 Test/Demo - Sentry test page (tests Sentry integration)
- **`/db/test`** 🔵 DB + Backend - Database test page (tests DB connectivity)
- **`/email/test`** 🟢 Backend Only - Email test page (sends test emails via API)
- **`/ai/test`** 🟢 Backend Only - AI integration test (tests AI API)
- **`/ai/chat`** 🟢 Backend Only - AI chat interface (connects to AI backend)
- **`/upload`** 🟢 Backend Only - File upload test (tests file upload API)
- **`/check-my-superadmin-status`** 🔵 DB + Backend - Super admin status checker (queries user roles)
- **`/test/api-connections`** 🔵 DB + Backend - API connection test page (tests API connections, generates reports)

---

## 📖 Documentation

- **`/docs`** 🟡 Static - Documentation viewer (static documentation, may fetch from DB if dynamic)

---

## 🎨 Component Showcase Pages

All component showcase pages are under `/components/[category]`:

> **Note**: Most component showcase pages are **⚪ Component Showcase** (static UI demos), but some may include interactive examples that connect to backend.

### Core Components

- **`/components`** ⚪ Component Showcase - Components overview
- **`/components/ui`** ⚪ Component Showcase - UI components showcase
- **`/components/forms`** ⚪ Component Showcase - Form components (may include form submission examples)
- **`/components/layout`** ⚪ Component Showcase - Layout components
- **`/components/navigation`** ⚪ Component Showcase - Navigation components
- **`/components/charts`** ⚪ Component Showcase - Chart components (may use mock data)
- **`/components/media`** ⚪ Component Showcase - Media components

### Feature Components

- **`/components/auth`** ⚪ Component Showcase - Authentication components (UI demo, no real auth)
- **`/components/billing`** ⚪ Component Showcase - Billing components (UI demo)
- **`/components/analytics`** ⚪ Component Showcase - Analytics components (may use mock data)
- **`/components/monitoring`** ⚪ Component Showcase - Monitoring components (UI demo)
- **`/components/errors`** ⚪ Component Showcase - Error handling components (UI demo)
- **`/components/i18n`** ⚪ Component Showcase - Internationalization components (UI demo)
- **`/components/admin`** ⚪ Component Showcase - Admin components (UI demo)
- **`/components/settings`** ⚪ Component Showcase - Settings components (UI demo)
- **`/components/activity`** ⚪ Component Showcase - Activity components (may use mock data)
- **`/components/feature-flags`** ⚪ Component Showcase - Feature flags components (UI demo)
- **`/components/preferences`** ⚪ Component Showcase - Preferences components (UI demo)
- **`/components/announcements`** ⚪ Component Showcase - Announcements components (UI demo)
- **`/components/feedback`** ⚪ Component Showcase - Feedback components (UI demo)
- **`/components/onboarding`** ⚪ Component Showcase - Onboarding components (UI demo)
- **`/components/documentation`** ⚪ Component Showcase - Documentation components (UI demo)
- **`/components/scheduled-tasks`** ⚪ Component Showcase - Scheduled tasks components (UI demo)
- **`/components/backups`** ⚪ Component Showcase - Backup components (UI demo)
- **`/components/email-templates`** ⚪ Component Showcase - Email template components (UI demo)
- **`/components/collaboration`** ⚪ Component Showcase - Collaboration components (UI demo)
- **`/components/content`** ⚪ Component Showcase - Content management components (UI demo)
- **`/components/cms`** ⚪ Component Showcase - CMS components (UI demo)
- **`/components/blog`** ⚪ Component Showcase - Blog components (UI demo)
- **`/components/client`** ⚪ Component Showcase - Client portal components (UI demo)
- **`/components/erp`** ⚪ Component Showcase - ERP components (UI demo)
- **`/components/integrations`** ⚪ Component Showcase - Integration components (UI demo)
- **`/components/notifications`** ⚪ Component Showcase - Notification components (UI demo)
- **`/components/performance`** ⚪ Component Showcase - Performance components (UI demo)
- **`/components/profile`** ⚪ Component Showcase - Profile components (UI demo)
- **`/components/rbac`** ⚪ Component Showcase - RBAC components (UI demo)
- **`/components/search`** ⚪ Component Showcase - Search components (UI demo)
- **`/components/seo`** ⚪ Component Showcase - SEO components (UI demo)
- **`/components/sharing`** ⚪ Component Showcase - Sharing components (UI demo)
- **`/components/subscriptions`** ⚪ Component Showcase - Subscription components (UI demo)
- **`/components/surveys`** ⚪ Component Showcase - Survey components (UI demo)
- **`/components/tags`** ⚪ Component Showcase - Tag components (UI demo)
- **`/components/templates`** ⚪ Component Showcase - Template components (UI demo)
- **`/components/theme`** ⚪ Component Showcase - Theme components (UI demo)
- **`/components/utils`** ⚪ Component Showcase - Utility components (UI demo)
- **`/components/versions`** ⚪ Component Showcase - Version control components (UI demo)
- **`/components/workflow`** ⚪ Component Showcase - Workflow components (UI demo)
- **`/components/advanced`** ⚪ Component Showcase - Advanced components (UI demo)
- **`/components/data`** ⚪ Component Showcase - Data components (UI demo)
- **`/components/favorites`** ⚪ Component Showcase - Favorites components (UI demo)
- **`/components/page-builder`** ⚪ Component Showcase - Page builder components (UI demo)
- **`/components/sections`** ⚪ Component Showcase - Section components (UI demo)

---

## 🔑 Key Features

### Authentication & Security

- ✅ JWT Authentication with httpOnly cookies
- ✅ OAuth Integration (Google, GitHub, Microsoft)
- ✅ Multi-Factor Authentication (MFA/TOTP)
- ✅ Role-Based Access Control (RBAC)
- ✅ API Key Management
- ✅ Security Headers (CSP, HSTS, X-Frame-Options)
- ✅ Input Sanitization & XSS Protection

### User Management

- ✅ User Registration & Login
- ✅ Profile Management
- ✅ User Preferences (Theme, Language)
- ✅ Activity Tracking
- ✅ Notification System (Real-time with WebSocket)
- ✅ User Invitations

### Team & Organization

- ✅ Team Management
- ✅ Organization Management
- ✅ Multi-tenancy Support
- ✅ Role & Permission Management

### Billing & Subscriptions

- ✅ Stripe Integration
- ✅ Subscription Management
- ✅ Payment History
- ✅ Invoice Generation
- ✅ Usage Metering

### Content Management

- ✅ Blog System
- ✅ Page Builder
- ✅ Media Library
- ✅ Content Scheduling
- ✅ SEO Management
- ✅ Menu Management

### Forms & Surveys

- ✅ Form Builder
- ✅ Form Submissions
- ✅ Survey Creation
- ✅ Survey Results

### ERP Features

- ✅ Client Management
- ✅ Order Management
- ✅ Invoice Management
- ✅ Inventory Management
- ✅ Reports & Analytics

### Monitoring & Analytics

- ✅ Performance Monitoring
- ✅ Error Tracking (Sentry)
- ✅ Web Vitals
- ✅ Analytics Dashboard
- ✅ Report Builder

### Internationalization

- ✅ Multi-language Support (EN, FR, AR, HE)
- ✅ Locale Routing
- ✅ RTL Support (Arabic, Hebrew)
- ✅ Language Preference Persistence

### Real-time Features

- ✅ WebSocket Support
- ✅ Real-time Notifications
- ✅ Notification Center
- ✅ Collaboration Features

### Developer Tools

- ✅ Component Library (270+ components)
- ✅ Storybook Integration
- ✅ TypeScript Type Generation
- ✅ Code Generation Tools
- ✅ Testing Suite (Vitest, Playwright, pytest)

---

## 📱 API Routes - Complete List

All API routes are under `/api/v1`. Base URL: `{API_URL}/api/v1`

### 🔍 API Connection Check (`/api/v1/api-connection-check`)

- `GET /api-connection-check/status` - Get quick connection status summary
- `GET /api-connection-check/frontend` - Check frontend API connections (detailed option available)
- `GET /api-connection-check/backend` - Check backend endpoints registration
- `GET /api-connection-check/report` - Generate API connection report

**Used by**: `/test/api-connections` ✅

### 🔐 Authentication (`/api/v1/auth`)

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info
- `GET /auth/google` - Get Google OAuth URL
- `GET /auth/google/callback` - Google OAuth callback

**Used by**: `/auth/login`, `/auth/register`, `/auth/callback` ✅

### 🔒 Two-Factor Authentication (`/api/v1/auth/2fa`)

- `POST /auth/2fa/setup` - Setup 2FA
- `POST /auth/2fa/verify` - Verify 2FA setup
- `POST /auth/2fa/disable` - Disable 2FA
- `POST /auth/2fa/verify-login` - Verify 2FA on login

**Used by**: `/profile/security`, `/settings/security` ✅

### 👤 Users (`/api/v1/users`)

- `GET /users` - List users (admin)
- `GET /users/{user_id}` - Get user details
- `PUT /users/{user_id}` - Update user
- `DELETE /users/{user_id}` - Delete user
- `GET /users/me` - Get current user
- `PUT /users/me` - Update current user
- `GET /users/preferences` - Get user preferences
- `PUT /users/preferences` - Update user preferences

**Used by**: `/admin/users`, `/profile`, `/settings/preferences` ✅

### 👥 Teams (`/api/v1/teams`)

- `POST /teams` - Create team
- `GET /teams` - List teams
- `GET /teams/{team_id}` - Get team
- `PUT /teams/{team_id}` - Update team
- `DELETE /teams/{team_id}` - Delete team
- `GET /teams/{team_id}/members` - List team members
- `POST /teams/{team_id}/members` - Add team member
- `PUT /teams/{team_id}/members/{user_id}` - Update team member
- `DELETE /teams/{team_id}/members/{user_id}` - Remove team member

**Used by**: `/admin/teams`, `/settings/team` ✅

### 📧 Invitations (`/api/v1/invitations`)

- `GET /invitations` - List invitations
- `POST /invitations` - Create invitation
- `GET /invitations/{invitation_id}` - Get invitation
- `PUT /invitations/{invitation_id}` - Update invitation
- `DELETE /invitations/{invitation_id}` - Delete invitation
- `POST /invitations/{invitation_id}/accept` - Accept invitation
- `POST /invitations/{invitation_id}/resend` - Resend invitation

**Used by**: `/admin/invitations` ✅

### 🎨 Themes (`/api/v1/themes`)

- `GET /themes` - List themes
- `GET /themes/{theme_id}` - Get theme
- `POST /themes` - Create theme
- `PUT /themes/{theme_id}` - Update theme
- `DELETE /themes/{theme_id}` - Delete theme
- `GET /themes/active` - Get active theme
- `POST /themes/{theme_id}/activate` - Activate theme
- `PUT /themes/active/mode` - Update theme mode

**Used by**: `/admin/themes` ✅

### 📁 Projects (`/api/v1/projects`)

- `GET /projects` - List projects
- `GET /projects/{project_id}` - Get project
- `POST /projects` - Create project
- `PUT /projects/{project_id}` - Update project
- `DELETE /projects/{project_id}` - Delete project

**Used by**: `/dashboard/projects`, `/client/projects` ✅

### 🔔 Notifications (`/api/v1/notifications`)

- `GET /notifications` - List notifications
- `GET /notifications/unread-count` - Get unread count
- `GET /notifications/{notification_id}` - Get notification
- `PATCH /notifications/{notification_id}/read` - Mark as read
- `PATCH /notifications/read-all` - Mark all as read
- `DELETE /notifications/{notification_id}` - Delete notification
- `POST /notifications` - Create notification (admin)

**Used by**: `/profile/notifications`, `/profile/notifications-list` ✅

### 🎫 Support Tickets (`/api/v1/support/tickets`)

- `GET /support/tickets` - List tickets
- `GET /support/tickets/{ticket_id}` - Get ticket
- `GET /support/tickets/{ticket_id}/messages` - Get ticket messages
- `POST /support/tickets` - Create ticket
- `POST /support/tickets/{ticket_id}/messages` - Add message
- `PUT /support/tickets/{ticket_id}` - Update ticket

**Used by**: `/help/tickets`, `/help/tickets/[id]`, `/client/tickets` ✅

### 📄 Pages (`/api/v1/pages`)

- `GET /pages` - List pages
- `GET /pages/{slug}` - Get page by slug
- `POST /pages` - Create page
- `PUT /pages/{page_id}` - Update page
- `DELETE /pages/{page_id}` - Delete page

**Used by**: `/content/pages` ⚠️ **TODO: Needs API integration**

- `/pages/[slug]` ⚠️ **TODO: Needs API integration**
- `/content/pages/[slug]/edit` ⚠️ **TODO: Needs API integration**
- `/content/pages/[slug]/preview` ⚠️ **TODO: Needs API integration**

### 📝 Forms (`/api/v1/forms`)

- `GET /forms` - List forms
- `GET /forms/{form_id}` - Get form
- `POST /forms` - Create form
- `PUT /forms/{form_id}` - Update form
- `DELETE /forms/{form_id}` - Delete form
- `GET /forms/{form_id}/submissions` - Get form submissions
- `POST /forms/{form_id}/submissions` - Submit form

**Used by**: `/forms` ✅

- `/forms/[id]/submissions` ⚠️ **TODO: Needs API integration**

### 📊 Surveys (`/api/v1/surveys`)

- `GET /surveys` - List surveys
- `GET /surveys/{survey_id}` - Get survey
- `POST /surveys` - Create survey
- `PUT /surveys/{survey_id}` - Update survey
- `DELETE /surveys/{survey_id}` - Delete survey
- `GET /surveys/{survey_id}/responses` - Get survey responses
- `POST /surveys/{survey_id}/responses` - Submit survey response

**Used by**: `/surveys` ⚠️ **TODO: Needs API integration**

- `/surveys/[id]/preview` ⚠️ **TODO: Needs API integration**
- `/surveys/[id]/results` ⚠️ **TODO: Needs API integration**

### 📰 Blog Posts (`/api/v1/posts`)

- `GET /posts` - List posts
- `GET /posts/{post_id}` - Get post
- `POST /posts` - Create post
- `PUT /posts/{post_id}` - Update post
- `DELETE /posts/{post_id}` - Delete post

**Used by**: `/blog`, `/blog/[slug]`, `/content/posts` ✅

### 🏷️ Tags & Categories (`/api/v1/tags`)

- `GET /tags` - List tags
- `GET /tags/{tag_id}` - Get tag
- `POST /tags` - Create tag
- `PUT /tags/{tag_id}` - Update tag
- `DELETE /tags/{tag_id}` - Delete tag
- `GET /categories` - List categories
- `GET /categories/{category_id}` - Get category
- `POST /categories` - Create category
- `PUT /categories/{category_id}` - Update category
- `DELETE /categories/{category_id}` - Delete category

**Used by**: `/content/tags`, `/content/categories` ✅

### 🛒 ERP (`/api/v1/erp`)

- `GET /erp/clients` - List clients
- `GET /erp/clients/{client_id}` - Get client
- `POST /erp/clients` - Create client
- `PUT /erp/clients/{client_id}` - Update client
- `DELETE /erp/clients/{client_id}` - Delete client
- `GET /erp/orders` - List orders
- `GET /erp/orders/{order_id}` - Get order
- `POST /erp/orders` - Create order
- `PUT /erp/orders/{order_id}` - Update order
- `GET /erp/invoices` - List invoices
- `GET /erp/invoices/{invoice_id}` - Get invoice
- `POST /erp/invoices` - Create invoice
- `GET /erp/inventory` - List inventory items
- `GET /erp/inventory/{item_id}` - Get inventory item
- `POST /erp/inventory` - Create inventory item
- `PUT /erp/inventory/{item_id}` - Update inventory item
- `GET /erp/reports` - Get ERP reports
- `GET /erp/dashboard` - Get ERP dashboard stats

**Used by**: `/erp/*` ✅

### 💼 Client Portal (`/api/v1/client`)

- `GET /client/invoices` - List client invoices
- `GET /client/invoices/{invoice_id}` - Get invoice
- `GET /client/projects` - List client projects
- `GET /client/tickets` - List client tickets
- `GET /client/dashboard` - Get client dashboard

**Used by**: `/client/*` ✅

### 💳 Subscriptions (`/api/v1/subscriptions`)

- `GET /subscriptions/plans` - List subscription plans
- `GET /subscriptions/plans/{plan_id}` - Get plan
- `GET /subscriptions` - List user subscriptions
- `POST /subscriptions` - Create subscription
- `PUT /subscriptions/{subscription_id}` - Update subscription
- `DELETE /subscriptions/{subscription_id}` - Cancel subscription

**Used by**: `/subscriptions`, `/settings/billing`, `/pricing` ✅

### 🛡️ Admin (`/api/v1/admin`)

- `GET /admin/statistics` - Get system statistics
- `GET /admin/logs` - Get system logs
- `GET /admin/users` - List all users
- `GET /admin/organizations` - List organizations

**Used by**: `/admin/*` ✅

### 🔐 RBAC (`/api/v1/rbac`)

- `GET /rbac/roles` - List roles
- `GET /rbac/roles/{role_id}` - Get role
- `POST /rbac/roles` - Create role
- `PUT /rbac/roles/{role_id}` - Update role
- `DELETE /rbac/roles/{role_id}` - Delete role
- `GET /rbac/permissions` - List permissions
- `GET /rbac/users/{user_id}/roles` - Get user roles
- `POST /rbac/users/{user_id}/roles` - Assign role to user

**Used by**: `/admin/rbac` ✅

### 🔍 Search (`/api/v1/search`)

- `POST /search` - Global search
- `GET /search/autocomplete` - Search autocomplete

**Used by**: `/examples/search` ✅

### 📊 Activities (`/api/v1/activities`)

- `GET /activities` - List activities
- `GET /activities/{activity_id}` - Get activity

**Used by**: `/dashboard/activity`, `/profile/activity` ✅

### 🎯 Onboarding (`/api/v1/onboarding`)

- `GET /onboarding/status` - Get onboarding status
- `POST /onboarding/complete` - Mark onboarding complete
- `POST /onboarding/skip` - Skip onboarding

**Used by**: `/onboarding/*` ✅

### 📚 Documentation (`/api/v1/documentation`)

- `GET /documentation` - List documentation
- `GET /documentation/{doc_id}` - Get documentation

**Used by**: `/docs` ⚠️ **May need API integration**

### 🔍 SEO (`/api/v1/seo`)

- `GET /seo/metadata` - Get SEO metadata
- `PUT /seo/metadata` - Update SEO metadata
- `GET /seo/sitemap` - Generate sitemap

**Used by**: `/seo`, `/sitemap` ✅

### 🍔 Menus (`/api/v1/menus`)

- `GET /menus` - List menus
- `GET /menus/{menu_id}` - Get menu
- `POST /menus` - Create menu
- `PUT /menus/{menu_id}` - Update menu
- `DELETE /menus/{menu_id}` - Delete menu

**Used by**: `/menus` ✅

### 🔌 Integrations (`/api/v1/integrations`)

- `GET /integrations` - List integrations
- `GET /integrations/{integration_id}` - Get integration
- `POST /integrations` - Create integration
- `PUT /integrations/{integration_id}` - Update integration
- `DELETE /integrations/{integration_id}` - Delete integration

**Used by**: `/settings/integrations` ✅

### 🔑 API Keys (`/api/v1/api-keys`)

- `GET /api-keys` - List API keys
- `POST /api-keys` - Create API key
- `DELETE /api-keys/{key_id}` - Delete API key

**Used by**: `/settings/api` ✅

### ⚙️ Organization Settings (`/api/v1/settings/organization`)

- `GET /settings/organization` - Get organization settings
- `PUT /settings/organization` - Update organization settings

**Used by**: `/settings/organization` ✅

### 🤖 AI (`/api/v1/ai`)

- `POST /ai/chat` - AI chat endpoint
- `POST /ai/completion` - AI completion

**Used by**: `/ai/chat`, `/ai/test` ✅

### 📧 Email (`/api/email`)

- `POST /email/test` - Send test email
- `GET /email/health` - Email health check

**Used by**: `/email/test` ✅

### 💾 Health Checks (`/api/v1/health`)

- `GET /health` - Health check
- `GET /db-health` - Database health check

**Used by**: `/db/test` ✅

---

## ⚠️ Pages Missing API Connections

The following pages are marked as requiring DB/Backend but have **TODO comments** indicating missing API integration:

### High Priority

1. **`/content/pages`** - Pages management page (has TODO comments)
2. **`/content/pages/[slug]/edit`** - Page editor (has TODO comments)
3. **`/content/pages/[slug]/preview`** - Page preview (has TODO comments)
4. **`/pages/[slug]`** - Dynamic page rendering (needs API call)
5. **`/forms/[id]/submissions`** - Form submissions viewer (needs API call)
6. **`/surveys`** - Surveys listing (needs API call)
7. **`/surveys/[id]/preview`** - Survey preview (needs API call)
8. **`/surveys/[id]/results`** - Survey results (needs API call)
9. **`/dashboard/reports`** - Reports page (has TODO comments, uses mock data)

### Medium Priority

10. **`/content/media`** - Media library (may need API integration)
11. **`/content/schedule`** - Scheduled content (may need API integration)
12. **`/content/templates`** - Content templates (may need API integration)
13. **`/help/faq`** - FAQ page (may need dynamic content from DB)
14. **`/help/guides`** - User guides (may need dynamic content from DB)
15. **`/help/videos`** - Video tutorials (may need dynamic content from DB)

### Low Priority

16. **`/docs`** - Documentation viewer (may be static or dynamic)
17. **`/monitoring/performance`** - Performance metrics (may need real-time data)
18. **`/monitoring/errors`** - Error tracking (may need Sentry integration)

---

## 🌍 Internationalization

All pages support multiple locales:

- **English** (`/` or `/en/...`)
- **French** (`/fr/...`)
- **Arabic** (`/ar/...`)
- **Hebrew** (`/he/...`)

Pages automatically redirect based on user language preference.

---

## 📊 Statistics

- **Total Pages**: 200+ pages
- **Component Categories**: 32 categories
- **Total Components**: 270+ components
- **Supported Languages**: 4 (EN, FR, AR, HE)
- **Features**: 50+ major features

### Database & Backend Connection Summary

- **🔵 DB + Backend Required**: ~120 pages (60%)
- **🟢 Backend Only**: ~30 pages (15%)
- **🟡 Static**: ~20 pages (10%)
- **🔴 Test/Demo**: ~15 pages (7.5%)
- **⚪ Component Showcase**: ~35 pages (17.5%)

**Key Insight**: The majority of pages (75%) require backend connectivity, with 60% requiring direct database access. This highlights the importance of proper backend and database setup for the application to function correctly.

---

## ✅ API Connection Status Summary

### Fully Connected Pages

- ✅ Authentication pages (`/auth/*`)
- ✅ Dashboard pages (`/dashboard/*`) - Most connected
- ✅ Profile pages (`/profile/*`)
- ✅ Settings pages (`/settings/*`)
- ✅ Admin pages (`/admin/*`)
- ✅ Blog pages (`/blog/*`)
- ✅ Content management (`/content/posts`, `/content/categories`, `/content/tags`)
- ✅ ERP pages (`/erp/*`)
- ✅ Client portal (`/client/*`)
- ✅ Subscriptions (`/subscriptions/*`)
- ✅ Help tickets (`/help/tickets/*`)
- ✅ Notifications (`/profile/notifications*`)

### Partially Connected Pages

- ⚠️ `/content/pages` - API exists but not integrated
- ⚠️ `/forms/[id]/submissions` - API exists but not integrated
- ⚠️ `/surveys/*` - API may exist but not integrated
- ⚠️ `/dashboard/reports` - Uses mock data, API integration needed

### Pages Needing API Development

- ❌ `/content/media` - Media upload/management API needed
- ❌ `/content/schedule` - Scheduled content API needed
- ❌ `/content/templates` - Template management API needed
- ❌ `/help/faq` - Dynamic FAQ API needed (if not static)
- ❌ `/help/guides` - Dynamic guides API needed (if not static)
- ❌ `/help/videos` - Video management API needed (if not static)

### Action Items

1. **Immediate Priority**: Connect existing API endpoints to pages with TODO comments
2. **High Priority**: Implement missing API endpoints for surveys and form submissions
3. **Medium Priority**: Add API integration for media library and scheduled content
4. **Low Priority**: Evaluate if help center pages need dynamic API or can remain static

---

_Last updated: January 2025_
