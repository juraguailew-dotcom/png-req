# Quick Redeploy Guide for Vercel & GitHub

## ⚡ Fastest Way to Redeploy

### Option 1: Push to GitHub (Auto-Redeploy) ⭐ Recommended

```bash
# Make your code changes locally

# 1. Check what changed
git status

# 2. Add all changes
git add .

# 3. Commit with a message
git commit -m "Update: your change description"

# 4. Push to GitHub
git push origin main

# ✅ Vercel automatically redeploys within 30-60 seconds
# Watch it at: https://vercel.com/dashboard → Your Project → Deployments
```

**That's it!** No additional steps needed. Vercel watches your GitHub repo and redeploys automatically.

### Option 2: Manual Redeploy on Vercel (No Code Changes)

If you only need to redeploy without code changes:

```bash
# Method A: Using Vercel Dashboard
1. Go to https://vercel.com/dashboard
2. Select your project: "png-requisition-system"
3. Click "Deployments" tab
4. Find the latest deployment
5. Click the 3-dot menu (⋮)
6. Select "Redeploy"

# Method B: Using Vercel CLI
vercel --prod
```

### Option 3: Redeploy from Specific Git Commit

```bash
# Using Vercel Dashboard
1. Go to Deployments
2. Find the deployment you want to redeploy
3. Click 3-dot menu → "Redeploy"
# Vercel will redeploy that commit
```

---

## 📝 Step-by-Step: Make Changes & Redeploy

### Step 1: Make Code Changes Locally

```bash
# Open your editor, make changes to files
# Example: Edit app/api/test-connection/route.js

# Start dev server to test changes
npm run dev

# Test at http://localhost:3000
```

### Step 2: Verify Changes Work

```bash
# Type check
npm run type-check

# Build test
npm run build

# If no errors, you're good!
```

### Step 3: Commit & Push to GitHub

```bash
# See what changed
git status

# Add changes
git add .

# Commit with clear message
git commit -m "Fix: updated API response handling"

# Push to main branch
git push origin main
```

### Step 4: Watch Vercel Redeploy

```bash
# Option A: In browser
# Go to https://vercel.com/dashboard
# Click your project
# Watch the Deployments tab
# Should show "Building..." then "Deployed"

# Option B: Using CLI
vercel logs --follow
```

---

## 🔧 Common Redeploy Scenarios

### Scenario 1: Quick Bug Fix

```bash
# 1. Fix the bug in your editor
# 2. Test locally: npm run dev
# 3. Commit and push
git add .
git commit -m "Fix: [bug description]"
git push origin main

# ✅ Vercel redeploys automatically (1-2 min)
```

### Scenario 2: Update Environment Variables

```bash
# 1. Go to https://vercel.com/dashboard
# 2. Select project → Settings → Environment Variables
# 3. Update the variable
# 4. Click "Save"
# 5. Redeploy project (in Deployments tab, click 3-dots → Redeploy)

# Or via CLI:
vercel env add VARIABLE_NAME
vercel --prod
```

### Scenario 3: Update Dependencies

```bash
# 1. Make changes to package.json or run:
npm install new-package

# 2. Commit
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push origin main

# ✅ Vercel redeploys with new dependencies
```

### Scenario 4: Large Changes (Multiple Files)

```bash
# 1. Create a new branch (optional)
git checkout -b feature/my-feature

# 2. Make changes
# 3. Test: npm run build

# 4. Commit multiple times if needed
git add app/api/new-route/route.js
git commit -m "feat: add new API endpoint"

git add app/components/NewComponent.js
git commit -m "feat: add new component"

# 5. Push branch
git push origin feature/my-feature

# 6. Create Pull Request on GitHub (optional, for review)
# 7. Merge to main
git checkout main
git merge feature/my-feature
git push origin main

# ✅ Vercel redeploys main branch automatically
```

---

## ⚡ Super Quick Reference

