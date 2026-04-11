import { useEffect, useState } from 'react';

/**
 * 日本語・英語併記の「読み込み中...」グラスモーフィズムポップアップ
 * 
 * 常にマウスカーソルへ追従（ストーカー）し、背後のHTML要素へのクリックや
 * 正常な情報閲覧を徹底的に妨害します。
 */
export default function ObstructionPopup() {
  // ポップアップの現在位置(x, y)を状態として保持。初期値は画面中央。
  const [position, setPosition] = useState({ 
    x: window.innerWidth / 2, 
    y: window.innerHeight / 2 
  });

  useEffect(() => {
    // マウスが動いた時に呼ばれる関数
    const handleMouseMove = (e) => {
      // カーソルの現在位置(clientX, clientY)を状態に保存
      setPosition({
        x: e.clientX,
        y: e.clientY
      });
    };

    // マウス移動イベントを監視開始
    window.addEventListener('mousemove', handleMouseMove);
    
    // クリーンアップ
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      className="obstruction-popup"
      style={{
        // カーソル座標を left / top に適用
        left: `${position.x}px`,
        top: `${position.y}px`,
        // -50% 移動させることで、要素の「中心」が必ずカーソルと重なるようにする
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="popup-content">
        <h2>読み込み中 99.9%...</h2>
        <p>Loading 99.9%...</p>
        <div className="spinner"></div>
      </div>
    </div>
  );
}
