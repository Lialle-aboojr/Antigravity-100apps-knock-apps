import React, { useEffect, useRef, useState } from 'react';
import './App.css';

// --- Intersection Observer Hook (スクロール連動フェードアップ用) ---
// 画面に要素が入ったかどうかを検知するカスタムフック
const useIntersectionObserver = (options) => {
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      // 要素が画面に入ったら 'is-visible' クラスを付与する
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        // 一度表示されたら監視を解除（毎回アニメーションさせたい場合は外す）
        observer.unobserve(entry.target);
      }
    }, options);

    const currentElement = elementRef.current;
    if (currentElement) {
      observer.observe(currentElement);
    }

    return () => {
      if (currentElement) {
        observer.unobserve(currentElement);
      }
    };
  }, [options]);

  return elementRef;
};


// --- Components ---

// 1. スクロール連動でフェードアップするラッパーコンポーネント
const FadeUp = ({ children }) => {
  const ref = useIntersectionObserver({
    root: null,
    rootMargin: '0px',
    threshold: 0.1, // 10%見えたら発火
  });

  return (
    <div ref={ref} className="fade-up-element">
      {children}
    </div>
  );
};


// 2. メインのAppコンポーネント
function App() {
  const [lang, setLang] = useState('ja'); // 'ja' または 'en' で管理

  // ロゴクリック時にページ上部にスムーススクロールで戻る処理
  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 言語翻訳テキストの定義
  const text = {
    ja: {
      heroSubtitle: "言葉は形を持ち、デザインは声を持つ。静けさの中に浮かび上がる、洗練されたタイポグラフィの世界へ。",
      sec1Desc: "整然としたデジタルの世界に、意図的なバグを忍ばせる。右のテキストにマウスを乗せると、赤とシアンのノイズが走る「グリッチエフェクト」が発動します。",
      sec2Desc: "平面のテキストに立体感を与えるCSSアニメーション。左のボックスにマウスを乗せると、CSSの transform: rotateX による3Dフリップが体験できます。余白と驚きが同居します。",
      card1Back: "タイポグラフィ",
      card2Back: "ショーケース"
    },
    en: {
      heroSubtitle: "Words have form, and design has a voice. Step into the world of refined typography emerging from silence.",
      sec1Desc: "Concealing intentional bugs within an orderly digital world. Hover over the text on the right to trigger the 'glitch effect', where red and cyan noise streaks across the screen.",
      sec2Desc: "A CSS animation that adds three-dimensionality to flat typography. Hover over the boxes on the left to experience a 3D flip using CSS transform: rotateX. Space and surprise coexist.",
      card1Back: "Typography",
      card2Back: "Showcase"
    }
  };

  const t = text[lang];

  return (
    <div className="app-container">
      
      {/* ナビゲーションバー（上部固定） */}
      <nav className="top-nav">
        {/* ロゴクリック可能化 */}
        <div className="logo font-sans" onClick={handleLogoClick} role="button" tabIndex={0}>
          Showcase<span style={{ color: 'var(--accent-color)' }}>.</span>
        </div>
        
        {/* 言語切り替えボタン */}
        <div className="lang-switch font-mono">
          <button 
            className={`lang-btn ${lang === 'ja' ? 'active' : ''}`}
            onClick={() => setLang('ja')}
          >
            JP
          </button>
          <span className="lang-separator">/</span>
          <button 
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => setLang('en')}
          >
            EN
          </button>
        </div>
      </nav>

      {/* 
        [アニメーション1: Mask Reveal]
        見えない壁からスッと文字が現れる演出。
        クラス delay-XXX で時間差をつけています。
      */}
      <header className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title font-serif">
            <span className="mask-reveal-wrapper">
              <span className="mask-reveal">The Art of</span>
            </span>
            <br />
            <span className="mask-reveal-wrapper">
              <span className="mask-reveal delay-200" style={{ color: 'var(--accent-color)'}}>Typography</span>
            </span>
          </h1>
          
          <div className="mask-reveal-wrapper" style={{ marginTop: '2rem' }}>
            <p className="hero-subtitle font-sans mask-reveal delay-400">
              {t.heroSubtitle}
            </p>
          </div>
        </div>
      </header>

      <main>
        
        {/* 
          [アニメーション3: Glitch]
          特定の単語にホバーするとサイバーなノイズが走る
        */}
        <section className="section">
          <div className="section-inner">
            <FadeUp>
              <div className="text-content">
                <span className="section-label font-mono">01 - Cybernetics</span>
                <h2 className="section-title font-serif">Digital Distortion</h2>
                <p className="section-description font-sans">
                  {t.sec1Desc}
                </p>
              </div>
            </FadeUp>
            
            <FadeUp>
              <div className="glitch-wrapper">
                {/* data-text属性に同じ文字を入れることで、CSSの疑似要素（::before, ::after）でノイズを作れます */}
                <span 
                  className="glitch-effect glitch-huge-text font-mono" 
                  data-text="GLITCH"
                >
                  GLITCH
                </span>
              </div>
            </FadeUp>
          </div>
        </section>

        {/* 
          [アニメーション4: 3D Flip]
          カード状の要素にホバーするとX軸（またはY軸）に回転する
        */}
        <section className="section section-reversed">
          <div className="section-inner">
            <FadeUp>
              <div className="text-content">
                <span className="section-label font-mono">02 - Dimensions</span>
                <h2 className="section-title font-serif">Space & Depth</h2>
                <p className="section-description font-sans">
                  {t.sec2Desc}
                </p>
              </div>
            </FadeUp>
            
            <FadeUp>
              <div className="flip-grid">
                
                {/* カード1 */}
                <div className="flip-container">
                  <div className="flip-inner">
                    <div className="flip-front">
                      <span className="font-serif card-number">T</span>
                    </div>
                    <div className="flip-back">
                      <span className="font-sans card-text text-black">
                        {t.card1Back}
                      </span>
                    </div>
                  </div>
                </div>

                {/* カード2 */}
                <div className="flip-container">
                  <div className="flip-inner">
                    <div className="flip-front">
                      <span className="font-serif card-number">S</span>
                    </div>
                    <div className="flip-back">
                      <span className="font-sans card-text">
                        {t.card2Back}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </FadeUp>
          </div>
        </section>

      </main>

      {/* フッター */}
      <footer className="footer">
        <p className="footer-text font-mono">
          © 2026 Typography Showcase. Created with React & Vanilla CSS.
        </p>
      </footer>

    </div>
  );
}

export default App;
