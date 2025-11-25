import * as React from 'react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// 如果使用 React 19，而依赖的 antd v5 仅兼容到 React 18，antd 会在运行时打印兼容性警告。
// 这里在导入任何 antd 相关内容之前临时修改 React.version，避免 antd 的警告。
// 注意：这是一个临时 shim，建议在正式支持 React 19 的 antd 版本或官方兼容包可用时移除。
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
