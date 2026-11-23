# Majestic Motors 2.0

A full-stack online car shop, rebuilt with a modern stack. The original v1 code is preserved in this repository's earlier commits; the API is also published on its own in [tazim5032/majestic-motors-api](https://github.com/tazim5032/majestic-motors-api).

**Live demo:** https://tazim-majestic-motors.netlify.app (runs fully in your browser; use the demo login buttons, and reset the data from the footer)

**Front end:** React 18, TypeScript, Vite, Tailwind CSS, React Router
**Back end:** Express, TypeScript, Zod validation, JWT auth, bcrypt; JSON-file database (no setup needed)

## Features

- **Shop:** home page with featured cars, body types and brands; inventory with search, filters (type, brand, price, stock), sorting and pagination; car details with specs and related cars.
- **Checkout:** stock-checked orders, delivery details, and a **simulated SurjoPay** sandbox where you can choose success, failure or cancellation. Stock is re-checked when payment completes.
- **Customer dashboard:** overview with live delivery tracking timeline, order history, profile and password change.
- **Admin dashboard:** revenue chart, revenue by body type, delivery pipeline, low-stock alerts; inventory CRUD with live preview; order management (delivery status, ETA, customer notes); customer list with deactivate/reactivate.
- Role-based routes, JWT sessions, input validation on every endpoint, responsive layout.

## Run it

```bash
npm run setup   # first time: installs root, server and client packages
npm run dev     # API on http://localhost:5050, web app on http://localhost:5173
```

Open http://localhost:5173. The login page has **Customer demo** and **Admin demo** buttons.
Demo account credentials are in `server/src/seed.ts` (local demo only).

Other scripts: `npm run typecheck`, `npm run build`, `npm run reset-data` (restore demo data).

## Notes

- Data is stored in `server/data/db.json` (created on first run). The data layer is isolated in `server/src/db.ts`, so it can be swapped for MongoDB.
- Car images are original SVG illustrations tinted with each car's paint colour; admins can also set a photo URL.
- Payments are simulated. No real payment provider is contacted.
