// ==========================================
// Cinema Roulette Pro V3 - Main Script
// 初心者学習用コメント付き
// ==========================================

// --- 定数とグローバル変数 ---
const STORAGE_KEY = 'cinemaRouletteData'; // LocalStorageの保存キー
const THEME_KEY = 'cinemaRouletteTheme';  // テーマ保存用のキー
let movies = []; // 映画データのリストを保持する配列

// --- DOM要素の取得 ---
const movieForm = document.getElementById('movieForm');
const movieListElement = document.getElementById('movieList');
const movieCountElement = document.getElementById('movieCount');
const emptyStateElement = document.getElementById('emptyState');
const spinBtn = document.getElementById('spinBtn');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveBtn = document.getElementById('saveBtn');

// V2追加: フィルターとテーマ
const rouletteFilter = document.getElementById('rouletteFilter');
const themeToggle = document.getElementById('themeToggle');
const themeLabel = document.getElementById('themeLabel');

// オーバーレイ（ポップアップ）関連の要素
const rouletteOverlay = document.getElementById('rouletteOverlay');
const confirmOverlay = document.getElementById('confirmOverlay');
const resultTitle = document.getElementById('resultTitle');
const resultContent = document.getElementById('resultContent');
const searchLink = document.getElementById('searchLink');
const closeResultBtn = document.getElementById('closeResultBtn');
const confirmYesBtn = document.getElementById('confirmYesBtn');
const confirmNoBtn = document.getElementById('confirmNoBtn');
const confirmMessage = document.getElementById('confirmMessage');

let deleteTargetId = null; // 削除対象のIDを一時保存する変数

// --- 初期化処理 ---
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();    // テーマ設定の読み込み
    loadMovies();   // データの読み込み
    renderList();   // リストの描画
});

// --- イベントリスナーの設定 ---

// フォーム送信（保存ボタン）時の処理
movieForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSave();
});

// キャンセルボタンクリック時の処理
cancelEditBtn.addEventListener('click', resetForm);

// 画像選択時のプレビュー表示処理
imageInput.addEventListener('change', function () {
    const file = this.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        }
        reader.readAsDataURL(file);
    } else {
        imagePreview.innerHTML = '';
    }
});

// 抽選ボタンクリック時の処理
spinBtn.addEventListener('click', spinRoulette);

// 抽選結果を閉じるボタン
closeResultBtn.addEventListener('click', () => {
    rouletteOverlay.classList.remove('active');
    rouletteOverlay.classList.add('hidden');
});

// 削除確認：はい
confirmYesBtn.addEventListener('click', () => {
    if (deleteTargetId !== null) {
        movies = movies.filter(movie => movie.id !== deleteTargetId);
        saveMovies();
        renderList();
        closeConfirm();
    }
});

// 削除確認：いいえ
confirmNoBtn.addEventListener('click', closeConfirm);

// テーマ切り替え処理
themeToggle.addEventListener('change', (e) => {
    const isLightMode = e.target.checked;
    applyTheme(isLightMode);
    localStorage.setItem(THEME_KEY, isLightMode ? 'light' : 'dark');
});


// --- データ操作関数 ---

function loadMovies() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        movies = JSON.parse(data);
    } else {
        movies = [];
    }
}

function saveMovies() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(movies));
    updateCount();
}

function updateCount() {
    movieCountElement.textContent = `(${movies.length})`;
}

// テーマの適用と読み込み
function loadTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const isLight = savedTheme === 'light';

    themeToggle.checked = isLight;
    applyTheme(isLight);
}

function applyTheme(isLight) {
    if (isLight) {
        document.body.classList.add('light-mode');
        themeLabel.textContent = 'Light Mode';
    } else {
        document.body.classList.remove('light-mode');
        themeLabel.textContent = 'Dark Mode';
    }
}


// --- 保存・追加・更新ロジック ---

async function handleSave() {
    const id = document.getElementById('movieId').value;
    const title = document.getElementById('title').value;
    const genre = document.getElementById('genre').value;

    const ratingInput = document.querySelector('input[name="rating"]:checked');
    const rating = ratingInput ? ratingInput.value : 3;

    // 画像データの取得
    let imageData = null;
    if (imageInput.files && imageInput.files[0]) {
        imageData = await convertToBase64(imageInput.files[0]);
    } else if (id) {
        const originalMovie = movies.find(m => m.id === parseInt(id));
        if (originalMovie) {
            imageData = originalMovie.image;
        }
    }

    const movieData = {
        id: id ? parseInt(id) : Date.now(),
        title: title,
        genre: genre,
        rating: rating,
        image: imageData
    };

    if (id) {
        const index = movies.findIndex(m => m.id === parseInt(id));
        if (index !== -1) {
            movies[index] = movieData;
        }
    } else {
        movies.push(movieData);
    }

    saveMovies();
    renderList();
    resetForm();
}

function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}


