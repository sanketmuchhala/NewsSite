# Environment Variables

---

## Next.js Frontend — `.env.local`

| Variable | Required | Description |
|---|:---:|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase web SDK API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | `[project-id].firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firestore project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ | `[project-id].appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ | Numeric sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ | Firebase web app identifier |
| `FIREBASE_PROJECT_ID` | ✅ | Admin SDK — same project ID |
| `FIREBASE_CLIENT_EMAIL` | ✅ | Admin SDK service account email |
| `FIREBASE_PRIVATE_KEY` | ✅ | Admin SDK private key (keep `\n` escapes, wrap in `"`) |
| `GEMINI_API_KEY` | ✅ | Google AI Studio key — used by Next.js API routes for re-enhancement |
| `NEXT_PUBLIC_API_URL` | — | Backend URL, e.g. `https://your-app.railway.app`. Defaults to `http://localhost:3001` |

---

## Express Backend — `backend/.env`

| Variable | Default | Description |
|---|:---:|---|
| `PORT` | `3001` | HTTP server port |
| `ALLOWED_ORIGINS` | `*` | Comma-separated list of CORS-allowed origins, e.g. `https://funnynews.club,http://localhost:3000` |
| `FIREBASE_PROJECT_ID` | **required** | Firestore project ID |
| `FIREBASE_CLIENT_EMAIL` | **required** | Service account email |
| `FIREBASE_PRIVATE_KEY` | **required** | Service account private key |
| `GROQ_API_KEY` | — | **Strongly recommended.** Llama 3.3 70B on Groq free tier. Without it, all LLM calls fall through to Gemini. Get one at [console.groq.com/keys](https://console.groq.com/keys) |
| `GEMINI_API_KEY` | **required** | Google AI Studio key — used as LLM fallback. Get at [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
| `REDDIT_CLIENT_ID` | — | Reddit OAuth app client ID. Without it, Reddit scraping is skipped |
| `REDDIT_CLIENT_SECRET` | — | Reddit OAuth app client secret |
| `SCRAPE_CRON` | `0 */2 * * *` | Cron expression for scrape schedule. Set to empty string to disable |
| `DIGEST_CRON` | `0 8 * * *` | Cron expression for daily digest generation. Set to empty string to disable |
| `SCRAPE_MAX_PER_SOURCE` | `15` | Maximum stories to import per source per scrape cycle |

### Notes

**`FIREBASE_PRIVATE_KEY`** — paste the raw private key with literal `\n` characters. Railway escapes these automatically. Vercel requires the key to be wrapped in double quotes in the dashboard.

**`GROQ_API_KEY`** — the Groq free tier gives 14,400 requests/day on Llama 3.3 70B. At 3 LLM calls per story × 15 stories × 5 sources × 12 scrape cycles/day = ~2,700 calls/day, well within the limit.

**Reddit credentials** — create a read-only script-type app at [reddit.com/prefs/apps](https://www.reddit.com/prefs/apps). The scraper uses the OAuth2 client credentials flow (no user login required).
