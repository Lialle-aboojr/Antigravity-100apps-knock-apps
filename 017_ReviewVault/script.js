/**
 * Review Vault Application Logic (V3 - Bug Fixed)
 * 編集機能、カスタムモーダルの制御修正版
 */

document.addEventListener('DOMContentLoaded', () => {
    // ---------------------------------------------------------
    // 1. DOM要素の取得
    // ---------------------------------------------------------
    const form = document.getElementById('reviewForm');
    const submitBtn = document.getElementById('submitBtn');
    const editIdInput = document.getElementById('editId');

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

    // モーダル関連要素
    const deleteModal = document.getElementById('deleteModal');
    const deleteMessage = document.getElementById('deleteMessage');
    const cancelDeleteBtn = document.getElementById('cancelDelete');
    const confirmDeleteBtn = document.getElementById('confirmDelete');

    // ---------------------------------------------------------
    // 2. データ初期化 & 状態管理
    // ---------------------------------------------------------
    let reviews = JSON.parse(localStorage.getItem('reviewVaultData')) || [];
    let currentFilter = 'all';
    let deleteTargetId = null;

    // 初期表示
    renderGallery();
    loadTheme();

    // ---------------------------------------------------------
    // 3. イベントリスナー設定
    // ---------------------------------------------------------

    // A. フィルタボタン
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderGallery();
        });
    });

    // B. キーワード検索
    searchInput.addEventListener('input', () => {
        renderGallery();
    });

    // C. 星評価クリック
    stars.forEach(star => {
        star.addEventListener('click', (e) => {
            const value = e.target.getAttribute('data-value');
            ratingValue.value = value;
            updateStarDisplay(value);
        });
    });

    // D. 画像プレビュー
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

    // E. フォーム送信（新規作成 & 更新）
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const category = document.getElementById('category').value;
        const rating = ratingValue.value;
        const comment = document.getElementById('comment').value;
        const file = imageInput.files[0];
        const editId = editIdInput.value;

        if (rating === "0") {
            alert('評価（星）を選択してください / Please select a rating.');
            return;
        }

        let imageData = '';
        if (file) {
            try {
                imageData = await resizeImage(file);
            } catch (error) {
                console.error('Image Error:', error);
                alert('画像の処理に失敗しました。');
                return;
            }
        } else if (editId) {
            // 画像変更なしで編集の場合は元の画像を維持
            const original = reviews.find(r => r.id === Number(editId));
            if (original) {
                imageData = original.image;
            }
        }

        if (editId) {
            // 更新
            const index = reviews.findIndex(r => r.id === Number(editId));
            if (index !== -1) {
                reviews[index] = {
                    ...reviews[index],
                    title,
                    category,
                    rating,
                    comment,
                    image: imageData,
                    updated: new Date().toLocaleDateString()
                };
                alert('更新しました！ / Updated!');
            }
        } else {
            // 新規
            const newReview = {
                id: Date.now(),
                title,
                category,
                rating,
                comment,
                image: imageData,
                date: new Date().toLocaleDateString()
            };
            reviews.unshift(newReview);
            alert('保存しました！ / Saved!');
        }

        saveData();
        resetForm();
        renderGallery();
    });

    // F. テーマ切替
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('reviewVaultTheme', isDark ? 'dark' : 'light');
    });

    // G. ギャラリーイベント（削除・編集）
    galleryGrid.addEventListener('click', (e) => {
        // --- 削除 ---
        const deleteBtn = e.target.closest('.btn-delete');
        if (deleteBtn) {
            const id = Number(deleteBtn.getAttribute('data-id'));
            const item = reviews.find(r => r.id === id);
            if (item) {
                showDeleteModal(id, item.title);
            }
            return;
        }

        // --- 編集 ---
        const editBtn = e.target.closest('.btn-edit');
        if (editBtn) {
            const id = Number(editBtn.getAttribute('data-id'));
            startEditMode(id);
        }
    });

    // H. モーダル操作 (修正ポイント)
    // キャンセルボタン
    cancelDeleteBtn.addEventListener('click', () => {
        closeDeleteModal();
    });

    // 削除実行ボタン
    confirmDeleteBtn.addEventListener('click', () => {
        if (deleteTargetId !== null) {
            reviews = reviews.filter(r => r.id !== deleteTargetId);
            saveData();
            renderGallery();
            closeDeleteModal();

            // 編集中のものを削除したらフォームリセット
            if (editIdInput.value == deleteTargetId) {
                resetForm();
            }
        }
    });

    // ---------------------------------------------------------
    // 4. 関数定義
    // ---------------------------------------------------------

    // モーダル表示 (CSSクラス制御に変更)
    function showDeleteModal(id, title) {
        deleteTargetId = id;
        deleteMessage.textContent = `「${title}」を削除しますか？\nDo you want to delete "${title}"?`;
        deleteModal.classList.add('is-visible'); // class追加で表示
    }

    // モーダル非表示
    function closeDeleteModal() {
        deleteModal.classList.remove('is-visible'); // class削除で非表示
        deleteTargetId = null;
    }

    function startEditMode(id) {
        const item = reviews.find(r => r.id === id);
        if (!item) return;

        document.getElementById('title').value = item.title;
        document.getElementById('category').value = item.category;
        document.getElementById('comment').value = item.comment;
        ratingValue.value = item.rating;
        editIdInput.value = item.id;

        updateStarDisplay(item.rating);

        if (item.image) {
            imagePreview.innerHTML = `<img src="${item.image}" alt="Preview">`;
        } else {
            imagePreview.innerHTML = '<span class="placeholder-text">画像を変更する場合のみ<br>選択してください</span>';
        }

        submitBtn.textContent = '更新 / Update';
        submitBtn.style.backgroundColor = 'var(--btn-edit)';
        form.scrollIntoView({ behavior: 'smooth' });
    }

    function resetForm() {
        form.reset();
        editIdInput.value = '';
        ratingValue.value = "0";
        submitBtn.textContent = '保存 / Save';
        submitBtn.style.backgroundColor = '';

        stars.forEach(star => star.classList.remove('active'));
        imagePreview.innerHTML = '<span class="placeholder-text">画像を選択してください<br>Select Image</span>';
    }

    function renderGallery() {
        const searchTerm = searchInput.value.toLowerCase();

        const filteredList = reviews.filter(review => {
            const categoryMatch = (currentFilter === 'all') || (review.category === currentFilter);
            const keywordMatch = review.title.toLowerCase().includes(searchTerm) ||
                review.comment.toLowerCase().includes(searchTerm);
            return categoryMatch && keywordMatch;
        });

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

    function createCardElement(review) {
        const card = document.createElement('article');
        card.className = 'review-card';
        card.style.animation = 'fadeIn 0.3s ease';

        let iconName = 'help_outline';
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
                
                <div class="card-actions">
                    <button class="action-btn btn-edit" data-id="${review.id}">
                        <span class="material-icons" style="font-size:18px;">edit</span> Edit
                    </button>
                    <button class="action-btn btn-delete" data-id="${review.id}">
                        <span class="material-icons" style="font-size:18px;">delete</span> Delete
                    </button>
                </div>
            </div>
        `;
        return card;
    }

    function saveData() {
        try {
            localStorage.setItem('reviewVaultData', JSON.stringify(reviews));
        } catch (e) {
            alert('保存容量の上限です。');
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
                star.textContent = '★';
            }
        });
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
