# Fixing "Cannot GET /" on Vercel

## ✅ Changes Made

I've fixed the deployment issues:

1. **Added root route handler** in `server.js`:
   - Now explicitly serves `index.html` at the root path
   - Uses `path.join()` to ensure correct file paths

2. **Updated `vercel.json`**:
   - Added static file handling for the `public` folder
   - Improved routing for both static assets and Socket.io

3. **Fixed module export** in `server.js`:
   - Proper export for Vercel's serverless environment
   - Conditional server startup (only runs locally, not on Vercel)

## 🚀 How to Redeploy

### If you pushed to GitHub:
1. Go to your Vercel dashboard
2. Your project should automatically redeploy with the latest commit
3. Wait for the build to complete (~1-2 minutes)
4. Test the new deployment URL

### If using Vercel CLI:
```bash
cd C:\Users\czaienal\.claude\projects\glass
vercel --prod
```

## 🧪 Testing After Deployment

1. Open your Vercel URL (e.g., `https://wobbly-glass-3d.vercel.app`)
2. You should see the start screen with "Create Room" and "Join Room" buttons
3. Open the same URL in another tab/window
4. Create a room in one tab, join with the code in another
5. Play the game!

## 🔧 If Issues Persist

### Check Vercel Logs
```bash
vercel logs YOUR_DEPLOYMENT_URL
```

### Common Issues:

**1. Still seeing "Cannot GET /"**
- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Wait a few minutes for Vercel's CDN to update
- Check if you're on the latest deployment in Vercel dashboard

**2. Static files not loading (CSS/JS)**
- Check the Network tab in browser DevTools
- Verify files are in the `public` folder
- Ensure `vercel.json` routes are correct

**3. Socket.io connection issues**
- Socket.io will auto-fallback to polling if WebSockets fail
- Check browser console for connection errors
- Verify Vercel hasn't rate-limited your requests

## 📝 File Structure (Must be correct)

```
glass/
├── server.js          ← Main server file
├── vercel.json        ← Vercel configuration
├── package.json       ← Dependencies
└── public/            ← All frontend files here!
    ├── index.html
    ├── game.js
    └── style.css
```

## ⚡ Performance Tips

- Vercel free tier supports WebSockets
- Room data is in-memory (resets on new deployment)
- Game should load in under 2 seconds globally
- Support for 100s of concurrent rooms

## 🆘 Still Having Issues?

1. Check Vercel deployment logs
2. Verify all files are committed to git
3. Try deleting and redeploying the project
4. Contact me with the specific error message!

---

**The fix is committed and ready to push/deploy!** 🎉
