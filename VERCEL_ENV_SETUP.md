# Environment Variables for Vercel

## Required Configuration

Add this environment variable in your Vercel project settings:

**Variable Name:** `VITE_API_URL`  
**Value:** `http://34.228.155.98:3000`  
**Environments:** Production, Preview, Development (check all)

## How to Configure in Vercel

1. Go to https://vercel.com/dashboard
2. Select your `sales-forecasting-platform` project
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - Name: `VITE_API_URL`
   - Value: `http://34.228.155.98:3000`
   - Check all environment boxes
6. Click **Save**
7. Go to **Deployments** tab
8. Click **⋯** on latest deployment → **Redeploy**

## Verification

After redeployment completes (~2 minutes):
- Navigate to your Vercel URL
- Login should now work with backend at `http://34.228.155.98:3000`
- Check browser console (F12) to verify API calls are going to the correct URL

## Backend Status

Your EC2 security group shows port 3000 is open ✅

Make sure the backend is running on EC2:
```bash
pm2 status
# Should show "sales-backend" as "online"
```
