// サニタイズ処理 (XSS対策)
function sanitizeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

const STORAGE_KEY = "moms_ai_recipe_book_data";
function saveRecipes(recipes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

function loadRecipes() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// 画像圧縮処理 (Canvas使用)
function compressImage(file, callback) {
    if (!file) {
        callback(null);
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const MAX_SIZE = 400;
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > MAX_SIZE) {
                    height *= MAX_SIZE / width;
                    width = MAX_SIZE;
                }
            } else {
                if (height > MAX_SIZE) {
                    width *= MAX_SIZE / height;
                    height = MAX_SIZE;
                }
            }

            const canvas = document.getElementById("image-canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            callback(dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

document.addEventListener("DOMContentLoaded", () => {
    
    // UI Elements
    const viewList = document.getElementById("view-list");
    const viewAdd = document.getElementById("view-add");
    const fabAdd = document.getElementById("fab-add");
    const backToListBtn = document.getElementById("back-to-list-btn");
    
    const recipeForm = document.getElementById("recipe-form");
    const formTitle = document.getElementById("form-title");
    const aiText = document.getElementById("ai-text");
    const autoFillBtn = document.getElementById("auto-fill-btn");
    
    const photoInput = document.getElementById("recipe-photo");
    const photoNameDisplay = document.getElementById("recipe-photo-name");
    const photoPreview = document.getElementById("photo-preview");
    
    const recipeGrid = document.getElementById("recipe-grid");
    
    const searchKeyword = document.getElementById("search-keyword");
    const filterGenre = document.getElementById("filter-genre");
    const sortOrder = document.getElementById("sort-order");

    const modal = document.getElementById("detail-modal");
    const modalClose = document.getElementById("modal-close");
    const modalBody = document.getElementById("modal-body");

    // History Forms
    const historyDate = document.getElementById("history-date");
    const historyPhotoInput = document.getElementById("history-photo");
    const historyPhotoNameDisplay = document.getElementById("history-photo-name");
    const addHistoryBtn = document.getElementById("add-history-btn");

    let currentPhotoBase64 = null; 
    let currentDetailRecipeId = null;

    // --- ビュー切り替え (SPA) ---
    function switchView(target) {
        if (target === 'list') {
            viewList.classList.remove("hidden");
            viewList.classList.add("active");
            viewAdd.classList.remove("active");
            viewAdd.classList.add("hidden");
            renderRecipes();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (target === 'add') {
            viewList.classList.remove("active");
            viewList.classList.add("hidden");
            viewAdd.classList.remove("hidden");
            viewAdd.classList.add("active");
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }

    fabAdd.addEventListener("click", () => {
        resetForm();
        switchView('add');
    });

    backToListBtn.addEventListener("click", () => {
        switchView('list');
    });

    // --- ファイル名の表示とプレビュー圧縮 ---
    photoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            photoNameDisplay.textContent = file.name;
            compressImage(file, (base64) => {
                currentPhotoBase64 = base64;
                photoPreview.src = base64;
                photoPreview.classList.remove("hidden");
            });
        } else {
            photoNameDisplay.textContent = "未選択 (No file chosen)";
            currentPhotoBase64 = null;
            photoPreview.classList.add("hidden");
        }
    });

    historyPhotoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            historyPhotoNameDisplay.textContent = file.name;
        } else {
            historyPhotoNameDisplay.textContent = "未選択 (None)";
        }
    });

    // --- AIテキスト解析 ---
    autoFillBtn.addEventListener("click", () => {
        const text = aiText.value;
        if (!text.trim()) {
            alert("AIのテキストを入力してください。\n(Please enter AI text.)");
            return;
        }

        let ingredientsText = "";
        let stepsText = "";
        let titleText = "";

        const lines = text.split('\n');
        if (lines.length > 0) {
            titleText = lines[0].replace(/[#*]/g, "").trim();
        }

        const stepSplit = text.split(/作り方|手順|ステップ|作り方の手順|Steps|Instructions/i);
        if (stepSplit.length > 1) {
            const ingredientSplit = stepSplit[0].split(/材料|用意するもの|Ingredients/i);
            ingredientsText = ingredientSplit.length > 1 ? ingredientSplit[1] : ingredientSplit[0];
            stepsText = stepSplit[1];
        } else {
            stepsText = text;
        }

        document.getElementById("recipe-title").value = titleText;
        document.getElementById("recipe-ingredients").value = ingredientsText.replace(/[:：-]/g, "").trim();
        document.getElementById("recipe-steps").value = stepsText.replace(/[:：-]/g, "").trim();
        
        alert("自動入力を完了しました。\n(Auto-filled.)");
    });

    // --- レシピ保存 ---
    recipeForm.addEventListener("submit", (e) => {
        e.preventDefault(); 
        const recipes = loadRecipes();
        
        const rData = {
            title: document.getElementById("recipe-title").value,
            genre: document.getElementById("recipe-genre").value,
            ingredients: document.getElementById("recipe-ingredients").value,
            steps: document.getElementById("recipe-steps").value,
            rating: document.getElementById("recipe-rating").value,
            comments: document.getElementById("recipe-comments").value,
        };
        const editId = document.getElementById("edit-id").value;

        if (editId) {
            const idx = recipes.findIndex(r => r.id === editId);
            if (idx > -1) {
                recipes[idx] = {
                    ...recipes[idx],
                    ...rData,
                    photo: currentPhotoBase64 || recipes[idx].photo, 
                    updatedAt: new Date().toISOString()
                };
                alert("更新しました！\n(Updated!)");
            }
        } else {
            const newRecipe = {
                id: "recipe_" + Date.now(),
                ...rData,
                photo: currentPhotoBase64,
                cookCount: 0,
                history: [],
                createdAt: new Date().toISOString()
            };
            recipes.push(newRecipe);
            alert("保存しました！\n(Saved!)");
        }

        saveRecipes(recipes);
        resetForm();
        switchView('list');
    });

    function resetForm() {
        recipeForm.reset();
        document.getElementById("edit-id").value = "";
        
        // ファイル入力の見た目もリセット
        currentPhotoBase64 = null;
        photoInput.value = "";
        photoNameDisplay.textContent = "未選択 (No file chosen)";
        photoPreview.src = "";
        photoPreview.classList.add("hidden");
        
        document.getElementById("save-btn").textContent = "保存 (Save)";
        formTitle.textContent = "手動入力・追加 (Manual Input)";
        aiText.value = "";
    }

    // --- レシピ表示・絞り込み ---
    function renderRecipes() {
        let recipes = loadRecipes();
        const kw = searchKeyword.value.toLowerCase();
        const gen = filterGenre.value;
        const sort = sortOrder.value;

        recipes = recipes.filter(r => {
            const matchKw = r.title.toLowerCase().includes(kw) || r.ingredients.toLowerCase().includes(kw);
            const matchGen = gen === "all" || r.genre === gen;
            return matchKw && matchGen;
        });

        recipes.sort((a, b) => {
            const countA = a.history ? Math.max(a.cookCount || 0, a.history.length) : (a.cookCount || 0);
            const countB = b.history ? Math.max(b.cookCount || 0, b.history.length) : (b.cookCount || 0);

            if (sort === "count") return countB - countA;
            if (sort === "rating") return Number(b.rating) - Number(a.rating);
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        recipeGrid.innerHTML = "";
        if (recipes.length === 0) {
            recipeGrid.innerHTML = "<p>レシピが見つかりません</p>";
            return;
        }

        recipes.forEach(r => {
            const card = document.createElement("div");
            card.className = "recipe-card";
            card.onclick = () => openModal(r.id);

            const displayCount = r.history ? Math.max(r.cookCount||0, r.history.length) : (r.cookCount||0);
            
            const imgHtml = r.photo 
                ? `<img src="${r.photo}" class="card-img" alt="Photo">`
                : `<div class="card-emoji">🍲</div>`;
            const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);

            card.innerHTML = `
                <div class="card-img-wrap">${imgHtml}</div>
                <div class="card-content">
                    <h3 class="card-title">${sanitizeHTML(r.title)}</h3>
                    <div class="card-rating">${stars}</div>
                    <div class="card-meta">
                        <span>🏷️ ${sanitizeHTML(r.genre)}</span>
                        <span class="card-count">🍽️ ${displayCount} 回</span>
                    </div>
                </div>
            `;
            recipeGrid.appendChild(card);
        });
    }

    searchKeyword.addEventListener("input", renderRecipes);
    filterGenre.addEventListener("change", renderRecipes);
    sortOrder.addEventListener("change", renderRecipes);

    // --- 詳細モーダル処理 ---
    function openModal(id) {
        const recipes = loadRecipes();
        const r = recipes.find(rec => rec.id === id);
        if(!r) return;
        
        currentDetailRecipeId = id;
        
        const displayCount = r.history ? Math.max(r.cookCount||0, r.history.length) : (r.cookCount||0);
        const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
        const imgHtml = r.photo 
                ? `<img src="${r.photo}" class="modal-img">`
                : `<div class="card-emoji" style="font-size:48px;">🍲</div>`;

        let historyHtml = "";
        if (r.history && r.history.length > 0) {
            historyHtml = `<div class="history-list">`;
            r.history.forEach(h => {
                const hImg = h.photo ? `<img src="${h.photo}" class="history-photo">` : `<div style="font-size:30px; margin-top:10px;">🍽️</div>`;
                historyHtml += `
                    <div class="history-item">
                        <div>📅 ${sanitizeHTML(h.date)}</div>
                        ${hImg}
                    </div>
                `;
            });
            historyHtml += `</div>`;
        } else {
            historyHtml = `<p style="font-size:12px; color:#999; margin:0;">(まだ履歴はありません)</p>`;
        }

        modalBody.innerHTML = `
            <div class="modal-img-wrap">${imgHtml}</div>
            <div class="modal-tag">🏷️ ${sanitizeHTML(r.genre)}</div>
            <h2 class="modal-title">${sanitizeHTML(r.title)}</h2>
            <div style="color: #ffb400; font-size:18px; margin-bottom:10px;">${stars} <span style="color:#d85c1f;font-size:14px;margin-left:10px;">作った回数: ${displayCount}回</span></div>
            
            <div class="modal-controls">
                <button class="btn btn-outline btn-sm" onclick="appContext.triggerEdit('${r.id}')">✏️ 編集 (Edit)</button>
                <button class="btn btn-outline btn-sm" onclick="appContext.triggerDelete('${r.id}')">🗑️ 削除 (Delete)</button>
            </div>

            <div class="modal-text-block">
                <h4>材料 (Ingredients)</h4>
                ${sanitizeHTML(r.ingredients)}
            </div>
            <div class="modal-text-block">
                <h4>作り方 (Steps)</h4>
                ${sanitizeHTML(r.steps)}
            </div>
            <div class="modal-text-block">
                <h4>コメント (Comments)</h4>
                ${r.comments ? sanitizeHTML(r.comments) : 'なし'}
            </div>
            
            <div class="modal-text-block">
                <h4>これまでの記録 (Cook History)</h4>
                ${historyHtml}
            </div>
        `;
        
        // 履歴フォームの初期化
        const today = new Date().toISOString().split('T')[0];
        historyDate.value = today;
        historyPhotoInput.value = "";
        historyPhotoNameDisplay.textContent = "未選択 (None)";

        modal.classList.remove("hidden");
    }

    modalClose.addEventListener("click", () => {
        modal.classList.add("hidden");
        currentDetailRecipeId = null;
    });

    modal.addEventListener("click", (e) => {
        if(e.target === modal) {
            modal.classList.add("hidden");
        }
    });

    // --- 履歴追加 ---
    addHistoryBtn.addEventListener("click", () => {
        if(!currentDetailRecipeId) return;
        
        const dateVal = historyDate.value;
        if(!dateVal) {
            alert("日付を入力してください。\n(Please select a date.)");
            return;
        }

        const file = historyPhotoInput.files[0];
        
        // 画像がある場合は圧縮して保存、無い場合はそのまま保存
        if (file) {
            compressImage(file, (base64) => {
                saveHistoryData(dateVal, base64);
            });
        } else {
            saveHistoryData(dateVal, null);
        }
    });

    function saveHistoryData(dateVal, base64Data) {
        const recipes = loadRecipes();
        const idx = recipes.findIndex(r => r.id === currentDetailRecipeId);
        
        if(idx > -1) {
            if(!recipes[idx].history) recipes[idx].history = [];
            
            recipes[idx].history.push({
                date: dateVal,
                photo: base64Data
            });

            recipes[idx].cookCount = Math.max(recipes[idx].cookCount || 0, recipes[idx].history.length);
            
            saveRecipes(recipes);
            renderRecipes();
            openModal(currentDetailRecipeId); 
            alert("記録を追加しました！\n(History added!)");
        }
    }

    // --- Global Methods ---
    window.appContext = {
        triggerDelete: (id) => {
            if(confirm("本当に削除しますか？\n(Are you sure?)")) {
                let recipes = loadRecipes();
                recipes = recipes.filter(r => r.id !== id);
                saveRecipes(recipes);
                renderRecipes();
                modal.classList.add("hidden");
            }
        },
        triggerEdit: (id) => {
            const recipes = loadRecipes();
            const r = recipes.find(rec => rec.id === id);
            if(r) {
                modal.classList.add("hidden");
                switchView('add');
                
                document.getElementById("form-title").textContent = "レシピの編集 (Edit Recipe)";
                document.getElementById("edit-id").value = r.id;
                document.getElementById("recipe-title").value = r.title;
                document.getElementById("recipe-genre").value = r.genre;
                document.getElementById("recipe-ingredients").value = r.ingredients;
                document.getElementById("recipe-steps").value = r.steps;
                document.getElementById("recipe-rating").value = r.rating;
                document.getElementById("recipe-comments").value = r.comments || "";
                
                if (r.photo) {
                    currentPhotoBase64 = r.photo;
                    photoPreview.src = r.photo;
                    photoPreview.classList.remove("hidden");
                    photoNameDisplay.textContent = "画像セット済み (Image set)";
                } else {
                    currentPhotoBase64 = null;
                    photoPreview.classList.add("hidden");
                    photoNameDisplay.textContent = "未選択 (No file chosen)";
                }
                document.getElementById("save-btn").textContent = "更新 (Update)";
            }
        }
    };

    // --- インポート / エクスポート ---
    document.getElementById("export-btn").addEventListener("click", () => {
        const recipes = loadRecipes();
        const dataStr = JSON.stringify(recipes, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "moms_recipe_book.json";
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById("import-file").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);
                if (Array.isArray(importedData)) {
                    const safeData = importedData.map(r => ({
                        ...r,
                        history: r.history || []
                    }));
                    if(confirm("インポートしますか？既存のデータは上書き・追加されます。\n(Import data?)")) {
                        saveRecipes(safeData);
                        renderRecipes();
                        alert("インポートが完了しました。\n(Done!)");
                        
                        // インポート後一旦一覧に戻る（追加画面にいる場合を考慮）
                        switchView('list');
                    }
                } else {
                    alert("不正なファイルです。(Invalid file.)");
                }
            } catch (err) {
                alert("読み込みエラー。(Parse error.)");
            }
        };
        reader.readAsText(file);
        e.target.value = ""; 
    });

    // 初期表示設定 (SPA)
    switchView('list');
});
