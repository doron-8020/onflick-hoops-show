ALTER TABLE public.videos DROP CONSTRAINT videos_user_id_fkey;
ALTER TABLE public.videos ADD CONSTRAINT videos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(user_id);