// ─────────────────────────────────────────────────────────────────────────────
//  Team Prayas – Knowledge Bank  |  server.js
//  Node.js + Express + Turso (LibSQL) + Multer (file uploads)
// ─────────────────────────────────────────────────────────────────────────────

const express      = require('express');
const cors         = require('cors');
const bcrypt       = require('bcryptjs');
const path         = require('path');
const fs           = require('fs');
const multer       = require('multer');
const { createClient } = require('@libsql/client');

const app    = express();
const PORT   = process.env.PORT || 3000;
const UPLOADS = path.join(__dirname, 'uploads');

// Create uploads folder if not exists
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS));

// ── Multer config ─────────────────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS),
  filename:    (req, file, cb) => {
    const unique = Date.now() + '_' + file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, unique);
  }
});
const upload = multer({ storage });

// ── Turso DB client ───────────────────────────────────────────────────────────
const db = createClient({
  url:       process.env.TURSO_URL,
  authToken: process.env.TURSO_TOKEN,
});

// ── DB helpers ────────────────────────────────────────────────────────────────
async function runStmt(sql, params = []) {
  await db.execute({ sql, args: params });
}

async function queryAll(sql, params = []) {
  const result = await db.execute({ sql, args: params });
  return result.rows;
}

async function queryOne(sql, params = []) {
  const rows = await queryAll(sql, params);
  return rows[0] || null;
}

