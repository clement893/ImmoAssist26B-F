# API Endpoints Documentation

Complete reference for all API endpoints in the FastAPI backend.

**Base URL**: `http://localhost:8000`  
**API Version**: `v1`  
**API Prefix**: `/api/v1`

## 🔐 Authentication

All endpoints except `/auth/register`, `/auth/login`, `/auth/google`, and `/health` require authentication.

### Authentication Header

```http
Authorization: Bearer <access_token>
```

---

## 📋 Table of Contents

- [Authentication Endpoints](#authentication-endpoints)
- [User Endpoints](#user-endpoints)
- [Project Endpoints](#project-endpoints)
- [Theme Endpoints](#theme-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [RBAC Endpoints](#rbac-endpoints)
- [2FA Endpoints](#2fa-endpoints)
- [API Keys Endpoints](#api-keys-endpoints)
- [Email Endpoints](#email-endpoints)
- [Webhook Endpoints](#webhook-endpoints)
- [Notification Endpoints](#notification-endpoints)

---

## Authentication Endpoints

### Register User

```http
POST /api/v1/auth/register
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-01-27T10:00:00Z"
}
```

---

### Login

```http
POST /api/v1/auth/login
Content-Type: application/x-www-form-urlencoded
```

**Request Body (form data):**

```
username=user@example.com
password=securepassword123
```

**Response:** `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

---

### Refresh Token

```http
POST /api/v1/auth/refresh
```

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:** `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

---

### Google OAuth Login

```http
GET /api/v1/auth/google
```

Redirects to Google OAuth consent screen, then redirects back with token.

**Query Parameters:**

- `redirect_url` (optional): URL to redirect after authentication

**Response:** `302 Redirect` → Google OAuth → Callback with token

---

### Get Current User

```http
GET /api/v1/auth/me
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "is_verified": true,
  "created_at": "2025-01-27T10:00:00Z",
  "updated_at": "2025-01-27T10:00:00Z"
}
```

---

### Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "message": "Successfully logged out"
}
```

---

## User Endpoints

### List Users

```http
GET /api/v1/users/
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (int, default: 1): Page number
- `page_size` (int, default: 10): Items per page
- `is_active` (bool, optional): Filter by active status
- `search` (string, optional): Search by name or email

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_active": true
    }
  ],
  "total": 100,
  "page": 1,
  "page_size": 10,
  "total_pages": 10
}
```

---

### Get User by ID

```http
GET /api/v1/users/{user_id}
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "is_verified": true,
  "created_at": "2025-01-27T10:00:00Z"
}
```

---

### Update User

```http
PUT /api/v1/users/{user_id}
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "is_active": true,
  "updated_at": "2025-01-27T11:00:00Z"
}
```

---

### Delete User

```http
DELETE /api/v1/users/{user_id}
Authorization: Bearer <token>
```

**Response:** `204 No Content`

---

## Project Endpoints

### List Projects

```http
GET /api/v1/projects/
Authorization: Bearer <token>
```

**Query Parameters:**

- `skip` (int, default: 0): Number of records to skip
- `limit` (int, default: 100, max: 1000): Maximum records to return
- `status` (enum, optional): Filter by status (`active`, `archived`, `completed`)

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "My Project",
    "description": "Project description",
    "status": "active",
    "user_id": 1,
    "created_at": "2025-01-27T10:00:00Z"
  }
]
```

---

### Create Project

```http
POST /api/v1/projects/
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "New Project",
  "description": "Project description",
  "status": "active"
}
```

**Response:** `201 Created`

```json
{
  "id": 1,
  "name": "New Project",
  "description": "Project description",
  "status": "active",
  "user_id": 1,
  "created_at": "2025-01-27T10:00:00Z"
}
```

---

### Get Project

```http
GET /api/v1/projects/{project_id}
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "My Project",
  "description": "Project description",
  "status": "active",
  "user_id": 1,
  "created_at": "2025-01-27T10:00:00Z",
  "updated_at": "2025-01-27T10:00:00Z"
}
```

---

### Update Project

```http
PUT /api/v1/projects/{project_id}
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "Updated Project",
  "description": "Updated description",
  "status": "completed"
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Updated Project",
  "description": "Updated description",
  "status": "completed",
  "updated_at": "2025-01-27T11:00:00Z"
}
```

---

### Delete Project

```http
DELETE /api/v1/projects/{project_id}
Authorization: Bearer <token>
```

**Response:** `204 No Content`

---

## Theme Endpoints

### Get Active Theme

```http
GET /api/v1/themes/active
```

**Public endpoint** - No authentication required.

**Response:** `200 OK`

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

### List Themes

```http
GET /api/v1/themes/
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Default Theme",
    "is_active": true,
    "config": {
      "mode": "system",
      "primary": "#3b82f6"
    },
    "created_at": "2025-01-27T10:00:00Z"
  }
]
```

---

### Create Theme (Admin)

```http
POST /api/v1/themes/
Authorization: Bearer <token>
```

**Requires:** Superadmin role

**Request Body:**

```json
{
  "name": "Custom Theme",
  "is_active": false,
  "config": {
    "mode": "dark",
    "primary": "#6366f1",
    "secondary": "#8b5cf6"
  }
}
```

**Response:** `201 Created`

```json
{
  "id": 2,
  "name": "Custom Theme",
  "is_active": false,
  "config": {...},
  "created_at": "2025-01-27T10:00:00Z"
}
```

---

### Update Theme (Admin)

```http
PUT /api/v1/themes/{theme_id}
Authorization: Bearer <token>
```

**Requires:** Superadmin role

**Request Body:**

```json
{
  "name": "Updated Theme",
  "is_active": true,
  "config": {
    "primary": "#10b981"
  }
}
```

**Response:** `200 OK`

```json
{
  "id": 1,
  "name": "Updated Theme",
  "is_active": true,
  "config": {...},
  "updated_at": "2025-01-27T11:00:00Z"
}
```

---

## Admin Endpoints

### Make User Superadmin

```http
POST /api/v1/admin/make-superadmin
Authorization: Bearer <token>
```

**Requires:** Superadmin role

**Request Body:**

```json
{
  "email": "admin@example.com"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "User made superadmin successfully",
  "user_id": 2,
  "email": "admin@example.com"
}
```

---

### Get System Statistics

```http
GET /api/v1/admin/stats
Authorization: Bearer <token>
```

**Requires:** Superadmin role

**Response:** `200 OK`

```json
{
  "total_users": 150,
  "active_users": 120,
  "total_projects": 500,
  "total_subscriptions": 45,
  "active_subscriptions": 40
}
```

---

## 2FA Endpoints

### Enable 2FA

```http
POST /api/v1/auth/2fa/enable
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qr_code_url": "data:image/png;base64,...",
  "backup_codes": ["code1", "code2", ...]
}
```

---

### Verify 2FA Setup

```http
POST /api/v1/auth/2fa/verify
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "code": "123456"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

---

### Disable 2FA

```http
POST /api/v1/auth/2fa/disable
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "code": "123456"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

---

## API Keys Endpoints

### List API Keys

```http
GET /api/v1/api-keys/
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Production API Key",
    "key_prefix": "sk_live_",
    "last_used_at": "2025-01-27T10:00:00Z",
    "created_at": "2025-01-20T10:00:00Z"
  }
]
```

---

### Create API Key

```http
POST /api/v1/api-keys/
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "name": "New API Key"
}
```

**Response:** `201 Created`

```json
{
  "id": 2,
  "name": "New API Key",
  "key": "sk_live_abc123...",
  "created_at": "2025-01-27T10:00:00Z"
}
```

**⚠️ Important:** The full key is only shown once. Store it securely.

---

### Delete API Key

```http
DELETE /api/v1/api-keys/{key_id}
Authorization: Bearer <token>
```

**Response:** `204 No Content`

---

## Email Endpoints

### Send Email

```http
POST /api/email/send
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "to": "recipient@example.com",
  "subject": "Test Email",
  "html_content": "<h1>Hello</h1><p>This is a test email.</p>",
  "text_content": "Hello\nThis is a test email."
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message_id": "msg_123456"
}
```

---

### Send Welcome Email

```http
POST /api/email/welcome
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "to_email": "user@example.com",
  "name": "John Doe"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Welcome email sent"
}
```

---

### Send Invoice Email

```http
POST /api/email/invoice
Authorization: Bearer <token>
```

**Request Body:**

```json
{
  "to_email": "customer@example.com",
  "name": "John Doe",
  "invoice_number": "INV-001",
  "invoice_date": "2025-01-27",
  "amount": 99.99,
  "currency": "USD"
}
```

**Response:** `200 OK`

```json
{
  "success": true,
  "message": "Invoice email sent"
}
```

---

## Webhook Endpoints

### Stripe Webhook

```http
POST /webhooks/stripe
```

**Headers:**

```
Stripe-Signature: t=timestamp,v1=signature
```

**Request Body:** (Stripe event payload)

**Response:** `200 OK`

```json
{
  "received": true
}
```

---

## Notification Endpoints

### List Notifications

```http
GET /api/v1/notifications
```

Get user's notifications with pagination and filtering.

**Query Parameters:**

- `skip` (integer, default: 0) - Number of records to skip
- `limit` (integer, default: 100, max: 1000) - Maximum number of records
- `read` (boolean, optional) - Filter by read status (true/false)
- `notification_type` (string, optional) - Filter by type (info, success, warning, error)

**Response:**

```json
{
  "notifications": [
    {
      "id": 1,
      "user_id": 1,
      "title": "Welcome!",
      "message": "Welcome to the platform",
      "notification_type": "info",
      "read": false,
      "read_at": null,
      "action_url": "/dashboard",
      "action_label": "Go to Dashboard",
      "metadata": null,
      "created_at": "2025-01-27T10:00:00Z",
      "updated_at": "2025-01-27T10:00:00Z"
    }
  ],
  "total": 1,
  "unread_count": 1,
  "skip": 0,
  "limit": 100
}
```

### Get Unread Count

```http
GET /api/v1/notifications/unread-count
```

Get count of unread notifications for the current user.

**Response:**

```json
{
  "unread_count": 5,
  "user_id": 1
}
```

### Get Notification

```http
GET /api/v1/notifications/{notification_id}
```

Get a specific notification by ID (only if it belongs to the current user).

**Response:**

```json
{
  "id": 1,
  "user_id": 1,
  "title": "Welcome!",
  "message": "Welcome to the platform",
  "notification_type": "info",
  "read": false,
  "read_at": null,
  "action_url": "/dashboard",
  "action_label": "Go to Dashboard",
  "metadata": null,
  "created_at": "2025-01-27T10:00:00Z",
  "updated_at": "2025-01-27T10:00:00Z"
}
```

### Mark Notification as Read

```http
PATCH /api/v1/notifications/{notification_id}/read
```

Mark a notification as read.

**Response:**

```json
{
  "id": 1,
  "user_id": 1,
  "title": "Welcome!",
  "message": "Welcome to the platform",
  "notification_type": "info",
  "read": true,
  "read_at": "2025-01-27T10:05:00Z",
  "action_url": "/dashboard",
  "action_label": "Go to Dashboard",
  "metadata": null,
  "created_at": "2025-01-27T10:00:00Z",
  "updated_at": "2025-01-27T10:05:00Z"
}
```

### Mark All Notifications as Read

```http
PATCH /api/v1/notifications/read-all
```

Mark all notifications as read for the current user.

**Response:**

```json
{
  "message": "Marked 5 notifications as read",
  "count": 5
}
```

### Delete Notification

```http
DELETE /api/v1/notifications/{notification_id}
```

Delete a notification (only if it belongs to the current user).

**Response:** `204 No Content`

### Create Notification

```http
POST /api/v1/notifications
```

Create a new notification. Users can only create notifications for themselves.

**Request Body:**

```json
{
  "user_id": 1,
  "title": "New Feature Available",
  "message": "Check out our new feature!",
  "notification_type": "info",
  "action_url": "/features/new",
  "action_label": "Learn More",
  "metadata": {
    "feature_id": 123
  }
}
```

**Response:**

```json
{
  "id": 2,
  "user_id": 1,
  "title": "New Feature Available",
  "message": "Check out our new feature!",
  "notification_type": "info",
  "read": false,
  "read_at": null,
  "action_url": "/features/new",
  "action_label": "Learn More",
  "metadata": {
    "feature_id": 123
  },
  "created_at": "2025-01-27T10:10:00Z",
  "updated_at": "2025-01-27T10:10:00Z"
}
```

### WebSocket Notifications

```http
WS /api/v1/ws/notifications?token={access_token}
```

WebSocket endpoint for real-time notifications. Connect to receive notifications as they are created.

**Connection:**

- Pass JWT token as query parameter: `?token=YOUR_TOKEN`
- Supports ping/pong for keepalive
- Automatic reconnection on disconnect

**Message Types:**

- `connected` - Connection confirmed
- `notification` - New notification received
- `pong` - Response to ping
- `error` - Error message

**Example Message:**

```json
{
  "type": "notification",
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "New notification",
    "message": "You have a new message",
    "notification_type": "info",
    "read": false,
    "created_at": "2025-01-27T10:00:00Z"
  }
}
```

---

## Error Responses

All endpoints follow a standardized error format:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": {
      "resource": "user",
      "id": "123"
    }
  },
  "timestamp": "2025-01-27T10:00:00Z"
}
```

### Common Error Codes

- `BAD_REQUEST` (400) - Invalid request
- `UNAUTHORIZED` (401) - Authentication required
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `CONFLICT` (409) - Resource conflict
- `VALIDATION_ERROR` (422) - Validation failed
- `RATE_LIMIT_EXCEEDED` (429) - Too many requests
- `INTERNAL_SERVER_ERROR` (500) - Server error

---

## Rate Limiting

Most endpoints have rate limiting enabled:

- **Authentication endpoints**: 5 requests/minute
- **User endpoints**: 100 requests/hour
- **Admin endpoints**: 50 requests/hour
- **Email endpoints**: 20 requests/hour

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643200000
```

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**

