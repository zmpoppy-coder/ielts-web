
CREATE TABLE public.speaking_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  part TEXT NOT NULL CHECK (part IN ('part1', 'part2')),
  question TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.speaking_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read speaking questions"
  ON public.speaking_questions
  FOR SELECT
  USING (true);

-- Insert default Part 1 topics
INSERT INTO public.speaking_questions (part, question) VALUES
('part1', 'Do you work or are you a student?'),
('part1', 'What do you do for work?'),
('part1', 'Why did you choose that job?'),
('part1', 'What subjects are you studying?'),
('part1', 'Why did you choose to study that subject?'),
('part1', 'Where is your hometown?'),
('part1', 'What do you like about your hometown?'),
('part1', 'Has your hometown changed much in recent years?'),
('part1', 'Would you recommend your hometown to visitors?'),
('part1', 'Do you live in a house or an apartment?'),
('part1', 'What is your favorite room in your home?'),
('part1', 'Would you like to move to a different place in the future?'),
('part1', 'What makes you feel happy?'),
('part1', 'Do you think money can make people happy?'),
('part1', 'Is there anything that made you happy recently?'),
('part1', 'What kind of weather do you like?'),
('part1', 'Does the weather affect your mood?'),
('part1', 'What is the weather usually like in your hometown?'),
('part1', 'What kind of music do you like?'),
('part1', 'Have you ever learned to play a musical instrument?'),
('part1', 'Do you like listening to music while studying or working?'),
('part1', 'How do you usually get to work or school?'),
('part1', 'Do you prefer public transport or private transport?'),
('part1', 'What is the traffic like in your city?'),
('part1', 'Do you use social media often?'),
('part1', 'What social media platforms do you use?'),
('part1', 'Do you think social media is a waste of time?'),
('part1', 'Do you like cooking?'),
('part1', 'What is your favorite dish to cook?'),
('part1', 'Did you learn to cook when you were young?');

-- Insert default Part 2 topics
INSERT INTO public.speaking_questions (part, question) VALUES
('part2', 'Describe a time when you helped someone. You should say: who you helped, how you helped them, why you helped them, and explain how you felt about it.'),
('part2', 'Describe a place you visited that was crowded. You should say: where it was, when you went there, what you did there, and explain how you felt about the crowd.'),
('part2', 'Describe a person you know who speaks a foreign language well. You should say: who this person is, what language they speak, how they learned it, and explain why you think they speak it well.'),
('part2', 'Describe a time when you were very busy. You should say: when it was, what you had to do, how you managed your time, and explain how you felt about being busy.'),
('part2', 'Describe an interesting old person you met. You should say: who this person was, where you met them, what you talked about, and explain why you found them interesting.'),
('part2', 'Describe a gift you gave to someone. You should say: what the gift was, who you gave it to, why you chose that gift, and explain how the person reacted.'),
('part2', 'Describe a piece of technology you find useful. You should say: what it is, when you started using it, how often you use it, and explain why you find it useful.'),
('part2', 'Describe a time when you changed your plan. You should say: what the original plan was, why you changed it, what you did instead, and explain how you felt about the change.'),
('part2', 'Describe a place in your country you would like to visit. You should say: where it is, what you know about it, how you would travel there, and explain why you want to visit it.'),
('part2', 'Describe an activity you do to keep fit. You should say: what the activity is, when you started doing it, how often you do it, and explain why you think it helps you keep fit.');
