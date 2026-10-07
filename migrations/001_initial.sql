CREATE TABLE galaxies(id uuid PRIMARY KEY,manifest jsonb NOT NULL,objects jsonb NOT NULL DEFAULT '[]',token_hash text,state text NOT NULL CHECK(state IN ('draft','ready')),created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE galaxy_rates(id text PRIMARY KEY,count integer NOT NULL);
ALTER TABLE galaxies ENABLE ROW LEVEL SECURITY;
ALTER TABLE galaxy_rates ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON galaxies,galaxy_rates FROM anon,authenticated;
