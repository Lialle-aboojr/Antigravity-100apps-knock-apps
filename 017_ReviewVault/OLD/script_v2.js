/**
 * Review Vault Application Logic (V2)
 * ユーザーの技術レベルに合わせて、丁寧な日本語コメントを含めています。
 */

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. DOM要素の取得
    // ---------------------------------------------------------
    const form = document.getElementById('reviewForm');
    const galleryGrid = document.getElementById('galleryGrid');
    const noDataMessage = document.getElementById('noDataMessage');
    const searchInput = document.getElementById('searchInput');
    const themeToggle = document.getElementById('themeToggle');
    const filterButtons = document.querySelectorAll('.filter-btn');

    // 星評価関連
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.getElementById('ratingValue');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');

    // ---------------------------------------------------------
    // 2. データ初期化 & 状態管理
    // ---------------------------------------------------------
    // localStorageからデータを読み込み（なければ空配列）
    let reviews = JSON.parse(localStorage.getItem('reviewVaultData')) || [];

    // 現在のフィルタ状態（デフォルトは 'all'）
    let currentFilter = 'all';

    // 初期表示
    renderGallery();
    loadTheme();

    // ---------------------------------------------------------
    // 3. イベントリスナー設定
    // ---------------------------------------------------------

    // A. フィルタボタンのクリック
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // アクティブクラスの切り替え
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // フィルタ条件の更新
            currentFilter = btn.getAttribute('data-filter');

            // ギャラリー再描画
            renderGallery();
        });
    });

    // B. キーワード検索（リアルタイム）
    searchInput.addEventListener('input', () => {
        renderGallery();
    });

    // C. 星評価のクリック
    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            const value = e.target.getAttribute('data-value');
            ratingValue.value = value;
            updateStarDisplay(value);
        });
    });

    // D. 画像選択時のプレビュー
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // E. フォーム送信（保存）
    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // ページリロード防止

        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const rating = ratingValue.value;
        const comment = document.getElementById('comment').value;
        const file = imageInput.files[0];

        if (rating === "0") {
            alert('評価（星）を選択してください / Please select a rating.');
            return;
        }

        // 画像処理（遅延非同期処理）
        let imageData = '';
        if (file) {
            try {
                imageData = await resizeImage(file);
            } catch (error) {
                console.error('Image Error:', error);
                alert('画像の処理に失敗しました。');
                return;
            }
        }

        // 新規データの作成
        const newReview = {
            id: Date.now(),
            title,
            category,
            rating,
            comment,
            image: imageData,
            date: new Date().toLocaleDateString()
        };

        // 配列に追加して保存
        reviews.unshift(newReview);
        saveData();

        // フォームのリセットと再描画
        form.reset();
        resetFormState();
        renderGallery();
        alert('保存しました！ / Saved!');
    });

    // F. テーマ切替
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('reviewVaultTheme', isDark ? 'dark' : 'light');
    });

    // G. 削除ボタン（イベント委譲）
    galleryGrid.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete')) {
            const btn = e.target.closest('.btn-delete');
            const id = Number(btn.getAttribute('data-id'));

            if (confirm('この記録を削除しますか？ / Delete this record?')) {
                reviews = reviews.filter(r => r.id !== id);
                saveData();
                renderGallery();
            }
        }
    });

    // ---------------------------------------------------------
    // 4. 関数定義
    // ---------------------------------------------------------

    // ギャラリーの描画（フィルタリング機能付き）
    function renderGallery() {
        const searchTerm = searchInput.value.toLowerCase();

        // フィルタリング実行 (AND条件: カテゴリ && 検索ワード)
        const filteredList = reviews.filter(review => {
            // 1. カテゴリチェック ('all'なら全てOK、それ以外は一致チェック)
            const categoryMatch = (currentFilter === 'all') || (review.category === currentFilter);

            // 2. キーワードチェック (タイトルまたはコメントに一致)
            const keywordMatch = review.title.toLowerCase().includes(searchTerm) ||
                review.comment.toLowerCase().includes(searchTerm);

            return categoryMatch && keywordMatch;
        });

        // DOM更新
        galleryGrid.innerHTML = '';

        if (filteredList.length === 0) {
            galleryGrid.appendChild(noDataMessage);
            noDataMessage.classList.remove('hidden');
            return;
        }

        noDataMessage.classList.add('hidden');

        filteredList.forEach(review => {
            const card = createCardElement(review);
            galleryGrid.appendChild(card);
        });
    }

    // カードのHTML生成
    function createCardElement(review) {
        const card = document.createElement('article');
        card.className = 'review-card';
        // アニメーション用
        card.style.animation = 'fadeIn 0.3s ease';

        // カテゴリアイコンの決定
        let iconName = 'help_outline'; // default
        let tooltip = review.category;

        switch (review.category) {
            case 'movie': iconName = 'movie'; break;
            case 'book': iconName = 'menu_book'; break;
            case 'comic': iconName = 'auto_stories'; break;
            case 'other': iconName = 'more_horiz'; break;
        }

        const starString = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

        const imgHtml = review.image
            ? `<img src="${review.image}" class="card-image" alt="${review.title}">`
            : `<div class="card-image" style="display:flex;align-items:center;justify-content:center;color:#ccc;background:#eee;">No Image</div>`;

        card.innerHTML = `
            ${imgHtml}
            <div class="card-content">
                <div class="card-category-icon" title="${tooltip}">
                    <span class="material-icons">${iconName}</span>
                </div>
                <h3 class="card-title">${escapeHtml(review.title)}</h3>
                <div class="card-rating">${starString}</div>
                <p class="card-comment">${escapeHtml(review.comment)}</p>
                
                <button class="btn-delete" data-id="${review.id}">
                    <span class="material-icons" style="font-size:16px;">delete</span> Delete
                </button>
            </div>
        `;
        return card;
    }

    function saveData() {
        try {
            localStorage.setItem('reviewVaultData', JSON.stringify(reviews));
        } catch (e) {
            alert('保存容量の上限です。画像を減らしてください。\nStorage quota exceeded.');
        }
    }

    function loadTheme() {
        const theme = localStorage.getItem('reviewVaultTheme');
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }

    function updateStarDisplay(value) {
        stars.forEach(star => {
            const starValue = star.getAttribute('data-value');
            if (starValue <= value) {
                star.classList.add('active');
                star.textContent = '★';
            } else {
                star.classList.remove('active');
                star.textContent = '★'; // デザイン上、色はCSSで変える
            }
        });
    }

    function resetFormState() {
        ratingValue.value = "0";
        stars.forEach(star => star.classList.remove('active'));
        imagePreview.innerHTML = '<span class="placeholder-text">画像を選択してください<br>Select Image</span>';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }

    // 画像リサイズ処理 (最大幅500px)
    function resizeImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    const maxWidth = 500;
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.onerror = reject;
            };
            reader.onerror = reject;
        });
    }
});
