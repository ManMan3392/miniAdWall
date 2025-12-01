import * as React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
try {
  const r: any = React;
  if (r && r.version) {
    const major = Number(String(r.version).split('.')[0] || 0);
    if (major > 18) {
      r.version = '18.999.0';
    }
  }
} catch {
  // 忽略任何修改失败，不影响应用启动
}

import 'normalize.css';
import './assets/css/index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
