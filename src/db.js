const { Pool } = require('pg');

// Ưu tiên DATABASE_URL (dùng khi deploy). Nếu không có thì dùng các biến PG* riêng lẻ.
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
    })
  : new Pool({
      host: process.env.PGHOST || 'localhost',
      port: Number(process.env.PGPORT) || 5432,
      database: process.env.PGDATABASE || 'url_shortener',
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
    });

pool.on('error', (err) => {
  // Lỗi ở connection đang idle trong pool - log để biết, không crash cả server
  console.error('Lỗi không mong muốn từ PostgreSQL pool:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
