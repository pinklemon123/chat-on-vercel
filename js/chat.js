// 聊天逻辑：多轮上下文 + Enter发送 + 禁用控件 + 流式显示（后端已清洗为纯文本）
import { qs, addBubble, setBusy } from './ui.js';
import { state, buildSystemMessages } from './promptlib.js';

const chatEl = qs('#chat');
const form = qs('#composer');
const input = qs('#q');
const sendBtn = qs('#send');
const clearBtn = qs('#clear');
const useSystem = qs('#useSystem');

let messages = JSON.parse(localStorage.getItem('messages') || '[]');
const saveMessages = () => localStorage.setItem('messages', JSON.stringify(messages));

// Enter 发送，Shift+Enter 换行
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

clearBtn.addEventListener('click', () => {
  messages = []; saveMessages();
  chatEl.innerHTML = '';
  // 重置 “once” 注入标记，让下一轮能再注入
  state.injectedOnceFlag = 'false';
  localStorage.setItem('injectedOnceFlag', 'false');
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = input.value.trim(); if (!text) return;

  // 显示用户消息
  addBubble(chatEl, 'user', text);
  messages.push({ role: 'user', content: text }); saveMessages();

  // 清空输入并禁用控件
  input.value = ''; setBusy(input, sendBtn, true);

  // 准备发送的消息：系统提示词（可选） + 历史 + 新消息（已 push）
  const vars = {}; // 你可以在这里放模板变量，如 { project: 'MyApp', lang: 'zh' }
  const sysMsgs = useSystem.checked ? buildSystemMessages(vars) : [];
  const payload = { messages: [...sysMsgs, ...messages] };

  // 预放 AI 气泡，流式填充
  const out = addBubble(chatEl, 'assistant', '');

  try {
    const resp = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok || !resp.body) {
      out.textContent = `（出错：${resp.status}）`;
      setBusy(input, sendBtn, false);
      return;
    }
    const reader = resp.body.getReader();
    const dec = new TextDecoder();
    let full = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = dec.decode(value);
      full += chunk;
      out.textContent += chunk;
      chatEl.scrollTop = chatEl.scrollHeight;
    }
    messages.push({ role: 'assistant', content: full }); saveMessages();
  } catch (err) {
    out.textContent = '（网络异常或服务不可用）';
    console.error(err);
  } finally {
    setBusy(input, sendBtn, false);
  }
});

// 刷新时把历史渲染回界面
(function hydrate(){
  chatEl.innerHTML = '';
  for (const m of messages) addBubble(chatEl, m.role, m.content);
})();
