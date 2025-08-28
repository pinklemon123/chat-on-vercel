// 简单的 UI 工具与渲染
export const qs = (s, el = document) => el.querySelector(s);
export const qsa = (s, el = document) => [...el.querySelectorAll(s)];

export function addBubble(chatEl, role, text = '') {
  const wrap = document.createElement('div');
  wrap.className = `bubble ${role}`;
  const avatar = document.createElement('div'); avatar.className = 'avatar'; avatar.textContent = role==='user'?'你':'AI';
  const body = document.createElement('div'); body.className = 'body'; body.textContent = text;
  wrap.appendChild(avatar); wrap.appendChild(body);
  chatEl.appendChild(wrap);
  chatEl.scrollTop = chatEl.scrollHeight;
  return body;
}

export function setBusy(inputEl, btnEl, busy) {
  inputEl.disabled = busy;
  btnEl.disabled = busy;
  btnEl.textContent = busy ? '发送中…' : '发送';
}

export function toggle(el, show) {
  el.classList[show ? 'remove' : 'add']('hidden');
}
