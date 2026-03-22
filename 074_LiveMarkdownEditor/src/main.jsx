// ============================================
// main.jsx - Reactアプリケーションのエントリーポイント
// ============================================
// ReactとReactDOMをインポート
import React from 'react';
import ReactDOM from 'react-dom/client';

// グローバルCSSをインポート
import './index.css';

// メインのAppコンポーネントをインポート
import App from './App.jsx';

// ============================================
// ReactアプリケーションをDOMにマウント
// document.getElementById('root') で index.html の <div id="root"> を取得し、
// そこにAppコンポーネントを描画する
// ============================================
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
