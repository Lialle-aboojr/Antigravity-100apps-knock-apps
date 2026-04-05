import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import PinList from './components/PinList';
import PinModal from './components/PinModal';
import TagFilter from './components/TagFilter';
import { loadPins, savePins } from './utils/storage';

function App() {
  const [pins, setPins] = useState([]);
  const [filterTag, setFilterTag] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPin, setEditingPin] = useState(null);

  // 初回ロード
  useEffect(() => {
    const loaded = loadPins();
    setPins(loaded);
  }, []);

  // Pins が更新されたら自動で LocalStorage に保存
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
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/favicon.png" 
              alt="PinNote Icon" 
              style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} 
            />
            PinNote
          </h1>
          <button 
            className="btn-primary" 
            onClick={() => setEditingPin({})} // 空オブジェクトで新規作成
          >
            <Plus size={18} />
            新しいピンを追加 (New Pin)
          </button>
        </div>
        
        {/* 検索窓とタグフィルターエリア */}
        <div className="search-container">
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
