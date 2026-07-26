const express = require('express');
const db = require('../db');
const { generateCode, isValidCustomCode } = require('../utils/code');

const router = express.Router();

function isValidHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function toPublicLink(row, baseUrl) {
  return {
    code: row.code,
    shortUrl: `${baseUrl}/${row.code}`,
    originalUrl: row.original_url,
    clicks: Number(row.clicks),
    createdAt: row.created_at,
  };
}

// POST /api/links  { url, code? }  -> tạo link rút gọn mới
router.post('/', async (req, res) => {
  const { url, code } = req.body || {};

  if (!url || typeof url !== 'string' || !isValidHttpUrl(url)) {
    return res.status(400).json({
      error: 'URL không hợp lệ. Vui lòng nhập URL đầy đủ, bắt đầu bằng http:// hoặc https://',
    });
  }

  let finalCode = code;
  if (finalCode) {
    if (!isValidCustomCode(finalCode)) {
      return res.status(400).json({
        error: 'Mã tự đặt chỉ được chứa chữ, số, "-", "_" và dài 3-32 ký tự.',
      });
    }
  }

  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

  try {
    if (finalCode) {
      // Người dùng tự đặt mã -> kiểm tra trùng trước
      const existing = await db.query('SELECT 1 FROM links WHERE code = $1', [finalCode]);
      if (existing.rowCount > 0) {
        return res.status(409).json({ error: 'Mã này đã được sử dụng, vui lòng chọn mã khác.' });
      }
    } else {
      // Sinh mã ngẫu nhiên, thử lại vài lần nếu trùng (xác suất rất thấp)
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generateCode();
        const existing = await db.query('SELECT 1 FROM links WHERE code = $1', [candidate]);
        if (existing.rowCount === 0) {
          finalCode = candidate;
          break;
        }
      }
      if (!finalCode) {
        return res.status(500).json({ error: 'Không thể sinh mã, vui lòng thử lại.' });
      }
    }

    const result = await db.query(
      `INSERT INTO links (code, original_url) VALUES ($1, $2) RETURNING *`,
      [finalCode, url]
    );

    return res.status(201).json(toPublicLink(result.rows[0], baseUrl));
  } catch (err) {
    console.error('Lỗi khi tạo link:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau.' });
  }
});

// GET /api/links -> danh sách link tạo gần đây nhất (demo/dashboard đơn giản)
router.get('/', async (req, res) => {
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  try {
    const result = await db.query(
      `SELECT * FROM links ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return res.json(result.rows.map((row) => toPublicLink(row, baseUrl)));
  } catch (err) {
    console.error('Lỗi khi lấy danh sách link:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau.' });
  }
});

// GET /api/links/:code -> chi tiết + số click của 1 link
router.get('/:code', async (req, res) => {
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;

  try {
    const result = await db.query('SELECT * FROM links WHERE code = $1', [req.params.code]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Không tìm thấy link.' });
    }
    return res.json(toPublicLink(result.rows[0], baseUrl));
  } catch (err) {
    console.error('Lỗi khi lấy chi tiết link:', err);
    return res.status(500).json({ error: 'Lỗi máy chủ, vui lòng thử lại sau.' });
  }
});

module.exports = router;
