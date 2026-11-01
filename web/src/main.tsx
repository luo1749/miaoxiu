import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router';
import './index.css';
import App from './App.tsx';

// 全局兜底：捕获第三方库抛出的未捕获 Promise / JS 异常，避免页面渲染冻结
window.addEventListener('unhandledrejection', (e) => {
  console.warn('[global] unhandledrejection:', e.reason);
  e.preventDefault();
});
window.addEventListener('error', (e) => {
  console.warn('[global] error:', e.message, e.filename, e.lineno);
});

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
);
