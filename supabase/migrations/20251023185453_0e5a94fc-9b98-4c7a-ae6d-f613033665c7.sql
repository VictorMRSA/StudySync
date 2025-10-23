-- Create quiz_question_results table to track detailed quiz answers
CREATE TABLE quiz_question_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  user_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_quiz_question_results_session ON quiz_question_results(quiz_session_id);
CREATE INDEX idx_quiz_question_results_incorrect ON quiz_question_results(quiz_session_id, is_correct) WHERE is_correct = false;

-- Enable RLS
ALTER TABLE quiz_question_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own question results
CREATE POLICY "Users can view own question results"
  ON quiz_question_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions
      WHERE quiz_sessions.id = quiz_question_results.quiz_session_id
        AND quiz_sessions.user_id = auth.uid()
    )
  );

-- Policy: Users can insert their own question results
CREATE POLICY "Users can insert own question results"
  ON quiz_question_results FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_sessions
      WHERE quiz_sessions.id = quiz_question_results.quiz_session_id
        AND quiz_sessions.user_id = auth.uid()
    )
  );