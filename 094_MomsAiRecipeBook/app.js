/**
 * セキュリティのためのXSS対策（サニタイズ処理）
 * 悪意のあるスクリプト表示を防ぐために、特殊文字を安全な文字に変換します。
 */
function sanitizeHTML(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * データをローカルストレージに保存する関数
 */
const STORAGE_KEY = "moms_ai_recipe_book_data";
function saveRecipes(recipes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
}

/**
 * データをローカルストレージから読み込む関数
 */
function loadRecipes() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

/**
 * 画像をCanvasで縮小・圧縮してBase64文字列にする関数（LocalStorageの最大容量対策）
 * 未経験者にも分かりやすいよう、アップロードされた画像を自動でサイズ調整します。
 */
function compressImage(file, callback) {
    if (!file) {
        callback(null);
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // 最大幅と高さを400pxに設定（画質と容量のバランス）
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

            // HTMLにある非表示Canvasを使ってリサイズ
            const canvas = document.getElementById("image-canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            
            // キャンバスをクリアして黒背景を防ぐ
            ctx.clearRect(0, 0, width, height);

            // キャンバスに描画
            ctx.drawImage(img, 0, 0, width, height);
            
            // 品質0.7（70%）のJPEGとしてBase64出力
            const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
            callback(dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

/**
 * DOM（画面の各パーツ）の読み込みが完了したら実行する
 */
document.addEventListener("DOMContentLoaded", () => {
    
    // --- 必要なHTML要素を取得 ---
    const recipeForm = document.getElementById("recipe-form");
    const aiText = document.getElementById("ai-text");
    const autoFillBtn = document.getElementById("auto-fill-btn");
    const photoInput = document.getElementById("recipe-photo");
    const photoPreview = document.getElementById("photo-preview");
    const recipeGrid = document.getElementById("recipe-grid");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    
    // 検索・絞り込み関連
    const searchKeyword = document.getElementById("search-keyword");
    const filterGenre = document.getElementById("filter-genre");
    const sortOrder = document.getElementById("sort-order");

    let currentPhotoBase64 = null; // 現在編集中・追加中の画像データ

    // --- 1. AIレシピ一括流し込み（自動解析） ---
    autoFillBtn.addEventListener("click", () => {
        const text = aiText.value;
        if (!text.trim()) {
            alert("AIのテキストを入力してください。\n(Please enter AI text.)");
            return;
        }

        // シンプルな正規表現とキーワードで「材料」と「作り方」らしき部分を分割するロジック
        // ※AIの出力形式は揺らぐため「材料」「作り方」や「Ingredients」「Steps」などの文字列を探す
        
        let ingredientsText = "";
        let stepsText = "";
        let titleText = "";

        // タイトルらしきものを1行目から抽出
        const lines = text.split('\n');
        if (lines.length > 0) {
            // # や ** などのマークダウン装飾を外す
            titleText = lines[0].replace(/[#*]/g, "").trim();
        }

        // ざっくりと「作り方」または「手順」または「Steps」以降を分離
        const stepSplit = text.split(/作り方|手順|ステップ|作り方の手順|Steps|Instructions/i);
        if (stepSplit.length > 1) {
            // 前半に「材料」を含む部分がある可能性が高い
            const ingredientSplit = stepSplit[0].split(/材料|用意するもの|Ingredients/i);
            ingredientsText = ingredientSplit.length > 1 ? ingredientSplit[1] : ingredientSplit[0];
            stepsText = stepSplit[1];
        } else {
            // 上手く分かれなかった場合は全体を作り方に投げる
            stepsText = text;
        }

        // クリーンアップ
        ingredientsText = ingredientsText.replace(/[:：-]/g, "").trim();
        stepsText = stepsText.replace(/[:：-]/g, "").trim();

        // フォームにセット
        document.getElementById("recipe-title").value = titleText;
        document.getElementById("recipe-ingredients").value = ingredientsText;
        document.getElementById("recipe-steps").value = stepsText;
        
        alert("自動入力が完了しました。必要に応じて修正してください。\n(Auto-filled. Please adjust if needed.)");
    });

    // --- 2. 写真プレビュー機能 ---
    photoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            // 本格的な登録前にプレビュー用として画像を圧縮
            compressImage(file, (base64) => {
                currentPhotoBase64 = base64;
                photoPreview.src = base64;
                photoPreview.classList.remove("hidden");
            });
        }
    });

    // --- 3. フォームの送信（保存・更新） ---
    recipeForm.addEventListener("submit", (e) => {
        e.preventDefault(); // 画面遷移を防ぐ
        
        const title = document.getElementById("recipe-title").value;
        const genre = document.getElementById("recipe-genre").value;
        const ingredients = document.getElementById("recipe-ingredients").value;
        const steps = document.getElementById("recipe-steps").value;
        const rating = document.getElementById("recipe-rating").value;
        const comments = document.getElementById("recipe-comments").value;
        const editId = document.getElementById("edit-id").value;

        const recipes = loadRecipes();

        if (editId) {
            // 更新（Update）
            const index = recipes.findIndex(r => r.id === editId);
            if (index > -1) {
                recipes[index] = {
                    ...recipes[index], // 古いデータ（作った回数など）を維持
                    title,
                    genre,
                    ingredients,
                    steps,
                    rating,
                    comments,
                    // 新しい画像があれば上書き、なければ既存を維持
                    photo: currentPhotoBase64 || recipes[index].photo, 
                    updatedAt: new Date().toISOString()
                };
                alert("レシピを更新しました！\n(Recipe updated!)");
            }
        } else {
            // 新規作成（Create）
            const newRecipe = {
                id: "recipe_" + Date.now(),
                title,
                genre,
                ingredients,
                steps,
                rating,
                comments,
                photo: currentPhotoBase64,
                cookCount: 1, // 作った回数の初期値（登録=1回とみなす）
                createdAt: new Date().toISOString()
            };
            recipes.push(newRecipe);
            alert("新しいレシピを保存しました！\n(New recipe saved!)");
        }

        saveRecipes(recipes);
        resetForm();
        renderRecipes();
    });

    // --- 4. フォームのリセット ---
    function resetForm() {
        recipeForm.reset();
        document.getElementById("edit-id").value = "";
        currentPhotoBase64 = null;
        photoPreview.src = "";
        photoPreview.classList.add("hidden");
        cancelEditBtn.classList.add("hidden");
        document.getElementById("save-btn").textContent = "保存 (Save)";
    }

    cancelEditBtn.addEventListener("click", resetForm);

    // --- 5. レシピの表示・検索・並べ替え処理 ---
    function renderRecipes() {
        let recipes = loadRecipes();
        const kw = searchKeyword.value.toLowerCase();
        const gen = filterGenre.value;
        const sort = sortOrder.value;

        // 絞り込み (Filter)
        recipes = recipes.filter(r => {
            const matchKw = r.title.toLowerCase().includes(kw) || r.ingredients.toLowerCase().includes(kw);
            const matchGen = gen === "all" || r.genre === gen;
            return matchKw && matchGen;
        });

        // 並べ替え (Sort)
        recipes.sort((a, b) => {
            if (sort === "count") {
                return (b.cookCount || 0) - (a.cookCount || 0); // 作った回数が多い順
            } else if (sort === "rating") {
                return Number(b.rating) - Number(a.rating); // 星が多い順
            } else {
                return new Date(b.createdAt) - new Date(a.createdAt); // 新着順
            }
        });

        // HTMLを構築して表示 (XSS対策で sanitizeHTML を経由させる)
        recipeGrid.innerHTML = "";
        if (recipes.length === 0) {
            recipeGrid.innerHTML = "<p>レシピが見つかりません。(No recipes found.)</p>";
            return;
        }

        recipes.forEach(r => {
            const card = document.createElement("div");
            card.className = "recipe-card";

            // 画像の表示処理
            const imgHtml = r.photo 
                ? `<img src="${r.photo}" class="card-img" alt="Recipe Photo">`
                : `<div class="card-img-placeholder">🍲</div>`;
            
            // 星マークの生成
            const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);

            // 日付のフォーマット
            const dateStr = new Date(r.createdAt).toLocaleDateString();

            card.innerHTML = `
                ${imgHtml}
                <div class="card-content">
                    <div class="card-meta">
                        <span>🏷️ ${sanitizeHTML(r.genre)}</span>
                        <span>📅 ${dateStr}</span>
                    </div>
                    <h3 class="card-title">${sanitizeHTML(r.title)}</h3>
                    <div class="card-rating">${stars}</div>
                    
                    <div class="card-stats">
                        🍽️ 作った回数 (Cooked): <strong>${r.cookCount || 0}</strong> 回
                    </div>

                    <div class="card-text"><strong>材料:</strong>\n${sanitizeHTML(r.ingredients).substring(0, 50)}...</div>
                    <div class="card-text" style="color:#d85c1f;"><strong>コメント:</strong> ${sanitizeHTML(r.comments || "なし")}</div>
                </div>
                <div class="card-actions">
                    <button class="btn btn-primary btn-sm" onclick="appContext.cookMore('${r.id}')">+ 作った！</button>
                    <button class="btn btn-outline btn-sm" onclick="appContext.editRecipe('${r.id}')">編集</button>
                    <button class="btn btn-outline btn-sm" onclick="appContext.deleteRecipe('${r.id}')">削除</button>
                </div>
            `;
            recipeGrid.appendChild(card);
        });
    }

    // イベントの発火
    searchKeyword.addEventListener("input", renderRecipes);
    filterGenre.addEventListener("change", renderRecipes);
    sortOrder.addEventListener("change", renderRecipes);

    // --- 6. 個別のアクション（編集・削除・作った回数カウントアップ） ---
    // HTMLのonclickから呼び出せるよう、window直下に露出させます
    window.appContext = {
        deleteRecipe: (id) => {
            if(confirm("本当にこのレシピを削除しますか？\n(Are you sure to delete?)")) {
                let recipes = loadRecipes();
                recipes = recipes.filter(r => r.id !== id);
                saveRecipes(recipes);
                renderRecipes();
            }
        },
        editRecipe: (id) => {
            const recipes = loadRecipes();
            const r = recipes.find(rec => rec.id === id);
            if(r) {
                // フォームにセット
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
                } else {
                    currentPhotoBase64 = null;
                    photoPreview.classList.add("hidden");
                }

                document.getElementById("save-btn").textContent = "更新 (Update)";
                cancelEditBtn.classList.remove("hidden");

                // スクロールで上部へ
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },
        cookMore: (id) => {
            const recipes = loadRecipes();
            const index = recipes.findIndex(r => r.id === id);
            if(index > -1) {
                recipes[index].cookCount = (recipes[index].cookCount || 0) + 1;
                // 作った日付を新たに追加していく配列を持たせても良いが、今回は要件の「追加するたびに回数カウントアップ」を実現
                saveRecipes(recipes);
                renderRecipes();
            }
        }
    };

    // --- 7. インポート / エクスポート機能 ---
    document.getElementById("export-btn").addEventListener("click", () => {
        const recipes = loadRecipes();
        const dataStr = JSON.stringify(recipes, null, 2);
        // Blobでファイルを作成してダウンロード
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
                    if(confirm("現在のデータを上書き（追加）しますか？\n(Import and overwrite data?)")) {
                        saveRecipes(importedData);
                        renderRecipes();
                        alert("インポートが完了しました。\n(Import completed!)");
                    }
                } else {
                    alert("不正なファイル形式です。\n(Invalid file format.)");
                }
            } catch (err) {
                alert("ファイルの読み込みに失敗しました。\n(Failed to parse JSON.)");
            }
        };
        reader.readAsText(file);
        e.target.value = ""; // リセット
    });

    // 初期表示
    renderRecipes();
});
