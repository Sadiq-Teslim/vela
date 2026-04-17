-- Vela initial database schema
-- Run this in Supabase SQL Editor

-- Custom types
CREATE TYPE invoice_status AS ENUM ('DRAFT', 'SENT', 'PENDING', 'PAID', 'OVERDUE');
CREATE TYPE follow_up_type AS ENUM ('reminder_before', 'due_date', 'overdue');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  business_name TEXT,
  raenest_wallet TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Invoices
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  job_description TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USDC',
  due_date TIMESTAMPTZ NOT NULL,
  status invoice_status NOT NULL DEFAULT 'DRAFT',
  payment_tx_hash TEXT,
  pdf_url TEXT,
  sent_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID UNIQUE NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-ups
CREATE TABLE follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  type follow_up_type NOT NULL,
  sent_at TIMESTAMPTZ,
  job_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_follow_ups_invoice_id ON follow_ups(invoice_id);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Invoices: users can CRUD their own invoices
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create invoices"
  ON invoices FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own invoices"
  ON invoices FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own invoices"
  ON invoices FOR DELETE USING (auth.uid() = user_id);

-- Public read for payment pages (anyone with invoice ID can view)
CREATE POLICY "Public can view invoices by ID"
  ON invoices FOR SELECT USING (true);

-- Contracts: same as invoices
CREATE POLICY "Users can manage own contracts"
  ON contracts FOR ALL USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid())
  );

CREATE POLICY "Public can view contracts"
  ON contracts FOR SELECT USING (true);

-- Follow-ups
CREATE POLICY "Users can view own follow-ups"
  ON follow_ups FOR SELECT USING (
    invoice_id IN (SELECT id FROM invoices WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role can manage follow-ups"
  ON follow_ups FOR ALL USING (true);

-- Invoice number sequence helper
CREATE SEQUENCE invoice_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'VLA-' || LPAD(nextval('invoice_number_seq')::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
