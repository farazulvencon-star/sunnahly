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
  process.exit(0);
}
migrate();
