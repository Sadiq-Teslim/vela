-- Add pdf_theme preference to profiles
-- Lets users choose whether their generated invoices use the light or dark theme.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS pdf_theme TEXT NOT NULL DEFAULT 'light'
CHECK (pdf_theme IN ('light', 'dark'));
