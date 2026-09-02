# Por Favor

Your time is currency. Post a favor, offer help, earn credits.

Live: https://favorloop.vercel.app

## Vercel environment

Set these in the Vercel project (Production + Preview). Do not commit them.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `BETTER_AUTH_SECRET` | Session signing secret (`openssl rand -hex 32`) |
| `BETTER_AUTH_URL` | `https://favorloop.vercel.app` (also in `vercel.json`) |

Email and password work once those are set. Google and X need the Grok auth broker and are not wired on a personal Vercel project.
