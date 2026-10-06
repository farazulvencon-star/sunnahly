import mysql from 'mysql2/promise';
import 'dotenv/config';

async function test() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [products] = await pool.query('SELECT id, name FROM products LIMIT 1');
  if (products.length === 0) {
    console.log("No products");
    return;
  }
  const id = products[0].id;
  console.log("Product:", products[0]);

  const payload = { name: "Test update" };
  const keys = Object.keys(payload);
  const setVals = Object.values(payload);
  const setClause = keys.map(k => `${k} = ?`).join(', ');

  const [result] = await pool.query(`UPDATE ?? SET ${setClause} WHERE id = ?`, ['products', ...setVals, id]);
  console.log("Update result:", result);
  
  const [updated] = await pool.query('SELECT id, name FROM products WHERE id = ?', [id]);
  console.log("Updated product:", updated[0]);
  process.exit(0);
}
test();
