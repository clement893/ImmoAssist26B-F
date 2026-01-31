# Deployment Guide

This document describes the GitHub Actions workflows for CI/CD, automated testing, and deployment.

## Workflows Overview

### 1. CI Workflow (`.github/workflows/ci.yml`)

Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**

- **Lint & Type Check**: Runs ESLint, TypeScript type checking, and Prettier formatting checks
- **Test Frontend**: Runs frontend unit tests and generates coverage reports
- **Test Backend**: Runs backend tests with PostgreSQL service
- **Build**: Builds frontend and types packages
- **E2E Tests**: Runs Playwright end-to-end tests

**Features:**

- Parallel job execution for faster CI
- Code coverage upload to Codecov
- Build artifact caching
- Playwright report uploads

### 2. PR Checks Workflow (`.github/workflows/pr-checks.yml`)

Runs on pull requests to ensure code quality before merging.

**Jobs:**

- **PR Checks**: Runs linting, type checking, formatting, and tests
- **Build Check**: Verifies the project builds successfully
- **Security Audit**: Checks for security vulnerabilities

**Features:**

- Automatic PR comments with test coverage
- Build verification
- Security vulnerability scanning

### 3. Deploy Workflow (`.github/workflows/deploy.yml`)

Deploys to production when code is pushed to `main` branch.

**Jobs:**

- **Deploy Frontend**: Deploys Next.js app to Railway
- **Deploy Backend**: Deploys FastAPI backend to Railway
- **Notify**: Sends deployment status notifications

**Platform:**

- **Frontend & Backend**: Railway (both services deployed on Railway)

### 4. Staging Workflow (`.github/workflows/staging.yml`)

Deploys to staging environment when code is pushed to `develop` branch.

**Features:**

- Automatic staging deployments
- Preview URLs in PR comments
- Test execution before deployment

### 5. CodeQL Analysis (`.github/workflows/codeql.yml`)

Runs security and quality analysis using GitHub CodeQL.

**Features:**

- JavaScript/TypeScript analysis
- Python analysis
- Weekly scheduled scans
- Security vulnerability detection

### 6. Dependabot Auto-merge (`.github/workflows/dependabot-auto-merge.yml`)

Automatically merges Dependabot PRs after all checks pass.

**Features:**

- Waits for CI checks to pass
- Auto-merges with squash merge
- Only runs for Dependabot PRs

## Setup Instructions

### 1. Required GitHub Secrets

Add these secrets to your GitHub repository settings:

#### Railway Deployment (Frontend & Backend)

```
RAILWAY_TOKEN                        # Railway API token
RAILWAY_FRONTEND_SERVICE_ID          # Railway frontend service ID (production)
RAILWAY_BACKEND_SERVICE_ID           # Railway backend service ID (production)
RAILWAY_FRONTEND_STAGING_SERVICE_ID  # Railway frontend service ID (staging)
RAILWAY_BACKEND_STAGING_SERVICE_ID   # Railway backend service ID (staging)
```

#### Environment Variables

```
NEXT_PUBLIC_API_URL  # Production API URL
NEXT_PUBLIC_APP_URL  # Production app URL
STAGING_API_URL      # Staging API URL
STAGING_APP_URL      # Staging app URL
```

#### Optional: Notifications

```
SLACK_WEBHOOK_URL    # Slack webhook for notifications
DISCORD_WEBHOOK_URL  # Discord webhook for notifications
```

#### Optional: AWS Deployment

```
AWS_ACCESS_KEY_ID           # AWS access key
AWS_SECRET_ACCESS_KEY       # AWS secret key
S3_BUCKET_NAME              # S3 bucket name
CLOUDFRONT_DISTRIBUTION_ID  # CloudFront distribution ID
EB_APPLICATION_NAME         # Elastic Beanstalk application name
EB_ENVIRONMENT_NAME         # Elastic Beanstalk environment name
```

#### Optional: Docker Deployment

```
DOCKER_USERNAME  # Docker Hub username
DOCKER_PASSWORD  # Docker Hub password
```

### 2. Environment Setup

#### GitHub Environments

Create environments in GitHub repository settings:

1. Go to Settings → Environments
2. Create `production` environment
3. Create `staging` environment
4. Add required secrets to each environment

### 3. Railway Setup

1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Link project: `railway link`
4. Get token: `railway whoami` or from Railway dashboard

### 5. Codecov Setup (Optional)

1. Sign up at [codecov.io](https://codecov.io)
2. Connect your GitHub repository
3. Copy the upload token (if needed)
4. Coverage reports will be automatically uploaded

## Workflow Triggers

### Automatic Triggers

- **Push to main**: Runs CI → Deploys to production
- **Push to develop**: Runs CI → Deploys to staging
- **Pull Request**: Runs CI and PR checks
- **Weekly**: Runs CodeQL analysis

### Manual Triggers

- **Deploy Workflow**: Can be manually triggered with environment selection
- **Staging Workflow**: Can be manually triggered

## Customization

### Adding New Deployment Platforms

1. Add deployment steps to `.github/workflows/deploy.yml`
2. Add required secrets to GitHub
3. Update environment variables as needed

### Modifying Test Commands

Update the test commands in workflow files:

```yaml
- name: Run tests
  run: pnpm test:custom
```

### Changing Coverage Thresholds

Update `vitest.config.ts`:

```typescript
thresholds: {
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80,
}
```

## Troubleshooting

### Workflow Fails on PR

1. Check PR comments for detailed error messages
2. Review workflow logs in Actions tab
3. Ensure all required secrets are set
4. Verify environment variables are correct

### Deployment Fails

1. Check deployment logs
2. Verify platform credentials
3. Check environment variables
4. Ensure build succeeds locally

### Tests Fail in CI

1. Compare with local test results
2. Check for environment-specific issues
3. Verify database/service dependencies
4. Review test timeout settings

## Best Practices

1. **Never commit secrets**: Always use GitHub Secrets
2. **Test locally first**: Run tests before pushing
3. **Review PR checks**: Ensure all checks pass before merging
4. **Monitor deployments**: Check deployment status after merging
5. **Keep workflows updated**: Update dependencies regularly

## Support

For issues or questions:

1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Check platform-specific documentation
4. Open an issue in the repository
