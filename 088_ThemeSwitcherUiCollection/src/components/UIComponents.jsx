import React, { useState } from 'react';

// === Buttons Component ===
export const Buttons = () => {
  return (
    <div className="card">
      <h2 className="card-title">Buttons <br/><small className="sub-title">ボタン各種</small></h2>
      <div className="btn-group">
        <button className="btn btn-primary">Primary (メイン)</button>
        <button className="btn btn-secondary">Secondary (サブ)</button>
        <button className="btn btn-outline">Outline (アウトライン)</button>
        <button className="btn btn-disabled" disabled>Disabled (無効化)</button>
      </div>
    </div>
  );
};

// === Forms Component ===
export const Forms = () => {
  const [inputText, setInputText] = useState('');
  const [toggle, setToggle] = useState(true);
  const [radio, setRadio] = useState('option1');

  // テキストの入力ハンドラー
  // Reactは自動的にレンダリング時にエスケープを行うため、XSSなどの脆弱性を防止します。
  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  return (
    <div className="card">
      <h2 className="card-title">Form Elements <br/><small className="sub-title">フォーム要素</small></h2>
      
      {/* 1. テキスト入力 */}
      <div className="form-group">
        <label className="form-label" htmlFor="sample-text">Text Input (テキスト入力):</label>
        <input 
          id="sample-text" 
          className="form-input" 
          type="text" 
          placeholder="Enter some text..." 
          value={inputText}
          onChange={handleInputChange} 
        />
        <p style={{fontSize: '0.85rem', color: 'var(--secondary-color)', margin: '0.2rem 0.5rem 0'}}>
          Live Output: {inputText}
        </p>
      </div>

      {/* 2. トグルスイッチ */}
      <div className="toggle-switch-group">
        <span className="form-label">Toggle Switch (トグル):</span>
        <label className="toggle-switch" htmlFor="sample-toggle">
          <input 
            id="sample-toggle" 
            type="checkbox" 
            checked={toggle} 
            onChange={() => setToggle(!toggle)} 
          />
          <span className="slider"></span>
        </label>
        <span style={{ fontWeight: '500' }}>{toggle ? 'ON' : 'OFF'}</span>
      </div>

      {/* 3. ラジオボタン */}
      <div className="form-group">
        <span className="form-label">Radio Buttons (ラジオボタン):</span>
        <div className="radio-group">
          <label className="radio-label">
            <input 
              type="radio" 
              name="sample-radio" 
              value="option1"
              className="radio-input"
              checked={radio === 'option1'}
              onChange={(e) => setRadio(e.target.value)}
            /> Option 1 (選択1)
          </label>
          <label className="radio-label">
            <input 
              type="radio" 
              name="sample-radio" 
              value="option2"
              className="radio-input"
              checked={radio === 'option2'}
              onChange={(e) => setRadio(e.target.value)}
            /> Option 2 (選択2)
          </label>
        </div>
      </div>
    </div>
  );
};

// === Alerts Component ===
export const Alerts = () => {
  return (
    <div className="card">
      <h2 className="card-title">Alerts <br/><small className="sub-title">メッセージ表示</small></h2>
      
      {/* 成功（Success） */}
      <div className="alert alert-success">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        <div><strong>Success:</strong> Your changes have been saved. (保存されました)</div>
      </div>
      
      {/* 警告（Warning） */}
      <div className="alert alert-warning">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
        <div><strong>Warning:</strong> Your session will expire soon. (セッションが切れそうです)</div>
      </div>
      
      {/* エラー（Error） */}
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        <div><strong>Error:</strong> Failed to update the database. (更新に失敗しました)</div>
      </div>
    </div>
  );
};
