import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import PinList from './components/PinList';
import PinModal from './components/PinModal';
import TagFilter from './components/TagFilter';
import { loadPins, savePins } from './utils/storage';

function App() {
  // useEffectによる初回上書きを防止するため、useStateの初期値として直接ロードします
  const [pins, setPins] = useState(() => loadPins());
  
  const [filterTag, setFilterTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPin, setEditingPin] = useState(null);

  // Pins が更新されたら自動で LocalStorage に保存
  // (初期値が正しく読み込まれているため、空配列での上書きは発生しません)
  useEffect(() => {
    savePins(pins);
  }, [pins]);

  // 全てのピンから固有のタグを収集する
  const allTags = useMemo(() => {
    const tagSet = new Set();
    pins.forEach(pin => {
      if (pin.tags) {
        pin.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [pins]);

  // 表示するピンをフィルタリング（タグ＋キーワード検索）
  const filteredPins = useMemo(() => {
    let result = pins;

    // タグ絞り込み
    if (filterTag !== 'All') {
      result = result.filter(pin => pin.tags && pin.tags.includes(filterTag));
    }

    // 検索語で絞り込み（タイトル or ノート）
    if (searchQuery.trim().length > 0) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(pin => {
        const titleMatch = (pin.title || '').toLowerCase().includes(query);
        const noteMatch = (pin.note || '').toLowerCase().includes(query);
        return titleMatch || noteMatch;
      });
    }

    return result;
  }, [pins, filterTag, searchQuery]);

  // ピンの保存処理 (新規・更新)
  const handleSavePin = (savedPin) => {
    setPins(prev => {
      const exists = prev.find(p => p.id === savedPin.id);
      if (exists) {
        return prev.map(p => p.id === savedPin.id ? savedPin : p);
      } else {
        return [savedPin, ...prev];
      }
    });
    setEditingPin(null);
  };

  // ピンの削除処理
  const handleDeletePin = (id) => {
    if (window.confirm("このピンを削除してもよろしいですか？ (Are you sure you want to delete this pin?)")) {
      setPins(prev => prev.filter(p => p.id !== id));
      setEditingPin(null);
    }
  };

  return (
    <div>
      <header className="header">
        <div className="header-top">
          {/* ロゴ：クリックでリロードする機能を付与 */}
          <h1 
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
            onClick={() => window.location.href = '/'}
            title="ホームに戻る"
          >
            <img 
              src="/favicon.png" 
              alt="PinNote Icon" 
              style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} 
            />
            PinNote
          </h1>

          {/* 検索窓：ロゴとボタンの間に配置（Flexboxのflex: 1で広がるよう調整） */}
          <div className="search-container" style={{ flex: 1, maxWidth: '600px', margin: '0 20px' }}>
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="タイトルやノートを検索 (Search pins...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <button 
            className="btn-primary" 
            style={{ flexShrink: 0 }}
            onClick={() => setEditingPin({})} // 空オブジェクトで新規作成
          >
            <Plus size={18} />
            新しいピンを追加 (New Pin)
          </button>
        </div>
        
        {/* タグフィルターエリア */}
        {allTags.length > 0 && (
          <TagFilter 
            tags={allTags} 
            currentTag={filterTag} 
            setFilterTag={setFilterTag} 
          />
        )}
      </header>

      <main>
        <PinList 
          pins={filteredPins} 
          onPinClick={(pin) => setEditingPin(pin)} 
        />
      </main>

      {/* Editor Modal */}
      {editingPin && (
        <PinModal 
          pin={editingPin}
          onClose={() => setEditingPin(null)}
          onSave={handleSavePin}
          onDelete={handleDeletePin}
        />
      )}
    </div>
  );
}

export default App;