// ── Init DB ───────────────────────────────────────────────────────────────────
async function initDb() {
  // Create tables
  await db.execute(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    created_at TEXT DEFAULT (datetime('now'))
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS files (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'Other',
    type        TEXT NOT NULL DEFAULT 'Other',
    size        TEXT DEFAULT '—',
    description TEXT DEFAULT '',
    url         TEXT DEFAULT '#',
    source      TEXT DEFAULT 'drive',
    filename    TEXT DEFAULT '',
    date        TEXT DEFAULT (date('now')),
    created_at  TEXT DEFAULT (datetime('now'))
  )`);

  // Seed users only if none exist
  const userCount = await queryOne('SELECT COUNT(*) as c FROM users');
  if (Number(userCount.c) === 0) {
    await runStmt(`INSERT INTO users (username,password,role) VALUES (?,?,?)`,
      ['admin', bcrypt.hashSync('admin123', 10), 'admin']);
    await runStmt(`INSERT INTO users (username,password,role) VALUES (?,?,?)`,
      ['team', bcrypt.hashSync('team123', 10), 'member']);
    console.log('✅ Default users seeded: admin / team');
  }

  // Seed files only if none exist
  const fileCount = await queryOne('SELECT COUNT(*) as c FROM files');
  if (Number(fileCount.c) === 0) {
    const seedFiles = [
      { name:'Gaurav Dixit_Bareilly',              category:'Data',       type:'Sheet', size:'24 KB',  description:'Student data spreadsheet shared from admissions.',        url:'https://docs.google.com/spreadsheets/d/1kMxsNupdsbN8EwAf1wCfXC3wpqyW7GPlEy2_JJ9l8s8/edit', source:'drive', filename:'' },
      { name:'EduPartners',                        category:'Data',       type:'Sheet', size:'10 KB',  description:'EduPartners data spreadsheet.',                           url:'https://docs.google.com/spreadsheets/d/1KZECzIXGgDTeFeiaLH2lwo0_Nb2_JBC8lHiq3PG_y-0/edit', source:'drive', filename:'' },
      { name:'Get in Touch: EduPartners',          category:'Templates',  type:'Form',  size:'152 KB', description:'EduPartners contact and inquiry form.',                   url:'https://docs.google.com/forms/d/1JPRU6DWJVBHD_0tEo7LX2_8RF6m2tIbe6DnmfrDoMRg/edit',    source:'drive', filename:'' },
      { name:'Calling Sheet_2026.xlsx',            category:'Data',       type:'XLSX',  size:'1.0 MB', description:'Calling sheet for 2026 outreach activities.',             url:'https://drive.google.com/file/d/1YdHPgy358DqfIEVHdKmyY_jUYZ7vicsO/view',                  source:'drive', filename:'' },
      { name:'GLA University x Curly Tales',       category:'Reports',    type:'Sheet', size:'3 KB',   description:'Collaboration data with Curly Tales.',                    url:'https://docs.google.com/spreadsheets/d/1QYWuaJmNRBlZqwHtYJ-3Oxdy2t2nKUxLP4W7kg0KxMw/edit', source:'drive', filename:'' },
      { name:'EduElite – Student Data Collection', category:'Templates',  type:'Form',  size:'3 KB',   description:'Student data collection form for EduElite.',              url:'https://docs.google.com/forms/d/1faBl0IAOd-uJo__N1NHe9ZoEtTihtxECA0uFnqpIi9o/edit',    source:'drive', filename:'' },
      { name:'EduPartners-INDIA',                  category:'Data',       type:'Sheet', size:'1 KB',   description:'India-specific EduPartners data.',                        url:'https://docs.google.com/spreadsheets/d/1BjQNVHkO1rujO1Slq7L3t34mx68vxzxkrrbTkNT-Z9g/edit', source:'drive', filename:'' },
      { name:'Prospectus_UndertakingForm.PDF',     category:'Guidelines', type:'PDF',   size:'323 KB', description:'Official prospectus undertaking form.',                   url:'https://drive.google.com/file/d/1Bk0zFSmNvdOvtxQd2yMqdeFPqiE5hVLT/view',                  source:'drive', filename:'' },
      { name:'Target Vs Achievement_2026.xlsx',    category:'Reports',    type:'XLSX',  size:'107 KB', description:'Target vs achievement tracking for 2026.',                url:'https://drive.google.com/file/d/14lp-EF4lPXru_Mw9EWapmggOs4SGWyCa/view',                  source:'drive', filename:'' },
      { name:'DELHI CBSE 2026 12th New.xlsx',      category:'Data',       type:'XLSX',  size:'25 MB',  description:'Delhi CBSE 2026 Class 12 student dataset.',               url:'https://drive.google.com/file/d/1TCe9Re5Wi620XkspYC7Dw9iKu9vdz816/view',                  source:'drive', filename:'' },
    ];
    for (const f of seedFiles) {
      await runStmt(
        `INSERT INTO files (name,category,type,size,description,url,source,filename,date) VALUES (?,?,?,?,?,?,?,?,?)`,
        [f.name, f.category, f.type, f.size, f.description, f.url, f.source, f.filename, new Date().toISOString().slice(0,10)]
      );
    }
    console.log('✅ Default files seeded: 10 files');
  }

  console.log(`\n🚀 Team Prayas Knowledge Bank running at:\n   http://localhost:${PORT}\n`);
}

// ═══════════════════════════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════════════════════════
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    const user = await queryOne('SELECT * FROM users WHERE username = ?', [username]);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ username: user.username, role: user.role });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  FILES
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/files', async (req, res) => {
  try {
    res.json(await queryAll('SELECT * FROM files ORDER BY created_at DESC'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/files', async (req, res) => {
  try {
    const { name, category, type, size, description, url, date } = req.body;
    if (!name) return res.status(400).json({ error: 'File name is required' });
    await runStmt(
      `INSERT INTO files (name,category,type,size,description,url,source,filename,date) VALUES (?,?,?,?,?,?,?,?,?)`,
      [name, category||'Other', type||'Other', size||'—', description||'', url||'#', 'drive', '', date||new Date().toISOString().slice(0,10)]
    );
    const result = await queryOne('SELECT last_insert_rowid() as id');
    res.status(201).json(await queryOne('SELECT * FROM files WHERE id = ?', [result.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { name, category, description } = req.body;
    const filename     = req.file.filename;
    const originalName = req.file.originalname;
    const size         = (req.file.size / 1024).toFixed(1) + ' KB';
    const ext          = path.extname(originalName).replace('.', '').toUpperCase() || 'File';
    const url          = `/uploads/${filename}`;
    await runStmt(
      `INSERT INTO files (name,category,type,size,description,url,source,filename,date) VALUES (?,?,?,?,?,?,?,?,?)`,
      [name||originalName, category||'Other', ext, size, description||'', url, 'local', filename, new Date().toISOString().slice(0,10)]
    );
    const result = await queryOne('SELECT last_insert_rowid() as id');
    res.status(201).json(await queryOne('SELECT * FROM files WHERE id = ?', [result.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, type, description, url } = req.body;
    if (!await queryOne('SELECT id FROM files WHERE id = ?', [id]))
      return res.status(404).json({ error: 'File not found' });
    await runStmt(`UPDATE files SET name=?,category=?,type=?,description=?,url=? WHERE id=?`,
      [name, category, type, description, url, id]);
    res.json(await queryOne('SELECT * FROM files WHERE id = ?', [id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const file = await queryOne('SELECT * FROM files WHERE id = ?', [id]);
    if (!file) return res.status(404).json({ error: 'File not found' });
    if (file.source === 'local' && file.filename) {
      const filePath = path.join(UPLOADS, file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await runStmt('DELETE FROM files WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  USERS
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/users', async (req, res) => {
  try {
    res.json(await queryAll('SELECT id,username,role,created_at FROM users ORDER BY created_at ASC'));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    if (await queryOne('SELECT id FROM users WHERE username = ?', [username]))
      return res.status(409).json({ error: 'Username already exists' });
    await runStmt(`INSERT INTO users (username,password,role) VALUES (?,?,?)`,
      [username, bcrypt.hashSync(password, 10), role||'member']);
    const result = await queryOne('SELECT last_insert_rowid() as id');
    res.status(201).json(await queryOne('SELECT id,username,role,created_at FROM users WHERE id = ?', [result.id]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/users/:username', async (req, res) => {
  try {
    const orig = req.params.username;
    const { username: newName, password, role } = req.body;
    const user = await queryOne('SELECT * FROM users WHERE username = ?', [orig]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (newName !== orig && await queryOne('SELECT id FROM users WHERE username = ?', [newName]))
      return res.status(409).json({ error: 'Username already taken' });
    const newHash = password ? bcrypt.hashSync(password, 10) : user.password;
    await runStmt(`UPDATE users SET username=?,password=?,role=? WHERE username=?`,
      [newName, newHash, role, orig]);
    res.json(await queryOne('SELECT id,username,role,created_at FROM users WHERE username = ?', [newName]));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    if (!await queryOne('SELECT id FROM users WHERE username = ?', [username]))
      return res.status(404).json({ error: 'User not found' });
    await runStmt('DELETE FROM users WHERE username = ?', [username]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Fallback ──────────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
initDb().then(() => app.listen(PORT));
