-- Trading Discipline Tracker Database Schema
-- Supabase PostgreSQL Migration

-- 1. Create daily_checkins table
CREATE TABLE IF NOT EXISTS public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  trade_count INTEGER NOT NULL CHECK (trade_count >= 0),
  urge_level TEXT NOT NULL CHECK (urge_level IN ('Low', 'Moderate', 'Strong')),
  stopped_as_planned BOOLEAN NOT NULL,
  impulsive_risk_increase BOOLEAN NOT NULL,
  work_distraction TEXT NOT NULL CHECK (work_distraction IN ('Yes', 'No', 'Not applicable')),
  followed_setups BOOLEAN NOT NULL,
  tempted_after_wins BOOLEAN NOT NULL,
  trigger_notes TEXT,
  daily_notes TEXT,
  tomorrow_improvement TEXT,
  discipline_score INTEGER CHECK (discipline_score IS NULL OR (discipline_score >= 0 AND discipline_score <= 100)),
  known_rules_count INTEGER NOT NULL DEFAULT 4 CHECK (known_rules_count >= 0 AND known_rules_count <= 4),
  ai_report JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_checkin_date UNIQUE (checkin_date)
);

-- Index for date queries
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON public.daily_checkins (checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user ON public.daily_checkins (user_id);

-- 2. Create monthly_reviews table
CREATE TABLE IF NOT EXISTS public.monthly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  review_month TEXT NOT NULL, -- Format: 'YYYY-MM'
  recorded_days INTEGER NOT NULL DEFAULT 0,
  total_trades INTEGER NOT NULL DEFAULT 0,
  avg_trades_per_day NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  over_two_trades_days INTEGER NOT NULL DEFAULT 0,
  over_two_trades_pct NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  impulsive_risk_days INTEGER NOT NULL DEFAULT 0,
  planned_setup_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  stopped_planned_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  work_distraction_count INTEGER NOT NULL DEFAULT 0,
  tempted_after_wins_count INTEGER NOT NULL DEFAULT 0,
  avg_discipline_score NUMERIC(5, 2),
  best_day JSONB,
  worst_day JSONB,
  ai_review JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_review_month UNIQUE (review_month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_reviews_month ON public.monthly_reviews (review_month DESC);
CREATE INDEX IF NOT EXISTS idx_monthly_reviews_user ON public.monthly_reviews (user_id);

-- 3. Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_daily_checkins_updated_at ON public.daily_checkins;
CREATE TRIGGER set_daily_checkins_updated_at
BEFORE UPDATE ON public.daily_checkins
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_monthly_reviews_updated_at ON public.monthly_reviews;
CREATE TRIGGER set_monthly_reviews_updated_at
BEFORE UPDATE ON public.monthly_reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_reviews ENABLE ROW LEVEL SECURITY;

-- 5. Strict RLS Policies for private single-user access
-- Allows access only if authenticated user owns the record or for single-user setup
DROP POLICY IF EXISTS "Allow user to view their daily checkins" ON public.daily_checkins;
CREATE POLICY "Allow user to view their daily checkins"
  ON public.daily_checkins
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow user to insert their daily checkins" ON public.daily_checkins;
CREATE POLICY "Allow user to insert their daily checkins"
  ON public.daily_checkins
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow user to update their daily checkins" ON public.daily_checkins;
CREATE POLICY "Allow user to update their daily checkins"
  ON public.daily_checkins
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow user to delete their daily checkins" ON public.daily_checkins;
CREATE POLICY "Allow user to delete their daily checkins"
  ON public.daily_checkins
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Monthly reviews RLS
DROP POLICY IF EXISTS "Allow user to view their monthly reviews" ON public.monthly_reviews;
CREATE POLICY "Allow user to view their monthly reviews"
  ON public.monthly_reviews
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow user to insert their monthly reviews" ON public.monthly_reviews;
CREATE POLICY "Allow user to insert their monthly reviews"
  ON public.monthly_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow user to update their monthly reviews" ON public.monthly_reviews;
CREATE POLICY "Allow user to update their monthly reviews"
  ON public.monthly_reviews
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Allow user to delete their monthly reviews" ON public.monthly_reviews;
CREATE POLICY "Allow user to delete their monthly reviews"
  ON public.monthly_reviews
  FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);
