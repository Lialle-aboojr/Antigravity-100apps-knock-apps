import { useState, useEffect } from 'react';
import ChaosCanvas from './components/ChaosCanvas';
import ObstructionPopup from './components/ObstructionPopup';
import EntropyPhysics from './components/EntropyPhysics'; // 追加: 無限増殖グラスモーフィズムカード
import './index.css';

/**
 * メインアプリケーションコンポーネント
 * 画面全体のスクロール制御と、構成要素（3Dキャンバス＋ポップアップ）を統合する。
 * 
 * 修正: 画面クリック時の絶望的なアラートトラップを追加し、
 * さらに物理演算によるDOM制御を並存させています。
 */
function App() {
  const [scrollAmount, setScrollAmount] = useState(0);

  useEffect(() => {
    // 【ギミック1】スクロール時のイベント制御（カメラを回転させるための数値）
    const handleScroll = () => {
      setScrollAmount(window.scrollY);
    };

    // 強制的にスクロールさせるために一時的にbodyに高さを付与
    document.body.style.height = '1000vh';
    
    // 【ギミック2】画面のどこかをクリックした瞬間に理不尽なアラートを出す罠
    // 妨害ポップアップの隙き間を縫ってクリックすると発動します。
    const handleClickTrap = () => {
      alert("逃げられません / You cannot escape");
    };

    // スクロールとクリックのイベントを監視開始
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('click', handleClickTrap);
    
    // コンポーネントが破棄される時に監視機能を解除（クリーンアップ）
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClickTrap);
      document.body.style.height = 'auto';
    };
  }, []);

  return (
    <div className="app-container">
      {/* 既存の機能1: 背景に固定される3Dのカオスキャンバス */}
      <div className="canvas-wrapper">
        <ChaosCanvas scrollAmount={scrollAmount} />
      </div>

      {/* 狂気の新機能: グラスモーフィズムなHTML要素が雪崩れてくる物理演算空間 */}
      <EntropyPhysics />

      {/* 既存の機能2: 常にマウスに追従し、操作を妨害するグラスモーフィズムポップアップ */}
      <ObstructionPopup />
    </div>
  );
}

export default App;