- `page` (int): Page number (default: 1)
- `page_size` (int): Items per page (default: 10, max: 100)

**Response Format:**

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "page_size": 10,
  "total_pages": 10
}
```

---

## Filtering & Search

Many list endpoints support filtering:

**Query Parameters:**

- `is_active` (bool): Filter by active status
- `search` (string): Search by name/email
- `status` (enum): Filter by status
- `created_after` (datetime): Filter by creation date
- `created_before` (datetime): Filter by creation date

---

## OpenAPI Documentation

Interactive API documentation is available at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/api/v1/openapi.json

---

## Examples

### Python (httpx)

```python
import httpx

# Login
response = httpx.post(
    "http://localhost:8000/api/v1/auth/login",
    data={"username": "user@example.com", "password": "password"}
)
tokens = response.json()

# Get current user
headers = {"Authorization": f"Bearer {tokens['access_token']}"}
response = httpx.get("http://localhost:8000/api/v1/auth/me", headers=headers)
user = response.json()
```

### JavaScript (fetch)

```javascript
// Login
const loginResponse = await fetch("http://localhost:8000/api/v1/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    username: "user@example.com",
    password: "password",
  }),
});
const tokens = await loginResponse.json();

// Get current user
const userResponse = await fetch("http://localhost:8000/api/v1/auth/me", {
  headers: { Authorization: `Bearer ${tokens.access_token}` },
});
const user = await userResponse.json();
```

### cURL

```bash
# Login
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=user@example.com&password=password"

# Get current user
curl -X GET "http://localhost:8000/api/v1/auth/me" \
  -H "Authorization: Bearer <access_token>"
```

---

**Last Updated:** January 2025  
**API Version:** 1.0.0
