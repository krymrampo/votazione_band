import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('workspace migration is repeatable, enforces revisions and retains detached notes', async () => {
  const db = new PGlite();
  try {
    await db.exec(
      'CREATE ROLE anon; CREATE ROLE authenticated; CREATE TABLE songs(id UUID PRIMARY KEY, title TEXT);',
    );
    const migration = await readFile(
      new URL('../supabase_workspace.sql', import.meta.url),
      'utf8',
    );
    await db.exec(migration);
    await db.exec(migration);
    const a = '00000000-0000-4000-8000-000000000001';
    const b = '00000000-0000-4000-8000-000000000002';
    await db.query('INSERT INTO songs VALUES ($1,$2),($3,$4)', [
      a,
      'First',
      b,
      'Second',
    ]);
    await db.exec('GRANT SELECT ON songs TO anon; SET ROLE anon;');
    const first = await db.query(
      'UPDATE band_setlist SET song_ids=$1, revision=1 WHERE id=1 AND revision=0 RETURNING *',
      [[b, a, b]],
    );
    assert.equal(first.rows.length, 1);
    assert.deepEqual((first.rows[0] as { song_ids: string[] }).song_ids, [
      b,
      a,
    ]);
    const stale = await db.query(
      'UPDATE band_setlist SET song_ids=$1, revision=1 WHERE id=1 AND revision=0 RETURNING *',
      [[a]],
    );
    assert.equal(stale.rows.length, 0);
    await assert.rejects(
      db.exec('UPDATE band_setlist SET revision=1 WHERE id=1'),
      /revision must increase/,
    );
    await assert.rejects(
      db.exec("INSERT INTO band_notes(title,body) VALUES ('   ','text')"),
    );
    await db.query(
      "INSERT INTO band_notes(title,body,song_id) VALUES ('Note','Keep this text',$1)",
      [a],
    );
    await db.exec('RESET ROLE;');
    await db.query('DELETE FROM songs WHERE id=$1', [a]);
    const note = await db.query<{ body: string; song_id: string | null }>(
      'SELECT body,song_id FROM band_notes',
    );
    assert.equal(note.rows[0].body, 'Keep this text');
    assert.equal(note.rows[0].song_id, null);
    await db.query(
      'UPDATE band_setlist SET song_ids=$1, revision=2 WHERE id=1 AND revision=1',
      [[a, b]],
    );
    assert.deepEqual(
      (
        await db.query<{ song_ids: string[] }>(
          'SELECT song_ids FROM band_setlist',
        )
      ).rows[0].song_ids,
      [b],
    );
  } finally {
    await db.close();
  }
});
