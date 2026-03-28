/**
 * 15 Puzzle (15パズル)
 * 初心者でも完全に動作し、バグの起きないよう設計されています。
 */

// --- 状態管理 (State Management) ---
const state = {
    board: [],         // 4x4の二次元配列でタイルの数値を管理 (1〜15, 0は空きマス)
    size: 4,           // グリッドサイズ(4x4)
    moves: 0,          // 手数
    timer: 0,          // 経過時間（秒）
    intervalId: null,  // タイマーのID
    autoSolveInterval: null, // お手本動作のインターバルID
    history: [],       // 移動履歴を保持する配列 (スタック構造)
    isPlaying: false,  // プレイ中かどうか（1手目を動かしたか）
    isCleared: false,  // クリア状態か
    isAutoSolving: false // お手本実行中かどうか
};

// --- DOM要素の取得 ---
const boardEl = document.getElementById('puzzle-board');
const movesDisplay = document.getElementById('moves-display');
const timeDisplay = document.getElementById('time-display');
const shuffleBtn = document.getElementById('shuffle-btn');
const autoSolveBtn = document.getElementById('auto-solve-btn'); // お手本ボタン
const clearOverlay = document.getElementById('clear-overlay');
const finalTimeDisplay = document.getElementById('final-time');
const finalMovesDisplay = document.getElementById('final-moves');
const playAgainBtn = document.getElementById('play-again-btn');

// --- セキュリティ: テキストのサニタイズ（XSS対策） ---
function sanitizeHTML(str) {
    const temp = document.createElement('div');
    temp.textContent = str;
    return temp.innerHTML;
}

// --- 初期化 (Initialization) ---
function init() {
    // 最初のシャッフル（引数trueで、DOM要素の初期生成をおこなう）
    shuffleBoardSimulated(true);

    // イベントリスナーの設定
    shuffleBtn.addEventListener('click', handleShuffleClick);
    autoSolveBtn.addEventListener('click', handleAutoSolveClick); // お手本ボタン
    playAgainBtn.addEventListener('click', handleShuffleClick);
}

// 完成状態(1〜15, 最後が0)の配列を生成
function createSolvedBoard() {
    state.board = [];
    let counter = 1;
    for (let r = 0; r < state.size; r++) {
        const row = [];
        for (let c = 0; c < state.size; c++) {
            if (r === state.size - 1 && c === state.size - 1) {
                row.push(0); // 最後は空きマス(0)
            } else {
                row.push(counter++);
            }
        }
        state.board.push(row);
    }
}

// --- 描画 (Rendering) ---
function renderBoard() {
    // 一度ボードを完全に空にする
    boardEl.innerHTML = '';
    
    for (let r = 0; r < state.size; r++) {
        for (let c = 0; c < state.size; c++) {
            const num = state.board[r][c];
            if (num === 0) continue; // 空きマスは要素自体を作らない

            // タイル要素を作成
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.dataset.num = num; // 対象となる数値をデータ属性で保持
            tile.innerHTML = sanitizeHTML(num.toString());
            
            // XとYの座標をCSSのカスタムプロパティ（--x, --y）として設定
            // CSS側で transform を使って適切な位置にアニメーション配置してくれます
            tile.style.setProperty('--x', c);
            tile.style.setProperty('--y', r);
            
            // クリックイベントリスナー
            tile.addEventListener('click', function() {
                // 自身の数値を引数に渡す
                handleTileClick(parseInt(this.dataset.num, 10));
            });
            
            boardEl.appendChild(tile);
        }
    }
}

// 位置だけを更新する関数（完全な再描画を避け、CSSアニメーションをスムーズに作動させるため）
function updateTilePositions() {
    const tiles = Array.from(boardEl.children);
    
    for (let r = 0; r < state.size; r++) {
        for (let c = 0; c < state.size; c++) {
            const num = state.board[r][c];
            if (num === 0) continue;
            
            // 対象となる数値を持ったタイルDOMを探す
            const tile = tiles.find(t => t.dataset.num === num.toString());
            if (tile) {
                // 変数を更新するとCSSによりTransformが実行される
                tile.style.setProperty('--x', c);
                tile.style.setProperty('--y', r);
            }
        }
    }
}

// --- 履歴の記録 ---
function recordMove(num) {
    // ユーザーからの要望により、ユーザーの回り道や無駄な往復移動に関しても
    // そのすべてをありのままに記憶し、純粋な完全逆再生の手本にするため全ての移動をPushします
    state.history.push(num);
}

