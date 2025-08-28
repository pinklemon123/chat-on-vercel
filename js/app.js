// 入口：初始化预置提示词，绑定侧栏按钮与导入导出
import { qs } from './ui.js';
import {
  ensurePresetsLoaded, renderPromptList, loadEditor, newPrompt,
  saveEditor, deleteEditor, setActive, exportPrompts, importPrompts
} from './promptlib.js';

const newPromptBtn   = qs('#newPrompt');
const saveBtn        = qs('#savePrompt');
const delBtn         = qs('#deletePrompt');
const setActiveBtn   = qs('#setActive');
const exportBtn      = qs('#exportPrompts');
const importInput    = qs('#importPrompts');

// 初始化
(async function init(){
  await ensurePresetsLoaded();
  renderPromptList();
  const first = JSON.parse(localStorage.getItem('prompts') || '[]')[0];
  if (first) loadEditor(first.id);
})();

// 左侧提示词库：按钮绑定
newPromptBtn?.addEventListener('click', newPrompt);
saveBtn?.addEventListener('click', saveEditor);
delBtn?.addEventListener('click', deleteEditor);
setActiveBtn?.addEventListener('click', setActive);

// 导入/导出
exportBtn?.addEventListener('click', exportPrompts);
importInput?.addEventListener('change', e => {
  const f = e.target.files?.[0]; if (f) importPrompts(f);
});

// —— 移动端折叠/展开 —— //
const drawer = qs('#drawer');
const collapseBtn = qs('#collapsePrompts');
const expandBtn   = qs('#expandPrompts');

collapseBtn?.addEventListener('click', () => drawer.classList.add('collapsed'));
expandBtn?.addEventListener('click',   () => drawer.classList.remove('collapsed'));
