# Blok — full-stack visual website builder

Blok is a complete, self-hostable website builder. It has a polished marketing site, real accounts (email/password + optional Google sign-in), a drag-and-drop editor with deep styling controls, multi-page projects, autosave, and one-click publishing to a live URL.

- **Frontend:** React 18 + Vite + React Router
- **Backend:** Node + Express (REST API, JWT auth)
- **Database:** MySQL 8

---

## What you can do

- Sign up / sign in (email + password out of the box; Google OAuth optional)
- Create projects, each with multiple pages
- Drag 15+ block types onto an infinite canvas: sections, containers, columns, grid, headings, text, buttons, links, images, video embeds, icons, forms, inputs, dividers, spacers
- Style everything: fonts, weights, sizes, line-height, letter-spacing, alignment, transform, colours, solid **and gradient** backgrounds, per-side padding/margin, width/height, borders, radius, **shadows**, opacity
- Edit text inline on the canvas
- Rearrange with layers, move up/down, duplicate, copy, undo/redo (60 steps), keyboard shortcuts
- Link buttons to other pages; set a home page
- Preview at desktop / tablet / mobile widths
- **Publish** — the site is frozen into standalone HTML and served at a public URL

---

## Prerequisites

- **Node.js 18+** (uses the built-in `fetch`)
- **MySQL 8+** running locally (or reachable over the network)

---

## Setup

### 1. Configure the server

```bash
cp server/.env.example server/.env
```

Open `server/.env` and set at least:

- `DB_USER`, `DB_PASSWORD`, `DB_NAME` (defaults to `blok`)
- `JWT_SECRET` — any long random string

### 2. Install dependencies

From the project root:

```bash
npm install            # root (concurrently)
npm run install:all    # installs server + client
```

> Or install each manually: `cd server && npm install`, then `cd ../client && npm install`.

### 3. Create the database (migrate)

```bash
npm run migrate        # creates the database + tables (safe to re-run)
```

This runs `database/schema.sql` and creates the `users`, `projects`, `pages` and `publications` tables. Use `npm run migrate -- --fresh` to drop and recreate everything from scratch.

> Prefer the MySQL CLI? `mysql -u root -p < database/schema.sql` does the same thing.

### 4. (Optional) Seed demo data

```bash
npm run seed           # adds a demo account + a ready-made project
```

Then sign in with **demo@blok.dev** / **password123** to see the builder pre-loaded.

> `npm run db:reset` does a fresh migrate **and** seed in one go.

### 5. Run it

From the project root:

```bash
npm run dev
```

This starts:

- API at **http://localhost:4000**
- App at **http://localhost:5173**

Open **http://localhost:5173**, create an account, and start building.

> You can also run them separately: `npm run dev:server` and `npm run dev:client`.

---

## Publishing & live sites

When you click **Publish** in the editor, every page is rendered to standalone HTML and stored in the `publications` table. The site is then served publicly (no login) at:

```
http://localhost:4000/sites/<your-project-slug>
```

The editor shows the exact link and an **Open live site** button. Re-publish any time to push new changes. Links between pages (set via a button's **Links to**) are wired up automatically in the published output.

In production you'd point a domain at the server and map it to `/sites/<slug>` (or give each project its own subdomain).

---

## Google sign-in (optional)

Email/password works with no extra setup. To enable **Continue with Google**:

1. Go to the [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Create an **OAuth client ID** (type: *Web application*).
3. Add this **Authorized redirect URI**:
   ```
   http://localhost:4000/api/auth/google/callback
   ```
4. Copy the client ID and secret into `server/.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```
5. Restart the server. The Google button on the login/register pages activates automatically.

---

## Project structure

```
blok/
├── database/
│   └── schema.sql            # MySQL schema
├── server/                   # Express API
│   ├── .env.example
│   └── src/
│       ├── index.js          # app entry
│       ├── config.js         # env config
│       ├── db.js             # MySQL pool
│       ├── render.js         # element-tree → HTML (publishing)
│       ├── templates.js      # starter pages
│       ├── middleware/auth.js
│       └── routes/           # auth, projects, pages, publish
└── client/                   # React app (Vite)
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx           # router
        ├── api.js            # axios instance
        ├── auth.jsx          # auth context
        ├── index.css         # all styles + design tokens
        ├── lib/              # element defs + tree ops
        └── components/
            ├── Landing.jsx   # marketing site
            ├── Login.jsx / Register.jsx / AuthCallback.jsx
            ├── Dashboard.jsx
            ├── Builder.jsx   # the editor
            └── builder/      # canvas, panels, controls
```

---

## API reference (quick)

All authenticated routes take an `Authorization: Bearer <token>` header.

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current user |
| GET | `/api/auth/google` | Start Google OAuth |
| GET | `/api/projects` | List my projects |
| POST | `/api/projects` | Create a project (+ home page) |
| GET | `/api/projects/:id` | Project + all pages |
| PUT | `/api/projects/:id` | Rename / settings |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/pages/project/:projectId` | Add a page |
| PUT | `/api/pages/:pageId` | Update content / name / path |
| PUT | `/api/pages/:pageId/home` | Set as home page |
| DELETE | `/api/pages/:pageId` | Delete a page |
| POST | `/api/projects/:id/publish` | Publish (snapshot to HTML) |
| POST | `/api/projects/:id/unpublish` | Take offline |
| GET | `/sites/:slug` | **Public** live site |

---

## Notes & ideas to extend

- **Image uploads:** currently images use URLs (with Picsum placeholders). Add a `/api/uploads` route + object storage to host user images.
- **Custom domains:** map a domain to a project slug.
- **Drag-to-reorder on canvas:** the layers panel + move buttons cover reordering today; HTML5 drag reordering on the canvas is a natural next step.
- **Templates:** seed new projects from a gallery of starter layouts.

Built as a foundation you can genuinely ship on and keep extending.
