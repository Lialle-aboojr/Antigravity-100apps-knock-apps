import { useEffect, useRef } from 'react';

/**
 * 日本語・英語併記の「読み込み中...」グラスモーフィズムポップアップ
 * 
 * 修正: マウス座標に即座に追従させるのではなく、慣性（イージング）を持たせて
 * ゆっくりと追従させることで、一瞬だけ操作できる「隙」を生み出します。
 */
export default function ObstructionPopup() {
  const popupRef = useRef(null);
  
  // マウスの目標座標（現在どこにマウスがあるか）
  const targetPos = useRef({ 
    x: window.innerWidth / 2, 
    y: window.innerHeight / 2 
  });
  
  // ポップアップ自体の現在座標
  const currentPos = useRef({ 
    x: window.innerWidth / 2, 
    y: window.innerHeight / 2 
  });

  useEffect(() => {
    // マウスが動いた時は「目標座標」だけを更新する
    const handleMouseMove = (e) => {
      targetPos.current.x = e.clientX;
      targetPos.current.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrame;
    
    // 現在値から目標値へ滑らかに近づける線形補間（Lerp）関数
    const lerp = (start, end, factor) => {
      return start + (end - start) * factor;
    };

    const updatePosition = () => {
      // 追従の減衰係数（0.01〜1.0）。
      // 0.05程度にすることで「のんびりとした慣性」を持たせ、
      // ユーザーが高速でマウスを振れば、一瞬だけクリック可能な「隙間」を作り出せる。
      const easingFactor = 0.05; 
      
      currentPos.current.x = lerp(currentPos.current.x, targetPos.current.x, easingFactor);
      currentPos.current.y = lerp(currentPos.current.y, targetPos.current.y, easingFactor);

      // Reactの再描画を用いず、直接DOMのstyleを更新して滑らかに動かす
      if (popupRef.current) {
         popupRef.current.style.left = `${currentPos.current.x}px`;
         popupRef.current.style.top = `${currentPos.current.y}px`;
      }

      // 次の描画フレームで再度実行
      animationFrame = requestAnimationFrame(updatePosition);
    };

    // ループ開始
    updatePosition();

    // クリーンアップ
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div
      ref={popupRef}
      className="obstruction-popup"
      style={{
        transform: 'translate(-50%, -50%)',
        // leftとtopは requestAnimationFrame で直接更新されます
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
