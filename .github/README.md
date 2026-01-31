# GitHub Actions Workflows

This directory contains GitHub Actions workflows for CI/CD, automated testing, and deployment.

## 📋 Workflows Overview

### 1. **CI Workflow** (`workflows/ci.yml`)

Main continuous integration pipeline that runs on every push and pull request.

**Features:**

- ✅ Linting and type checking
- ✅ Frontend and backend testing
- ✅ Code coverage reporting
- ✅ Build verification
- ✅ E2E testing with Playwright

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

### 2. **PR Checks** (`workflows/pr-checks.yml`)

Comprehensive quality checks for pull requests.

**Features:**

- ✅ Code quality validation
- ✅ Test coverage reporting
- ✅ Automatic PR comments with coverage stats
- ✅ Security audit
- ✅ Build verification

**Triggers:**

- Pull request opened, updated, or marked ready for review

### 3. **Deploy** (`workflows/deploy.yml`)

Automated deployment to production environment.

**Features:**

- 🚀 Frontend deployment (Vercel, Railway, AWS S3)
- 🚀 Backend deployment (Railway, Heroku, AWS EB, Docker)
- 📊 Deployment status notifications
- 🔄 Manual deployment support

**Triggers:**

- Push to `main` branch
- Manual workflow dispatch

### 4. **Staging** (`workflows/staging.yml`)

Automated deployment to staging environment.

**Features:**

- 🧪 Staging environment deployment
- 🔗 Preview URL comments in PRs
- ✅ Pre-deployment testing

**Triggers:**

- Push to `develop` branch
- Manual workflow dispatch

### 5. **CodeQL Analysis** (`workflows/codeql.yml`)

Security and quality analysis using GitHub CodeQL.

**Features:**

- 🔒 JavaScript/TypeScript security scanning
- 🐍 Python security scanning
- 📅 Weekly scheduled scans
- 🛡️ Vulnerability detection

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Weekly schedule (Sundays)

### 6. **Dependabot Auto-merge** (`workflows/dependabot-auto-merge.yml`)

Automatically merges Dependabot PRs after checks pass.

**Features:**

- 🤖 Automatic dependency updates
- ✅ Waits for CI checks
- 🔀 Squash merge strategy

**Triggers:**

- Dependabot pull requests

## 🚀 Quick Start

### 1. Set Up Secrets

Add required secrets in GitHub repository settings:

- Go to **Settings** → **Secrets and variables** → **Actions**
- Add secrets listed in [DEPLOYMENT.md](./DEPLOYMENT.md)

### 2. Configure Environments

Create environments in GitHub:

- Go to **Settings** → **Environments**
- Create `production` and `staging` environments
- Add environment-specific secrets

### 3. Enable Dependabot

Dependabot is configured via `.github/dependabot.yml`:

- Automatically checks for updates weekly
- Creates PRs for dependency updates
- Auto-merges after CI passes

## 📊 Workflow Status

View workflow runs and status:

- **Actions tab**: See all workflow runs
- **PR checks**: View checks directly on pull requests
- **Deployment status**: Check deployment logs

## 🔧 Customization

### Adding New Platforms

To add deployment to a new platform:

1. Add deployment steps to `workflows/deploy.yml`
2. Add required secrets to GitHub
3. Update environment variables

### Modifying Test Commands

Update test commands in workflow files:

```yaml
- name: Run tests
  run: pnpm test:custom
```

### Changing Coverage Thresholds

Update thresholds in `apps/web/vitest.config.ts`:

```typescript
thresholds: {
  lines: 80,
  functions: 80,
  branches: 75,
  statements: 80,
}
```

## 📚 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Detailed deployment guide
- **[Workflow Files](./workflows/)**: Individual workflow configurations

## 🐛 Troubleshooting

### Workflow Fails

1. Check workflow logs in Actions tab
2. Verify all secrets are set correctly
3. Ensure environment variables are configured
4. Review error messages in workflow output

### Tests Fail in CI

1. Run tests locally: `pnpm test`
2. Check for environment-specific issues
3. Verify database/service dependencies
4. Review test timeout settings

### Deployment Fails

1. Check deployment platform logs
2. Verify platform credentials
3. Ensure build succeeds locally
4. Review environment variables

## 🔐 Security

- **Never commit secrets**: Always use GitHub Secrets
- **Review Dependabot PRs**: Check dependency updates before auto-merge
- **CodeQL alerts**: Review security findings regularly
- **Access control**: Limit who can trigger deployments

## 📈 Best Practices

1. ✅ **Test locally first**: Run tests before pushing
2. ✅ **Review PR checks**: Ensure all checks pass before merging
3. ✅ **Monitor deployments**: Check deployment status after merging
4. ✅ **Keep workflows updated**: Update actions and dependencies regularly
5. ✅ **Use environments**: Separate staging and production configurations

## 🆘 Support

For issues or questions:

1. Check workflow logs in GitHub Actions
2. Review [DEPLOYMENT.md](./DEPLOYMENT.md)
3. Check platform-specific documentation
4. Open an issue in the repository

## 📝 Workflow Files

- `ci.yml` - Main CI pipeline
- `pr-checks.yml` - PR quality checks
- `deploy.yml` - Production deployment
- `staging.yml` - Staging deployment
- `codeql.yml` - Security analysis
- `dependabot-auto-merge.yml` - Auto-merge Dependabot PRs

## 🔄 Workflow Dependencies

```
Push/PR → CI → PR Checks
         ↓
    Build Check
         ↓
   Deploy (main) → Production
   Staging (develop) → Staging
```

## 📊 Coverage Reports

Coverage reports are automatically:

- Generated during CI runs
- Uploaded to Codecov (if configured)
- Commented on PRs with coverage stats

## 🎯 Next Steps

1. ✅ Configure GitHub Secrets
2. ✅ Set up deployment platforms
3. ✅ Enable Dependabot
4. ✅ Test workflows with a test PR
5. ✅ Monitor first deployment
