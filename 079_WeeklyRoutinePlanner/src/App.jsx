import React, { useReducer, useEffect, useState } from 'react';

// 初期状態・定数用のキーとカラム設定
const STORAGE_KEY = 'weekly_routine_planner_data';

const COLUMNS = [
  { id: 'pool', jp: '未割り当て', en: 'Unassigned' },
  { id: 'mon', jp: '月曜日', en: 'Monday' },
  { id: 'tue', jp: '火曜日', en: 'Tuesday' },
  { id: 'wed', jp: '水曜日', en: 'Wednesday' },
  { id: 'thu', jp: '木曜日', en: 'Thursday' },
  { id: 'fri', jp: '金曜日', en: 'Friday' },
  { id: 'sat', jp: '土曜日', en: 'Saturday' },
  { id: 'sun', jp: '日曜日', en: 'Sunday' }
];

const COLORS = [
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#ec4899', // Pink
];

// LocalStorageからデータを同期的に初期化する関数（リロード時のバグ対策）
const initTasks = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { tasks: JSON.parse(saved) };
      } catch (e) {
        console.error('Failed to parse saved tasks', e);
      }
    }
  }
  return { tasks: [] };
};

// Reducer関数の定義
// 状態管理を一元化し、アクションに応じて状態を更新します。
function taskReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK':
      return { 
        ...state, 
        tasks: [
          ...state.tasks, 
          { 
            id: Date.now().toString(), 
            title: action.payload.title, 
            color: action.payload.color, 
            column: 'pool' 
          }
        ] 
      };
    case 'MOVE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task => 
          task.id === action.payload.taskId 
            ? { ...task, column: action.payload.targetColumn } 
            : task
        )
      };
    case 'DUPLICATE_TASK': {
      const taskToDuplicate = state.tasks.find(t => t.id === action.payload.taskId);
      if (!taskToDuplicate) return state;
      const duplicatedTask = {
        ...taskToDuplicate,
        id: Date.now().toString() // 新しい一意のIDを付与
      };
      return {
        ...state,
        tasks: [...state.tasks, duplicatedTask]
      };
    }
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload.taskId)
      };
    default:
      return state;
  }
}

function App() {
  // useReducerの第3引数で初回マウント時に確実に復元する
  const [state, dispatch] = useReducer(taskReducer, undefined, initTasks);
  const [inputValue, setInputValue] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[4]); // Default: Violet
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverColumn, setDragOverColumn] = useState(null);

  // state.tasks が更新されるたびにローカルストレージへ保存する
  // （マウント時の初期化は済んでいるため上書きバグが発生しない）
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
  }, [state.tasks]);

  // 新規タスク追加処理
  const handleAddTask = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    
    // Reactのデフォルト機能によりJSX内のテキストエスケープ（XSS対策）は行われます。
    // maxLengthやtrim等でサニタイズを強化しています。
    dispatch({ 
      type: 'ADD_TASK', 
      payload: { title: trimmed, color: selectedColor } 
    });
    setInputValue('');
  };

  // HTML5 Drag & Drop API: ドラッグ開始
  const handleDragStart = (e, taskId) => {
    setDraggedTaskId(taskId);
    // ドラッグ中のデータ転送設定。これをしないとFirefox等で動かない場合があります。
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  // ドラッグ領域を離れる時やドロップ終了時
  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  // ドラッグ要素が乗ったときの処理（必須: デフォルトの挙動をキャンセルしてDropを許可する）
  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  }

  // ドロップ時の処理
  const handleDrop = (e, targetColumn) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId && targetColumn) {
      dispatch({ 
        type: 'MOVE_TASK', 
        payload: { taskId, targetColumn } 
      });
    }
    setDraggedTaskId(null); // ドラッグ状態のリセット
    setDragOverColumn(null);
  };

  // カラムごとにタスクをフィルタリングして表示内容を生成
  const getTasksByColumn = (columnId) => {
    return state.tasks.filter(t => t.column === columnId);
  };

  return (
    <div className="app-container">
      {/* ヘッダー部分 */}
      <header className="app-header">
        <div className="title-section">
          <h1>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="#8b5cf6" strokeWidth="2"/>
              <path d="M8 9L12 13L16 9" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="8" y1="15" x2="16" y2="15" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Weekly Routine Planner
          </h1>
          <span className="subtitle">週間ルーティンプランナー</span>
        </div>
      </header>

      {/* タスク作成フォーム */}
      <form className="task-form neumo-panel" onSubmit={handleAddTask}>
        <input 
          type="text" 
          className="task-input"
          placeholder="新しいタスクを入力... / Enter a new task..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={50} // 簡易的な入力文字数制限（XSS軽減）
        />
        <div className="label-picker">
          {COLORS.map(color => (
            <button
              key={color}
              type="button"
              className={`color-btn ${selectedColor === color ? 'active' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setSelectedColor(color)}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
        <button type="submit" className="add-btn">
          <span>+</span>
          追加 / Add
        </button>
      </form>

      {/* カンバンボード部分 */}
      <div className="board-container">
        {COLUMNS.map(column => {
          const columnTasks = getTasksByColumn(column.id);
          const isDragOver = dragOverColumn === column.id;
          
          return (
            <div className="column neumo-panel" key={column.id}>
              <div className="column-header">
                <div className="column-title">
                  {column.en}
                  <span>{column.jp}</span>
                </div>
                <div className="column-count">{columnTasks.length}</div>
              </div>
              
              <div 
                className={`task-list ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {columnTasks.length === 0 && (
                  <div className="empty-placeholder">
                    ドロップして追加<br />Drop here
                  </div>
                )}
                {columnTasks.map(task => (
                  <div 
                    key={task.id}
                    className={`task-card neumo-card ${draggedTaskId === task.id ? 'dragging' : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                  >
                    <div 
                      className="task-label-indicator" 
                      style={{ backgroundColor: task.color }} 
                    />
                    <div className="task-header">
                      <span className="task-title">{task.title}</span>
                      <div className="task-actions">
                        {/* 複製機能ボタン */}
                        <button 
                          className="task-action-btn"
                          onClick={() => dispatch({ type: 'DUPLICATE_TASK', payload: { taskId: task.id } })}
                          title="複製 / Duplicate"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                        </button>
                        {/* 削除ボタン */}
                        <button 
                          className="task-action-btn task-delete"
                          onClick={() => dispatch({ type: 'DELETE_TASK', payload: { taskId: task.id } })}
                          title="削除 / Delete"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
