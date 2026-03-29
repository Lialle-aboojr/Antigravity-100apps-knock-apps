import React, { createContext, useContext, useState, useEffect } from 'react';

// テーマを管理するContextを作成します
const ThemeContext = createContext();

// オーディオを再生するユーティリティ関数（Web Audio APIを使用）
const playThemeChangeSound = () => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // 波形を矩形波（square）にしてエッジを効かせる
    oscillator.type = 'square';
    
    // 周波数を高め（1000Hz）から一瞬で落とすことで、アタック感のあるクリック音を作成
    oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
    
    // 短くてソリッドな「カチッ」という音量エンベロープ
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.005); // 一瞬で立ち上げる
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05); // 直後に急減衰
    
    // 接続プロセス
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // 再生してすぐ（0.06秒で）完全に停止
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.06);
  } catch (e) {
    console.error("Audio API isn't supported or failed", e);
  }
};

export const ThemeProvider = ({ children }) => {
  // Local Storageから初期テーマを取得（未設定時は 'system' をデフォルトにする）
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'system';
  });

  // Custom環境でのカラーの初期値を取得
  const [customColor, setCustomColor] = useState(() => {
    return localStorage.getItem('app-custom-color') || '#ff9900';
  });

  // テーマが変更されたときの処理（副作用）
  useEffect(() => {
    // 選択された変更状態をLocal Storageに永続保存
    localStorage.setItem('app-theme', theme);
    localStorage.setItem('app-custom-color', customColor);

    // documentのルートタグ(html)をターゲットにする
    const root = document.documentElement;
    
    // [System（OS設定追従）の動作定義]
    if (theme === 'system') {
      const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
      root.setAttribute('data-theme', matchMedia.matches ? 'dark' : 'light');

      // OSの設定変更を常に監視して自動で表示を切り替えるようリスナーを用意
      const listener = (e) => {
        if (theme === 'system') {
          root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
      };
      
      // 旧式ブラウザでも動くようイベントリスナーを登録
      if (matchMedia.addEventListener) {
        matchMedia.addEventListener('change', listener);
        return () => matchMedia.removeEventListener('change', listener);
      }
    } else {
      // System以外のテーマを選択している場合はHTML属性として data-theme を直接設定する
      root.setAttribute('data-theme', theme);
    }

    // Custom(色を直接選ぶ)テーマが選択された場合のみ、CSS変数をJSから動的に上書き
    if (theme === 'custom') {
      root.style.setProperty('--primary-color', customColor);
      root.style.setProperty('--primary-hover', customColor);
      root.style.setProperty('--bg-color', '#f4f4f5'); // カスタムテーマ用基本背景
      root.style.setProperty('--text-color', '#18181b'); // 同文字色
      root.style.setProperty('--card-bg', '#ffffff');
      root.style.setProperty('--btn-text-color', '#ffffff');
    } else {
      // 別のテーマに切り替わったら動的操作したスタイルは全てクリーンアップする
      root.style.removeProperty('--primary-color');
      root.style.removeProperty('--primary-hover');
      root.style.removeProperty('--bg-color');
      root.style.removeProperty('--text-color');
      root.style.removeProperty('--card-bg');
      root.style.removeProperty('--btn-text-color');
    }
  }, [theme, customColor]);

  // テーマ変更用関数
  const changeTheme = (newTheme) => {
    if (newTheme !== theme) {
      setTheme(newTheme);
      playThemeChangeSound();
    }
  };

  // カスタムカラー変更関数
  const changeCustomColor = (color) => {
    setCustomColor(color);
    if (theme === 'custom') {
      playThemeChangeSound();
    }
  };

  // 連携用データ
  return (
    <ThemeContext.Provider value={{ theme, changeTheme, customColor, changeCustomColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

// カスタムフックとして呼び出しやすくする機能
export const useTheme = () => useContext(ThemeContext);
