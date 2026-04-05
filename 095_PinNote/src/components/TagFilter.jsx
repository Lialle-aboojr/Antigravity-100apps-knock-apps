import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const TagFilter = ({ tags, currentTag, setFilterTag }) => {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  // スクロール位置をチェックし、矢印の表示/非表示を更新する
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeft(scrollLeft > 0);
      // 小数の端数やズレを考慮し、-1で判定
      setShowRight(scrollLeft + clientWidth < scrollWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [tags]); // タグの数が変わった場合にも再計算

  const scrollByAmount = (amount) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div className="tag-filter-container">
      {/* 左スクロールボタン */}
      {showLeft && (
        <button 
          className="scroll-btn left" 
          onClick={() => scrollByAmount(-200)}
          aria-label="左にスクロール"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      {/* タグ一覧 */}
      <div 
        className="filter-tags" 
        ref={scrollRef}
        onScroll={checkScroll}
      >
        <button 
          className={`filter-tag ${currentTag === 'All' ? 'active' : ''}`}
          onClick={() => setFilterTag('All')}
        >
          すべて (All)
        </button>
        {tags.map((tag, index) => (
          <button 
            key={index}
            className={`filter-tag ${currentTag === tag ? 'active' : ''}`}
            onClick={() => setFilterTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* 右スクロールボタン */}
      {showRight && (
        <button 
          className="scroll-btn right" 
          onClick={() => scrollByAmount(200)}
          aria-label="右にスクロール"
        >
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
};

export default TagFilter;
