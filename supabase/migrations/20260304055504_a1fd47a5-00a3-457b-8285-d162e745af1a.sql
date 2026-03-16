
-- Drop the restrictive policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can read speaking questions" ON public.speaking_questions;
CREATE POLICY "Allow public read speaking_questions"
  ON public.speaking_questions
  FOR SELECT
  TO anon, authenticated
  USING (true);
