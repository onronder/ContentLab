-- Add content fields to analysis_jobs table if they don't exist

DO $$ 
BEGIN
  -- Check if content_gaps column exists, add it if not
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_jobs' AND column_name = 'content_gaps') THEN
    ALTER TABLE analysis_jobs ADD COLUMN content_gaps TEXT[];
  END IF;

  -- Check if popular_themes column exists, add it if not
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'analysis_jobs' AND column_name = 'popular_themes') THEN
    ALTER TABLE analysis_jobs ADD COLUMN popular_themes TEXT[];
  END IF;
END
$$;
