import { useState, useEffect } from 'react';
import ChaosCanvas from './components/ChaosCanvas';
import ObstructionPopup from './components/ObstructionPopup';
import './index.css';

/**
 * メインアプリケーションコンポーネント
 * 画面全体のスクロール制御と、構成要素（3Dキャンバス＋ポップアップ）を統合する。
 * 
 * 初心者向け解説:
 * ここではReactの `useState` (状態を保持する機能) と `useEffect` (画面表示時などに処理を実行する機能) を使い、
 * ユーザーがどれくらいスクロールしたかの数値を取得・保存しています。
 */
function App() {
  // スクロール量（ピクセル）を保持する状態
  const [scrollAmount, setScrollAmount] = useState(0);

  useEffect(() => {
    // スクロール時に呼ばれる関数
    const handleScroll = () => {
      // 画面のスクロール量を取得して保存する
      setScrollAmount(window.scrollY);
    };

    // 強制的にスクロールさせるために一時的にbodyに高さを付与
    document.body.style.height = '1000vh';
    
    // スクロールイベントを監視開始
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // コンポーネントが破棄される時に監視機能を解除（クリーンアップ）
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.height = 'auto';
    };
  }, []);

  return (
    <div className="app-container">
      {/* 背景に固定される3Dのカオスキャンバス */}
      <div className="canvas-wrapper">
        {/* スクロール量を3Dキャンバスに渡して回転させる */}
        <ChaosCanvas scrollAmount={scrollAmount} />
      </div>

      {/* 常にマウスに追従し、操作を妨害するグラスモーフィズムポップアップ */}
      <ObstructionPopup />
    </div>
  );
}

export default App;
