# FlexFit AI

FlexFit AI is a privacy-first fitness assistant with real-time pose detection, workout libraries, and progress tracking.

**Highlights**
- AI pose detection with real-time feedback
- Workout library for home and gym exercises
- Progress dashboard with session summaries
- Leaderboards and profile management
- PWA install support

**Tech Stack**
- React (Create React App)
- Supabase (auth + database)
- TensorFlow.js + MoveNet
- Pexels video previews (via server-side proxy)

**Getting Started**
1. Install dependencies:
```bash
npm install
```
2. Create an environment file:
```bash
copy .env.example .env
```
3. Fill in the required values in `.env`.
4. Start the dev server:
```bash
npm start
```

**Environment Variables**
- `REACT_APP_SUPABASE_URL`: Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Supabase anon key
- `PEXELS_API_KEY`: Server-side key for the Pexels proxy
- `REACT_APP_PEXELS_PROXY`: Set to `1` to force proxy usage (default)

**Scripts**
- `npm start` - Run the app in development
- `npm test` - Run the test suite
- `npm run build` - Build for production

**Pexels Proxy**
Video previews use the `/api/pexels` proxy to avoid exposing API keys in the browser.  
Set `PEXELS_API_KEY` in your environment when running the proxy (Vercel, server, or local dev).

**Deployment**
Deploy to Vercel or any static host that supports serverless functions for `api/pexels.js`.  
Make sure `PEXELS_API_KEY` is set in your deployment environment.

**Security Note**
Never commit real secrets to git. Rotate any keys that were accidentally exposed.
