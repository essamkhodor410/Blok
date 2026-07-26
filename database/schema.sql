-- ============================================================
--  Blok — database schema (PostgreSQL / Neon)
--  Run with:  npm run migrate     (uses DATABASE_URL)
--  Neon already gives you a database, so this only creates tables.
-- ============================================================

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255),                     -- null for OAuth-only accounts
  avatar_url    VARCHAR(500),
  provider      VARCHAR(20) NOT NULL DEFAULT 'local'
                CHECK (provider IN ('local','google')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- projects ----------
CREATE TABLE IF NOT EXISTS projects (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name         VARCHAR(160) NOT NULL DEFAULT 'Untitled project',
  slug         VARCHAR(80) NOT NULL UNIQUE,       -- used for the public URL
  settings     JSONB,                             -- theme, fonts, favicon, etc.
  is_published BOOLEAN NOT NULL DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_user ON projects(user_id);

-- ---------- pages ----------
CREATE TABLE IF NOT EXISTS pages (
  id          SERIAL PRIMARY KEY,
  project_id  INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        VARCHAR(160) NOT NULL DEFAULT 'Page',
  path        VARCHAR(120) NOT NULL DEFAULT 'index',
  content     JSONB NOT NULL,                     -- serialized element tree (array)
  is_home     BOOLEAN NOT NULL DEFAULT false,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, path)
);
CREATE INDEX IF NOT EXISTS idx_pages_project ON pages(project_id);

-- ---------- publications (frozen snapshot served publicly) ----------
CREATE TABLE IF NOT EXISTS publications (
  id           SERIAL PRIMARY KEY,
  project_id   INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  page_path    VARCHAR(120) NOT NULL,
  html         TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, page_path)
);
CREATE INDEX IF NOT EXISTS idx_pub_project ON publications(project_id);

-- ---------- keep updated_at fresh on UPDATE ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_projects_updated ON projects;
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_pages_updated ON pages;
CREATE TRIGGER trg_pages_updated BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
