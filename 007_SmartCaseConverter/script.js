/**
 * Smart Case Converter JavaScript
 * 入力されたテキストを様々な形式に変換するロジックを記述します。
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------------------
    // 1. DOM要素の取得
    // -------------------------------------------------------------------------
    const inputText = document.getElementById('inputText');   // 入力エリア
    const outputText = document.getElementById('outputText'); // 出力エリア
    const charCount = document.querySelector('.char-count');  // 文字数表示
    const copyBtn = document.getElementById('copyBtn');       // コピーボタン
    const clearBtn = document.getElementById('clearBtn');     // クリアボタン
    const buttons = document.querySelectorAll('.btn-primary, .btn-secondary'); // 変換ボタン群

    // -------------------------------------------------------------------------
    // 2. 文字数カウント機能
    // -------------------------------------------------------------------------
    inputText.addEventListener('input', () => {
        const count = inputText.value.length;
        charCount.textContent = `${count} 文字`;
    });

    // -------------------------------------------------------------------------
    // 3. 変換ロジック
    // -------------------------------------------------------------------------
    
    // 単語の区切り文字（スペース、タブ、改行）でテキストを分割するヘルパー関数
    function splitWords(text) {
        // 前後の空白を削除し、空白文字の連続で分割
        return text.trim().split(/\s+/);
    }

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const text = inputText.value;
            // 未入力の場合は何もしない
            if (!text) return; 

            // ボタンの data-type 属性から変換タイプを取得
            const type = button.getAttribute('data-type');
            let result = '';

            switch (type) {
                // --- 文章用グループ ---
                case 'uppercase':
                    // 全て大文字
                    result = text.toUpperCase();
                    break;
                
                case 'lowercase':
                    // 全て小文字
                    result = text.toLowerCase();
                    break;

                case 'capitalize':
                    // 単語の先頭だけ大文字（例: hello world -> Hello World）
                    // 文章全体をそのまま扱うより、単語ごとに処理するのが自然ですが、
                    // 要件の「文章用」として、全ての単語の先頭を大文字にします。
                    result = text.replace(/\b\w/g, char => char.toUpperCase());
                    break;

                // --- プログラミング用グループ ---
                // プログラミング用は単語を連結するため、まず単語リストを作ります
                case 'camelCase':
                case 'snakeCase':
                case 'kebabCase':
                    const words = splitWords(text);
                    if (words.length === 0 || (words.length === 1 && words[0] === '')) {
                        result = '';
                        break;
                    }

                    if (type === 'camelCase') {
                        // camelCase: 最初の単語は小文字、以降の単語は先頭大文字
                        result = words.map((word, index) => {
                            word = word.toLowerCase();
                            if (index === 0) return word;
                            return word.charAt(0).toUpperCase() + word.slice(1);
                        }).join('');
                    } else if (type === 'snakeCase') {
                        // snake_case: 全て小文字にしてアンダースコアで連結
                        result = words.map(word => word.toLowerCase()).join('_');
                    } else if (type === 'kebabCase') {
                        // kebab-case: 全て小文字にしてハイフンで連結
                        result = words.map(word => word.toLowerCase()).join('-');
                    }
                    break;
            }

            // 結果を出力エリアに表示
            outputText.value = result;
        });
    });

    // -------------------------------------------------------------------------
    // 4. コピー機能
    // -------------------------------------------------------------------------
    copyBtn.addEventListener('click', () => {
        if (!outputText.value) return;

        navigator.clipboard.writeText(outputText.value)
            .then(() => {
                // コピー成功時の演出
                const originalText = copyBtn.querySelector('.btn-text').textContent;
                copyBtn.querySelector('.btn-text').textContent = 'コピーしました！';
                copyBtn.style.backgroundColor = '#2ecc71'; // 緑色に一時変更

                // 2秒後に元に戻す
                setTimeout(() => {
                    copyBtn.querySelector('.btn-text').textContent = originalText;
                    copyBtn.style.backgroundColor = ''; // CSSの指定色に戻る
                }, 2000);
            })
            .catch(err => {
                console.error('コピーに失敗しました', err);
                alert('コピーに失敗しました');
            });
    });

    // -------------------------------------------------------------------------
    // 5. クリア機能
    // -------------------------------------------------------------------------
    clearBtn.addEventListener('click', () => {
        // テキストエリアを空にする
        inputText.value = '';
        outputText.value = '';
        // 文字数カウントをリセット
        charCount.textContent = '0 文字';
    });
});
