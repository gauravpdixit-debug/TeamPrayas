# Team Prayas – Knowledge Bank Portal

A full-stack web app with Node.js backend + SQLite database.

---

## 📁 Folder Structure

```
TeamPrayas/
├── server.js          ← Node.js backend (Express + SQLite)
├── package.json       ← Dependencies
├── database.db        ← SQLite DB (auto-created on first run)
└── public/
    └── index.html     ← Frontend (served by the backend)
```

---

## 🚀 Setup & Run (First Time)

### Step 1: Install dependencies
Open CMD or terminal inside the `TeamPrayas` folder and run:
```bash
npm install
```

### Step 2: Start the server
```bash
node server.js
```

### Step 3: Open the portal
Go to your browser and open:
```
http://localhost:3000
```

---

## 👤 Default Login Credentials

| Username | Password   | Role   |
|----------|------------|--------|
| admin    | admin123   | Admin  |
| team     | team123    | Member |

> ⚠️ Change these passwords from the Admin Panel after first login!

---

## 💾 Database

- The database file `database.db` is created automatically on first run
- All files and users are stored permanently — data never resets
- To reset the database, simply delete `database.db` and restart the server

---

## ☁️ Moving to Cloud/Server Later

When you're ready to go live on your domain:

1. Upload the entire `TeamPrayas/` folder to your server (VPS, cPanel, etc.)
2. Run `npm install` on the server
3. Use **PM2** to keep it running:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "team-prayas"
   pm2 save
   ```
4. Point your domain to the server IP on port 3000
   (or use Nginx as a reverse proxy on port 80/443)

---

## 🔄 Switching to MySQL/PostgreSQL (Cloud DB)

When ready to upgrade from SQLite to a cloud database:
- Replace `better-sqlite3` with `mysql2` or `pg`
- Update the DB connection in `server.js`
- All your API routes stay exactly the same — only the DB driver changes!
