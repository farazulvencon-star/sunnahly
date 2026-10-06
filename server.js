import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Set up uploads directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Serve uploads folder
app.use('/uploads', express.static(uploadDir));

// Configure multer (memory storage for sharp processing)
const upload = multer({ storage: multer.memoryStorage() });

// Upload Endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const timestamp = Date.now();
    let filename;
    
    if (isImage) {
      filename = `img-${timestamp}.webp`;
      const outputPath = path.join(uploadDir, filename);
      
      // Auto-reduce and convert to WebP
      await sharp(req.file.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toFile(outputPath);
    } else {
      // Handle videos
      const ext = path.extname(req.file.originalname) || '';
      filename = `vid-${timestamp}${ext}`;
      const outputPath = path.join(uploadDir, filename);
      fs.writeFileSync(outputPath, req.file.buffer);
    }

    // Return URL format expected by frontend
    res.json({ secure_url: `/uploads/${filename}` });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Create Database Connection Pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Example Route: Get All Products
app.get('/api/products', async (req, res, next) => {
  try {
    const isAdmin = Object.keys(req.query).length > 0;
    
    let query = `
      SELECT p.*, c.name as category_name, c.slug as category_slug 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    
    if (!isAdmin) {
      query += ` WHERE p.is_active = true ORDER BY p.sort_order ASC`;
    } else {
      query += ` ORDER BY p.created_at DESC`;
    }
    
    const [rows] = await pool.query(query);
    
    // Map to Supabase expected format: categories(name, slug)
    const formatted = rows.map(r => {
      const { category_name, category_slug, ...rest } = r;
      return {
        ...rest,
        categories: { name: category_name, slug: category_slug }
      };
    });
    
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Example Route: Get Categories
app.get('/api/categories', async (req, res, next) => {
  try {
    const isAdmin = Object.keys(req.query).length > 0;
    let query = 'SELECT * FROM categories';
    if (!isAdmin) {
      query += ' WHERE is_active = true ORDER BY sort_order ASC';
    } else {
      query += ' ORDER BY created_at DESC';
    }
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function buildWhereClause(query, table = '') {
  let whereParts = [];
  let values = [];
  for (const [key, value] of Object.entries(query)) {
    if (key === 'select' || key === 'order' || key === 'single') continue;
    if (typeof value === 'string') {
      // Map 'key' to 'setting_key' and 'value' to 'setting_value' for site_settings
      let colName = key;
      if (table === 'site_settings') {
        if (key === 'key') colName = 'setting_key';
        if (key === 'value') colName = 'setting_value';
      }
      
      if (value.startsWith('eq.')) {
        whereParts.push(`\`${colName}\` = ?`);
        values.push(value.split('eq.')[1]);
      } else if (value.startsWith('in.(')) {
        const inVals = value.slice(4, -1).split(',');
        const placeholders = inVals.map(() => '?').join(',');
        whereParts.push(`\`${colName}\` IN (${placeholders})`);
        values.push(...inVals);
      }
    }
  }
  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';
  return { whereClause, values };
}

// Generic GET Route
app.get('/api/:table', async (req, res, next) => {
  const { table } = req.params;
  // Ignore specific routes already handled above
  if (['products', 'categories', 'rpc'].includes(table)) return next();
  
  const { whereClause, values } = buildWhereClause(req.query, table);
  let orderClause = '';
  if (req.query.order) {
    const [col, dir] = req.query.order.split('.');
    orderClause = `ORDER BY ${col} ${dir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
  }

  try {
    const [rows] = await pool.query(`SELECT * FROM ?? ${whereClause} ${orderClause}`, [table, ...values]);
    if (req.query.single) return res.json(rows[0] || null);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RPC route for get_public_setting
app.post('/api/rpc/get_public_setting', async (req, res) => {
  const { _key } = req.body;
  try {
    const [rows] = await pool.query('SELECT setting_value FROM site_settings WHERE setting_key = ?', [_key]);
    if (rows.length > 0) {
      res.json(rows[0].setting_value);
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generic POST Route
app.post('/api/:table', async (req, res, next) => {
  const { table } = req.params;
  if (table === 'rpc') return next();
  
  const data = req.body;
  if (!data || Object.keys(data).length === 0) return res.status(400).json({ error: "No data" });
  
  const items = Array.isArray(data) ? data : [data];
  try {
    const results = [];
    for (const item of items) {
      // Handle the 'key' to 'setting_key' mapping for insert
      if (table === 'site_settings') {
        if (item.key !== undefined) {
          item.setting_key = item.key;
          delete item.key;
        }
        if (item.value !== undefined) {
          item.setting_value = item.value;
          delete item.value;
        }
      }
      const keys = Object.keys(item);
      const vals = Object.values(item).map(v => (typeof v === 'object' && v !== null ? JSON.stringify(v) : v));
      const escapedKeys = keys.map(k => `\`${k}\``).join(', ');
      const placeholders = keys.map(() => '?').join(', ');
      const [result] = await pool.query(`INSERT INTO ?? (${escapedKeys}) VALUES (${placeholders})`, [table, ...vals]);
      results.push({ ...item, id: result.insertId || item.id });
    }
    res.json(Array.isArray(data) ? results : results[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generic PATCH Route
app.patch('/api/:table', async (req, res) => {
  const { table } = req.params;
  const data = req.body;
  const { whereClause, values } = buildWhereClause(req.query, table);
  
  if (!whereClause) return res.status(400).json({ error: "Missing where clause for update" });
  
  try {
    // Handle 'key' to 'setting_key' and 'value' to 'setting_value' mapping for updates
    if (table === 'site_settings') {
      if (data.key !== undefined) {
        data.setting_key = data.key;
        delete data.key;
      }
      if (data.value !== undefined) {
        data.setting_value = data.value;
        delete data.value;
      }
    }
    const keys = Object.keys(data);
    const setVals = Object.values(data).map(v => (typeof v === 'object' && v !== null ? JSON.stringify(v) : v));
    const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
    
    await pool.query(`UPDATE ?? SET ${setClause} ${whereClause}`, [table, ...setVals, ...values]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generic DELETE Route
app.delete('/api/:table', async (req, res) => {
  const { table } = req.params;
  const { whereClause, values } = buildWhereClause(req.query, table);
  if (!whereClause) return res.status(400).json({ error: "Missing where clause for delete" });
  
  try {
    await pool.query(`DELETE FROM ?? ${whereClause}`, [table, ...values]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