// --- 編集・削除 ---

window.editMovie = function (id) {
    const movie = movies.find(m => m.id === id);
    if (!movie) return;

    document.getElementById('movieId').value = movie.id;
    document.getElementById('title').value = movie.title;
    document.getElementById('genre').value = movie.genre;

    const radio = document.querySelector(`input[name="rating"][value="${movie.rating}"]`);
    if (radio) radio.checked = true;

    if (movie.image) {
        imagePreview.innerHTML = `<img src="${movie.image}" alt="Preview">`;
    } else {
        imagePreview.innerHTML = '';
    }

    saveBtn.textContent = '更新 / Update';
    cancelEditBtn.classList.remove('hidden');
    movieForm.scrollIntoView({ behavior: 'smooth' });
};

window.deleteMovie = function (id) {
    const movie = movies.find(m => m.id === id);
    if (!movie) return;

    deleteTargetId = id;

    // V3修正: 2行に分けたメッセージを設定 (HTMLタグを使用)
    confirmMessage.innerHTML = `
        「${movie.title}」を削除しますか？<br>
        <span style="font-size: 0.9em; opacity: 0.8;">Do you want to delete "${movie.title}"?</span>
    `;

    confirmOverlay.classList.remove('hidden');
};

function closeConfirm() {
    confirmOverlay.classList.add('hidden');
    deleteTargetId = null;
}

function resetForm() {
    movieForm.reset();
    document.getElementById('movieId').value = '';
    imagePreview.innerHTML = '';
    saveBtn.textContent = '保存 / Save';
    cancelEditBtn.classList.add('hidden');
}


// --- リスト描画 ---

function renderList() {
    movieListElement.innerHTML = '';

    if (movies.length === 0) {
        emptyStateElement.style.display = 'block';
        return;
    } else {
        emptyStateElement.style.display = 'none';
    }

    [...movies].reverse().forEach(movie => {
        const imageHtml = movie.image
            ? `<img src="${movie.image}" alt="${movie.title}">`
            : `<div class="no-image"></div>`;

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
    // 1. まず全体の登録数をチェック
    if (movies.length === 0) {
        alert('まずは映画を登録してください！\nPlease add movies first!');
        return;
    }

    // 2. フィルタリング
    const selectedGenre = rouletteFilter.value;
    let candidates = [];

    if (selectedGenre === "All") {
        candidates = movies;
    } else {
        candidates = movies.filter(movie => movie.genre === selectedGenre);
    }

    // 3. 候補が0件の場合の処理
    if (candidates.length === 0) {
        showNoCandidatesError(selectedGenre);
        return;
    }

    spinBtn.disabled = true;

    // 演出用タイマー
    const duration = 2000;
    const intervalTime = 100;

    // 本番抽選
    setTimeout(() => {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const winner = candidates[randomIndex];
        showWinner(winner);
        spinBtn.disabled = false;
    }, duration);

    // ボタン上の演出
    let count = 0;
    const interval = setInterval(() => {
        const icons = ['🎬', '🍿', '🥤', '🎟️', '🎲'];
        spinBtn.innerHTML = `<span class="icon">${icons[count % icons.length]}</span> 抽選中...`;
        count++;
    }, intervalTime);

    setTimeout(() => {
        clearInterval(interval);
        spinBtn.innerHTML = `<span class="icon">🎲</span> 抽選する / Spin`;
    }, duration);
}

// 候補がない場合のエラー表示
function showNoCandidatesError(genre) {
    resultTitle.textContent = "Oops...";
    resultContent.innerHTML = `
        <div style="font-size: 3rem; margin-bottom: 20px;">😢</div>
        <h3>No movies found</h3>
        <p>「${genre}」ジャンルの映画はまだ登録されていません。<br>Please register "${genre}" movies first.</p>
    `;

    searchLink.style.display = 'none';

    rouletteOverlay.classList.remove('hidden');
    setTimeout(() => {
        rouletteOverlay.classList.add('active');
    }, 10);
}

function showWinner(movie) {
    resultTitle.textContent = "Tonight's Movie / 今日の1本";

    const imageHtml = movie.image
        ? `<img src="${movie.image}" alt="${movie.title}">`
        : `<div class="no-image" style="height:200px; width:150px; margin:0 auto 15px auto; border-radius:8px;"></div>`;

    const stars = '★'.repeat(movie.rating);

    resultContent.innerHTML = `
        ${imageHtml}
        <h3>${movie.title}</h3>
        <p>Genre: ${movie.genre} | Rating: <span style="color:#ffd700">${stars}</span></p>
    `;

    // Google検索リンク設定
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(movie.title + ' 映画')}`;
    searchLink.href = searchUrl;
    searchLink.style.display = 'inline-block';

    rouletteOverlay.classList.remove('hidden');
    setTimeout(() => {
        rouletteOverlay.classList.add('active');
    }, 10);
}
