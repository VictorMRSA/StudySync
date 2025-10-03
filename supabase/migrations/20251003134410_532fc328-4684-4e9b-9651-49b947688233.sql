-- Add feedback column to ai_summaries table
ALTER TABLE ai_summaries 
ADD COLUMN IF NOT EXISTS user_feedback TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN ai_summaries.user_feedback IS 'User feedback about the AI-generated summary to improve future analyses';