import { DatabaseSync } from 'node:sqlite';

export function createAltTextStore(path) {
  const db = new DatabaseSync(path);
  db.exec(`CREATE TABLE IF NOT EXISTS alt_corrections (
    site_id TEXT NOT NULL, page_path TEXT NOT NULL, image_id TEXT NOT NULL,
    image_sha256 TEXT NOT NULL, alt TEXT NOT NULL, version INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (site_id, page_path, image_id, image_sha256)
  )`);
  const get = db.prepare('SELECT alt, version, updated_at FROM alt_corrections WHERE site_id=? AND page_path=? AND image_id=? AND image_sha256=?');
  const upsert = db.prepare(`INSERT INTO alt_corrections (site_id,page_path,image_id,image_sha256,alt,updated_at)
    VALUES (?,?,?,?,?,?) ON CONFLICT (site_id,page_path,image_id,image_sha256)
    DO UPDATE SET alt=excluded.alt, updated_at=excluded.updated_at, version=alt_corrections.version+1`);
  const remove = db.prepare('DELETE FROM alt_corrections WHERE site_id=? AND page_path=? AND image_id=? AND image_sha256=?');
  const keys = (id) => [id.siteId, id.pagePath, id.imageId, id.imageHash];
  return {
    get: (id) => get.get(...keys(id)) || null,
    put(id, alt) { upsert.run(...keys(id), alt, new Date().toISOString()); return get.get(...keys(id)); },
    delete: (id) => remove.run(...keys(id)).changes > 0,
    close: () => db.close(),
  };
}
