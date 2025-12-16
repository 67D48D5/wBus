# Deployment Guide

This guide covers deploying wBus to various platforms and production best practices.

## Table of Contents

- [Overview](#overview)
- [Vercel Deployment](#vercel-deployment)
- [Other Platforms](#other-platforms)
- [Environment Variables](#environment-variables)
- [Pre-deployment Checklist](#pre-deployment-checklist)
- [Post-deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Overview

wBus is built with Next.js 15 and can be deployed to any platform that supports Node.js applications. The recommended platform is Vercel for optimal performance and ease of use.

### Deployment Architecture

```
┌──────────────────────────────────────────────────────┐
│                      Vercel CDN                       │
│  (Static Assets, Edge Caching, Global Distribution)  │
└─────────────────┬────────────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────────────┐
│              Vercel Edge Network                      │
│         (Serverless Functions, ISR)                   │
└─────────────────┬────────────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────────────┐
│              AWS API Gateway                          │
│         (API Proxy, Caching, Rate Limiting)          │
└─────────────────┬────────────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────────────┐
│         Korean Public Data Portal API                 │
│           (Real-time Bus Data)                        │
└───────────────────────────────────────────────────────┘
```

## Vercel Deployment

### Method 1: Deploy via Vercel Dashboard (Recommended)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up or log in with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your wBus repository
   - Vercel will automatically detect Next.js

3. **Configure Project**

```
Framework Preset: Next.js
Root Directory: ./
Build Command: npm run build (auto-detected)
Output Directory: .next (auto-detected)
Install Command: npm install (auto-detected)
```

4. **Set Environment Variables**
   
Click "Environment Variables" and add:

```
NEXT_PUBLIC_API_URL=https://your-api-gateway-url.com
NEXT_PUBLIC_API_REFRESH_INTERVAL=3000
```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `your-project.vercel.app`

### Method 2: Deploy via Vercel CLI

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Login**

```bash
vercel login
```

3. **Deploy**

```bash
# From project root
vercel

# For production
vercel --prod
```

4. **Set Environment Variables**

```bash
vercel env add NEXT_PUBLIC_API_URL
# Enter value when prompted

vercel env add NEXT_PUBLIC_API_REFRESH_INTERVAL
# Enter value when prompted
```

### Automatic Deployments

Once connected to GitHub, Vercel automatically:

- **Production**: Deploys `main` branch to production
- **Preview**: Deploys pull requests to preview URLs
- **Rollback**: Easy rollback to previous deployments

### Custom Domain

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed
4. Wait for DNS propagation (up to 48 hours)

## Other Platforms

### Netlify

1. **netlify.toml**

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

2. **Deploy**
   - Connect GitHub repository
   - Set environment variables
   - Deploy

### AWS (EC2/Elastic Beanstalk)

1. **Build Docker Image**

```dockerfile
FROM node:20-alpine AS base

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

2. **Deploy to AWS**
   - Use Elastic Beanstalk console
   - Or use AWS CLI with `eb deploy`

### Docker Compose

```yaml
version: '3.8'
services:
  wbus:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=${API_URL}
      - NEXT_PUBLIC_API_REFRESH_INTERVAL=3000
    restart: unless-stopped
```

### Self-Hosted

```bash
# Build the application
npm run build

# Start with PM2 for process management
npm install -g pm2
pm2 start npm --name "wbus" -- start

# Or use systemd service
# Create /etc/systemd/system/wbus.service
```

**Systemd Service File:**

```ini
[Unit]
Description=wBus Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/wbus
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production
Environment=NEXT_PUBLIC_API_URL=https://your-api.com

[Install]
WantedBy=multi-user.target
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | API Gateway URL | `https://api.example.com` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_REFRESH_INTERVAL` | `3000` | Polling interval (ms) |
| `NEXT_PUBLIC_APP_NAME` | `wBus` | Application name |
| `NEXT_PUBLIC_MAP_DEFAULT_POSITION` | `37.28115,127.901946` | Map center |
| `NEXT_PUBLIC_MAP_DEFAULT_ZOOM` | `12` | Initial zoom level |

### Setting Environment Variables

**Vercel:**
```bash
vercel env add VARIABLE_NAME
```

**Netlify:**
```bash
netlify env:set VARIABLE_NAME value
```

**Docker:**
```bash
docker run -e NEXT_PUBLIC_API_URL=https://api.example.com wbus
```

## Pre-deployment Checklist

### Code Quality

- [ ] All tests pass
- [ ] No console errors in production build
- [ ] Linter passes: `npm run lint`
- [ ] TypeScript compiles without errors
- [ ] No TODO/FIXME comments in critical code

### Performance

- [ ] Bundle size analyzed
- [ ] Images optimized
- [ ] Lazy loading implemented
- [ ] Code splitting configured
- [ ] Cache headers configured

### Security

- [ ] No sensitive data in code
- [ ] Environment variables set correctly
- [ ] API keys not exposed
- [ ] HTTPS enabled
- [ ] Security headers configured

### Testing

- [ ] Tested on Chrome, Firefox, Safari
- [ ] Tested on mobile devices
- [ ] Tested with slow network
- [ ] Error scenarios tested
- [ ] 404 pages work correctly

### Documentation

- [ ] README updated
- [ ] CHANGELOG updated
- [ ] API documentation current
- [ ] Environment variables documented

## Post-deployment

### Verify Deployment

1. **Check Application**
   - Visit deployed URL
   - Test core features
   - Check browser console for errors

2. **Check Performance**
   - Run Lighthouse audit
   - Check Core Web Vitals
   - Monitor initial load time

3. **Check API**
   - Verify API connectivity
   - Check data loading
   - Test error handling

### Performance Optimization

**Vercel-specific:**

```javascript
// next.config.ts
export default {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
  compress: true,
  poweredByHeader: false,
};
```

### Caching Strategy

**Static Assets:**
```
Cache-Control: public, max-age=31536000, immutable
```

**API Responses:**
```
Cache-Control: public, s-maxage=10, stale-while-revalidate=59
```

### CDN Configuration

Configure CDN rules in Vercel:
- Cache static assets aggressively
- Use stale-while-revalidate for dynamic content
- Enable compression

## Monitoring

### Vercel Analytics

Automatically enabled on Vercel:
- Real User Monitoring (RUM)
- Core Web Vitals
- Page load times

Access at: `vercel.com/[team]/[project]/analytics`

### Custom Monitoring

Integrate third-party services:

**Sentry (Error Tracking):**
```bash
npm install @sentry/nextjs
```

**Google Analytics:**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Health Checks

Create health check endpoint:

```typescript
// app/api/health/route.ts
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
}
```

Monitor at: `https://your-domain.com/api/health`

### Uptime Monitoring

Use services like:
- UptimeRobot
- Pingdom
- StatusCake

Configure to check every 5 minutes.

## Troubleshooting

### Build Failures

**Error: Out of Memory**
```bash
# Increase Node memory
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

**Error: Module not found**
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run build
```

### Runtime Errors

**503 Service Unavailable**
- Check if deployment finished
- Verify environment variables
- Check Vercel dashboard for errors

**API Connection Errors**
- Verify API_URL is correct
- Check API Gateway status
- Review CORS configuration

### Performance Issues

**Slow Initial Load**
- Enable compression
- Optimize images
- Implement code splitting
- Check network tab in DevTools

**High Memory Usage**
- Check for memory leaks
- Implement proper cleanup in useEffect
- Use React.memo appropriately

### Rollback

**Vercel:**
1. Go to Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

**CLI:**
```bash
vercel rollback [deployment-url]
```

## Continuous Deployment

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Best Practices

1. **Use Preview Deployments**: Test changes before production
2. **Monitor Performance**: Check Core Web Vitals regularly
3. **Set Up Alerts**: Get notified of errors and downtime
4. **Review Logs**: Check deployment and runtime logs
5. **Keep Dependencies Updated**: Regular security updates
6. **Backup Data**: Regular backups of configuration
7. **Document Changes**: Maintain CHANGELOG
8. **Test Before Deploy**: Always test in preview first

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [AWS Deployment](https://aws.amazon.com/getting-started/hands-on/deploy-nextjs-app/)
- [Docker Best Practices](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)

---

**Deployment Checklist: Ready for Production! 🚀**
