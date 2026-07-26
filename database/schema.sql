-- ============================================================
--  Blok — database schema (MySQL 8+)
--  Run:  mysql -u root -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS blok
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE blok;

-- ---------- users ----------
CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(190)  NOT NULL,
  password_hash VARCHAR(255)  NULL,               -- null for OAuth-only accounts
  avatar_url    VARCHAR(500)  NULL,
  provider      ENUM('local','google') NOT NULL DEFAULT 'local',
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ---------- projects ----------
CREATE TABLE IF NOT EXISTS projects (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  name        VARCHAR(160) NOT NULL DEFAULT 'Untitled project',
  slug        VARCHAR(80)  NOT NULL,              -- used for the public URL
  settings    JSON         NULL,                  -- theme, fonts, favicon, etc.
  is_published TINYINT(1)  NOT NULL DEFAULT 0,
  published_at TIMESTAMP   NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_slug (slug),
  KEY idx_projects_user (user_id),
  CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- pages ----------
CREATE TABLE IF NOT EXISTS pages (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id  INT UNSIGNED NOT NULL,
  name        VARCHAR(160) NOT NULL DEFAULT 'Page',
  path        VARCHAR(120) NOT NULL DEFAULT 'index',   -- 'index', 'about', ...
  content     JSON         NOT NULL,                    -- serialized element tree (array)
  is_home     TINYINT(1)   NOT NULL DEFAULT 0,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pages_project_path (project_id, path),
  KEY idx_pages_project (project_id),
  CONSTRAINT fk_pages_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------- publications (frozen snapshot served publicly) ----------
CREATE TABLE IF NOT EXISTS publications (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  project_id   INT UNSIGNED NOT NULL,
  page_path    VARCHAR(120) NOT NULL,
  html         LONGTEXT     NOT NULL,
  published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pub_project_path (project_id, page_path),
  KEY idx_pub_project (project_id),
  CONSTRAINT fk_pub_project FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
) ENGINE=InnoDB;
