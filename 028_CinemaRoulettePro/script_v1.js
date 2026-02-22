// ==========================================
// Cinema Roulette Pro - Main Script
// 初心者学習用コメント付き
// ==========================================

// --- 定数とグローバル変数 ---
const STORAGE_KEY = 'cinemaRouletteData'; // LocalStorageの保存キー
let movies = []; // 映画データのリストを保持する配列

// --- DOM要素の取得（HTMLの要素をJavaScriptで操作できるようにする） ---
const movieForm = document.getElementById('movieForm');
const movieListElement = document.getElementById('movieList');
const movieCountElement = document.getElementById('movieCount');
const emptyStateElement = document.getElementById('emptyState');
const spinBtn = document.getElementById('spinBtn');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveBtn = document.getElementById('saveBtn');

// オーバーレイ（ポップアップ）関連の要素
const rouletteOverlay = document.getElementById('rouletteOverlay');
const confirmOverlay = document.getElementById('confirmOverlay');
const resultContent = document.getElementById('resultContent');
const closeResultBtn = document.getElementById('closeResultBtn');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');
const confirmMessage = document.getElementById('confirmMessage');

let deleteTargetId = null; // 削除対象のIDを一時保存する変数

// --- 初期化処理 ---
// ページが読み込まれたときに実行されます
document.addEventListener('DOMContentLoaded', () => {
    loadMovies();   // データの読み込み
    renderList();   // リストの描画
});

// --- イベントリスナーの設定 ---

// フォーム送信（保存ボタン）時の処理
movieForm.addEventListener('submit', (e) => {
    e.preventDefault(); // ページのリロードを防ぐ
    handleSave();
});

// キャンセルボタンクリック時の処理
cancelEditBtn.addEventListener('click', resetForm);

// 画像選択時のプレビュー表示処理
imageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader(); // ファイルを読み込むためのオブジェクト
        
        // 読み込み完了時の処理
        reader.onload = function(e) {
            // プレビューエリアに画像を表示
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        }
        
        reader.readAsDataURL(file); // 画像をDataURL（文字列）として読み込む
    } else {
        imagePreview.innerHTML = ''; // クリア
    }
});

// 抽選ボタンクリック時の処理
spinBtn.addEventListener('click', spinRoulette);

// 抽選結果を閉じるボタン
closeResultBtn.addEventListener('click', () => {
    rouletteOverlay.classList.remove('active'); // クラス操作でアニメーション
    rouletteOverlay.classList.add('hidden');
});

// 削除確認：はい
confirmYesBtn.addEventListener('click', () => {
    if (deleteTargetId !== null) {
        movies = movies.filter(movie => movie.id !== deleteTargetId); // 該当ID以外を残す＝削除
        saveMovies();
        renderList();
        closeConfirm();
    }
});

// 削除確認：いいえ
confirmNoBtn.addEventListener('click', closeConfirm);


// --- データ操作関数 ---

// LocalStorageからデータを読み込む
function loadMovies() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        movies = JSON.parse(data); // JSON文字列を配列に戻す
    } else {
        movies = [];
    }
}

// LocalStorageにデータを保存する
function saveMovies() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movies)); // 配列をJSON文字列に変換
    updateCount();
}

// 映画の件数を更新表示する
function updateCount() {
    movieCountElement.textContent = `(${movies.length})`;
}


// --- 保存・追加・更新ロジック ---

async function handleSave() {
    // フォームの値を取得
    const id = document.getElementById('movieId').value;
    const title = document.getElementById('title').value;
    const genre = document.getElementById('genre').value;
    
    // 選択されたラジオボタン（評価）の値を取得
    const ratingInput = document.querySelector('input[name="rating"]:checked');
    const rating = ratingInput ? ratingInput.value : 3; // デフォルトは3

    // 画像データの取得
    let imageData = null;
    if (imageInput.files && imageInput.files[0]) {
        // 新しい画像が選択されている場合、Base64文字列に変換して保存
        imageData = await convertToBase64(imageInput.files[0]);
    } else if (id) {
        // 編集モードで、新しい画像が選択されていない場合、既存の画像を維持
        const originalMovie = movies.find(m => m.id === parseInt(id));
        if (originalMovie) {
            imageData = originalMovie.image;
        }
    }

    // 映画オブジェクトの作成
    const movieData = {
        id: id ? parseInt(id) : Date.now(), // IDがあればそのまま、なければ現在時刻をIDに
        title: title,
        genre: genre,
        rating: rating,
        image: imageData
    };

    if (id) {
        // 編集（更新）
        const index = movies.findIndex(m => m.id === parseInt(id));
        if (index !== -1) {
            movies[index] = movieData;
        }
    } else {
        // 新規追加
        movies.push(movieData);
    }

    saveMovies(); // 保存
    renderList(); // 再描画
    resetForm();  // フォームリセット
}

// 画像ファイルをBase64文字列に変換する関数（非同期処理）
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}


// --- 編集・削除 ---

