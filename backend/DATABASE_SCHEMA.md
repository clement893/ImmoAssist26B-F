# Database Schema Documentation

Complete database schema reference for the MODELE-NEXTJS-FULLSTACK backend.

## 📊 Overview

The database uses **PostgreSQL** with **SQLAlchemy 2.0** ORM. All tables include:

- `id` (Integer, Primary Key)
- `created_at` (DateTime, timezone-aware)
- `updated_at` (DateTime, timezone-aware, auto-updated)

---

## 📋 Table of Contents

- [Users & Authentication](#users--authentication)
- [Roles & Permissions](#roles--permissions)
- [Teams & Organizations](#teams--organizations)
- [Subscriptions & Billing](#subscriptions--billing)
- [Projects](#projects)
- [Themes](#themes)
- [Files](#files)
- [API Keys](#api-keys)
- [Webhooks](#webhooks)

---

## Users & Authentication

### `users`

User accounts table.

| Column             | Type               | Constraints                 | Description                       |
| ------------------ | ------------------ | --------------------------- | --------------------------------- |
| `id`               | Integer            | Primary Key                 | User ID                           |
| `email`            | String             | Unique, Not Null, Indexed   | User email address                |
| `hashed_password`  | String             | Not Null                    | Bcrypt hashed password            |
| `first_name`       | String(100)        | Nullable, Indexed           | First name                        |
| `last_name`        | String(100)        | Nullable, Indexed           | Last name                         |
| `is_active`        | Boolean            | Default: True, Indexed      | Account active status             |
| `theme_preference` | String(20)         | Nullable, Default: 'system' | **Deprecated** - Theme preference |
| `created_at`       | DateTime(timezone) | Not Null, Indexed           | Account creation timestamp        |
| `updated_at`       | DateTime(timezone) | Not Null, Indexed           | Last update timestamp             |

**Indexes:**

- `idx_users_email` - Email lookup
- `idx_users_is_active` - Active user filtering
- `idx_users_created_at` - Creation date sorting
- `idx_users_updated_at` - Update date sorting

**Relationships:**

- `roles` → `user_roles` (many-to-many)
- `team_memberships` → `team_members`
- `owned_teams` → `teams` (owner)
- `sent_invitations` → `invitations`
- `subscriptions` → `subscriptions`
- `invoices` → `invoices`

**Example:**

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR UNIQUE NOT NULL,
    hashed_password VARCHAR NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    theme_preference VARCHAR(20) DEFAULT 'system',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_updated_at ON users(updated_at);
```

---

## Roles & Permissions

### `roles`

Role definitions table.

| Column        | Type               | Constraints      | Description                       |
| ------------- | ------------------ | ---------------- | --------------------------------- |
| `id`          | Integer            | Primary Key      | Role ID                           |
| `name`        | String(100)        | Unique, Not Null | Role name (e.g., 'admin', 'user') |
| `description` | Text               | Nullable         | Role description                  |
| `permissions` | Text               | Nullable         | JSON permissions array            |
| `created_at`  | DateTime(timezone) | Not Null         | Creation timestamp                |
| `updated_at`  | DateTime(timezone) | Not Null         | Update timestamp                  |

**Indexes:**

- `idx_roles_name` - Role name lookup

**Relationships:**

- `user_roles` → `user_roles` (many-to-many)

---

### `user_roles`

User-role assignments (junction table).

| Column       | Type               | Constraints                      | Description          |
| ------------ | ------------------ | -------------------------------- | -------------------- |
| `id`         | Integer            | Primary Key                      | Assignment ID        |
| `user_id`    | Integer            | Foreign Key → users.id, Not Null | User ID              |
| `role_id`    | Integer            | Foreign Key → roles.id, Not Null | Role ID              |
| `created_at` | DateTime(timezone) | Not Null                         | Assignment timestamp |

**Indexes:**

- `idx_user_roles_user_id` - User role lookup
- `idx_user_roles_role_id` - Role user lookup
- Unique constraint on (`user_id`, `role_id`)

**Relationships:**

- `user` → `users`
- `role` → `roles`

---

## Teams & Organizations

### `teams`

Teams/organizations table (multi-tenant support).

| Column        | Type               | Constraints                      | Description             |
| ------------- | ------------------ | -------------------------------- | ----------------------- |
| `id`          | Integer            | Primary Key                      | Team ID                 |
| `name`        | String(200)        | Not Null, Indexed                | Team name               |
| `slug`        | String(200)        | Unique, Not Null, Indexed        | URL-friendly identifier |
| `description` | Text               | Nullable                         | Team description        |
| `owner_id`    | Integer            | Foreign Key → users.id, Not Null | Team owner user ID      |
| `is_active`   | Boolean            | Default: True, Indexed           | Team active status      |
| `settings`    | Text               | Nullable                         | JSON team settings      |
| `created_at`  | DateTime(timezone) | Not Null                         | Creation timestamp      |
| `updated_at`  | DateTime(timezone) | Not Null                         | Update timestamp        |

**Indexes:**

- `idx_teams_name` - Name lookup
- `idx_teams_slug` - Slug lookup
- `idx_teams_owner` - Owner lookup
- `idx_teams_is_active` - Active team filtering

**Relationships:**

- `owner` → `users`
- `members` → `team_members`
- `invitations` → `invitations`

---

### `team_members`

Team membership with roles.

| Column      | Type               | Constraints                      | Description                              |
| ----------- | ------------------ | -------------------------------- | ---------------------------------------- |
| `id`        | Integer            | Primary Key                      | Membership ID                            |
| `team_id`   | Integer            | Foreign Key → teams.id, Not Null | Team ID                                  |
| `user_id`   | Integer            | Foreign Key → users.id, Not Null | User ID                                  |
| `role`      | String(50)         | Not Null                         | Member role ('owner', 'admin', 'member') |
| `joined_at` | DateTime(timezone) | Not Null                         | Join timestamp                           |

**Indexes:**

- `idx_team_members_team_id` - Team member lookup
- `idx_team_members_user_id` - User team lookup
- Unique constraint on (`team_id`, `user_id`)

**Relationships:**

- `team` → `teams`
- `user` → `users`

---

### `invitations`

Team invitations table.

| Column          | Type               | Constraints                      | Description                               |
| --------------- | ------------------ | -------------------------------- | ----------------------------------------- |
| `id`            | Integer            | Primary Key                      | Invitation ID                             |
| `team_id`       | Integer            | Foreign Key → teams.id, Not Null | Team ID                                   |
| `email`         | String             | Not Null                         | Invited email address                     |
| `role`          | String(50)         | Not Null                         | Invited role                              |
| `invited_by_id` | Integer            | Foreign Key → users.id, Not Null | Inviter user ID                           |
| `token`         | String             | Unique, Not Null                 | Invitation token                          |
| `status`        | String(20)         | Default: 'pending'               | Status ('pending', 'accepted', 'expired') |
| `expires_at`    | DateTime(timezone) | Not Null                         | Expiration timestamp                      |
| `created_at`    | DateTime(timezone) | Not Null                         | Creation timestamp                        |

**Indexes:**

- `idx_invitations_team_id` - Team invitation lookup
- `idx_invitations_email` - Email invitation lookup
- `idx_invitations_token` - Token lookup
- `idx_invitations_status` - Status filtering

**Relationships:**

- `team` → `teams`
- `invited_by` → `users`

---

## Subscriptions & Billing

### `plans`

Subscription plans table.

| Column            | Type               | Constraints               | Description                                       |
| ----------------- | ------------------ | ------------------------- | ------------------------------------------------- |
| `id`              | Integer            | Primary Key               | Plan ID                                           |
| `name`            | String(200)        | Not Null                  | Plan name                                         |
| `description`     | Text               | Nullable                  | Plan description                                  |
| `amount`          | Numeric(10,2)      | Not Null                  | Price amount (in cents)                           |
| `currency`        | String(3)          | Default: 'usd'            | Currency code                                     |
| `interval`        | Enum               | Not Null                  | Billing interval ('month', 'year', 'week', 'day') |
| `interval_count`  | Integer            | Default: 1                | Interval count (e.g., 3 for quarterly)            |
| `stripe_price_id` | String(255)        | Unique, Nullable, Indexed | Stripe price ID                                   |
| `features`        | Text               | Nullable                  | JSON features array                               |
| `status`          | Enum               | Default: 'active'         | Status ('active', 'inactive', 'archived')         |
| `created_at`      | DateTime(timezone) | Not Null                  | Creation timestamp                                |
| `updated_at`      | DateTime(timezone) | Not Null                  | Update timestamp                                  |

**Indexes:**

- `idx_plans_stripe_id` - Stripe price lookup
- `idx_plans_status` - Status filtering
- `idx_plans_interval` - Interval filtering

**Relationships:**

- `subscriptions` → `subscriptions`

---

### `subscriptions`

User subscriptions table.

| Column                     | Type               | Constraints                      | Description                                     |
| -------------------------- | ------------------ | -------------------------------- | ----------------------------------------------- |
| `id`                       | Integer            | Primary Key                      | Subscription ID                                 |
| `user_id`                  | Integer            | Foreign Key → users.id, Not Null | User ID                                         |
| `plan_id`                  | Integer            | Foreign Key → plans.id, Not Null | Plan ID                                         |
| `stripe_subscription_id`   | String(255)        | Unique, Nullable, Indexed        | Stripe subscription ID                          |
| `stripe_customer_id`       | String(255)        | Nullable, Indexed                | Stripe customer ID                              |
| `stripe_payment_method_id` | String(255)        | Nullable                         | Stripe payment method ID                        |
| `status`                   | Enum               | Default: 'incomplete', Indexed   | Status ('active', 'canceled', 'past_due', etc.) |
| `current_period_start`     | DateTime(timezone) | Nullable                         | Current period start                            |
| `current_period_end`       | DateTime(timezone) | Nullable, Indexed                | Current period end                              |
| `cancel_at_period_end`     | Boolean            | Default: False                   | Cancel at period end flag                       |
| `canceled_at`              | DateTime(timezone) | Nullable                         | Cancellation timestamp                          |
| `trial_start`              | DateTime(timezone) | Nullable                         | Trial start date                                |
| `trial_end`                | DateTime(timezone) | Nullable                         | Trial end date                                  |
| `created_at`               | DateTime(timezone) | Not Null                         | Creation timestamp                              |
| `updated_at`               | DateTime(timezone) | Not Null                         | Update timestamp                                |

**Indexes:**

- `idx_subscriptions_user_id` - User subscription lookup
- `idx_subscriptions_status` - Status filtering
- `idx_subscriptions_stripe_id` - Stripe subscription lookup
- `idx_subscriptions_current_period_end` - Period end filtering

**Relationships:**

- `user` → `users`
- `plan` → `plans`
- `invoices` → `invoices`

**Status Values:**

- `active` - Active subscription
- `canceled` - Canceled subscription
- `past_due` - Payment past due
- `unpaid` - Unpaid subscription
- `trialing` - In trial period
- `incomplete` - Incomplete setup
- `incomplete_expired` - Incomplete and expired

---

### `invoices`

Payment invoices table.

| Column              | Type               | Constraints                              | Description                          |
| ------------------- | ------------------ | ---------------------------------------- | ------------------------------------ |
| `id`                | Integer            | Primary Key                              | Invoice ID                           |
| `user_id`           | Integer            | Foreign Key → users.id, Not Null         | User ID                              |
| `subscription_id`   | Integer            | Foreign Key → subscriptions.id, Nullable | Subscription ID                      |
| `stripe_invoice_id` | String(255)        | Unique, Nullable                         | Stripe invoice ID                    |
| `amount`            | Numeric(10,2)      | Not Null                                 | Invoice amount                       |
| `currency`          | String(3)          | Default: 'usd'                           | Currency code                        |
| `status`            | String(20)         | Not Null                                 | Status ('paid', 'pending', 'failed') |
| `invoice_date`      | DateTime(timezone) | Not Null                                 | Invoice date                         |
| `due_date`          | DateTime(timezone) | Nullable                                 | Due date                             |
| `paid_at`           | DateTime(timezone) | Nullable                                 | Payment timestamp                    |
| `invoice_number`    | String(100)        | Unique, Nullable                         | Invoice number                       |
| `pdf_url`           | String(500)        | Nullable                                 | PDF invoice URL                      |
| `created_at`        | DateTime(timezone) | Not Null                                 | Creation timestamp                   |
| `updated_at`        | DateTime(timezone) | Not Null                                 | Update timestamp                     |

**Indexes:**

- `idx_invoices_user_id` - User invoice lookup
- `idx_invoices_subscription_id` - Subscription invoice lookup
- `idx_invoices_status` - Status filtering
- `idx_invoices_invoice_date` - Date filtering

**Relationships:**

- `user` → `users`
- `subscription` → `subscriptions`

---

## Projects

### `projects`

User projects table.

| Column        | Type               | Constraints                      | Description                                |
| ------------- | ------------------ | -------------------------------- | ------------------------------------------ |
| `id`          | Integer            | Primary Key                      | Project ID                                 |
| `user_id`     | Integer            | Foreign Key → users.id, Not Null | User ID                                    |
| `name`        | String(200)        | Not Null                         | Project name                               |
| `description` | Text               | Nullable                         | Project description                        |
| `status`      | Enum               | Default: 'active'                | Status ('active', 'archived', 'completed') |
| `settings`    | Text               | Nullable                         | JSON project settings                      |
| `created_at`  | DateTime(timezone) | Not Null                         | Creation timestamp                         |
| `updated_at`  | DateTime(timezone) | Not Null                         | Update timestamp                           |

**Indexes:**

- `idx_projects_user_id` - User project lookup
- `idx_projects_status` - Status filtering
- `idx_projects_created_at` - Creation date sorting

**Relationships:**

- `user` → `users`

**Status Values:**

- `active` - Active project
- `archived` - Archived project
- `completed` - Completed project

---

## Themes

### `themes`

Theme configurations table.

| Column       | Type               | Constraints             | Description              |
| ------------ | ------------------ | ----------------------- | ------------------------ |
| `id`         | Integer            | Primary Key             | Theme ID                 |
| `name`       | String(200)        | Not Null                | Theme name               |
| `is_active`  | Boolean            | Default: False, Indexed | Active theme flag        |
| `config`     | Text               | Not Null                | JSON theme configuration |
| `created_at` | DateTime(timezone) | Not Null                | Creation timestamp       |
| `updated_at` | DateTime(timezone) | Not Null                | Update timestamp         |

**Indexes:**

- `idx_themes_is_active` - Active theme lookup

**Config Structure:**

```json
{
  "mode": "system",
  "primary": "#3b82f6",
  "secondary": "#8b5cf6",
  "danger": "#ef4444",
  "warning": "#f59e0b",
  "info": "#06b6d4",
  "fonts": {
    "primary": "Inter",
    "secondary": "Roboto"
  },
  "border_radius": "0.5rem"
}
```

---

## Files

### `files`

File metadata table.

| Column         | Type               | Constraints                      | Description                  |
| -------------- | ------------------ | -------------------------------- | ---------------------------- |
| `id`           | Integer            | Primary Key                      | File ID                      |
| `user_id`      | Integer            | Foreign Key → users.id, Not Null | Owner user ID                |
| `filename`     | String(500)        | Not Null                         | Original filename            |
| `file_path`    | String(1000)       | Not Null                         | File storage path            |
| `file_size`    | Integer            | Not Null                         | File size in bytes           |
| `mime_type`    | String(100)        | Nullable                         | MIME type                    |
| `storage_type` | String(50)         | Default: 'local'                 | Storage type ('local', 's3') |
| `is_public`    | Boolean            | Default: False                   | Public access flag           |
| `created_at`   | DateTime(timezone) | Not Null                         | Creation timestamp           |
| `updated_at`   | DateTime(timezone) | Not Null                         | Update timestamp             |

**Indexes:**

- `idx_files_user_id` - User file lookup
- `idx_files_storage_type` - Storage type filtering
- `idx_files_is_public` - Public file filtering

**Relationships:**

- `user` → `users`

---

## API Keys

### `api_keys`

API key management table.

| Column         | Type               | Constraints                      | Description                   |
| -------------- | ------------------ | -------------------------------- | ----------------------------- |
| `id`           | Integer            | Primary Key                      | API key ID                    |
| `user_id`      | Integer            | Foreign Key → users.id, Not Null | Owner user ID                 |
| `name`         | String(200)        | Not Null                         | API key name                  |
| `key_hash`     | String(255)        | Unique, Not Null                 | Hashed API key                |
| `key_prefix`   | String(20)         | Not Null                         | Key prefix (e.g., 'sk*live*') |
| `last_used_at` | DateTime(timezone) | Nullable                         | Last usage timestamp          |
| `expires_at`   | DateTime(timezone) | Nullable                         | Expiration timestamp          |
| `is_active`    | Boolean            | Default: True                    | Active status                 |
| `created_at`   | DateTime(timezone) | Not Null                         | Creation timestamp            |
| `updated_at`   | DateTime(timezone) | Not Null                         | Update timestamp              |

**Indexes:**

- `idx_api_keys_user_id` - User API key lookup
- `idx_api_keys_key_hash` - Key hash lookup
- `idx_api_keys_is_active` - Active key filtering

**Relationships:**

- `user` → `users`

---

## Webhooks

### `webhook_events`

Webhook event log table.

| Column          | Type               | Constraints        | Description                                   |
| --------------- | ------------------ | ------------------ | --------------------------------------------- |
| `id`            | Integer            | Primary Key        | Event ID                                      |
| `event_type`    | String(100)        | Not Null, Indexed  | Event type (e.g., 'stripe.payment_succeeded') |
| `source`        | String(50)         | Not Null           | Event source ('stripe', 'custom')             |
| `payload`       | Text               | Not Null           | JSON event payload                            |
| `status`        | String(20)         | Default: 'pending' | Processing status                             |
| `processed_at`  | DateTime(timezone) | Nullable           | Processing timestamp                          |
| `error_message` | Text               | Nullable           | Error message if failed                       |
| `created_at`    | DateTime(timezone) | Not Null           | Creation timestamp                            |

**Indexes:**

- `idx_webhook_events_type` - Event type lookup
- `idx_webhook_events_status` - Status filtering
- `idx_webhook_events_created_at` - Date filtering

---

## Notifications

### `notifications`

User notifications table.

| Column              | Type               | Constraints                               | Description                          |
| ------------------- | ------------------ | ----------------------------------------- | ------------------------------------ |
| `id`                | Integer            | Primary Key                               | Notification ID                      |
| `user_id`           | Integer            | Foreign Key → users.id, Not Null, Indexed | User ID                              |
| `title`             | String(200)        | Not Null                                  | Notification title                   |
| `message`           | Text               | Not Null                                  | Notification message                 |
| `notification_type` | String(20)         | Default: 'info', Not Null, Indexed        | Type (info, success, warning, error) |
| `read`              | Boolean            | Default: False, Not Null, Indexed         | Read status                          |
| `read_at`           | DateTime(timezone) | Nullable                                  | Timestamp when marked as read        |
| `action_url`        | String(500)        | Nullable                                  | Optional action URL                  |
| `action_label`      | String(100)        | Nullable                                  | Optional action button label         |
| `metadata`          | JSONB              | Nullable                                  | Additional metadata (JSON)           |
| `created_at`        | DateTime(timezone) | Not Null, Indexed                         | Creation timestamp                   |
| `updated_at`        | DateTime(timezone) | Not Null                                  | Last update timestamp                |

**Indexes:**

- `idx_notifications_user_id` - User notification lookup
- `idx_notifications_read` - Read status filtering
- `idx_notifications_created_at` - Date sorting
- `idx_notifications_type` - Type filtering
- `idx_notifications_user_read` - Composite index for user + read queries

**Relationships:**

- `user` → `users`

**Notification Types:**

- `info` - Informational notification
- `success` - Success notification
- `warning` - Warning notification
- `error` - Error notification

**Example:**

```sql
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(20) DEFAULT 'info' NOT NULL,
    read BOOLEAN DEFAULT FALSE NOT NULL,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url VARCHAR(500),
    action_label VARCHAR(100),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
```

---

## Entity Relationship Diagram

```
users
├── user_roles → roles
├── team_members → teams
│   └── teams → invitations
├── subscriptions → plans
│   └── invoices
├── projects
├── files
├── api_keys
└── notifications

webhook_events (standalone)
```

---

## Database Indexes Summary

### Performance Indexes

All foreign keys are indexed for join performance:

- User lookups: `idx_users_email`, `idx_users_is_active`
- Relationship lookups: `idx_user_roles_user_id`, `idx_team_members_team_id`
- Status filtering: `idx_subscriptions_status`, `idx_projects_status`, `idx_notifications_read`
- Date sorting: `idx_users_created_at`, `idx_projects_created_at`, `idx_notifications_created_at`

### Composite Indexes

Consider adding composite indexes for common query patterns:

- `(user_id, status)` on subscriptions
- `(team_id, user_id)` on team_members (already unique)
- `(user_id, created_at)` on projects
- `(user_id, read)` on notifications (already implemented)

---

## Migration History

Key migrations:

1. `001_initial_users.py` - Initial user table
2. `001_add_rbac_teams_invitations.py` - RBAC and teams
3. `002_add_oauth_fields.py` - OAuth support
4. `003_create_files_table.py` - File management
5. `007_add_database_indexes.py` - Performance indexes
6. `008_add_subscriptions_tables.py` - Subscription system
7. `009_add_webhook_events_table.py` - Webhook logging
8. `010_add_theme_preference.py` - Theme support
9. `021_add_notifications_table.py` - Notification system

---

## Data Types Reference

- **Integer**: Standard integer (32-bit)
- **String(n)**: Variable-length string with max length
- **Text**: Unlimited length text
- **Boolean**: True/false
- **DateTime(timezone)**: Timezone-aware timestamp
- **Numeric(10,2)**: Decimal with 10 digits, 2 decimal places
- **Enum**: Enumeration type

---

## Constraints

### Unique Constraints

- `users.email` - Unique email addresses
- `teams.slug` - Unique team slugs
- `subscriptions.stripe_subscription_id` - Unique Stripe IDs
- `invoices.invoice_number` - Unique invoice numbers
- `api_keys.key_hash` - Unique API key hashes

### Foreign Key Constraints

- All foreign keys have `ON DELETE CASCADE` or `ON DELETE SET NULL` as appropriate
- User deletion cascades to related records (subscriptions, projects, etc.)

---

## Best Practices

1. **Always use indexes** on frequently queried columns
2. **Use timezone-aware timestamps** for all datetime fields
3. **Store sensitive data hashed** (passwords, API keys)
4. **Use JSON fields** for flexible configuration data
5. **Implement soft deletes** where appropriate (using `is_active` flags)
6. **Use enums** for fixed value sets (status, roles, etc.)

---

**Last Updated:** January 2025  
**Database Version:** PostgreSQL 14+  
**ORM:** SQLAlchemy 2.0
