import React, { useState, useEffect, useRef } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { sanitizeText } from '../utils/sanitize';

const PinModal = ({ pin, onClose, onSave, onDelete }) => {
  const isNew = !pin.id;
  
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);

  // 編集モードなら初期値をセット
  useEffect(() => {
    if (pin && !isNew) {
      setImageUrl(pin.imageUrl || '');
      setTitle(pin.title || '');
      setNote(pin.note || '');
      setTagsInput(pin.tags ? pin.tags.join(', ') : '');
    }
  }, [pin, isNew]);

  // ファイルアップロードの処理（FileReaderでBase64変換）
  const handleFileUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert("画像ファイルを選択してください (Please upload an image file).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target.result); // Base64データ URL
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleSave = () => {
    // タグをカンマ区切りで配列にしてサニタイズ・トリム
    const tagsArray = tagsInput
      .split(',')
      .map(t => sanitizeText(t.trim()))
      .filter(t => t);

    const savedPin = {
      id: isNew ? Date.now().toString() : pin.id,
      imageUrl: sanitizeText(imageUrl.trim()), // Base64 or URL
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
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isNew ? '新しいピン (New Pin)' : 'ピンの編集 (Edit Pin)'}</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        
        <div className="modal-body">
          <div className="input-group">
            <label>画像 (Image URL or Upload)</label>
            
            {/* D&D Upload Area */}
            <div 
              className={`drag-drop-area ${isDragging ? 'dragging' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current.click()}
            >
              <UploadCloud size={28} className="upload-icon" />
              <p>ローカル画像をドラッグ＆ドロップ、またはクリックして選択</p>
              <small>(Drag & Drop or Click to Upload)</small>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*" 
                onChange={handleFileInputChange} 
              />
            </div>

            {/* URL Input */}
            <div style={{ textAlign: 'center', margin: '4px 0', fontSize: '0.8rem', color: '#999' }}>またはURLで指定 (or enter image URL)</div>
            
            <input 
              type="text" 
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
