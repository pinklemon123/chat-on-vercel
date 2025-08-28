// 入口：初始化预置提示词，绑定侧栏按钮与导入导出
import { qs } from './ui.js';
import {
  ensurePresetsLoaded, renderPromptList, loadEditor, newPrompt,
  saveEditor, deleteEditor, setActive, exportPrompts, importPrompts,
  openDrawer, closeDrawer, isDrawerOpen
} from './promptlib.js';

const newPromptBtn   = qs('#newPrompt');
const saveBtn        = qs('#savePrompt');
const delBtn         = qs('#deletePrompt');
const setActiveBtn   = qs('#setActive');
const exportBtn      = qs('#exportPrompts');
const importInput    = qs('#importPrompts');
const drawer         = qs('#drawer');

// === 新增：页签元素
const tabChat        = qs('#tabChat');
const tabPrompts     = qs('#tabPrompts');

// === 新增：页签选中态
function highlightTab(name){
  tabChat.classList.toggle('active', name === 'chat');
  tabPrompts.classList.toggle('active', name === 'prompts');
}

// === 新增：Hash 路由（#chat / #prompts）
function route(){
  const hash = (location.hash || '#chat').toLowerCase();
  if (hash === '#prompts') {
    openDrawer();      // 打开提示词侧栏
    highlightTab('prompts');
  } else {
    closeDrawer();     // 关闭提示词侧栏
    highlightTab('chat');
  }
}

// Escape 键在“提示词库”界面返回聊天界面
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && isDrawerOpen()) {
    location.hash = '#chat';
  }
});

// 防止用户清空 hash 时无状态：点击 LOGO/标题时回 #chat（可选）
qs('h1')?.addEventListener('click', () => { location.hash = '#chat'; });

(async function init(){
  await ensurePresetsLoaded();
  renderPromptList();
  // 默认加载第一个已有提示词到编辑器
  const first = JSON.parse(localStorage.getItem('prompts') || '[]')[0];
  if (first) loadEditor(first.id);

  // === 新增：启动时根据 hash 渲染界面
  if (!location.hash) location.hash = '#chat';
  route();
})();

// === 新增：监听 hash 变化
window.addEventListener('hashchange', route);

// 侧栏相关按钮
newPromptBtn?.addEventListener('click', newPrompt);
saveBtn?.addEventListener('click', saveEditor);
delBtn?.addEventListener('click', deleteEditor);
setActiveBtn?.addEventListener('click', setActive);

// 导入导出
exportBtn?.addEventListener('click', exportPrompts);
importInput?.addEventListener('change', e => {
  const f = e.target.files?.[0]; if (f) importPrompts(f);
});
