require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const db = require('./db');
const linksRouter = require('./routes/links');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Giới hạn tần suất tạo link để tránh spam (không áp dụng cho redirect)
const createLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Bạn thao tác quá nhanh, vui lòng thử lại sau ít phút.' },
});

app.use('/api/links', (req, res, next) => {
  if (req.method === 'POST') return createLimiter(req, res, next);
  return next();
});
app.use('/api/links', linksRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Phục vụ frontend tĩnh
app.use(express.static(path.join(__dirname, '..', 'public')));

// Route redirect - PHẢI đặt sau static & sau /api để không nuốt mất các route khác
app.get('/:code', async (req, res, next) => {
  const { code } = req.params;

  // Bỏ qua các request tìm file tĩnh kiểu favicon.ico, robots.txt...
  if (code.includes('.')) return next();

  try {
    const result = await db.query('SELECT * FROM links WHERE code = $1', [code]);
    if (result.rowCount === 0) {
      return res.status(404).sendFile(path.join(__dirname, '..', 'public', '404.html'));
    }

    const link = result.rows[0];

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.status(410).send('Link này đã hết hạn.');
    }

    // Cập nhật lượt click bất đồng bộ, không chặn redirect
    db.query(
      'UPDATE links SET clicks = clicks + 1, last_visited_at = now() WHERE code = $1',
      [code]
    ).catch((err) => console.error('Lỗi cập nhật lượt click:', err));

    return res.redirect(302, link.original_url);
  } catch (err) {
    console.error('Lỗi khi redirect:', err);
    return res.status(500).send('Lỗi máy chủ.');
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Không tìm thấy.' });
});

app.listen(PORT, () => {
  console.log(`🚀 URL Shortener đang chạy tại http://localhost:${PORT}`);
});
