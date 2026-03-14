/**
 * 404 Error Page Maker - Main Script
 * リアルタイムプレビュー機能と、HTML/CSSコード生成・コピー機能を提供します。
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM要素の取得 ---
    
    // 入力要素（テキスト）
    const inputHeading = document.getElementById('inputHeading');
    const inputMessage = document.getElementById('inputMessage');
    const inputBtnText = document.getElementById('inputBtnText');
    const selectIcon = document.getElementById('selectIcon');
    
    // 入力要素（カラー）
    const colorBg = document.getElementById('colorBg');
    const colorText = document.getElementById('colorText');
    const colorAccent = document.getElementById('colorAccent');
    
    // カラーの hex 値表示用ラベル
    const valColorBg = document.getElementById('valColorBg');
    const valColorText = document.getElementById('valColorText');
    const valColorAccent = document.getElementById('valColorAccent');
    
    // プレビュー表示用のコンテナ（ここにスタイルを適用）
    const previewContainer = document.getElementById('previewContainer');
    // プレビュー表示用の中身（テキストとアイコン）
    const prvIcon = document.getElementById('prvIcon');
    const prvHeading = document.getElementById('prvHeading');
    const prvMessage = document.getElementById('prvMessage');
    const prvBtn = document.getElementById('prvBtn');
    
    // コード出力・コピー用要素
    const generatedCodeDisplay = document.getElementById('generatedCodeDisplay');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const copySuccessMsg = document.getElementById('copySuccessMsg');

    
    // --- 2. XSS対策（入力値のサニタイズ） ---
    // ユーザーの入力テキストをHTMLに埋め込む前にエスケープ処理を行う関数
    function escapeHTML(str) {
        if (!str) return '';
        return str.replace(/[&<>'"]/g, function(tag) {
            const charsToReplace = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            };
            return charsToReplace[tag] || tag;
        });
    }

    // --- 3. リアルタイム・プレビューの更新処理 ---
    function updatePreview() {
        // 現在の入力値を取得してサニタイズ
        const heading = escapeHTML(inputHeading.value || '404');
        const message = escapeHTML(inputMessage.value || 'Oops!');
        const btnText = escapeHTML(inputBtnText.value || 'Home');
        const icon = selectIcon.value;
        const bg = colorBg.value;
        const text = colorText.value;
        const accent = colorAccent.value;

        // カラーコードのラベル表示を更新
        valColorBg.textContent = bg;
        valColorText.textContent = text;
        valColorAccent.textContent = accent;

        // 【1】プレビューDOMのテキストを更新（HTMLエスケープ済みなので innerHTML または textContent に安全に適用可）
        prvIcon.textContent = icon;
        // <br>などを含めたい場合は innerHTML(ただしサニタイズされた文字列)として扱う
        prvHeading.innerHTML = heading;
        prvMessage.innerHTML = message;
        prvBtn.innerHTML = btnText;

        // 【2】プレビューDOMのスタイルを直接変更（背景・文字色・アクセント色）
        // アプリケーション内のコンテナに対するスタイル適用
        previewContainer.style.backgroundColor = bg;
        previewContainer.style.color = text;
        
        prvIcon.style.fontSize = '80px';
        prvIcon.style.marginBottom = '20px';
        prvIcon.style.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))';
        
        prvHeading.style.fontSize = '8rem';
        prvHeading.style.fontWeight = '900';
        prvHeading.style.lineHeight = '1';
        prvHeading.style.margin = '0 0 10px 0';
        prvHeading.style.color = text;
        
        prvMessage.style.fontSize = '1.25rem';
        prvMessage.style.marginBottom = '40px';
        prvMessage.style.opacity = '0.8';
        
        // ボタンのスタイル
        prvBtn.style.display = 'inline-block';
        prvBtn.style.padding = '14px 32px';
        prvBtn.style.backgroundColor = accent;
        prvBtn.style.color = '#ffffff';
        prvBtn.style.textDecoration = 'none';
        prvBtn.style.borderRadius = '50px'; // pill shape
        prvBtn.style.fontWeight = 'bold';
        prvBtn.style.fontSize = '1.1rem';
        prvBtn.style.transition = 'transform 0.2s, box-shadow 0.2s';
        prvBtn.style.boxShadow = `0 4px 14px ${accent}66`; // 発光エフェクト

        // Flex中央揃えのレイアウト（コンテナ内の子要素 .preview-content 用）
        const prvContent = document.getElementById('previewBox');
        prvContent.style.textAlign = 'center';
        prvContent.style.display = 'flex';
        prvContent.style.flexDirection = 'column';
        prvContent.style.alignItems = 'center';
        prvContent.style.justifyContent = 'center';
        prvContent.style.padding = '40px';

        // 生成されるコードを再生成する
        generateCode(heading, message, btnText, icon, bg, text, accent);
    }

    // --- 4. 完全なHTML/CSSコードの生成 ---
    // ここで生成された文字列が、ユーザーがコピーする最終成果物となります。
    function generateCode(heading, message, btnText, icon, bg, text, accent) {
        const fullHTML = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${heading} - Page Not Found</title>
    <style>
        /* 
         * Generated by 404 Error Page Maker (Antigravity)
         * このままコピーしてサーバーに配置すれば動作します
         */
        
        :root {
            --bg-color: ${bg};
            --text-color: ${text};
            --accent-color: ${accent};
            /* 読みやすいデフォルトフォント */
            --font-family: 'Helvetica Neue', Arial, 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif;
        }

        body {
            margin: 0;
            padding: 0;
            width: 100vw;
            height: 100vh;
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: var(--font-family);
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            overflow: hidden;
        }

        .error-container {
            padding: 40px 20px;
            max-width: 600px;
            animation: fadeIn 0.8s ease-out;
        }

        .icon {
            font-size: 100px;
            margin-bottom: 20px;
            line-height: 1;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.15));
            animation: float 3s ease-in-out infinite;
        }

        .heading {
            font-size: 8rem;
            font-weight: 900;
            margin: 0 0 10px 0;
            line-height: 1;
            letter-spacing: -2px;
        }

        .message {
            font-size: 1.2rem;
            opacity: 0.8;
            margin-bottom: 40px;
            line-height: 1.6;
        }

        .home-btn {
            display: inline-block;
            padding: 16px 40px;
            background-color: var(--accent-color);
            color: #ffffff;
            text-decoration: none;
            border-radius: 50px;
            font-weight: bold;
            font-size: 1.1rem;
            transition: all 0.2s ease;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }

        .home-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px var(--accent-color);
            opacity: 0.95;
        }

        /* アニメーション定義 */
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0); }
        }

        /* レスポンシブ対応 */
        @media (max-width: 600px) {
            .heading { font-size: 6rem; }
            .icon { font-size: 80px; }
            .message { font-size: 1rem; }
        }
    </style>
