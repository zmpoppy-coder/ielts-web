
ALTER TABLE public.speaking_questions RENAME COLUMN part TO category;
ALTER TABLE public.speaking_questions RENAME COLUMN question TO title;
ALTER TABLE public.speaking_questions ADD COLUMN content text;
