import mysql from 'mysql2/promise';
import 'dotenv/config';

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const [result] = await pool.query('ALTER TABLE products ADD COLUMN landing_page_html LONGTEXT;');
    console.log("Products migration success:", result);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column landing_page_html already exists.");
    } else {
      console.error("Products migration failed:", err);
    }
  }

  try {
    const [resultCat] = await pool.query('ALTER TABLE categories ADD COLUMN show_on_home TINYINT(1) DEFAULT 0;');
    console.log("Categories migration success:", resultCat);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column show_on_home already exists.");
    } else {
      console.error("Categories migration failed:", err);
    }
  }

  try {
    const [resultBs] = await pool.query('ALTER TABLE products ADD COLUMN is_bestseller TINYINT(1) DEFAULT 0;');
    console.log("Products is_bestseller migration success:", resultBs);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("Column is_bestseller already exists.");
    } else {
      console.error("Products is_bestseller migration failed:", err);
    }
  }

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shefa_videos (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255),
        youtube_url TEXT,
        youtube_id VARCHAR(64),
        video_url TEXT,
        thumbnail_url TEXT,
        is_active TINYINT(1) DEFAULT 1,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log("shefa_videos migration success");
    try { await pool.query('ALTER TABLE shefa_videos ADD COLUMN video_url TEXT;'); } catch (e) {}
    try { await pool.query('ALTER TABLE shefa_videos ADD COLUMN thumbnail_url TEXT;'); } catch (e) {}
  } catch (err) {
    console.error("shefa_videos migration error:", err.message);
  }

  try {
    await pool.query('ALTER TABLE orders ADD COLUMN payment_method VARCHAR(50) DEFAULT "cod";');
    await pool.query('ALTER TABLE orders ADD COLUMN payment_status VARCHAR(50) DEFAULT "pending";');
    await pool.query('ALTER TABLE orders ADD COLUMN transaction_id VARCHAR(100) NULL;');
    await pool.query('ALTER TABLE orders ADD COLUMN eps_redirect_url TEXT NULL;');
    console.log("orders payment columns migration success");
  } catch (err) {
    console.log("Note on orders payment columns:", err.message);
  }
  process.exit(0);
}
migrate();