</head>
<body>
    <div class="error-container">
        <div class="icon">${icon}</div>
        <h1 class="heading">${heading}</h1>
        <p class="message">${message}</p>
        <a href="/" class="home-btn">${btnText}</a>
    </div>
</body>
</html>`;

        // 表示エリアにエスケープして表示（プレタグ内でHTMLとして解釈されないようにする）
        generatedCodeDisplay.textContent = fullHTML;
    }

    // --- 5. クリップボードへコピーする処理 ---
    copyCodeBtn.addEventListener('click', async () => {
        const codeText = generatedCodeDisplay.textContent;
        try {
            await navigator.clipboard.writeText(codeText);
            // 成功メッセージの表示
            copySuccessMsg.style.display = 'block';
            setTimeout(() => {
                copySuccessMsg.style.display = 'none';
            }, 3000);
        } catch (err) {
            alert('コピーに失敗しました。ブラウザの権限を確認してください。/ Failed to copy. ' + err);
        }
    });

    // --- 6. イベントリスナーの登録 ---
    // 全ての入力要素（テキスト・セレクト・カラー）の変更時にプレビューを更新する
    const inputs = [inputHeading, inputMessage, inputBtnText, selectIcon, colorBg, colorText, colorAccent];
    inputs.forEach(input => {
        // キー入力をリアルタイムで取得するため 'input' イベントを使用
        input.addEventListener('input', updatePreview);
    });

    // 初期化時の描画
    updatePreview();

});
