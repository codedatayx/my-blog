// ========== Blog AI Chat ==========
// Uses DeepSeek API (OpenAI-compatible format)

(function () {
  const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';
  const MODEL = 'deepseek-chat';
  const POSTS_FILE = 'data/posts.json';

  let posts = [];
  let chatHistory = [];
  let apiKey = localStorage.getItem('deepseek_key') || '';
  let isOpen = false;
  let isSettingsOpen = false;

  // ========== Init ==========
  async function initChat() {
    // Load posts
    try {
      const res = await fetch(POSTS_FILE);
      posts = await res.json();
    } catch (e) {
      posts = [];
    }

    injectHTML();
    bindEvents();
  }

  function injectHTML() {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'static/css/chat.css';
    document.head.appendChild(css);

    const html = `
      <button class="chat-fab" id="chatFab" title="AI 助手">&#128172;</button>

      <div class="chat-panel" id="chatPanel">
        <div class="chat-header">
          <div class="chat-header-info">
            <span class="dot"></span>
            <h3>AI 助手</h3>
          </div>
          <div class="chat-header-actions">
            <button onclick="ChatBot.toggleSettings()" title="设置">&#9881;</button>
            <button onclick="ChatBot.toggle()" title="关闭">&times;</button>
          </div>
        </div>

        <div class="chat-settings" id="chatSettings">
          <label>DeepSeek API Key</label>
          <input type="password" id="chatApiKey" placeholder="sk-...">
          <p class="hint">在 <a href="https://platform.deepseek.com/" target="_blank">DeepSeek 平台</a> 获取，费用极低</p>
          <button class="save-btn" onclick="ChatBot.saveKey()">保存</button>
        </div>

        <div class="chat-messages" id="chatMessages">
          <div class="chat-msg bot">
            你好！我是博客 AI 助手，可以帮你了解文章内容。试试问我：
          </div>
        </div>

        <div class="chat-suggestions" id="chatSuggestions">
          <button onclick="ChatBot.ask('推荐一篇文章给我')">推荐文章</button>
          <button onclick="ChatBot.ask('这个博客主要讲什么？')">博客介绍</button>
          <button onclick="ChatBot.ask('有哪些技术相关的内容？')">技术内容</button>
        </div>

        <div class="chat-input-area">
          <input type="text" id="chatInput" placeholder="输入你的问题..." autocomplete="off">
          <button onclick="ChatBot.send()">&#10148;</button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  function bindEvents() {
    document.getElementById('chatFab').addEventListener('click', toggle);
    document.getElementById('chatInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        send();
      }
    });
  }

  // ========== Toggle ==========
  function toggle() {
    isOpen = !isOpen;
    document.getElementById('chatPanel').classList.toggle('open', isOpen);
    document.getElementById('chatFab').classList.toggle('hidden', isOpen);
    if (isOpen) {
      document.getElementById('chatInput').focus();
    }
  }

  function toggleSettings() {
    isSettingsOpen = !isSettingsOpen;
    const settings = document.getElementById('chatSettings');
    const messages = document.getElementById('chatMessages');
    const suggestions = document.getElementById('chatSuggestions');
    const inputArea = document.querySelector('.chat-input-area');

    settings.classList.toggle('show', isSettingsOpen);
    messages.style.display = isSettingsOpen ? 'none' : '';
    suggestions.style.display = isSettingsOpen ? 'none' : '';
    inputArea.style.display = isSettingsOpen ? 'none' : '';

    if (isSettingsOpen) {
      document.getElementById('chatApiKey').value = apiKey;
    }
  }

  function saveKey() {
    apiKey = document.getElementById('chatApiKey').value.trim();
    if (apiKey) {
      localStorage.setItem('deepseek_key', apiKey);
      addBotMessage('API Key 已保存，现在可以开始聊天了！');
    }
    toggleSettings();
  }

  // ========== Chat ==========
  function addMessage(text, role) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function addBotMessage(text) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function addTyping() {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-msg typing';
    div.id = 'typingIndicator';
    div.textContent = '正在思考...';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function removeTyping() {
    const el = document.getElementById('typingIndicator');
    if (el) el.remove();
  }

  function buildPostContext() {
    if (posts.length === 0) return '暂无文章内容。';

    const summaries = posts.map(p => {
      const tags = p.tags.length ? ` [标签: ${p.tags.join(', ')}]` : '';
      // Strip HTML tags from content for context
      const plain = p.content.replace(/<[^>]+>/g, '').substring(0, 300);
      return `- "${p.title}" (${p.date})${tags}\n  摘要: ${p.summary}\n  内容概要: ${plain}...`;
    });

    return `以下是博客「杨轩的博客」的所有文章：\n\n${summaries.join('\n\n')}`;
  }

  async function ask(question) {
    // Show user message
    addMessage(question, 'user');

    // Hide suggestions after first question
    document.getElementById('chatSuggestions').style.display = 'none';

    // Clear input
    document.getElementById('chatInput').value = '';

    // Check API key
    if (!apiKey) {
      addBotMessage('请先在设置中配置 <strong>DeepSeek API Key</strong>（点击右上角齿轮图标）。');
      return;
    }

    // Check posts
    if (posts.length === 0) {
      addBotMessage('暂无文章内容，无法回答问题。');
      return;
    }

    addTyping();

    const postContext = buildPostContext();
    const systemPrompt = `你是「杨轩的博客」的 AI 助手。根据博客文章内容回答用户问题。

规则：
- 只基于博客文章内容回答，不要编造不存在的文章
- 回答要简洁自然，像朋友聊天一样
- 如果用户想了解某篇文章，给出文章标题并建议点击阅读
- 推荐文章时说明推荐理由
- 如果问题和博客内容无关，友好地引导回博客话题

博客文章列表：
${postContext}`;

    chatHistory.push({ role: 'user', content: question });

    try {
      const res = await fetch(DEEPSEEK_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...chatHistory.slice(-10) // Keep last 10 messages for context
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      removeTyping();

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const reply = data.choices?.[0]?.message?.content || '抱歉，没有收到回复。';

      chatHistory.push({ role: 'assistant', content: reply });

      // Format reply with article links
      let formatted = reply;
      posts.forEach(p => {
        if (formatted.includes(p.title)) {
          formatted = formatted.replace(
            new RegExp(p.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
            `<a href="post.html?id=${p.id}">${p.title}</a>`
          );
        }
      });

      addBotMessage(formatted);
    } catch (e) {
      removeTyping();
      addBotMessage('出错了: ' + e.message);
    }
  }

  function send() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    ask(text);
  }

  // ========== Expose ==========
  window.ChatBot = { toggle, ask, send, toggleSettings, saveKey };

  // Init when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }
})();
