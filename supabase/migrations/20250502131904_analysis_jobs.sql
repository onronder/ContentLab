-- Create the analysis_jobs table to track analysis job status

CREATE TABLE IF NOT EXISTS analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_url TEXT NOT NULL,
  competitor_urls TEXT[] NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create RLS policies for analysis_jobs
ALTER TABLE analysis_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY analysis_jobs_select_policy ON analysis_jobs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY analysis_jobs_insert_policy ON analysis_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY analysis_jobs_update_policy ON analysis_jobs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY analysis_jobs_delete_policy ON analysis_jobs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_user_id ON analysis_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_jobs_status ON analysis_jobs(status);
