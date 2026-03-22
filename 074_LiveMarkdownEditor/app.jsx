// ============================================
// Live Markdown Editor - Reactアプリケーション
// React CDN版 + marked + DOMPurify
// ============================================

// グローバルからReact関連の関数を取得
const { useState, useMemo, useCallback } = React;

// ============================================
// 初期サンプルMarkdownテキスト
// 初めて使う人がMarkdown記法を理解できるようにサンプルを用意
// ============================================
const SAMPLE_MARKDOWN = `# Welcome to Live Markdown Editor! 🎉
# ようこそ！ライブMarkdownエディタへ！

このエディタでは、**Markdown記法**をリアルタイムでプレビューできます。
左側に入力すると、右側に即座にHTMLとして表示されます。

---

## 見出し / Headings

\`#\` の数で見出しレベルを変えられます：

# H1 見出し
## H2 見出し
### H3 見出し
#### H4 見出し

---

## テキスト装飾 / Text Formatting

- **太字（ボールド）**: \`**テキスト**\`
- *斜体（イタリック）*: \`*テキスト*\`
- ~~取り消し線~~: \`~~テキスト~~\`
- \`インラインコード\`: バッククォートで囲む

---

## リスト / Lists

### 箇条書きリスト（Unordered）
- Reactでステート管理
- markedでMarkdown変換
- DOMPurifyでXSS対策

### 番号付きリスト（Ordered）
1. Markdownを入力する
2. リアルタイムでプレビュー確認
3. 完成！🚀

---

## 引用文 / Blockquote

> "シンプルであることは、
> 究極の洗練である。"
> — レオナルド・ダ・ヴィンチ

---

## コードブロック / Code Block

\`\`\`javascript
// JavaScriptの例
function greet(name) {
  return \`Hello, \${name}! 👋\`;
}

console.log(greet("World"));
\`\`\`

---

## テーブル / Table

| 機能 / Feature | 説明 / Description |
|---|---|
| リアルタイムプレビュー | 入力と同時にHTMLを描画 |
| XSS対策 | DOMPurifyでサニタイズ |
| レスポンシブ | PC: 左右 / スマホ: 上下 |

---

## リンク / Link

[GitHub](https://github.com) - 世界最大のコードホスティングサービス

---

✏️ **左側のテキストを自由に編集してみてください！**
✏️ **Try editing the text on the left side!**
`;

// ============================================
// markedの設定
// GitHub Flavored Markdown (GFM) を有効化
// ============================================
marked.setOptions({
    gfm: true,        // GitHub風Markdownを有効化
    breaks: true,      // 改行を<br>に変換
});

// ============================================
// App コンポーネント（メイン）
// ============================================
function App() {
    // Markdownテキストの状態管理
    // 初期値としてサンプルテキストを設定
    const [markdownText, setMarkdownText] = useState(SAMPLE_MARKDOWN);

    // テキストエリアの変更ハンドラー
    // ユーザーが入力するたびにStateを更新
    const handleTextChange = useCallback((e) => {
        setMarkdownText(e.target.value);
    }, []);

    // MarkdownをHTMLに変換（メモ化で最適化）
    // markdownTextが変更された時だけ再計算される
    const sanitizedHtml = useMemo(() => {
        // markedでMarkdownをHTMLに変換
        const rawHtml = marked.parse(markdownText);
        // DOMPurifyでXSS攻撃を防ぐためにサニタイズ
        // <script>タグなど危険なHTMLを除去
        return DOMPurify.sanitize(rawHtml);
    }, [markdownText]);

    // テキストの文字数と行数を計算（フッター表示用）
    const charCount = markdownText.length;
    const lineCount = markdownText.split('\n').length;

    return (
        React.createElement(React.Fragment, null,
            // ===== ヘッダー =====
            React.createElement('header', { className: 'app-header' },
                React.createElement('div', { className: 'app-header__title-group' },
                    // アイコン
                    React.createElement('div', { className: 'app-header__icon' }, '#'),
                    // タイトルテキスト
                    React.createElement('div', null,
                        React.createElement('div', { className: 'app-header__title' },
                            'Live Markdown Editor'
                        ),
                        React.createElement('div', { className: 'app-header__subtitle' },
                            'リアルタイム Markdown プレビュー / Real-time Preview'
                        )
                    )
                )
            ),

            // ===== メインエディタ領域 =====
            React.createElement('main', { className: 'editor-container' },

                // ----- 左パネル: Markdown入力 -----
                React.createElement('div', { className: 'panel editor-panel' },
                    // パネルヘッダー
                    React.createElement('div', { className: 'panel__header' },
                        React.createElement('span', { className: 'panel__header-icon' }, '✏️'),
                        React.createElement('span', null, '入力 / Editor'),
                        React.createElement('span', { className: 'panel__header-label-sub' }, 'Markdown')
                    ),
                    // テキストエリア
                    React.createElement('textarea', {
                        id: 'markdown-input',
                        className: 'editor-panel__textarea',
                        value: markdownText,
                        onChange: handleTextChange,
                        placeholder: 'Markdownを入力してください... / Type your Markdown here...',
                        spellCheck: false,
                        'aria-label': 'Markdown入力エリア'
                    })
                ),

                // ----- 右パネル: プレビュー -----
                React.createElement('div', { className: 'panel preview-panel' },
                    // パネルヘッダー
                    React.createElement('div', { className: 'panel__header' },
                        React.createElement('span', { className: 'panel__header-icon' }, '👁️'),
                        React.createElement('span', null, 'プレビュー / Preview'),
                        React.createElement('span', { className: 'panel__header-label-sub' }, 'HTML')
                    ),
                    // プレビュー表示エリア
                    // dangerouslySetInnerHTML を使用するが、DOMPurifyでサニタイズ済みなので安全
                    markdownText.trim()
                        ? React.createElement('div', {
                            id: 'markdown-preview',
                            className: 'preview-panel__content markdown-body',
                            dangerouslySetInnerHTML: { __html: sanitizedHtml }
                        })
                        : React.createElement('div', { className: 'preview-panel__content' },
                            React.createElement('div', { className: 'preview-placeholder' },
                                React.createElement('div', { className: 'preview-placeholder__icon' }, '📝'),
                                React.createElement('div', null,
                                    '左側にMarkdownを入力すると、ここにプレビューが表示されます'
                                ),
                                React.createElement('div', null,
                                    'Start typing Markdown on the left to see the preview here'
                                )
                            )
                        )
                )
            ),

            // ===== フッター =====
            React.createElement('footer', { className: 'app-footer' },
                React.createElement('div', { className: 'app-footer__info' },
                    React.createElement('span', null,
                        charCount.toLocaleString() + ' 文字 / characters'
                    ),
                    React.createElement('span', null,
                        lineCount.toLocaleString() + ' 行 / lines'
                    )
                ),
                React.createElement('div', { className: 'app-footer__info' },
                    React.createElement('span', { className: 'app-footer__badge app-footer__badge--security' },
                        '🛡️ XSS Protected'
                    ),
                    React.createElement('span', { className: 'app-footer__badge' },
                        '⚡ React 18'
                    )
                )
            )
        )
    );
}

// ============================================
// ReactアプリケーションをDOMにマウント
// ============================================
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(React.createElement(App));
