# Deploying Wobbly Glass 3D to Vercel

## Prerequisites

1. Install Vercel CLI globally:
   ```bash
   npm install -g vercel
   ```

2. Create a Vercel account at https://vercel.com if you don't have one

## Deployment Steps

### Option 1: Deploy via CLI (Recommended)

1. Navigate to the project directory:
   ```bash
   cd C:\Users\czaienal\.claude\projects\glass
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the project:
   ```bash
   vercel
   ```

   - Follow the prompts
   - Select your Vercel account
   - Confirm the project settings
   - Wait for deployment to complete

4. For production deployment:
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub

1. Create a new GitHub repository
2. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Wobbly Glass 3D"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

3. Go to https://vercel.com/dashboard
4. Click "Import Project"
5. Import your GitHub repository
6. Vercel will automatically detect the configuration
7. Click "Deploy"

### Option 3: Deploy via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Select "Import from Git" or drag your project folder
4. Vercel will auto-configure based on `vercel.json`
5. Click "Deploy"

## Environment Configuration

No environment variables needed for basic deployment! The game uses in-memory storage.

## Post-Deployment

After deployment, you'll get a URL like:
```
https://wobbly-glass-3d.vercel.app
```

Share this URL with friends to play together in real-time!

## Troubleshooting

### WebSocket Connection Issues

If you experience WebSocket issues on Vercel, note that:
- Vercel supports WebSockets on all plans
- Socket.io will automatically fall back to polling if needed
- The game should work seamlessly

### Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow Vercel's DNS configuration instructions

## Monitoring

- View logs: `vercel logs <deployment-url>`
- Check analytics in Vercel dashboard
- Monitor real-time connections

## Updating the Deployment

After making changes:

```bash
vercel --prod
```

This will create a new production deployment with your updates.

## Performance Notes

- The game is lightweight and runs efficiently on Vercel
- WebSocket connections are handled automatically
- No database = no additional configuration needed
- Room data is stored in memory (resets on deployment)

## Cost

- Vercel Hobby plan is FREE
- Includes:
  - Unlimited deployments
  - Automatic HTTPS
  - WebSocket support
  - Global CDN

Perfect for this game! 🎮
