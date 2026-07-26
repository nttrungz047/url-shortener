-- Schema cho URL Shortener

CREATE TABLE IF NOT EXISTS links (
    id            BIGSERIAL PRIMARY KEY,
    code          VARCHAR(32) UNIQUE NOT NULL,
    original_url  TEXT NOT NULL,
    clicks        BIGINT NOT NULL DEFAULT 0,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_visited_at TIMESTAMPTZ,
    expires_at    TIMESTAMPTZ
);

-- Tra cứu theo mã rút gọn là thao tác nóng nhất -> đã có UNIQUE index tự động.
-- Thêm index phụ để trang "danh sách link gần đây" load nhanh.
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links (created_at DESC);
