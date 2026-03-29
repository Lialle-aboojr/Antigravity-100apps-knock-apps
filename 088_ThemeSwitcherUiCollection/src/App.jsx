import React from 'react';
import Navbar from './components/Navbar';
import ThemeSelector from './components/ThemeSelector';
import { Buttons, Forms, Alerts } from './components/UIComponents';

function App() {
  return (
    <>
      <Navbar />
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 className="title">UI Framework Sandbox</h1>
          <p>
            Experience dynamic global theme management using React Context. 
            <br />
            (React Contextを使ったグローバルなテーマ切り替えの体験)
          </p>
        </div>
        
        {/* テーマセレクター用のカード */}
        <div style={{ marginBottom: '2rem' }}>
          <ThemeSelector />
        </div>

        {/* 各種UIコンポーネントをグリッドで配置 */}
        <div className="grid">
          <Buttons />
          <Forms />
          <Alerts />
        </div>
      </div>
    </>
  );
}

export default App;
