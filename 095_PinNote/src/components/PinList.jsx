import React from 'react';
import { sanitizeText } from '../utils/sanitize';

const PinList = ({ pins, onPinClick }) => {
  if (pins.length === 0) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: '3rem', margin: '0 0 10px 0', opacity: 0.3 }}>📌</div>
        <p>最初のピンを追加しましょう。<br/>Add your first pin to get started.</p>
      </div>
    );
  }

  return (
    <div className="masonry-grid">
      {pins.map((pin) => (
        <div className="pin-item" key={pin.id} onClick={() => onPinClick(pin)}>
          <div className="pin-image-wrapper">
            <img 
              src={pin.imageUrl || 'https://via.placeholder.com/400x300?text=No+Image'} 
              alt={pin.title || 'Pin image'} 
              className="pin-image"
              loading="lazy"
              onError={(e) => {
                // 画像リンク切れなどのフォールバック
                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Found';
              }}
            />
          </div>
          <div className="pin-info">
            <h3 className="pin-title">{sanitizeText(pin.title) || '無題 (Untitled)'}</h3>
            {pin.note && (
              <p className="pin-note-preview">{sanitizeText(pin.note)}</p>
            )}
            {pin.tags && pin.tags.length > 0 && (
              <div className="pin-tags-preview">
                {pin.tags.map((tag, i) => (
                   <span key={i} className="tag-badge">{sanitizeText(tag)}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PinList;
