-- Add conta_contabil column to faturas table
ALTER TABLE public.faturas ADD COLUMN IF NOT EXISTS conta_contabil text;