// --- 操作 (Interaction) ---
function handleTileClick(num) {
    // クリア済み、もしくはお手本実行中の場合はユーザー操作をブロック
    if (state.isCleared || state.isAutoSolving) return;

    // クリックされたタイルと、空きマス(0)の「現在の配列上での座標」を探す
    const pos = findTilePosition(num);
    const emptyPos = findTilePosition(0);
    
    // クリックしたタイルが空きマスに隣接しているか判定
    if (isAdjacent(pos.r, pos.c, emptyPos.r, emptyPos.c)) {
        // タイマーが止まっていれば開始（初回のみ）
        if (!state.isPlaying) {
            startTimer();
            state.isPlaying = true;
        }

        // ユーザーの手動移動もすべて履歴にタイルの番号として記録
        recordMove(num);

        // 配列のデータを入れ替え
        swapTiles(pos.r, pos.c, emptyPos.r, emptyPos.c);
        
        // 手数を更新して表示
        state.moves++;
        movesDisplay.textContent = state.moves;

        // 画面のタイルをアニメーションとともに移動させる
        updateTilePositions();

        // クリア判定を行う
        if (checkWinCondition()) {
            handleWin();
        }
    }
}

// お手本（Auto-Solve）ボタンが押された時の処理
function handleAutoSolveClick() {
    // 既にクリア済み、すでにお手本動作中、または動かす履歴がない場合は何もしない
    if (state.isCleared || state.isAutoSolving || state.history.length === 0) return;
    
    state.isAutoSolving = true;
    stopTimer(); // お手本動作中はゲームのタイマーを停止
    
    // 一定間隔（120ms）で履歴をスタックの最後（最新の手）から取り出し逆再生する
    state.autoSolveInterval = setInterval(() => {
        // 歴史の最初（配列が空になれば）クリア状態に到達し完了
        if (state.history.length === 0) {
            clearInterval(state.autoSolveInterval);
            state.autoSolveInterval = null;
            state.isAutoSolving = false;
            
            if (checkWinCondition()) {
                handleWin();
            }
            return;
        }

        // 直前に動かされたタイルの番号を取り出す（これで後ろから順番に完全逆再生になる）
        const numToMove = state.history.pop();
        
        const pos = findTilePosition(numToMove);
        const emptyPos = findTilePosition(0);
        
        // タイルを移動させる
        swapTiles(pos.r, pos.c, emptyPos.r, emptyPos.c);
        updateTilePositions();
        
        // お手本による自動移動が1回行われるたびに、リアルタイムで手数をカウントアップ
        state.moves++;
        movesDisplay.textContent = state.moves;

    }, 120); // 120ms間隔で心地よく「シャッシャッ」と動かす
}

// --- ロジック (Logic) ---

// 特定の数値が入っているタイルの座標を探す
function findTilePosition(num) {
    for (let r = 0; r < state.size; r++) {
        for (let c = 0; c < state.size; c++) {
            if (state.board[r][c] === num) {
                return { r, c };
            }
        }
    }
    return null; // 通常は到達しません
}

// 2つのマスが隣接しているか（上・下・左・右のいずれかか）
function isAdjacent(r1, c1, r2, c2) {
    const rowDiff = Math.abs(r1 - r2);
    const colDiff = Math.abs(c1 - c2);
    // どちらか一方が1離れていて、もう一方が同じ行/列であれば隣接している
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
}

// 配列内の盤面データを入れ替える
function swapTiles(r1, c1, r2, c2) {
    const temp = state.board[r1][c1];
    state.board[r1][c1] = state.board[r2][c2];
    state.board[r2][c2] = temp;
}

// シャッフルボタンやもう一度ボタンが押された時の処理
function handleShuffleClick() {
    if (state.isAutoSolving) return; // お手本実行中はブロック
    resetGame();
    // ボタンクリック時はアニメーションを楽しめるように、false(再描画ではなく更新)を渡す
    shuffleBoardSimulated(false);
}

// ゲームのリセット（UIや状態を0に戻す）
function resetGame() {
    stopTimer();
    if (state.autoSolveInterval) {
        clearInterval(state.autoSolveInterval);
        state.autoSolveInterval = null;
    }
    
    state.moves = 0;
    state.timer = 0;
    state.isPlaying = false;
    state.isCleared = false;
    state.isAutoSolving = false;
    
    movesDisplay.textContent = '0';
    timeDisplay.textContent = '00:00';
    
    clearOverlay.classList.add('hidden');
}

