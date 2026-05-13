# Production Environment Variables

This file documents all environment variables needed for production deployment.

## Supabase Configuration
```env
# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase anonymous key (safe to expose to browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Supabase service role key (KEEP SECRET - server-side only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Email Configuration (Resend)
```env
# Resend API key for sending emails
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx

# Email address to send from
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## Application Configuration
```env
# Your production domain
NEXT_PUBLIC_APP_URL=https://app.yourdomain.com

# Node environment
NODE_ENV=production
```

## Optional Configuration
```env
# API rate limiting (requests per minute per user)
API_RATE_LIMIT=100

# API timeout in milliseconds
API_TIMEOUT=30000

# Enable detailed error messages (disable in production)
DEBUG=false
```

## Getting These Values

### From Supabase
1. Go to [supabase.com](https://supabase.com)
2. Select your project
3. Go to Project Settings → API
4. Copy `Project URL` and `anon public key`
5. Copy `service_role key` (keep this secret!)

### From Resend
1. Go to [resend.com](https://resend.com)
2. Click on API Keys
3. Create or copy your API key
4. Verify your domain is set up

## Setting Environment Variables on Vercel

### Option 1: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Select your project
3. Go to Settings → Environment Variables
4. Add each variable with its value
5. Redeploy the project

### Option 2: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variable
vercel env add NEXT_PUBLIC_SUPABASE_URL

# Select environment (production, preview, development)
# Enter the value when prompted
```

## Verification

After setting environment variables, verify they're loaded:

```bash
# On your deployment, visit the test endpoint
curl https://yourdomain.com/api/test-connection
```

Expected response:
```json
{
  "status": "ok",
  "supabase": "connected",
  "app_url": "https://yourdomain.com"
}
```

## Security Best Practices

⚠️ **IMPORTANT**: 
- Never commit `.env.local` to Git
- Never share `SUPABASE_SERVICE_ROLE_KEY` publicly
- Use different keys for staging and production
- Rotate keys periodically
- Enable RLS policies in Supabase for data protection
