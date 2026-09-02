# FavorLoop

**Your time is currency.**

A mobile-first social marketplace for real-world favors.

## Run the demo

The built app lives in `dist/`.

```bash
cd favorloop/dist
python3 -m http.server 4173
```

Open http://localhost:4173

## Develop

```bash
npm install
npm run dev
```

## Demo login

- Email: `yasar@favorloop.app`
- Password: `loop`
- Or tap **Continue as Yasar**

New accounts receive 3 promotional starter credits.

## Core loop

Discover → Offer help → Chat → Mark completed → Credits transfer → Rate → Trust updates

Favor Credits are not cash. Balances change only inside `src/store.tsx`.

## Live data

On every load FavorLoop:

1. Detects the visitor city via IP (`ipwho.is`)
2. Loads a stable set of real portraits and names from Random User (`seed=favorloop-v5`)
3. Places those neighbors around the visitor and computes walking distances
4. Falls back to a baked snapshot of the same people if the network is blocked

Your own posts, credits, chats, and ratings stay in this browser.
