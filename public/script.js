const form = document.getElementById('shorten-form');
const urlInput = document.getElementById('url-input');
const aliasInput = document.getElementById('alias-input');
const toggleAliasBtn = document.getElementById('toggle-alias');
const aliasField = document.getElementById('alias-field');
const submitBtn = document.getElementById('submit-btn');
const submitLabel = document.getElementById('submit-label');
const errorMsg = document.getElementById('error-msg');

const resultCard = document.getElementById('result-card');
const gaugeAfter = document.getElementById('gauge-after');
const gaugeLabel = document.getElementById('gauge-label');
const shortUrlText = document.getElementById('short-url-text');
const originalUrlText = document.getElementById('original-url-text');
const copyBtn = document.getElementById('copy-btn');

const recentList = document.getElementById('recent-list');
const refreshBtn = document.getElementById('refresh-btn');

let lastShortUrl = '';

toggleAliasBtn.addEventListener('click', () => {
  aliasField.classList.toggle('hidden');
  toggleAliasBtn.classList.add('hidden');
  if (!aliasField.classList.contains('hidden')) aliasInput.focus();
});

function showError(message) {
  errorMsg.textContent = message;
  errorMsg.classList.remove('hidden');
}

function clearError() {
  errorMsg.classList.add('hidden');
  errorMsg.textContent = '';
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitLabel.textContent = isLoading ? 'Đang rút gọn…' : 'Rút gọn ngay';
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();

  const url = urlInput.value.trim();
  const code = aliasInput.value.trim();

  if (!url) return;

  setLoading(true);
  try {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(code ? { url, code } : { url }),
    });
    const data = await res.json();

    if (!res.ok) {
      showError(data.error || 'Có lỗi xảy ra, vui lòng thử lại.');
      return;
    }

    renderResult(url, data.shortUrl);
    form.reset();
    aliasField.classList.add('hidden');
    toggleAliasBtn.classList.remove('hidden');
    loadRecent();
  } catch (err) {
    showError('Không kết nối được tới máy chủ.');
  } finally {
    setLoading(false);
  }
});

function renderResult(originalUrl, shortUrl) {
  lastShortUrl = shortUrl;

  const beforeLen = originalUrl.length;
  const afterLen = shortUrl.length;
  const reduction = Math.max(0, Math.round((1 - afterLen / beforeLen) * 100));

  resultCard.classList.remove('hidden');
  gaugeAfter.style.width = '0%';
  // Đợi 1 frame để CSS transition chạy mượt
  requestAnimationFrame(() => {
    gaugeAfter.style.width = `${100 - reduction}%`;
  });

  gaugeLabel.textContent = `${beforeLen} → ${afterLen} ký tự · giảm ${reduction}%`;
  shortUrlText.textContent = shortUrl;
  originalUrlText.textContent = originalUrl;
  copyBtn.textContent = 'Sao chép';
  copyBtn.classList.remove('copied');

  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

copyBtn.addEventListener('click', async () => {
  if (!lastShortUrl) return;
  try {
    await navigator.clipboard.writeText(lastShortUrl);
    copyBtn.textContent = 'Đã sao chép ✓';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'Sao chép';
      copyBtn.classList.remove('copied');
    }, 1800);
  } catch {
    showError('Trình duyệt chặn sao chép tự động, vui lòng tự copy.');
  }
});

async function loadRecent() {
  try {
    const res = await fetch('/api/links?limit=10');
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) {
      recentList.innerHTML = '<li class="recent__empty">Chưa có link nào. Tạo cái đầu tiên ở trên nhé.</li>';
      return;
    }

    recentList.innerHTML = data
      .map(
        (item) => `
        <li class="recent__item">
          <div class="recent__item-main">
            <a class="recent__item-code" href="${item.shortUrl}" target="_blank" rel="noopener">${item.shortUrl.replace(/^https?:\/\//, '')}</a>
            <div class="recent__item-original">${escapeHtml(item.originalUrl)}</div>
          </div>
          <div class="recent__item-clicks">${item.clicks} lượt</div>
        </li>`
      )
      .join('');
  } catch {
    // im lặng bỏ qua - không phải chức năng cốt lõi của trang
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

refreshBtn.addEventListener('click', loadRecent);

loadRecent();
