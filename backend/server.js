const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const JWT_SECRET = process.env.JWT_SECRET || 'grocery-sync-super-secret-key';
const dataDir = path.join(__dirname, 'data');
const uploadsDir = path.join(dataDir, 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
});
const upload = multer({ storage: storage });

const dbPath = process.env.DB_PATH || path.join(dataDir, 'grocery.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

const initDb = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, is_admin BOOLEAN DEFAULT 0, perm_products_create BOOLEAN DEFAULT 0, perm_products_edit BOOLEAN DEFAULT 0, perm_products_delete BOOLEAN DEFAULT 0, perm_lists_create BOOLEAN DEFAULT 0, perm_lists_edit BOOLEAN DEFAULT 0, perm_lists_delete BOOLEAN DEFAULT 0, perm_categories BOOLEAN DEFAULT 0);
        CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, product_group TEXT, barcode TEXT, picture_url TEXT, allowed_units TEXT DEFAULT 'Pc,g,Kg');
        CREATE TABLE IF NOT EXISTS lists (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, due_date TEXT, picture_url TEXT);
        CREATE TABLE IF NOT EXISTS list_items (list_id INTEGER, product_id INTEGER, quantity REAL DEFAULT 1, unit TEXT DEFAULT 'Pc', is_bought BOOLEAN DEFAULT 0, FOREIGN KEY(list_id) REFERENCES lists(id) ON DELETE CASCADE, FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE, PRIMARY KEY(list_id, product_id));
        CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL, sort_order INTEGER DEFAULT 0);
    `);
    
    try { db.exec("ALTER TABLE lists ADD COLUMN picture_url TEXT"); } catch(e){}
    try { db.exec("ALTER TABLE products ADD COLUMN allowed_units TEXT DEFAULT 'Pc,g,Kg'"); } catch(e){}
    try { db.exec("ALTER TABLE users ADD COLUMN perm_products_create BOOLEAN DEFAULT 0"); } catch(e){}
    try { db.exec("ALTER TABLE users ADD COLUMN perm_products_edit BOOLEAN DEFAULT 0"); } catch(e){}
    try { db.exec("ALTER TABLE users ADD COLUMN perm_products_delete BOOLEAN DEFAULT 0"); } catch(e){}
    try { db.exec("ALTER TABLE users ADD COLUMN perm_lists_create BOOLEAN DEFAULT 0"); } catch(e){}
    try { db.exec("ALTER TABLE users ADD COLUMN perm_lists_edit BOOLEAN DEFAULT 0"); } catch(e){}
    try { db.exec("ALTER TABLE users ADD COLUMN perm_lists_delete BOOLEAN DEFAULT 0"); } catch(e){}
    
    db.exec("INSERT OR IGNORE INTO categories (name) SELECT DISTINCT product_group FROM products WHERE product_group IS NOT NULL AND product_group != ''");

    if (db.prepare('SELECT COUNT(*) as count FROM users').get().count === 0) {
        db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?, ?, 1)').run('admin', bcrypt.hashSync('admin', 10));
    }
    db.exec("UPDATE users SET perm_products_create=1, perm_products_edit=1, perm_products_delete=1, perm_lists_create=1, perm_lists_edit=1, perm_lists_delete=1, perm_categories=1 WHERE is_admin=1");
};
initDb();

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// --- AUTH API ---
app.post('/api/login', (req, res) => {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(req.body.username);
    if (!user || !bcrypt.compareSync(req.body.password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    const uPayload = { id: user.id, username: user.username, is_admin: user.is_admin, perm_products_create: user.perm_products_create, perm_products_edit: user.perm_products_edit, perm_products_delete: user.perm_products_delete, perm_lists_create: user.perm_lists_create, perm_lists_edit: user.perm_lists_edit, perm_lists_delete: user.perm_lists_delete, perm_categories: user.perm_categories };
    const token = jwt.sign(uPayload, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: uPayload });
});

// --- MIDDLEWARE ---
const authenticate = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err, user) => { if (err) return res.sendStatus(403); req.user = user; next(); });
};
const reqAdmin = (req, res, next) => req.user.is_admin ? next() : res.sendStatus(403);
const canCreateProd = (req, res, next) => (req.user.is_admin || req.user.perm_products_create) ? next() : res.sendStatus(403);
const canEditProd = (req, res, next) => (req.user.is_admin || req.user.perm_products_edit) ? next() : res.sendStatus(403);
const canDelProd = (req, res, next) => (req.user.is_admin || req.user.perm_products_delete) ? next() : res.sendStatus(403);
const canCreateList = (req, res, next) => (req.user.is_admin || req.user.perm_lists_create) ? next() : res.sendStatus(403);
const canEditList = (req, res, next) => (req.user.is_admin || req.user.perm_lists_edit) ? next() : res.sendStatus(403);
const canDelList = (req, res, next) => (req.user.is_admin || req.user.perm_lists_delete) ? next() : res.sendStatus(403);
const canManageCats = (req, res, next) => (req.user.is_admin || req.user.perm_categories) ? next() : res.sendStatus(403);

app.use('/api', authenticate);

// --- USER MANAGEMENT ---
app.post('/api/change-password', (req, res) => {
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(req.body.newPassword, 10), req.user.id); res.json({ success: true });
});
app.get('/api/users', reqAdmin, (req, res) => res.json(db.prepare('SELECT id, username, is_admin, perm_products_create, perm_products_edit, perm_products_delete, perm_lists_create, perm_lists_edit, perm_lists_delete, perm_categories FROM users').all()));
app.post('/api/users', reqAdmin, (req, res) => {
    try {
        db.prepare('INSERT INTO users (username, password, is_admin, perm_products_create, perm_products_edit, perm_products_delete, perm_lists_create, perm_lists_edit, perm_lists_delete, perm_categories) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(req.body.username, bcrypt.hashSync(req.body.password, 10), req.body.is_admin?1:0, req.body.perm_products_create?1:0, req.body.perm_products_edit?1:0, req.body.perm_products_delete?1:0, req.body.perm_lists_create?1:0, req.body.perm_lists_edit?1:0, req.body.perm_lists_delete?1:0, req.body.perm_categories?1:0);
        res.json({ success: true });
    } catch(e) { res.status(500).json({error: e.message}); }
});

// SAFE UPDATE: Prevent removing the last admin
app.put('/api/users/:id', reqAdmin, (req, res) => {
    const targetUserId = req.params.id;
    const willBeAdmin = req.body.is_admin ? 1 : 0;
    
    if (!willBeAdmin) {
        const targetUser = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(targetUserId);
        if (targetUser && targetUser.is_admin === 1) {
            const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get().count;
            if (adminCount <= 1) return res.status(400).json({ error: "Action blocked: You cannot remove the last Admin user." });
        }
    }

    if (req.body.password) db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(req.body.password, 10), targetUserId);
    db.prepare('UPDATE users SET is_admin=?, perm_products_create=?, perm_products_edit=?, perm_products_delete=?, perm_lists_create=?, perm_lists_edit=?, perm_lists_delete=?, perm_categories=? WHERE id=?').run(willBeAdmin, req.body.perm_products_create?1:0, req.body.perm_products_edit?1:0, req.body.perm_products_delete?1:0, req.body.perm_lists_create?1:0, req.body.perm_lists_edit?1:0, req.body.perm_lists_delete?1:0, req.body.perm_categories?1:0, targetUserId);
    res.json({ success: true });
});

// SAFE DELETE: Prevent deleting the last admin
app.delete('/api/users/:id', reqAdmin, (req, res) => {
    const targetUserId = req.params.id;
    const targetUser = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(targetUserId);
    if (targetUser && targetUser.is_admin === 1) {
        const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get().count;
        if (adminCount <= 1) return res.status(400).json({ error: "Action blocked: You cannot delete the last Admin user." });
    }
    db.prepare('DELETE FROM users WHERE id = ?').run(targetUserId); 
    res.json({ success: true }); 
});

// --- CATEGORIES API ---
app.get('/api/categories', (req, res) => res.json(db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all()));
app.post('/api/categories', canManageCats, (req, res) => { const max = db.prepare('SELECT MAX(sort_order) as max FROM categories').get().max || 0; res.json({ id: db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run(req.body.name, max + 1).lastInsertRowid }); });
app.delete('/api/categories/:id', canManageCats, (req, res) => { db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id); res.json({success: true}); });
app.post('/api/categories/reorder', canManageCats, (req, res) => { const update = db.prepare('UPDATE categories SET sort_order = ? WHERE id = ?'); db.transaction((ids) => { ids.forEach((id, index) => update.run(index, id)); })(req.body.orderedIds); res.json({success: true}); });

// --- PRODUCTS API ---
app.get('/api/products', (req, res) => res.json(db.prepare('SELECT * FROM products').all()));
app.post('/api/products', canCreateProd, upload.single('picture'), (req, res) => res.json({ id: db.prepare('INSERT INTO products (name, product_group, barcode, picture_url, allowed_units) VALUES (?, ?, ?, ?, ?)').run(req.body.name, req.body.product_group || null, req.body.barcode || null, req.file ? `/uploads/${req.file.filename}` : null, req.body.allowed_units || 'Pc,g,Kg').lastInsertRowid }));
app.put('/api/products/:id', canEditProd, upload.single('picture'), (req, res) => {
    let pic = "", params = [req.body.name, req.body.product_group || null, req.body.barcode || null, req.body.allowed_units || 'Pc,g,Kg'];
    if (req.file) { pic = ", picture_url=?"; params.push(`/uploads/${req.file.filename}`); } else if (req.body.remove_picture === 'true') { pic = ", picture_url=NULL"; }
    params.push(req.params.id);
    db.prepare(`UPDATE products SET name=?, product_group=?, barcode=?, allowed_units=?${pic} WHERE id=?`).run(...params); res.json({ success: true });
});
app.delete('/api/products/:id', canDelProd, (req, res) => { db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id); res.json({ success: true }); });

// --- EXPORT & IMPORT (ADMIN ONLY) ---
app.get('/api/export', reqAdmin, (req, res) => {
    const categories = db.prepare('SELECT * FROM categories').all();
    const products = db.prepare('SELECT * FROM products').all().map(p => {
        let picture_base64 = null;
        if (p.picture_url && fs.existsSync(path.join(dataDir, p.picture_url.replace('/uploads/', 'uploads/')))) {
            picture_base64 = fs.readFileSync(path.join(dataDir, p.picture_url.replace('/uploads/', 'uploads/')), 'base64');
            p.picture_ext = path.extname(p.picture_url);
        }
        return { ...p, picture_base64 };
    });
    res.json({ products, categories });
});
app.post('/api/import', reqAdmin, upload.single('file'), (req, res) => {
    try {
        const data = JSON.parse(fs.readFileSync(req.file.path, 'utf8'));
        const items = Array.isArray(data) ? data : (data.products || []);
        const cats = Array.isArray(data) ? [] : (data.categories || []);
        db.transaction(() => {
            const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, sort_order) VALUES (?, ?)');
            for (const c of cats) insertCat.run(c.name, c.sort_order || 0);
            const insertProd = db.prepare('INSERT INTO products (name, product_group, barcode, picture_url, allowed_units) VALUES (?, ?, ?, ?, ?)');
            for (const item of items) {
                let pic_url = item.picture_url;
                if (item.picture_base64) {
                    const filename = Date.now() + '-' + Math.round(Math.random() * 1E9) + (item.picture_ext || '.jpg');
                    fs.writeFileSync(path.join(uploadsDir, filename), Buffer.from(item.picture_base64, 'base64'));
                    pic_url = `/uploads/${filename}`;
                }
                insertProd.run(item.name, item.product_group || null, item.barcode || null, pic_url, item.allowed_units || 'Pc,g,Kg');
            }
        })();
        res.json({ success: true });
    } catch(err) { res.status(500).json({ error: "Failed" }); }
});

// --- LISTS & ITEMS API ---
app.get('/api/lists', (req, res) => res.json(db.prepare(`SELECT lists.*, (SELECT COUNT(*) FROM list_items WHERE list_id = lists.id AND is_bought = 0) as pending_count, (SELECT COUNT(*) FROM list_items WHERE list_id = lists.id) as total_count FROM lists`).all()));
app.post('/api/lists', canCreateList, upload.single('picture'), (req, res) => res.json({ id: db.prepare('INSERT INTO lists (name, due_date, picture_url) VALUES (?, ?, ?)').run(req.body.name, req.body.due_date || null, req.file ? `/uploads/${req.file.filename}` : null).lastInsertRowid }));
app.delete('/api/lists/:id', canDelList, (req, res) => { db.prepare('DELETE FROM lists WHERE id = ?').run(req.params.id); res.json({ success: true }); });

app.get('/api/lists/:id/items', (req, res) => res.json(db.prepare(`SELECT p.*, li.is_bought, li.quantity, li.unit FROM list_items li JOIN products p ON li.product_id = p.id WHERE li.list_id = ?`).all(req.params.id)));
app.post('/api/lists/:id/items', canEditList, (req, res) => { db.prepare('INSERT OR REPLACE INTO list_items (list_id, product_id, quantity, unit) VALUES (?, ?, ?, ?)').run(req.params.id, req.body.product_id, req.body.quantity, req.body.unit); res.json({ success: true }); });
app.delete('/api/lists/:id/items/:productId', canEditList, (req, res) => { db.prepare('DELETE FROM list_items WHERE list_id = ? AND product_id = ?').run(req.params.id, req.params.productId); res.json({ success: true }); });

io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Auth Error"));
    jwt.verify(token, JWT_SECRET, (err, user) => { if (err) return next(new Error("Auth Error")); socket.user = user; next(); });
});
io.on('connection', (socket) => {
    socket.on('toggle_item_status', ({ listId, productId, isBought }) => {
        db.prepare('UPDATE list_items SET is_bought = ? WHERE list_id = ? AND product_id = ?').run(isBought ? 1 : 0, listId, productId);
        io.emit('list_updated', { listId, productId, isBought });
    });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
server.listen(process.env.PORT || 3000, () => console.log(`Server running`));
