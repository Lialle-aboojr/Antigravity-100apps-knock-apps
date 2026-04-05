import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { sanitizeText } from '../utils/sanitize';

const PinModal = ({ pin, onClose, onSave, onDelete }) => {
  const isNew = !pin.id;
  
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // 編集モードなら初期値をセット
  useEffect(() => {
    if (pin && !isNew) {
      setImageUrl(pin.imageUrl || '');
      setTitle(pin.title || '');
      setNote(pin.note || '');
      setTagsInput(pin.tags ? pin.tags.join(', ') : '');
    }
  }, [pin, isNew]);

  const handleSave = () => {
    // タグをカンマ区切りで配列にしてサニタイズ・トリム
    const tagsArray = tagsInput
      .split(',')
      .map(t => sanitizeText(t.trim()))
      .filter(t => t);

    const savedPin = {
      id: isNew ? Date.now().toString() : pin.id,
      imageUrl: sanitizeText(imageUrl.trim()),
      title: sanitizeText(title.trim()),
      note: sanitizeText(note.trim()),
      tags: tagsArray,
      createdAt: isNew ? new Date().toISOString() : pin.createdAt,
      updatedAt: new Date().toISOString()
    };

    onSave(savedPin);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      {/* モーダル内部のクリックで閉じないように伝播をストップ */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? '新しいピン (New Pin)' : 'ピンの編集 (Edit Pin)'}</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="input-group">
            <label htmlFor="imageUrl">画像のURL (Image URL)</label>
            <input 
              type="text" 
              id="imageUrl"
              className="input-field" 
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            {imageUrl && (
              <div className="image-preview-area">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/400x300?text=Preview+Error';
                  }}
                />
              </div>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="title">タイトル (Title)</label>
            <input 
              type="text" 
              id="title"
              className="input-field" 
              placeholder="画像についての一言 (Title for this image)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="note">ノート (Note)</label>
            <textarea 
              id="note"
              className="input-field" 
              placeholder="詳しいメモや理由などを書き込みます (Write your detailed notes here)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
          </div>

          <div className="input-group">
            <label htmlFor="tags">タグ (Tags)</label>
            <input 
              type="text" 
              id="tags"
              className="input-field" 
              placeholder="カンマ区切りで入力 (e.g. Design, Inspiration, Web)"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
            />
          </div>
        </div>

        <div className="modal-footer">
          {!isNew && (
            <button className="btn-danger" onClick={() => onDelete(pin.id)}>
              削除 (Delete)
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>
            キャンセル (Cancel)
          </button>
          <button className="save-btn" onClick={handleSave}>
            保存する (Save)
          </button>
        </div>
      </div>
    </div>
  );
};

export default PinModal;
