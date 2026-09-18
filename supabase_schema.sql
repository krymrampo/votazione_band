-- ==============================================================================
-- SCHEMA SUPABASE: Votazione Brani Band
-- Incolla ed esegui questo script nell'SQL Editor di Supabase (https://supabase.com)
-- ==============================================================================

-- 1. Tabella dei brani proposti
CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabella dei voti (1 a 4 stelle)
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 4),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(song_id, member_name)
);

-- 3. Abilitazione Row Level Security (RLS) aperta in lettura/scrittura per la band (anon)
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Accesso completo per i brani"
ON songs FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Accesso completo per i voti"
ON votes FOR ALL
USING (true)
WITH CHECK (true);

-- 4. Abilita il real-time (opzionale ma utile)
ALTER PUBLICATION supabase_realtime ADD TABLE songs;
ALTER PUBLICATION supabase_realtime ADD TABLE votes;

-- Inserimento di qualche brano di prova (opzionale)
-- INSERT INTO songs (title, artist) VALUES
--   ('Sweet Child O Mine', 'Guns N Roses'),
--   ('Superstition', 'Stevie Wonder'),
--   ('Certe Notti', 'Ligabue'),
--   ('Beggin', 'Maneskin');
