CREATE TABLE "clients" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" text NOT NULL REFERENCES "teams"("id") ON DELETE cascade,
  "name" text NOT NULL,
  "contact_email" text NOT NULL,
  "company" text,
  "notes" text,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "contracts" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "team_id" text NOT NULL REFERENCES "teams"("id") ON DELETE cascade,
  "client_id" text NOT NULL REFERENCES "clients"("id") ON DELETE cascade,
  "title" text NOT NULL,
  "contract_type" text NOT NULL,
  "content" text NOT NULL,
  "status" text DEFAULT 'draft' NOT NULL,
  "generated_by_ai" boolean DEFAULT false NOT NULL,
  "ai_prompt" text,
  "ai_model" text,
  "archived_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "contract_activities" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "contract_id" text NOT NULL REFERENCES "contracts"("id") ON DELETE cascade,
  "team_id" text NOT NULL REFERENCES "teams"("id") ON DELETE cascade,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "action" text NOT NULL,
  "details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);