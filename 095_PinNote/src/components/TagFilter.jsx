import React from 'react';

const TagFilter = ({ tags, currentTag, setFilterTag }) => {
  return (
    <div className="filter-tags">
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
  );
};

export default TagFilter;
