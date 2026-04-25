// DouSearch v2.2 - popup.js

const DOUYIN_TAGS = [
  { trend: true,  kw: '油炸狗尾巴' },
  { trend: true,  kw: '科目三' },
  { trend: false, kw: '猫meme' },
  { trend: false, kw: '周杰伦' },
  { trend: true,  kw: '美食教程' },
  { trend: false, kw: '搞笑视频' },
  { trend: false, kw: '旅行攻略' },
  { trend: false, kw: '健身教学' },
];

const TIKTOK_TAGS = [
  { trend: true,  kw: 'trending dance' },
  { trend: true,  kw: 'viral memes' },
  { trend: false, kw: 'cooking tips' },
  { trend: false, kw: 'travel vlog' },
  { trend: true,  kw: 'funny fails' },
  { trend: false, kw: 'life hacks' },
  { trend: false, kw: 'fitness' },
  { trend: false, kw: 'pets' },
];

const SETTING_MAP = {
  'newtab':  't-newtab',
  'history': 't-history',
  'bypass':  't-bypass',
  'copy':    't-copy',
};

let currentPlatform = 'douyin';
let searchHistory = [];
let settings = { newtab: true, history: true, bypass: true, copy: false };

// ── Boot ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadStorage();
  renderTags(DOUYIN_TAGS);
  bindAll();
});

// ── Storage ───────────────────────────────────────────────────────────────────
function loadStorage() {
  chrome.storage.local.get(['history', 'settings', 'platform'], (data) => {
    if (data.history)  searchHistory = data.history;
    if (data.settings) Object.assign(settings, data.settings);
    if (data.platform) currentPlatform = data.platform;

    applySettingsUI();
    renderHistory();

    if (currentPlatform === 'tiktok') {
      applyPlatformUI('tiktok');
      renderTags(TIKTOK_TAGS);
    }
  });
}

function saveStorage() {
  chrome.storage.local.set({ history: searchHistory, settings, platform: currentPlatform });
}

// ── Bind all events ───────────────────────────────────────────────────────────
function bindAll() {
  // Search
  document.getElementById('searchBtn').addEventListener('click', doSearch);
  document.getElementById('keyword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch();
  });

  // Paste & Clear
  document.getElementById('pasteBtn').addEventListener('click', doPaste);
  document.getElementById('clearBtn').addEventListener('click', () => {
    document.getElementById('keyword').value = '';
    document.getElementById('keyword').focus();
    document.getElementById('clearBtn').style.display = 'none';
  });
  document.getElementById('keyword').addEventListener('input', () => {
    const hasVal = document.getElementById('keyword').value.length > 0;
    document.getElementById('clearBtn').style.display = hasVal ? 'flex' : 'none';
  });

  // Platform
  document.getElementById('pt-douyin').addEventListener('click', () => setPlatform('douyin'));
  document.getElementById('pt-tiktok').addEventListener('click', () => setPlatform('tiktok'));

  // Tabs (tab bar)
  document.getElementById('tab-popular').addEventListener('click',  () => switchTab('popular'));
  document.getElementById('tab-history').addEventListener('click',  () => switchTab('history'));
  document.getElementById('tab-settings').addEventListener('click', () => switchTab('settings'));

  // Header shortcut buttons
  document.getElementById('historyBtn').addEventListener('click',  () => switchTab('history'));
  document.getElementById('settingsBtn').addEventListener('click', () => switchTab('settings'));

  // Settings toggles
  Object.entries(SETTING_MAP).forEach(([key, id]) => {
    document.getElementById(id).addEventListener('click', () => toggleSetting(key));
  });

  // Clear history
  document.getElementById('clearHistoryBtn').addEventListener('click', clearHistory);

  // GitHub
  document.getElementById('githubBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://github.com/Ashekur-Rahman/Dousearch' });
  });
}

// ── Tab switching ─────────────────────────────────────────────────────────────
function switchTab(name) {
  ['popular', 'history', 'settings'].forEach((t) => {
    document.getElementById('tab-' + t).classList.toggle('active', t === name);
    document.getElementById('panel-' + t).classList.toggle('active', t === name);
  });
}

