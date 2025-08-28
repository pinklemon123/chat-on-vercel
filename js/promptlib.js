// 提示词库：本地存储 + 预置合并 + 渲染/编辑/导出/导入 + 变量模板
import { qs } from './ui.js';

const promptList = qs('#promptList');
const editor = qs('#editor');
const pName = qs('#pName');
const pMode = qs('#pMode');
const pContent = qs('#pContent');
const pFewshot = qs('#pFewshot');
const activeBar = qs('#activeBar');

export const state = {
  prompts: JSON.parse(localStorage.getItem('prompts') || '[]'),
  activePromptId: localStorage.getItem('activePromptId') || '',
  injectedOnceFlag: localStorage.getItem('injectedOnceFlag') || 'false',
};
const save = () => {
  localStorage.setItem('prompts', JSON.stringify(state.prompts));
  localStorage.setItem('activePromptId', state.activePromptId);
  localStorage.setItem('injectedOnceFlag', state.injectedOnceFlag);
};

export async function ensurePresetsLoaded() {
  if (localStorage.getItem('presetsMerged') === 'true') return;
  try {
    const r = await fetch('/data/presets.json');
    if (r.ok) {
      const presets = await r.json();
      state.prompts.push(...presets.map(p => ({ ...p, id: p.id || uuid() })));
      localStorage.setItem('presetsMerged', 'true');
      save();
    }
  } catch {}
}

export function uuid(){ return 'p-' + Math.random().toString(36).slice(2,9); }

export function renderPromptList(){
  promptList.innerHTML = '';
  state.prompts.forEach(p => {
    const btn = document.createElement('button');
    btn.className = 'prompt-item' + (p.id===state.activePromptId?' active':'');
    btn.textContent = p.name || '(未命名)';
    btn.onclick = () => loadEditor(p.id);
    promptList.appendChild(btn);
  });
  renderActiveBar();
}

function renderActiveBar(){
  const cur = state.prompts.find(x => x.id===state.activePromptId);
  if (cur) {
    activeBar.textContent = `当前系统提示词：${cur.name}（${cur.mode==='every'?'每次注入':'仅首次注入'}）`;
    activeBar.classList.remove('hidden');
  } else {
    activeBar.classList.add('hidden');
    activeBar.textContent = '';
  }
}

export function loadEditor(id){
  const p = state.prompts.find(x => x.id===id);
  editor.dataset.id = id || '';
  pName.value = p?.name || '';
  pMode.value = p?.mode || 'every';
  pContent.value = p?.content || '';
  pFewshot.value = p?.fewshot || '';
}

export function newPrompt(){
  editor.dataset.id = '';
  pName.value = ''; pMode.value = 'every'; pContent.value = ''; pFewshot.value = '';
}

export function saveEditor(){
  const id = editor.dataset.id || uuid();
  const obj = {
    id,
    name: pName.value.trim() || '未命名提示词',
    mode: pMode.value,
    content: pContent.value,
    fewshot: pFewshot.value
  };
  const i = state.prompts.findIndex(x => x.id===id);
  if (i>=0) state.prompts[i] = obj; else state.prompts.push(obj);
  if (!state.activePromptId) state.activePromptId = id;
  save(); renderPromptList(); loadEditor(id);
}

export function deleteEditor(){
  const id = editor.dataset.id;
  if (!id) return;
  state.prompts = state.prompts.filter(x => x.id!==id);
  if (state.activePromptId===id) state.activePromptId = '';
  newPrompt(); save(); renderPromptList();
}

export function setActive(){
  const id = editor.dataset.id;
  if (!id) return;
  state.activePromptId = id;
  state.injectedOnceFlag = 'false';
  save(); renderPromptList();
}

export function exportPrompts(){
  const blob = new Blob([JSON.stringify(state.prompts, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'prompts.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

export function importPrompts(file){
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const arr = JSON.parse(reader.result);
      if (Array.isArray(arr)) {
        const map = new Map(state.prompts.map(p => [p.name, p]));
        arr.forEach(p => map.set(p.name, { ...p, id: p.id || uuid() }));
        state.prompts = [...map.values()];
        save(); renderPromptList();
      }
    } catch {}
  };
  reader.readAsText(file);
}

// 构建要注入的 system/few-shot 消息
export function buildSystemMessages(vars = {}) {
  if (!state.activePromptId) return [];
  const cur = state.prompts.find(x => x.id===state.activePromptId);
  if (!cur) return [];

  if (cur.mode === 'once' && state.injectedOnceFlag === 'true') return [];

  const sys = interpolate(cur.content || '', vars);
  const msgs = [];
  if (sys.trim()) msgs.push({ role: 'system', content: sys });

  const few = (cur.fewshot || '').split('\n').map(s => s.trim()).filter(Boolean);
  for (const line of few) {
    const m = /^(\w+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const role = m[1].toLowerCase();
    const content = interpolate(m[2], vars);
    if (['user','assistant','system'].includes(role)) msgs.push({ role, content });
  }

  if (cur.mode === 'once') {
    state.injectedOnceFlag = 'true'; save();
  }
  return msgs;
}

function interpolate(tpl, vars) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (vars[k] ?? ''));
}
