CREATE TABLE plans (
  id text PRIMARY KEY, name text NOT NULL, monthly_cents integer NOT NULL CHECK(monthly_cents>0),
  setup_cents integer NOT NULL CHECK(setup_cents>=0), equipment_limit integer NOT NULL CHECK(equipment_limit>0),
  user_limit integer NOT NULL CHECK(user_limit>0), features jsonb NOT NULL DEFAULT '[]',
  active boolean NOT NULL DEFAULT true, revision integer NOT NULL DEFAULT 1
);
INSERT INTO plans VALUES
('start','Start',44900,150000,150,3,'["equipment","documents","requests"]',true,1),
('growth','Growth',99000,300000,1000,10,'["equipment","documents","requests","parts","quotes","tickets","reports"]',true,1),
('industry','Industry',219000,600000,5000,30,'["equipment","documents","requests","parts","quotes","tickets","reports","advanced_roles"]',true,1);
CREATE TABLE users (
  id uuid PRIMARY KEY, name text NOT NULL, email text UNIQUE NOT NULL,
  password_hash text NOT NULL, verified_at timestamptz, is_ews_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE organizations (
  id uuid PRIMARY KEY, name text NOT NULL, cnpj text UNIQUE NOT NULL, phone text NOT NULL,
  brand_name text NOT NULL DEFAULT '', brand_color text NOT NULL DEFAULT '#1564e8',
  support_email text NOT NULL DEFAULT '', support_phone text NOT NULL DEFAULT '', hours text NOT NULL DEFAULT '',
  onboarding_step integer NOT NULL DEFAULT 0 CHECK(onboarding_step BETWEEN 0 AND 2),
  admin_suspended boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE memberships (
  org_id uuid NOT NULL REFERENCES organizations, user_id uuid NOT NULL REFERENCES users,
  role text NOT NULL CHECK(role IN ('admin','commercial','support','technician')),
  PRIMARY KEY(org_id,user_id)
);
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY, org_id uuid UNIQUE NOT NULL REFERENCES organizations,
  plan_id text NOT NULL REFERENCES plans, plan_snapshot jsonb NOT NULL,
  state text NOT NULL DEFAULT 'awaiting_payment' CHECK(state IN ('awaiting_payment','partially_paid','active','past_due','cancel_scheduled','cancelled','suspended')),
  gateway_customer text, gateway_subscription text UNIQUE, checkout_started_at timestamptz,
  billing_type text CHECK(billing_type IN ('PIX','BOLETO')),
  activated_at timestamptz, paid_until date, cancel_at date,
  terms_version text NOT NULL, terms_accepted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  org_id uuid REFERENCES organizations, csrf text NOT NULL, expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE auth_tokens (
  token_hash text PRIMARY KEY, user_id uuid NOT NULL REFERENCES users ON DELETE CASCADE,
  kind text NOT NULL CHECK(kind IN ('verify','reset','admin_mfa')), expires_at timestamptz NOT NULL,
  used_at timestamptz
);
CREATE TABLE invitations (
  id uuid PRIMARY KEY, org_id uuid NOT NULL REFERENCES organizations, email text NOT NULL,
  role text NOT NULL CHECK(role IN ('admin','commercial','support','technician')),
  token_hash text UNIQUE NOT NULL, expires_at timestamptz NOT NULL, accepted_at timestamptz,
  UNIQUE(org_id,email)
);
CREATE TABLE charges (
  id uuid PRIMARY KEY, org_id uuid NOT NULL REFERENCES organizations,
  subscription_id uuid NOT NULL REFERENCES subscriptions, gateway_id text UNIQUE NOT NULL,
  kind text NOT NULL CHECK(kind IN ('setup','recurring')), amount_cents integer NOT NULL CHECK(amount_cents>=0),
  status text NOT NULL, due_date date NOT NULL, invoice_url text,
  confirmed_at timestamptz, reconciled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(org_id,id)
);
CREATE UNIQUE INDEX one_setup ON charges(subscription_id) WHERE kind='setup';
CREATE INDEX charges_period ON charges(subscription_id,due_date);
CREATE TABLE gateway_commands (
  id uuid PRIMARY KEY, org_id uuid NOT NULL REFERENCES organizations, step text NOT NULL,
  external_reference text UNIQUE NOT NULL, state text NOT NULL DEFAULT 'new',
  gateway_id text, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(org_id,step)
);
CREATE TABLE webhook_events (
  id text PRIMARY KEY, event text NOT NULL, resource_id text, resource_kind text NOT NULL,
  payload jsonb NOT NULL, received_at timestamptz NOT NULL DEFAULT now(), processed_at timestamptz
);
CREATE TABLE jobs (
  id uuid PRIMARY KEY, kind text NOT NULL, dedupe_key text UNIQUE NOT NULL, payload jsonb NOT NULL,
  attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz, locked_by uuid, completed_at timestamptz, error_code text
);
CREATE INDEX pending_jobs ON jobs(available_at) WHERE completed_at IS NULL;
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY, org_id uuid REFERENCES organizations, actor_id uuid REFERENCES users,
  action text NOT NULL, detail jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE commercial_leads (
  id uuid PRIMARY KEY, name text NOT NULL, email text NOT NULL, company text NOT NULL,
  message text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE service_requests (
  id uuid PRIMARY KEY, org_id uuid NOT NULL REFERENCES organizations, user_id uuid NOT NULL REFERENCES users,
  kind text NOT NULL CHECK(kind IN ('upgrade','support','privacy')), message text NOT NULL,
  state text NOT NULL DEFAULT 'open', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE FUNCTION tenant_visible(tenant uuid) RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.system',true) = 'yes' OR tenant::text = current_setting('app.org_id',true)
$$;
DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['organizations','memberships','subscriptions','invitations','charges','gateway_commands','audit_logs','service_requests'] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY',t);
    EXECUTE format('CREATE POLICY tenant_isolation ON %I USING (tenant_visible(%I)) WITH CHECK (tenant_visible(%I))',t,CASE WHEN t='organizations' THEN 'id' ELSE 'org_id' END,CASE WHEN t='organizations' THEN 'id' ELSE 'org_id' END);
  END LOOP;
END $$;
-- API role must exist before migrations. Never run the API with the migration/superuser role.
GRANT USAGE ON SCHEMA public TO ews_app;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO ews_app;
REVOKE UPDATE,DELETE ON audit_logs FROM ews_app;
