/**
 * Review Vault Application Logic
 * ユーザーの技術レベルに合わせて、丁寧な日本語コメントを含めています。
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const form = document.getElementById('reviewForm');
    const galleryGrid = document.getElementById('galleryGrid');
    const noDataMessage = document.getElementById('noDataMessage');
    const searchInput = document.getElementById('searchInput');
    const themeToggle = document.getElementById('themeToggle');
    
    // 星評価関連の要素
    const stars = document.querySelectorAll('.star');
    const ratingValue = document.getElementById('ratingValue');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');

    // データの読み込み (localStorageから)
    let reviews = JSON.parse(localStorage.getItem('reviewVaultData')) || [];

    // 初期表示
    renderGallery(reviews);
    loadTheme();

    /**
     * イベントリスナー設定
     * =========================================
     */

    // 1. 星評価のクリック処理
    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            const value = e.target.getAttribute('data-value');
            ratingValue.value = value;
            updateStarDisplay(value);
        });
    });

    // 2. 画像選択時のプレビュー処理
    imageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                // プレビュー表示
                imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. フォーム送信（保存）処理
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // 入力値の取得
        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const rating = ratingValue.value;
        const comment = document.getElementById('comment').value;
        const file = imageInput.files[0];

        if (rating === "0") {
            alert('評価（星）を選択してください / Please select a rating.');
            return;
        }

        // 画像処理（リサイズしてBase64化）
        let imageData = '';
        if (file) {
            try {
                imageData = await resizeImage(file);
            } catch (error) {
                console.error('Image processing failed:', error);
                alert('画像の処理に失敗しました。 / Failed to process image.');
                return;
            }
        }

        // 新しいレビューオブジェクトの作成
        const newReview = {
            id: Date.now(), // ユニークIDとして現在時刻を使用
            title,
            category,
            rating,
            comment,
            image: imageData, // Base64文字列
            date: new Date().toLocaleDateString()
        };

        // 配列に追加して保存
        reviews.unshift(newReview); // 先頭に追加
        saveData();
        
        // 画面更新とフォームリセット
        renderGallery(reviews);
        form.reset();
        resetFormState();
        alert('保存しました！ / Saved!');
    });

    // 4. 検索機能
    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = reviews.filter(review => {
            return review.title.toLowerCase().includes(term) || 
                   review.comment.toLowerCase().includes(term);
        });
        renderGallery(filtered);
    });

    // 5. テーマ切替 (ダークモード)
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        // 設定を保存
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('reviewVaultTheme', isDark ? 'dark' : 'light');
    });

    // 6. 削除ボタン（イベント委譲）
    galleryGrid.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const id = Number(e.target.getAttribute('data-id'));
            if (confirm('この記録を削除しますか？ / Delete this record?')) {
                reviews = reviews.filter(r => r.id !== id);
                saveData();
                renderGallery(reviews);
                // 検索中だったら検索結果も更新する必要があるが、今回は簡易的に全件表示に戻るか、あるいは現在の検索語句で再フィルタリングするのが理想。
                // 初心者向けにシンプルに「削除後は現在のリストを再描画」としています。
                // 検索ボックスに値が入っていればトリガーする
                if (searchInput.value) {
                   searchInput.dispatchEvent(new Event('input'));
                }
            }
        }
    });

    /**
     * 関数定義エリア
     * =========================================
     */

    // データをlocalStorageに保存
    function saveData() {
        try {
            localStorage.setItem('reviewVaultData', JSON.stringify(reviews));
        } catch (e) {
            alert('保存容量の上限に達した可能性があります。画像を減らすか削除してください。\nStorage quota exceeded.');
        }
    }

    // テーマの読み込み
    function loadTheme() {
        const theme = localStorage.getItem('reviewVaultTheme');
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }

    // 星の表示を更新
    function updateStarDisplay(value) {
        stars.forEach(star => {
            const starValue = star.getAttribute('data-value');
            if (starValue <= value) {
                star.classList.add('active');
                star.textContent = '★';
            } else {
                star.classList.remove('active');
                star.textContent = '☆'; // 未選択時は白抜きにする場合
                // デザイン要件で「クリックで選択」なので、色はCSSで制御し、文字は★のままでも良いが、わかりやすく切り替えても良い。
                // 今回はCSSのcolor変化だけで十分だが、あえて★のままにする。
                 star.textContent = '★';
            }
        });
    }

    // フォームリセット時の表示初期化
    function resetFormState() {
        ratingValue.value = "0";
        stars.forEach(s => s.classList.remove('active'));
        imagePreview.innerHTML = '<span class="placeholder-text">画像を選択してください<br>Select Image</span>';
    }

    // ギャラリーの描画
    function renderGallery(list) {
        galleryGrid.innerHTML = ''; // 一旦クリア

        if (list.length === 0) {
            galleryGrid.appendChild(noDataMessage);
            noDataMessage.classList.remove('hidden');
            return;
        }

        noDataMessage.classList.add('hidden');

        list.forEach(review => {
            const card = document.createElement('article');
            card.className = 'review-card';
            
            // 星の生成
            const starString = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

            // 画像HTML (画像がない場合はダミー画像を表示しない、またはプレースホルダーを表示)
            // ここでは背景色で代用するため、imgタグはsrcがある場合のみ表示、あるいはCSSで制御
            const imgHtml = review.image 
                ? `<img src="${review.image}" class="card-image" alt="${review.title}">` 
                : `<div class="card-image" style="display:flex;align-items:center;justify-content:center;color:#ccc;">No Image</div>`;

            card.innerHTML = `
                ${imgHtml}
                <div class="card-content">
                    <span class="card-category">${review.category}</span>
                    <h3 class="card-title">${review.title}</h3>
                    <div class="card-rating">${starString}</div>
                    <p class="card-comment">${escapeHtml(review.comment)}</p>
                    <button class="btn-delete" data-id="${review.id}">削除 / Delete</button>
                </div>
            `;
            galleryGrid.appendChild(card);
        });
    }

    // HTMLエスケープ（XSS対策）
    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }

    /**
     * 画像のリサイズ処理 (重要)
     * Canvasを使用して画像を縮小し、Base64文字列として返します。
     * 最大幅: 500px
     */
    function resizeImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                
                img.onload = () => {
                    const maxWidth = 500; // 最大幅
                    let width = img.width;
                    let height = img.height;

                    // アスペクト比を維持して計算
                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }

                    // Canvasを作成して描画
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Base64 (JPEG, 品質0.8) に変換
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    resolve(dataUrl);
                };
                
                img.onerror = (err) => reject(err);
            };
            
            reader.onerror = (err) => reject(err);
        });
    }
});
