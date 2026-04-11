import React, { useEffect, useRef, useState } from 'react';
import Matter from 'matter-js';

const CARD_TEXTS = ["サービス内容", "実績", "料金", "FAQ", "お問い合わせ", "ERROR", "Warning", "会社概要"];

/**
 * 追加機能：グラスモーフィズム・エントロピー
 * HTML DOM要素と2D物理演算エンジン(Matter.js)を完全に同期させ、
 * 無数のガラスのカードが降り注ぎ、無限増殖する仕様。
 */
export default function EntropyPhysics() {
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const [cards, setCards] = useState([]);
  const bodiesMap = useRef({});
  const domRefs = useRef({});

  useEffect(() => {
    // 1. エンジン・ワールドの初期化
    const engine = Matter.Engine.create();
    engineRef.current = engine;
    const world = engine.world;

    const cw = window.innerWidth;
    const ch = window.innerHeight;

    // 2. 見えない床と壁を設置
    const floor = Matter.Bodies.rectangle(cw / 2, ch + 50, cw + 200, 100, { isStatic: true });
    // カードが画面左右から逃げないように壁を配置
    const leftWall = Matter.Bodies.rectangle(-50, ch / 2, 100, ch * 3, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(cw + 50, ch / 2, 100, ch * 3, { isStatic: true });
    Matter.Composite.add(world, [floor, leftWall, rightWall]);

    // 3. マウスコントロール (カードをドラッグ可能にする)
    const mouse = Matter.Mouse.create(containerRef.current);
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: mouse,
      constraint: {
        stiffness: 0.2, // ドラッグの硬さ
        render: { visible: false }
      }
    });

    // スクロール時にマウス位置がずれないようにEventを解除（スクロールはカメラ回転に使うため）
    mouseConstraint.mouse.element.removeEventListener("mousewheel", mouseConstraint.mouse.mousewheel);
    mouseConstraint.mouse.element.removeEventListener("DOMMouseScroll", mouseConstraint.mouse.mousewheel);

    Matter.Composite.add(world, mouseConstraint);

    // 4. 【狂気の無限増殖スパム機能】
    // ユーザーがドラッグして手放した（または投げきった）瞬間に発動
    Matter.Events.on(mouseConstraint, 'enddrag', () => {
      // アイテムをどかそうとすると、さらに10枚が上空から降ってくる（ブラウザクラッシュを誘発）
      spawnCards(10);
    });

    // エンジン稼働
    Matter.Runner.run(Matter.Runner.create(), engine);

    // 5. DOM要素への同期ループ（HTML要素を物理演算の座標で動かす）
    let animationFrame;
    const updateDOM = () => {
      // 登録されたすべての物理ボディの（x, y, 角度）をDOMのstyle.transformに適用
      Object.keys(bodiesMap.current).forEach(id => {
        const body = bodiesMap.current[id];
        const el = domRefs.current[id];
        if (body && el) {
          // Matter.jsの座標系は「ボディの中央」基準のため、幅・高さの半分を引いて左上基準に戻す
          const x = body.position.x - body.clientW / 2;
          const y = body.position.y - body.clientH / 2;
          const angle = body.angle;
          // GPUアクセラレーションを効かせて描画
          el.style.transform = `translate(${x}px, ${y}px) rotate(${angle}rad)`;
        }
      });
      animationFrame = requestAnimationFrame(updateDOM);
    };
    updateDOM();

    // 6. 初期状態: まず20枚ほど上空からランダムに降らせる
    spawnCards(20);

    // クリーンアップ
    return () => {
      cancelAnimationFrame(animationFrame);
      Matter.Engine.clear(engine);
    };
  }, []);

  // 新しいカードを生成して「物理世界」と「DOM世界」の両方に追加する関数
  const spawnCards = (count) => {
    const cw = window.innerWidth;
    const newCards = [];
    const newBodies = [];

    for (let i = 0; i < count; i++) {
      const w = 150 + Math.random() * 100;
      const h = 80 + Math.random() * 40;
      // 画面上部のランダムな位置
      const x = cw / 2 + (Math.random() - 0.5) * cw * 0.8;
      const y = -100 - (Math.random() * 500);

      const text = CARD_TEXTS[Math.floor(Math.random() * CARD_TEXTS.length)];
      // React用のユニークなID生成
      const id = 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

      // Matter.jsの物理ボディ生成
      const body = Matter.Bodies.rectangle(x, y, w, h, {
        restitution: 0.6, // 少し弾む
        friction: 0.5,
        density: 0.05
      });
      // DOM同期用に幅と高さを記録しておく
      body.clientW = w;
      body.clientH = h;

      newCards.push({ id, w, h, text });
      newBodies.push(body);
      bodiesMap.current[id] = body; // 同期用マップに登録
    }

    // 物理エンジンに追加
    Matter.Composite.add(engineRef.current.world, newBodies);
    // Reactの再レンダリングをトリガーしてDOM側にもDIVを生成
    setCards(prev => [...prev, ...newCards]);
  };

  return (
    <div ref={containerRef} className="entropy-container">
      {cards.map(c => (
        <div
          key={c.id}
          id={c.id}
          ref={el => domRefs.current[c.id] = el}
          className="entropy-card"
          style={{ width: `${c.w}px`, height: `${c.h}px` }}
        >
          {c.text}
        </div>
      ))}
    </div>
  );
}
