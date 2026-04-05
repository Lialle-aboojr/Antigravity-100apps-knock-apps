import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import PinList from './components/PinList';
import PinModal from './components/PinModal';
import TagFilter from './components/TagFilter';
import { loadPins, savePins } from './utils/storage';

function App() {
  const [pins, setPins] = useState([]);
  const [filterTag, setFilterTag] = useState('All');
  const [editingPin, setEditingPin] = useState(null); // { isNew: true } または 既存の pin object

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

  // 表示するピンをフィルタリング
  const filteredPins = useMemo(() => {
    if (filterTag === 'All') return pins;
    return pins.filter(pin => pin.tags && pin.tags.includes(filterTag));
  }, [pins, filterTag]);

  // ピンの保存処理 (新規・更新)
  const handleSavePin = (savedPin) => {
    setPins(prev => {
      const exists = prev.find(p => p.id === savedPin.id);
      if (exists) {
        // 更新 (上に持ってくる場合は別ですが、今回は位置を維持)
        return prev.map(p => p.id === savedPin.id ? savedPin : p);
      } else {
        // 新規追加は先頭に
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
          <h1>📌 PinNote</h1>
          <button 
            className="btn-primary" 
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
