require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

async function migrate() {
  const sqlPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Đang chạy migration...');
  try {
    await pool.query(sql);
    console.log('✅ Migration thành công. Bảng "links" đã sẵn sàng.');
  } catch (err) {
    console.error('❌ Migration thất bại:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