// 編集ボタンが押されたとき（HTMLのonclick属性から呼ばれる）
window.editMovie = function(id) {
    const movie = movies.find(m => m.id === id);
    if (!movie) return;

    // フォームに値をセット
    document.getElementById('movieId').value = movie.id;
    document.getElementById('title').value = movie.title;
    document.getElementById('genre').value = movie.genre;
    
    // 評価（ラジオボタン）のセット
    const radio = document.querySelector(`input[name="rating"][value="${movie.rating}"]`);
    if (radio) radio.checked = true;

    // 画像プレビュー
    if (movie.image) {
        imagePreview.innerHTML = `<img src="${movie.image}" alt="Preview">`;
    } else {
        imagePreview.innerHTML = '';
    }

    // UI変更（キャンセルボタン表示、保存ボタンのテキスト変更）
    saveBtn.textContent = '更新 / Update';
    cancelEditBtn.classList.remove('hidden');
    
    // フォームにスクロール（モバイル用）
    movieForm.scrollIntoView({ behavior: 'smooth' });
};

// 削除ボタンが押されたとき
window.deleteMovie = function(id) {
    const movie = movies.find(m => m.id === id);
    if (!movie) return;

    deleteTargetId = id;
    confirmMessage.textContent = `「${movie.title}」を削除しますか？\nDo you want to delete this?`;
    confirmOverlay.classList.remove('hidden');
};

function closeConfirm() {
    confirmOverlay.classList.add('hidden');
    deleteTargetId = null;
}

// フォームを初期状態に戻す
function resetForm() {
    movieForm.reset();
    document.getElementById('movieId').value = '';
    imagePreview.innerHTML = '';
    saveBtn.textContent = '保存 / Save';
    cancelEditBtn.classList.add('hidden');
}


// --- リスト描画 ---

function renderList() {
    movieListElement.innerHTML = ''; // リストをクリア

    if (movies.length === 0) {
        emptyStateElement.style.display = 'block';
        return;
    } else {
        emptyStateElement.style.display = 'none';
    }

    // 新しい順に表示するため、逆順でループ
    [...movies].reverse().forEach(movie => {
        // 画像がない場合のプレイスホルダー
        const imageHtml = movie.image 
            ? `<img src="${movie.image}" alt="${movie.title}">` 
            : `<div class="no-image"></div>`;

        // 星評価の表示用文字列を作成
        const stars = '★'.repeat(movie.rating) + '☆'.repeat(5 - movie.rating);

        const card = document.createElement('div');
        card.className = 'movie-card';
        card.innerHTML = `
            <div class="card-image">
                ${imageHtml}
            </div>
            <div class="card-info">
                <h4 class="card-title">${movie.title}</h4>
                <div class="card-meta">
                    <span class="card-genre">${movie.genre}</span>
                    <span class="card-rating">${stars}</span>
                </div>
                <div class="card-actions">
                    <button onclick="editMovie(${movie.id})" class="card-btn edit-btn">編集 / Edit</button>
                    <button onclick="deleteMovie(${movie.id})" class="card-btn delete-btn">削除 / Delete</button>
                </div>
            </div>
        `;
        movieListElement.appendChild(card);
    });

    updateCount();
}


// --- ルーレット機能 ---

function spinRoulette() {
    if (movies.length === 0) {
        alert('まずは映画を登録してください！\nPlease add movies first!');
        return;
    }

    spinBtn.disabled = true; // ボタン連打防止
    
    // ルーレット演出（簡易的）
    // 一定時間後にランダムで1つ選ぶ
    const duration = 2000; // 2秒
    const intervalTime = 100;
    
    // 演出：オーバーレイを表示する前に、少しユーザーに待機感を与える（今回は即時計算し、オーバーレイ表示時に結果を出す）
    
    // 本番抽選
    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * movies.length);
        const winner = movies[randomIndex];
        showWinner(winner);
        spinBtn.disabled = false;
    }, duration);

    // 演出として、ボタンのテキストを変えるなどしても良い
    let count = 0;
    const interval = setInterval(() => {
        const icons = ['🎬', '🍿', '🥤', '🎟️', '🎲'];
        spinBtn.innerHTML = `<span class="icon">${icons[count % icons.length]}</span> 抽選中... / Rolling...`;
        count++;
    }, intervalTime);

    setTimeout(() => {
        clearInterval(interval);
        spinBtn.innerHTML = `<span class="icon">🎲</span> 抽選する / Spin`;
    }, duration);
}

function showWinner(movie) {
    const imageHtml = movie.image 
        ? `<img src="${movie.image}" alt="${movie.title}">` 
        : `<div class="no-image" style="height:200px; width:150px; margin:0 auto 15px auto; border-radius:8px;"></div>`;
    
    const stars = '★'.repeat(movie.rating);

    resultContent.innerHTML = `
        ${imageHtml}
        <h3>${movie.title}</h3>
        <p>Genre: ${movie.genre} | Rating: <span style="color:#ffd700">${stars}</span></p>
    `;

    // Google検索リンクの生成
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(movie.title + ' 映画')}`;
    const searchLink = document.getElementById('searchLink');
    searchLink.href = searchUrl;

    // オーバーレイを表示
    rouletteOverlay.classList.remove('hidden');
    
    // 少し拡大するアニメーション用のクラスを追加（CSS transition用）
    setTimeout(() => {
        rouletteOverlay.classList.add('active');
    }, 10);
}