// ── Platform ──────────────────────────────────────────────────────────────────
function setPlatform(p) {
  currentPlatform = p;
  applyPlatformUI(p);
  renderTags(p === 'tiktok' ? TIKTOK_TAGS : DOUYIN_TAGS);
  saveStorage();
}

function applyPlatformUI(p) {
  const dy = document.getElementById('pt-douyin');
  const tt = document.getElementById('pt-tiktok');
  dy.className = 'ptag' + (p === 'douyin' ? ' active' : '');
  tt.className = 'ptag' + (p === 'tiktok' ? ' active tiktok' : '');
  document.getElementById('btnText').textContent =
    p === 'tiktok' ? 'Search TikTok' : 'Search Douyin';
}

// ── Tags ──────────────────────────────────────────────────────────────────────
function renderTags(list) {
  const grid = document.getElementById('tagsGrid');
  grid.innerHTML = list.map((t) =>
    `<div class="tag">${t.trend ? '<span class="trend">↑</span>' : ''}${escHtml(t.kw)}</div>`
  ).join('');

  grid.querySelectorAll('.tag').forEach((el, i) => {
    el.addEventListener('click', () => fillSearch(list[i].kw));
  });
}

// ── Search ────────────────────────────────────────────────────────────────────
function doSearch() {
  const kw = document.getElementById('keyword').value.trim();
  if (!kw) { document.getElementById('keyword').focus(); return; }

  const url = currentPlatform === 'tiktok'
    ? `https://www.tiktok.com/search?q=${encodeURIComponent(kw)}`
    : `https://www.douyin.com/search/${encodeURIComponent(kw)}?enter_from=discover&source=pc_click_hashtag_feed`;

  if (settings.copy) {
    navigator.clipboard.writeText(url).then(showToast).catch(() => {});
  }

  if (settings.history) {
    searchHistory = [kw, ...searchHistory.filter((h) => h !== kw)].slice(0, 15);
    renderHistory();
    saveStorage();
  }

  if (settings.newtab) {
    chrome.tabs.create({ url });
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) chrome.tabs.update(tabs[0].id, { url });
    });
  }
}

function fillSearch(kw) {
  document.getElementById('keyword').value = kw;
  document.getElementById('keyword').focus();
  document.getElementById('clearBtn').style.display = kw ? 'flex' : 'none';
}

// ── Paste ─────────────────────────────────────────────────────────────────────
function doPaste() {
  navigator.clipboard.readText().then((text) => {
    const kw = text.trim();
    if (!kw) return;
    fillSearch(kw);
    showPasteToast();
  }).catch(() => {
    // fallback: focus input so user can Ctrl+V manually
    document.getElementById('keyword').focus();
  });
}

// ── History ───────────────────────────────────────────────────────────────────
function renderHistory() {
  const list = document.getElementById('historyList');
  const none = document.getElementById('noHistory');

  if (!searchHistory.length) {
    list.innerHTML = '';
    none.style.display = 'block';
    return;
  }

  none.style.display = 'none';
  list.innerHTML = searchHistory.map((h, i) =>
    `<div class="history-item" data-index="${i}">
      <span>🕐 ${escHtml(h)}</span>
      <span class="del-btn" data-index="${i}">✕</span>
    </div>`
  ).join('');

  list.querySelectorAll('.history-item').forEach((el) => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('del-btn')) {
        removeHistory(+e.target.dataset.index);
      } else {
        fillSearch(searchHistory[+el.dataset.index]);
        switchTab('popular');
      }
    });
  });
}

function removeHistory(i) {
  searchHistory.splice(i, 1);
  renderHistory();
  saveStorage();
}

function clearHistory() {
  searchHistory = [];
  renderHistory();
  saveStorage();
}

// ── Settings ──────────────────────────────────────────────────────────────────
function toggleSetting(key) {
  settings[key] = !settings[key];
  const el = document.getElementById(SETTING_MAP[key]);
  el.classList.toggle('on', settings[key]);
  saveStorage();
}

function applySettingsUI() {
  Object.entries(SETTING_MAP).forEach(([key, id]) => {
    document.getElementById(id).classList.toggle('on', !!settings[key]);
  });
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

function showPasteToast() {
  const toast = document.getElementById('toast-paste');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1500);
}

// ── Utils ─────────────────────────────────────────────────────────────────────
function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
