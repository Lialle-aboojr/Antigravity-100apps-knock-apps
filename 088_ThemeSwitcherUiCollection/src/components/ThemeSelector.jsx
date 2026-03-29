import React from 'react';
import { useTheme } from '../context/ThemeContext';

const ThemeSelector = () => {
  const { theme, changeTheme, customColor, changeCustomColor } = useTheme();

  // テーマのリスト（英語・日本語併記用データ）
  const themes = [
    { id: 'light', en: 'Light', jp: 'ライト' },
    { id: 'dark', en: 'Dark', jp: 'ダーク' },
    { id: 'system', en: 'System', jp: 'システム' },
    { id: 'cyberpunk', en: 'Cyberpunk', jp: 'サイバー' },
    { id: 'retro', en: 'Retro', jp: 'レトロ' },
    { id: 'high-contrast', en: 'High Contrast', jp: 'ハイコントラスト' },
    { id: 'custom', en: 'Custom', jp: 'カスタム' },
  ];

  return (
    <div className="card">
      <h2 className="card-title">Theme Switcher <br/><small className="sub-title">テーマ切り替え</small></h2>
      
      <div className="theme-grid">
        {themes.map((t) => (
          <button
            key={t.id}
            className={`theme-btn ${theme === t.id ? 'active' : ''}`}
            onClick={() => changeTheme(t.id)}
            aria-label={`${t.en} Theme`}
          >
            <span>{t.en}</span>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>{t.jp}</span>
          </button>
        ))}
      </div>

      {/* カスタムテーマが選択されている場合のみカラーピッカーを表示 */}
      {theme === 'custom' && (
        <div className="color-picker-container">
          <label htmlFor="custom-color-picker" style={{ fontWeight: '500' }}>
            Choose Primary Color (カラー選択):
          </label>
          <input
            id="custom-color-picker"
            type="color"
            value={customColor}
            onChange={(e) => changeCustomColor(e.target.value)}
            title="Choose your custom color"
          />
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
