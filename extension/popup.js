// Ask Tomas - Chrome Extension Popup

const STORAGE_KEY = 'tomas_ext';
const DEFAULT_URL = 'https://tina-translate-table.lovable.app';
const SUPABASE_URL = 'https://kaqjqrdmqtjgegsfpwxc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthcWpxcmRtcXRqZ2Vnc2Zwd3hjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NTgwMTYsImV4cCI6MjA5MDUzNDAxNn0.L-vQnwEjDTAyXZf6_vqYSQZXXVmIeMKRs-57xIA56dk';

let appUrl = DEFAULT_URL;
let messages = [];
let isLoading = false;
let showSettings = false;

// DOM elements
const messagesEl = document.getElementById('messages');
const emptyState = document.getElementById('empty-state');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const clearBtn = document.getElementById('clear-btn');
const settingsToggle = document.getElementById('settings-toggle');
const settingsBar = document.getElementById('settings-bar');
const appUrlInput = document.getElementById('app-url');
const saveUrlBtn = document.getElementById('save-url');
const statusLine = document.getElementById('status-line');
const openAppLink = document.getElementById('open-app');

// Load saved state
chrome.storage.local.get([STORAGE_KEY], (result) => {
  const data = result[STORAGE_KEY] || {};
  appUrl = data.appUrl || DEFAULT_URL;
  messages = data.messages || [];
  appUrlInput.value = appUrl;
  openAppLink.href = appUrl;
  openAppLink.style.display = 'flex';
  openAppLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: appUrl });
  });
  renderMessages();
});

function saveState() {
  chrome.storage.local.set({ [STORAGE_KEY]: { appUrl, messages } });
}

function formatText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
}

function renderMessages() {
  // Clear all except empty state
  const children = Array.from(messagesEl.children);
  children.forEach(c => { if (c.id !== 'empty-state') c.remove(); });

  emptyState.style.display = messages.length === 0 ? 'flex' : 'none';

  messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = `msg ${msg.role}`;
    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble';
    bubble.innerHTML = msg.role === 'assistant' ? formatText(msg.content) : escapeHtml(msg.content);
    div.appendChild(bubble);
    messagesEl.appendChild(div);
  });

  if (isLoading) {
    const div = document.createElement('div');
    div.className = 'msg assistant';
    div.innerHTML = '<div class="msg-bubble"><div class="loading-dots"><span></span><span></span><span></span></div></div>';
    messagesEl.appendChild(div);
  }

  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

async function sendMessage(question) {
  if (!question || isLoading) return;

  messages.push({ role: 'user', content: question });
  isLoading = true;
  renderMessages();
  saveState();
  chatInput.value = '';
  sendBtn.disabled = true;
  statusLine.textContent = '';
  statusLine.className = 'status';

  try {
    // First, fetch settings from the app's Supabase instance
    // We need the Supabase URL and anon key - derive from the app URL
    const supabaseUrl = await getSupabaseUrl();
    if (!supabaseUrl) throw new Error('Could not determine backend URL');

    const response = await fetch(`${supabaseUrl}/functions/v1/style-guide-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': await getAnonKey(),
      },
      body: JSON.stringify({
        question,
        conversationHistory: messages.slice(-10),
      }),
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    messages.push({ role: 'assistant', content: data.answer || 'No response.' });
    statusLine.textContent = 'Connected';
    statusLine.className = 'status connected';
  } catch (err) {
    messages.push({ role: 'assistant', content: `Error: ${err.message}. Check your Tomas app URL in settings.` });
    statusLine.textContent = 'Connection failed';
    statusLine.className = 'status error';
  } finally {
    isLoading = false;
    renderMessages();
    saveState();
  }
}

// Derive Supabase URL from app config
async function getSupabaseUrl() {
  // Try to fetch the app's .env values from a known endpoint
  // For Lovable Cloud projects, the Supabase URL follows a pattern
  try {
    const stored = await new Promise(resolve => {
      chrome.storage.local.get(['tomas_supabase'], r => resolve(r.tomas_supabase));
    });
    if (stored?.url) return stored.url;

    // Fetch the index page and extract the Supabase URL from the env
    const resp = await fetch(appUrl);
    const html = await resp.text();

    // Look for VITE_SUPABASE_URL in the built JS
    const scripts = html.match(/src="([^"]*\.js)"/g);
    if (scripts) {
      for (const s of scripts.slice(0, 3)) {
        const src = s.match(/src="([^"]*)"/)[1];
        const fullSrc = src.startsWith('http') ? src : new URL(src, appUrl).href;
        try {
          const jsResp = await fetch(fullSrc);
          const js = await jsResp.text();
          const match = js.match(/https:\/\/[a-z0-9]+\.supabase\.co/);
          if (match) {
            const url = match[0];
            // Also try to find anon key
            const keyMatch = js.match(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/);
            if (keyMatch) {
              chrome.storage.local.set({ tomas_supabase: { url, key: keyMatch[0] } });
            }
            return url;
          }
        } catch {}
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function getAnonKey() {
  const stored = await new Promise(resolve => {
    chrome.storage.local.get(['tomas_supabase'], r => resolve(r.tomas_supabase));
  });
  return stored?.key || '';
}

// Event handlers
chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage(chatInput.value.trim());
});

chatInput.addEventListener('input', () => {
  sendBtn.disabled = !chatInput.value.trim() || isLoading;
});

clearBtn.addEventListener('click', () => {
  messages = [];
  renderMessages();
  saveState();
  statusLine.textContent = '';
});

settingsToggle.addEventListener('click', () => {
  showSettings = !showSettings;
  settingsBar.style.display = showSettings ? 'flex' : 'none';
});

saveUrlBtn.addEventListener('click', () => {
  const url = appUrlInput.value.trim();
  if (url) {
    appUrl = url;
    openAppLink.href = url;
    // Clear cached Supabase config so it re-discovers
    chrome.storage.local.remove('tomas_supabase');
    saveState();
    showSettings = false;
    settingsBar.style.display = 'none';
    statusLine.textContent = 'URL saved — will connect on next message';
    statusLine.className = 'status';
  }
});

// Focus input on open
chatInput.focus();
