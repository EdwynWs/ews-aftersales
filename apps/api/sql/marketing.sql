CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS marketing_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  company VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  team_size VARCHAR(40) NOT NULL,
  message VARCHAR(1500),
  consent BOOLEAN NOT NULL CHECK (consent = TRUE),
  source VARCHAR(30) NOT NULL DEFAULT 'landing',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS marketing_leads_created_idx ON marketing_leads(created_at DESC);
