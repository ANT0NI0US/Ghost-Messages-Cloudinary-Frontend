# Ghost Messages — Web

The web client for Ghost Messages, an anonymous messaging app (the Express / MongoDB / Redis API lives in its own repository). Share your link, receive messages with no name attached, ask a sender to talk, and chat if they accept. Fully bilingual (Arabic RTL / English) with light and dark themes.

Built with React 19, Vite, Tailwind CSS 4 and React Router. No UI kit: every component is in `src/components`.

| | |
|---|---|
| Live app | [ghost-messages-cloudinary-frontend.vercel.app](https://ghost-messages-cloudinary-frontend.vercel.app/) |
| API (Node.js / Express) | [ANT0NI0US/Ghost-Messages-Cloudinary-Backend](https://github.com/ANT0NI0US/Ghost-Messages-Cloudinary-Backend) · [live](https://ghost-messages-cloudinary.vercel.app/) |
| Demo video | [Watch on LinkedIn](https://lnkd.in/p/eFTp7mVX) |

## What's inside

| Page | Route | Backend endpoints |
|---|---|---|
| Landing | `/` | — |
| Sign up → confirm email (OTP) | `/signup`, `/confirm-email` | `POST /auth/signup`, `PATCH /auth/confirm-email`, `PATCH /auth/resend-confirm-email` |
| Log in → two-step code | `/login`, `/login/verify` | `POST /auth/login`, `PATCH /auth/login-confirmation`, `POST /auth/signup-with-gmail` |
| Forgot / reset password (email link) | `/forgot-password`, `/reset-password/:token` | `POST /auth/forgot-password`, `PATCH /auth/reset-password/:token` |
| Public page (anyone can write) | `/u/:userId` | `GET /user/:userId/share-profile`, `POST /message` |
| Inbox (received / sent) | `/inbox` | `GET /message/all` |
| Message | `/messages/:id` | `GET /message/:id`, `DELETE /message/:id`, `POST /request/create` |
| Chat requests | `/requests` | `GET /request/all`, `POST /request/action` |
| Chat | `/chat/:messageId` | `GET /conversation/all`, `POST /conversation/create` |
| Settings | `/settings` | `PATCH /user/update`, profile & cover images, two-step verification, logout (device / all) |
| Admin | `/admin` | `GET /user/all`, `PATCH /user/:id/status`, `DELETE /user/:id` |

How it talks to the API (`src/api/client.js`):

- Sends `accept-language: 0 | 1` with every request, so the backend's own messages (toasts, validation errors) come back in the UI language.
- Shows backend validation issues under the matching form fields.
- When the access token expires, it calls `/auth/rotate-token` once with the refresh token and retries. If the session was revoked (password reset, logout from all devices) it signs out.

## Run locally

Requirements: Node 20+ and the backend running (default `http://localhost:4000`).

```bash
npm install
cp .env.example .env   # optional in development
npm run dev            # http://localhost:3000
```

The dev server runs on port 3000 because the backend's development `FRONTEND_URL` is `http://localhost:3000`, so password-reset links open here.

In development the app calls `/api/...` and Vite proxies it to `DEV_BACKEND_URL`. The backend's rate limiter keys requests by IP, and its optional Egypt-only rule needs a real one: `localhost` has no country, so the proxy sends an `x-forwarded-for` header with `DEV_FORWARDED_IP`.

## Environment

| Variable | Where | Purpose |
|---|---|---|
| `VITE_API_URL` | production | Full backend URL, e.g. `https://your-api.example.com`. Empty in development. |
| `VITE_GOOGLE_CLIENT_ID` | optional | Shows "Sign in with Google". Must also be in the backend's `WEB_CLIENT_IDS`. |
| `DEV_BACKEND_URL` | development | Where the Vite proxy sends `/api` (default `http://localhost:4000`). |
| `DEV_FORWARDED_IP` | development | IP the proxy presents to the backend rate limiter. |

`.env` and `.env.production` stay out of git. `VITE_` values are built into the public JavaScript bundle, so never put a secret in one.

## Deploy (Vercel)

1. Import the repo in Vercel. Framework preset: **Vite** (build `npm run build`, output `dist`).
2. In the Vercel project settings, set `VITE_API_URL` to the deployed backend URL (and `VITE_GOOGLE_CLIENT_ID` for Google sign-in).
3. **Redeploy** after changing them: Vite writes these values into the bundle at build time, so a running deployment keeps the old ones.
4. Set the backend's `FRONTEND_URL` to the Vercel URL so reset links point to it.
5. For Google sign-in, add the Vercel URL to the OAuth client's **Authorized JavaScript origins** in Google Cloud Console.

`vercel.json` rewrites every path to `index.html`, so deep links like `/u/<id>` and `/reset-password/<token>` work on refresh.

## Project structure

```
src/
  api/          client.js (fetch, language header, token rotation), endpoints.js (every backend call)
  auth/         AuthProvider (session), RequireAuth / GuestOnly route guards
  components/   AppShell, LanternHero, VeiledMessage, CopyLink, GoogleButton, Toast, ui (buttons, fields, tabs…)
  i18n/         en.js, ar.js, I18nProvider (t(), RTL switch, date formatting)
  lib/          enums (mirrors the backend), storage, useSubmit, opened (which messages you've read)
  pages/        one file per screen
```
