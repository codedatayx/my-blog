// ========== Blog AI Chat - Digital Twin ==========

(function () {
  const _k = ['c2stYWIwNDIwZThlMzA2NDU1Y2I3ZGM3ZjEyODViOGMwNDU='];
  const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';
  const POSTS_FILE = 'data/posts.json';
  const SOUL_FILE = 'soul.md';

  let posts = [];
  let soul = '';
  let chatHistory = [];
  let isOpen = false;

  // ========== Init ==========
  async function initChat() {
    try {
      const [postsRes, soulRes] = await Promise.all([
        fetch(POSTS_FILE),
        fetch(SOUL_FILE)
      ]);
      posts = await postsRes.json();
      soul = await soulRes.text();
    } catch (e) {
      posts = [];
      soul = '你是杨轩的博客AI助手。';
    }

    injectHTML();
    bindEvents();
  }

  function injectHTML() {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'static/css/chat.css';
    document.head.appendChild(css);

    // Extract the intro line from soul.md
    const introMatch = soul.match(/我是杨轩.*不是什么AI模型/);
    const intro = introMatch ? introMatch[0] : '我就是杨轩本人，不是什么AI模型。';

    const html = `
      <button class="chat-fab" id="chatFab" title="和我聊聊">&#128172;</button>

      <div class="chat-panel" id="chatPanel">
        <div class="chat-header" style="position:relative;">
          <h3>问我的数字分身</h3>
          <div class="chat-header-actions">
            <button onclick="ChatBot.toggle()" title="关闭">&times;</button>
          </div>
        </div>

        <div class="chat-messages" id="chatMessages">
          <div class="chat-msg system">${intro}</div>
        </div>

        <div class="chat-suggestions" id="chatSuggestions">
          <button onclick="ChatBot.ask('你平时工作做什么？')">你的工作具体做什么</button>
          <button onclick="ChatBot.ask('INFJ对你工作有什么影响')">INFJ对你工作有什么影响</button>
          <button onclick="ChatBot.ask('你的个人主页什么样')">你的个人主页什么样</button>
          <button onclick="ChatBot.ask('你最近在忙什么？')">你最近在忙什么</button>
          <button onclick="ChatBot.ask('你喜欢什么类型的游戏')">我喜欢什么类型的游戏</button>
          <button onclick="ChatBot.ask('你是什么技术栈？')">你是什么技术栈？</button>
          <button onclick="ChatBot.ask('平时怎么学习新技术？')">怎么学AI技术</button>
        </div>

        <div class="chat-input-area">
          <input type="text" id="chatInput" placeholder="随便问，不用客气..." autocomplete="off">
          <button onclick="ChatBot.send()">发送</button>
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
    // Inline chat input (post page)
    const inlineInput = document.getElementById('inlineChatInput');
    if (inlineInput) {
      inlineInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          inlineSend();
        }
      });
    }
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

  function buildPostContext() {
    if (posts.length === 0) return '';
    const summaries = posts.map(p => {
      const tags = p.tags.length ? ` [${p.tags.join(', ')}]` : '';
      const plain = p.content.replace(/<[^>]+>/g, '').substring(0, 200);
      return `- "${p.title}" (${p.date})${tags}\n  ${p.summary}`;
    });
    return `\n\n我写过的博客文章：\n${summaries.join('\n')}`;
  }

  // ========== Typing Animation ==========
  function typeText(el, text, onDone) {
    let i = 0;
    const container = el.parentElement;
    function tick() {
      if (i < text.length) {
        // Auto-link article titles
        let formatted = text.substring(0, i + 1);
        posts.forEach(p => {
          if (formatted.includes(p.title)) {
            formatted = formatted.replace(
              new RegExp(p.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
              `<a href="post.html?id=${p.id}">${p.title}</a>`
            );
          }
        });
        el.innerHTML = formatted;
        container.scrollTop = container.scrollHeight;
        i++;
        // Faster for ASCII, slower for CJK
        const delay = text.charCodeAt(i - 1) > 127 ? 35 : 18;
        setTimeout(tick, delay);
      } else {
        onDone();
      }
    }
    tick();
  }

  async function chatRequest(messages) {
    const apiKey = atob(_k[0]);
    console.log('[ChatBot] Request:', { model: 'deepseek-chat', msgCount: messages.length });
    const res = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages,
        temperature: 0.8,
        max_tokens: 600
      })
    });
    console.log('[ChatBot] Response status:', res.status);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[ChatBot] API error:', err);
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }
    const data = await res.json();
    console.log('[ChatBot] Reply:', data.choices?.[0]?.message?.content?.substring(0, 50));
    return data.choices?.[0]?.message?.content || '抱歉，没有收到回复。';
  }

  async function ask(question) {
    addMessage(question, 'user');
    document.getElementById('chatSuggestions').style.display = 'none';
    document.getElementById('chatInput').value = '';

    const postContext = buildPostContext();
    const systemPrompt = `${soul}${postContext}`;
    chatHistory.push({ role: 'user', content: question });

    const botDiv = addBotMessage('<em style="color:#b0a898">正在思考...</em>');

    try {
      const reply = await chatRequest([
        { role: 'system', content: systemPrompt },
        ...chatHistory.slice(-10)
      ]);
      chatHistory.push({ role: 'assistant', content: reply });
      await new Promise(resolve => typeText(botDiv, reply, resolve));
    } catch (e) {
      console.error('[ChatBot]', e);
      botDiv.innerHTML = '出错了: ' + e.message;
    }
  }

  function send() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    ask(text);
  }

  // ========== Inline Chat (post page) ==========
  let inlineHistory = [];

  function inlineAddBot(text) {
    const container = document.getElementById('inlineChatMessages');
    if (!container) return null;
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.innerHTML = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return div;
  }

  function inlineAddUser(text) {
    const container = document.getElementById('inlineChatMessages');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'chat-msg user';
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  async function inlineAsk(question) {
    inlineAddUser(question);
    document.getElementById('inlineChatSuggestions').style.display = 'none';
    document.getElementById('inlineChatInput').value = '';

    const postTitle = document.querySelector('.post-detail-header h1')?.textContent || '';
    const postContent = document.querySelector('.post-detail-content')?.textContent?.substring(0, 500) || '';
    const systemPrompt = `${soul}\n\n当前这篇文章：「${postTitle}」\n内容摘要：${postContent}`;
    inlineHistory.push({ role: 'user', content: question });

    const botDiv = inlineAddBot('<em style="color:#b0a898">正在思考...</em>');

    try {
      const reply = await chatRequest([
        { role: 'system', content: systemPrompt },
        ...inlineHistory.slice(-8)
      ]);
      inlineHistory.push({ role: 'assistant', content: reply });
      await new Promise(resolve => typeText(botDiv, reply, resolve));
    } catch (e) {
      botDiv.innerHTML = '出错了: ' + e.message;
    }
  }

  function inlineSend() {
    const input = document.getElementById('inlineChatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    inlineAsk(text);
  }

  // ========== Expose ==========
  window.ChatBot = { toggle, ask, send, inlineAsk, inlineSend };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }
})();