| Task | Command |
|------|---------|
| Make & test changes | Edit files + `npm run dev` |
| Push to GitHub | `git add . && git commit -m "msg" && git push origin main` |
| Auto redeploy | Already happens! Just check dashboard |
| Manual redeploy | Go to Vercel dashboard → Deployments → 3-dots → Redeploy |
| Check deploy status | https://vercel.com/dashboard → Your Project → Deployments |
| View deploy logs | `vercel logs --follow` or click deployment in dashboard |
| Update env var | Vercel dashboard → Settings → Environment Variables → Redeploy |
| Rollback | Deployments → Select old deployment → 3-dots → Redeploy |

---

## 📊 Deployment Status

### Check Current Live Version
```bash
# Visit your live site
https://png-requisition-system.vercel.app
# or your custom domain

# Check version/build info
curl https://yourdomain.com/api/test-connection
```

### View Deployment History
```bash
# Using CLI
vercel list

# Or in browser
# https://vercel.com/dashboard → Project → Deployments
```

---

## 🚨 Troubleshooting Redeployment

### Issue: Vercel Build Failed

**Check what went wrong:**
1. Go to https://vercel.com/dashboard
2. Click your project
3. Click on the failed deployment
4. Scroll down to see error messages

**Common fixes:**
```bash
# TypeScript errors
npm run type-check

# Build errors
npm run build

# Missing dependencies
npm install

# Push fixes
git add .
git commit -m "Fix: build errors"
git push origin main
```

### Issue: Changes Not Showing After Redeploy

```bash
# 1. Hard refresh browser (Ctrl+Shift+Delete cache)
# 2. Wait 30 seconds for cache to clear
# 3. Check if code actually pushed:
git log --oneline -5

# 4. Verify deployment in Vercel dashboard
```

### Issue: Environment Variables Not Updating

```bash
# 1. Verify in Vercel dashboard → Settings → Environment Variables
# 2. Click the deployment to redeploy with new vars
# 3. Don't need to push to GitHub for env var changes
```

### Issue: Rollback to Previous Version

```bash
# Method 1: Using Vercel Dashboard
1. Go to Deployments
2. Find working version
3. Click 3-dots → Redeploy

# Method 2: Using Git
git log --oneline  # Find old commit
git revert <commit-hash>
git push origin main

# Vercel will redeploy from reverted commit
```

---

## 📋 Pre-Redeploy Checklist

Before pushing to production:

- [ ] Code changes tested locally: `npm run dev`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Build passes: `npm run build`
- [ ] No `console.log` or debug code left
- [ ] Environment variables are correct
- [ ] Changes committed with clear message
- [ ] Ready to push to main branch

---

## 🎯 Typical Workflow

```bash
# Day-to-day workflow
1. Make code changes
2. Test locally: npm run dev
3. Commit: git commit -m "description"
4. Push: git push origin main
5. Vercel automatically redeploys
6. Verify on live site
7. Done! ✅
```

---

## 🔗 Useful Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Your Project Deployments**: https://vercel.com/dashboard/[project-name]
- **GitHub Repository**: https://github.com/your-username/png-requisition-system
- **Live Site**: https://yourdomain.com (or your Vercel URL)

---

## 💡 Pro Tips

**Tip 1: Quick Status Check**
```bash
git status  # See what's changed
git diff    # See exact changes
git log --oneline -5  # See last 5 commits
```

**Tip 2: Undo Last Commit (Before Push)**
```bash
git reset HEAD~1
# This undoes the commit but keeps your changes
```

**Tip 3: View Vercel Logs Live**
```bash
vercel logs --follow
# Shows real-time logs as app runs
```

**Tip 4: Test Build Locally First**
```bash
npm run build
npm run start
# Test before pushing to avoid failed deploys
```

---

**That's it!** Your typical flow is:
1. Edit code
2. Push: `git push origin main`
3. Vercel automatically redeploys ✅

No additional steps needed!
