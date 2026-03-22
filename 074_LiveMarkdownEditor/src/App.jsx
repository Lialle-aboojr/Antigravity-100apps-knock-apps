// ============================================
// App.jsx - Live Markdown Editorのメインコンポーネント
// ============================================

// Reactの機能をインポート
import { useState, useMemo, useCallback } from 'react';

// Markdownパーサーライブラリをインポート
// Markdown記法のテキストをHTMLに変換するために使用
import { marked } from 'marked';

// XSS（クロスサイトスクリプティング）攻撃を防ぐサニタイズライブラリをインポート
// HTMLの中の危険なタグ（<script>など）を除去する
import DOMPurify from 'dompurify';

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
  gfm: true,    // GitHub風Markdownを有効化（テーブル、取り消し線など）
  breaks: true, // 改行を<br>に変換
});

// ============================================
// App コンポーネント（メイン）
// ============================================
function App() {
  // ------------------------------------------
  // Markdownテキストの状態管理（useState）
  // 初期値としてサンプルテキストを設定
  // ------------------------------------------
  const [markdownText, setMarkdownText] = useState(SAMPLE_MARKDOWN);

  // ------------------------------------------
  // テキストエリアの変更ハンドラー
  // useCallbackで関数をメモ化（不要な再生成を防止）
  // ------------------------------------------
  const handleTextChange = useCallback((e) => {
    setMarkdownText(e.target.value);
  }, []);

  // ------------------------------------------
  // MarkdownをHTMLに変換（useMemoで最適化）
  // markdownTextが変更された時だけ再計算される
  // ------------------------------------------
  const sanitizedHtml = useMemo(() => {
    // ステップ1: markedでMarkdownをHTMLに変換
    const rawHtml = marked.parse(markdownText);
    // ステップ2: DOMPurifyでXSS攻撃を防ぐためにサニタイズ
    // <script>タグなど危険なHTMLを除去してから返す
    return DOMPurify.sanitize(rawHtml);
  }, [markdownText]);

  // テキストの文字数と行数を計算（フッター表示用）
  const charCount = markdownText.length;
  const lineCount = markdownText.split('\n').length;

  // ------------------------------------------
  // JSXによるUI描画
  // ------------------------------------------
  return (
    <>
      {/* ===== ヘッダー ===== */}
      <header className="app-header">
        <div className="app-header__title-group">
          {/* アプリアイコン */}
          <div className="app-header__icon">#</div>
          {/* タイトルとサブタイトル */}
          <div>
            <div className="app-header__title">Live Markdown Editor</div>
            <div className="app-header__subtitle">
              リアルタイム Markdown プレビュー / Real-time Preview
            </div>
          </div>
        </div>
      </header>

      {/* ===== メインエディタ領域（左右分割） ===== */}
      <main className="editor-container">
        {/* ----- 左パネル: Markdown入力 ----- */}
        <div className="panel editor-panel">
          {/* パネルヘッダー */}
          <div className="panel__header">
            <span className="panel__header-icon">✏️</span>
            <span>入力 / Editor</span>
            <span className="panel__header-label-sub">Markdown</span>
          </div>
          {/* テキスト入力エリア */}
          <textarea
            id="markdown-input"
            className="editor-panel__textarea"
            value={markdownText}
            onChange={handleTextChange}
            placeholder="Markdownを入力してください... / Type your Markdown here..."
            spellCheck={false}
            aria-label="Markdown入力エリア"
          />
        </div>

        {/* ----- 右パネル: HTMLプレビュー ----- */}
        <div className="panel preview-panel">
          {/* パネルヘッダー */}
          <div className="panel__header">
            <span className="panel__header-icon">👁️</span>
            <span>プレビュー / Preview</span>
            <span className="panel__header-label-sub">HTML</span>
          </div>
          {/* プレビュー表示エリア */}
          {markdownText.trim() ? (
            // Markdownテキストがある場合: HTMLをレンダリング
            // dangerouslySetInnerHTML を使用するが、DOMPurifyでサニタイズ済みなので安全
            <div
              id="markdown-preview"
              className="preview-panel__content markdown-body"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          ) : (
            // テキストが空の場合: プレースホルダーを表示
            <div className="preview-panel__content">
              <div className="preview-placeholder">
                <div className="preview-placeholder__icon">📝</div>
                <div>左側にMarkdownを入力すると、ここにプレビューが表示されます</div>
                <div>Start typing Markdown on the left to see the preview here</div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ===== フッター ===== */}
      <footer className="app-footer">
        <div className="app-footer__info">
          <span>{charCount.toLocaleString()} 文字 / characters</span>
          <span>{lineCount.toLocaleString()} 行 / lines</span>
        </div>
        <div className="app-footer__info">
          <span className="app-footer__badge app-footer__badge--security">
            🛡️ XSS Protected
          </span>
          <span className="app-footer__badge">⚡ React + Vite</span>
        </div>
      </footer>
    </>
  );
}

// Appコンポーネントをエクスポート（main.jsxから読み込まれる）
export default App;