// ランダムな有効手をシミュレートしてシャッフル（絶対に解ける配置にするためのアルゴリズム）
function shuffleBoardSimulated(isInitial = false) {
    // 一度内部的に完成状態にする
    createSolvedBoard(); 
    state.history = []; // 履歴（スタック）を初期化
    let emptyPos = { r: state.size - 1, c: state.size - 1 }; // (3,3) が最初は空きマス
    
    let previousPos = null;
    
    // シャッフル手数を120〜180回の間でランダムに決定する（毎回手数が変動する）
    const shuffleCount = Math.floor(Math.random() * (180 - 120 + 1)) + 120;

    for (let i = 0; i < shuffleCount; i++) {
        const candidates = [];
        const directions = [
            { r: -1, c: 0 }, // 上
            { r: 1, c: 0 },  // 下
            { r: 0, c: -1 }, // 左
            { r: 0, c: 1 }   // 右
        ];

        // 4方向の中で動かせるタイルを探す
        for (const dir of directions) {
            const newR = emptyPos.r + dir.r;
            const newC = emptyPos.c + dir.c;
            
            // はみ出していないかチェックし、はみ出していなければ候補に追加
            if (newR >= 0 && newR < state.size && newC >= 0 && newC < state.size) {
                // 行ったり来たりをなるべく防ぐ（少しでもバラけさせるため）
                if (previousPos && previousPos.r === newR && previousPos.c === newC) {
                    continue; // 前回戻ってきた場所なら今回はスキップ
                }
                candidates.push({ r: newR, c: newC });
            }
        }

        // もし候補がない場合（通常はあり得ないが安全策）は全方向から選び直す
        if (candidates.length === 0) {
            for (const dir of directions) {
                const newR = emptyPos.r + dir.r;
                const newC = emptyPos.c + dir.c;
                if (newR >= 0 && newR < state.size && newC >= 0 && newC < state.size) {
                    candidates.push({ r: newR, c: newC });
                }
            }
        }

        // 候補からランダムに1つ選んで入れ替え
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const selected = candidates[randomIndex];
        
        // 選ばれたタイルの番号を取得
        const numToMove = state.board[selected.r][selected.c];

        swapTiles(selected.r, selected.c, emptyPos.r, emptyPos.c);
        
        // シャッフルで行った移動を行動履歴に記録（ここから逆算してお手本になる）
        recordMove(numToMove);
        
        // PreviousPosを更新
        previousPos = { r: emptyPos.r, c: emptyPos.c };
        // 空きマス位置を変数に保持
        emptyPos = selected;
    }
    
    if (isInitial) {
        // 初回ロード時は、アニメーションせず最初からバラバラの状態にするため全再描画する
        renderBoard();
    } else {
        // シャッフルボタン起動時は、CSSに従ってパネルがザーッと動くアニメーション適用
        updateTilePositions();
    }
}

// 全ての並び順が一致している（クリア）か判定する
function checkWinCondition() {
    let counter = 1;
    for (let r = 0; r < state.size; r++) {
        for (let c = 0; c < state.size; c++) {
            // 右下は空き(0)であること
            if (r === state.size - 1 && c === state.size - 1) {
                return state.board[r][c] === 0;
            }
            if (state.board[r][c] !== counter) {
                return false;
            }
            counter++;
        }
    }
    return true;
}

// クリアしたときのイベント
function handleWin() {
    state.isCleared = true;
    stopTimer();
    if (state.autoSolveInterval) {
        clearInterval(state.autoSolveInterval);
        state.autoSolveInterval = null;
    }
    
    // 少し遅らせてからオーバーレイを表示（最後のアニメーションが終わるのを待つため）
    setTimeout(() => {
        finalTimeDisplay.textContent = formatTime(state.timer);
        finalMovesDisplay.textContent = state.moves;
        clearOverlay.classList.remove('hidden');
    }, 400); // 余裕をもって400ms待つ
}

// --- タイマー (Timer) ---
function startTimer() {
    state.intervalId = setInterval(() => {
        state.timer++;
        timeDisplay.textContent = formatTime(state.timer);
    }, 1000);
}

function stopTimer() {
    if (state.intervalId) {
        clearInterval(state.intervalId);
        state.intervalId = null;
    }
}

// 秒数を mm:ss 形式の文字列にするフォーマット関数
function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

// DOMが読み込まれたら初期化を実行
document.addEventListener('DOMContentLoaded', init);
