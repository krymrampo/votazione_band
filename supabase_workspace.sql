-- Run after supabase_schema.sql. Safe to rerun; existing songs/votes are preserved.
BEGIN;

CREATE TABLE IF NOT EXISTS public.band_setlist (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  song_ids UUID[] NOT NULL DEFAULT '{}',
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0)
);
INSERT INTO public.band_setlist (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.band_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  body TEXT NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 20000),
  song_id UUID REFERENCES public.songs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS band_notes_song_id_idx ON public.band_notes(song_id);

ALTER TABLE public.band_setlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Band setlist read" ON public.band_setlist;
CREATE POLICY "Band setlist read" ON public.band_setlist FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Band setlist update" ON public.band_setlist;
CREATE POLICY "Band setlist update" ON public.band_setlist FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Band notes access" ON public.band_notes;
CREATE POLICY "Band notes access" ON public.band_notes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
GRANT SELECT, UPDATE ON public.band_setlist TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.band_notes TO anon, authenticated;

-- The revision filter in UPDATE is the compare-and-swap guard between clients.
CREATE OR REPLACE FUNCTION public.validate_band_setlist() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.revision <> OLD.revision + 1 THEN
    RAISE EXCEPTION 'Setlist revision must increase by one';
  END IF;
  NEW.song_ids := ARRAY(
    SELECT song_id FROM unnest(NEW.song_ids) WITH ORDINALITY AS entries(song_id, position)
    JOIN public.songs ON songs.id = entries.song_id
    GROUP BY song_id ORDER BY min(position)
  );
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS validate_band_setlist ON public.band_setlist;
CREATE TRIGGER validate_band_setlist BEFORE UPDATE ON public.band_setlist
FOR EACH ROW EXECUTE FUNCTION public.validate_band_setlist();

COMMIT;
