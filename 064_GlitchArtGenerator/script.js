/**
 * サイバー風グリッチメーカー メインスクリプト
 * 
 * セキュリティ：
 * - File APIを使用し、画像処理をブラウザ(ローカル)内で完結させます。
 * - これによりCanvas汚染（Tainted Canvas）を防ぎ、安全な画像ダウンロードを実現します。
 * - アップロードされたファイル形式を厳格にチェックします（XSS/不明なファイル実行の防止）。
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. 各種DOM要素の取得
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const workspace = document.getElementById('workspace');
    const canvas = document.getElementById('glitch-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true }); // パフォーマンス最適化のため追加

    // スライダーの取得
    const sliders = {
        rgbShift: document.getElementById('rgb-shift'),
        noise: document.getElementById('noise'),
        slice: document.getElementById('slice')
    };

    const resetBtn = document.getElementById('reset-btn');
    const changeImageBtn = document.getElementById('change-image-btn');
    const downloadBtn = document.getElementById('download-btn');

    // 2. 状態管理用の変数
    let originalImage = null;       // アップロードされた画像を保持するCanvas
    let originalImageData = null;   // ピクセルデータをキャッシュして高速化
    const MAX_DIMENSION = 1920;     // 処理負荷軽減のための最大ピクセルサイズ（フルHD想定）

    // ----------------------------------------------------
    // イベントリスナー設定
    // ----------------------------------------------------

    // ドラッグ＆ドロップ（ホバー時の見た目変更）
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault(); // デフォルトの動作（ファイルを開く等）をキャンセル
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    // ドロップされた時の処理
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // クリックでファイル選択ダイアログを開く
    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    // ファイルが選択された時の処理
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // スライダーが動かされた時にリアルタイムでグリッチを計算
    Object.values(sliders).forEach(slider => {
        slider.addEventListener('input', () => {
            if (originalImageData) applyGlitch();
        });
    });

    // リセットボタンの処理
    resetBtn.addEventListener('click', () => {
        Object.values(sliders).forEach(slider => slider.value = 0);
        if (originalImageData) applyGlitch();
    });

    // 画像変更ボタンの処理
    changeImageBtn.addEventListener('click', () => {
        // UIをワークスペースからアップロード画面に戻す
        workspace.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        
        // 状態のリセット
        fileInput.value = ''; // ファイル入力をリセット（同じ画像を再選択できるようにする）
        originalImage = null;
        originalImageData = null;
        ctx.clearRect(0, 0, canvas.width, canvas.height); // キャンバスのクリア
        Object.values(sliders).forEach(slider => slider.value = 0); // スライダーの値をリセット
    });

    // ダウンロードボタンの処理
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `glitch-art-${Date.now()}.png`; // 重複しないファイル名を生成
        link.href = canvas.toDataURL('image/png');      // 画像をBase64データ化して取得
        link.click();
    });

    // ----------------------------------------------------
    // コアロジック
    // ----------------------------------------------------

    /**
     * ファイルの読み込みとサニタイズ（形式確認）を行う関数
     * @param {File} file - 選択されたファイル
     */
    function handleFile(file) {
        // セキュリティ: 許可された画像形式のみ受け付ける
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            alert('対応していないファイル形式です。JPG, PNG, WEBPを利用してください。\nUnsupported file format.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            // 読み込んだデータを画像として初期化
            const img = new Image();
            img.onload = () => {
                initCanvas(img);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file); // ファイルをData URlとして読み込む
    }

    /**
     * Canvasのサイズ調整と初期描画を行う関数
     * @param {HTMLImageElement} img - メモリ上に生成した画像オブジェクト
     */
    function initCanvas(img) {
        // 画像サイズが大きすぎる場合、アスペクト比を維持して縮小（レスポンス確保）
        let width = img.width;
        let height = img.height;
        
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        // 加工の基準点として「何も変更されていない元の画像」を見えないCanvasに保持
        originalImage = document.createElement('canvas');
        originalImage.width = width;
        originalImage.height = height;
        const oCtx = originalImage.getContext('2d');
        oCtx.drawImage(img, 0, 0, width, height);
        
        // 元のピクセルデータをキャッシュして、毎回画像を再読込する負荷をゼロにする
        originalImageData = oCtx.getImageData(0, 0, width, height);

        // UIをアップロード画面からワークスペースに切り替え
        uploadArea.classList.add('hidden');
        workspace.classList.remove('hidden');

        // 各値を初期化して描画
        Object.values(sliders).forEach(slider => slider.value = 0);
        applyGlitch();
    }

    /**
     * グリッチエフェクトを適用するメイン関数
     * 各ピクセルのRGBA配列データを直接操作して、画面を破損させます。
     */
    function applyGlitch() {
        if (!originalImageData) return;

        const width = canvas.width;
        const height = canvas.height;
        
        // 処理の土台として、元のクリーンなピクセルデータをコピー（Uint8ClampedArray）
        const srcData = originalImageData.data;
        const outputImageData = new ImageData(
            new Uint8ClampedArray(srcData),
            width,
            height
        );
        const data = outputImageData.data;

        // スライダーの現在の値（0〜100）を取得
        const rgbShiftValue = parseInt(sliders.rgbShift.value, 10);
        const noiseValue = parseInt(sliders.noise.value, 10);
        const sliceValue = parseInt(sliders.slice.value, 10);

        // --- 1. スライス（ブロックずれ）エフェクト ---
        if (sliceValue > 0) {
            // ずれを発生させるブロックの数（最大25箇所）
            const sliceCount = Math.floor((sliceValue / 100) * 25); 
            // ブロックが横にズレる最大距離
            const maxShift = sliceValue * 3; 

            for (let i = 0; i < sliceCount; i++) {
                // ブロックの開始Y座標と高さをランダムに決定
                const y = Math.floor(Math.random() * height);
                const h = Math.floor(Math.random() * 30) + 5; 
                // X軸へのズレ幅 (-maxShift/2 〜 +maxShift/2)
                const shiftX = Math.floor((Math.random() - 0.5) * maxShift);

                for (let sy = y; sy < y + h; sy++) {
                    if (sy >= height) break;
                    
                    for (let x = 0; x < width; x++) {
                        const targetX = x + shiftX;
                        // ズレた先がCanvasの内側ならピクセルを上書き
                        if (targetX >= 0 && targetX < width) {
                            // ピクセルデータは [R, G, B, A] の1次元配列なので x4 する
                            const srcIndex = (sy * width + x) * 4;
                            const destIndex = (sy * width + targetX) * 4;
                            
                            data[destIndex] = srcData[srcIndex];         // R
                            data[destIndex + 1] = srcData[srcIndex + 1]; // G
                            data[destIndex + 2] = srcData[srcIndex + 2]; // B
                            // Alpha(不透明度)はそのまま
                        }
                    }
                }
            }
        }

        // --- 2. RGBズレ ＆ ノイズエフェクト ---
        // スライスを適用済みのデータを現在のベースとする
        const currentData = new Uint8ClampedArray(data);

        if (rgbShiftValue > 0 || noiseValue > 0) {
            // 最大で画像幅の8%ズレるように計算
            const shiftAmount = Math.floor((rgbShiftValue / 100) * (width * 0.08)); 
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const currentIndex = (y * width + x) * 4;
                    // 赤と青のチャンネルを別々の方向にズラすための参照インデックス
                    const rIndex = (y * width + Math.min(width - 1, x + shiftAmount)) * 4;
                    const bIndex = (y * width + Math.max(0, x - shiftAmount)) * 4;

                    // RGB Shift
                    if (rgbShiftValue > 0) {
                        data[currentIndex] = currentData[rIndex];             // 赤は右隣の色を持ってくる
                        data[currentIndex + 1] = currentData[currentIndex + 1]; // 緑はそのまま
                        data[currentIndex + 2] = currentData[bIndex + 2];     // 青は左隣の色を持ってくる
                    }

                    // Noise（砂嵐）
                    if (noiseValue > 0) {
                        // ランダムな値で色を増減させてノイズを表現
                        const noiseAmount = (noiseValue / 100) * 150; // 強度
                        const randomNoise = (Math.random() - 0.5) * noiseAmount;
                        
                        // 0〜255の範囲内に収めるよう Math.max/Math.min でガード
                        data[currentIndex] = Math.max(0, Math.min(255, data[currentIndex] + randomNoise));
                        data[currentIndex + 1] = Math.max(0, Math.min(255, data[currentIndex + 1] + randomNoise));
                        data[currentIndex + 2] = Math.max(0, Math.min(255, data[currentIndex + 2] + randomNoise));
                    }
                }
            }
        }

        // 組み立てた新しいピクセルデータをCanvasに描画
        ctx.putImageData(outputImageData, 0, 0);
    }
});
