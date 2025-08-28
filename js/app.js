// 入口：初始化预置提示词，绑定侧栏按钮与导入导出
import { qs } from './ui.js';
import {
  ensurePresetsLoaded, renderPromptList, loadEditor, newPrompt,
  saveEditor, deleteEditor, setActive, exportPrompts, importPrompts,
  openDrawer, closeDrawer, isDrawerOpen
} from './promptlib.js';

const togglePrompts = qs('#togglePrompts');
const newPromptBtn   = qs('#newPrompt');
const saveBtn        = qs('#savePrompt');
const delBtn         = qs('#deletePrompt');
const setActiveBtn   = qs('#setActive');
const exportBtn      = qs('#exportPrompts');
const importInput    = qs('#importPrompts');
const drawer         = qs('#drawer');

(async function init(){
  await ensurePresetsLoaded();
  renderPromptList();
  // 默认加载第一个已有提示词到编辑器
  const first = JSON.parse(localStorage.getItem('prompts') || '[]')[0];
  if (first) loadEditor(first.id);
})();

togglePrompts.addEventListener('click', () => {
  isDrawerOpen() ? closeDrawer() : openDrawer();
});
newPromptBtn.addEventListener('click', newPrompt);
saveBtn.addEventListener('click', saveEditor);
delBtn.addEventListener('click', deleteEditor);
setActiveBtn.addEventListener('click', setActive);
exportBtn.addEventListener('click', exportPrompts);
importInput.addEventListener('change', e => {
  const f = e.target.files?.[0]; if (f) importPrompts(f);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && isDrawerOpen()) closeDrawer();
});
