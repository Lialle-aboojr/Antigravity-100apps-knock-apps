/**
 * 100 Apps Knock Portfolio - Main Script
 * プログラミング未経験の方向けに、Vanilla JS (標準のJavaScript) で処理を構築しています。
 * 外部のREADME.mdを読み込みし、アプリの情報を抽出して画面にカードを自動生成します✨
 */

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------
  // 1. 各HTML要素（DOM）をJavaScriptで操作できるように取得します
  // --------------------------------------------------
  const themeToggleBtn = document.getElementById('theme-toggle');
  const searchInput = document.getElementById('search-input');
  const galleryGrid = document.getElementById('gallery-grid');
  const ringProgress = document.getElementById('ring-progress');
  const appCountEl = document.getElementById('app-count');

  // 取得したアプリデータを保存しておくための配列(リスト)
  let appDataList = [];

  // --------------------------------------------------
  // 2. ダークモード切替の設定 (Theme Toggle)
  // --------------------------------------------------
  // localStorage（ブラウザの保存領域）から最後に使ったテーマを取得。無ければ'dark'を初期設定にする。
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // ボタンをクリックした時の処理（ライト⇄ダークを入れ替えて保存する）
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // HTMLの属性を書き換えるとCSSが自動的に反応して色が変わります
    document.documentElement.setAttribute('data-theme', newTheme);
    // 次回開いた時のために保存しておく
    localStorage.setItem('theme', newTheme);
  });

  // --------------------------------------------------
  // 3. 進捗メーター (円形グラフ) のアニメーション更新
  // --------------------------------------------------
  // 何個アプリがあるかを受け取り、円のゲージを動かす関数
  function updateProgress(count) {
    const radius = ringProgress.r.baseVal.value; // 半径 (52)
    const circumference = radius * 2 * Math.PI; // 円周の長さ
    
    // 真ん中のテキストに数字をセット
    appCountEl.textContent = count;
    
    // 100個で1周(100%)にする計算。もし100を超えた場合は100で止める
    const percent = count > 100 ? 100 : count;
    const offset = circumference - (percent / 100) * circumference;
    
    // CSSのプロパティを変更して、アニメーションとして描画する
    ringProgress.style.strokeDashoffset = offset;
  }

  // --------------------------------------------------
  // 4. README.md ファイルを読み込んで情報を分解（解析）する
  // --------------------------------------------------
  async function fetchAndRenderApps() {
    try {
      // fetch関数: 指定したURLのデータを取得する。
      // 要件に基づき GitHub上の README.md を直接読み込む
      const response = await fetch('https://raw.githubusercontent.com/lialle-aboojr/Antigravity-100apps-knock-apps/main/README.md');
      
      if (!response.ok) {
        throw new Error('READMEファイルの取得に失敗しました');
      }

      // 文章として読み出す
      const markdownText = await response.text();
      
      // 改行('\n')ごとに一行ずつに切り分ける
      const lines = markdownText.split('\n');
      
      // 各行をチェックして、テーブル（表）の形式からデータを抜き出す
      lines.forEach(line => {
        // 例: 「| 001 | アプリ名 | [リンク](URL) |」
        // '|' という文字で区切って配列を作成します
        const cols = line.split('|').map(text => text.trim());
        
        // カラムがちゃんとある行 (マークダウンの表であること) を確認
        if (cols.length >= 4) {
          const rawNum = cols[1]; // 例: '001'
          
          // 番号欄が「1～3桁の数字のみ」で構成されているかを正規表現でチェックする
          if (/^\d{1,3}$/.test(rawNum)) {
            
            // アプリ名を取得。HTMLタグが含まれていれば削除する（XSS・HTMLインジェクション対策）
            const dirtyName = cols[2];
            // もし名前が "[名前](URL)" といったリンク形式だった場合、文字だけを抜き出す
            const nameMatch = dirtyName.match(/\[(.*?)\]/);
            const cleanName = nameMatch ? nameMatch[1] : dirtyName.replace(/<[^>]*>?/gm, '');
            
            // リンク(URL)を抽出する「 [](URL) 」形式の URL部分を取得
            const dirtyLink = cols[3];
            const linkMatch = dirtyLink.match(/\]\((.*?)\)/);
            let url = linkMatch ? linkMatch[1] : '';

            // ★重要(パス補正):
            // 2階層上のREADMEから取得した "../" や "./" リンクは基準が変わってしまうため修正する
            if (url.startsWith('./')) {
              // 例: ./001_App/index.html を ../../001_App/index.html に変換
              url = '../../' + url.substring(2);
            } else if (url && !url.startsWith('http') && !url.startsWith('../')) {
              url = '../../' + url;
            }

            // 情報が全て無事に取れていれば、登録用リストに追加する！
            if (rawNum && cleanName && url) {
              appDataList.push({
                number: rawNum.padStart(3, '0'), // 確実に001という3桁にする
                name: cleanName,
                url: url
              });
            }
          }
        }
      });

      // エラーなく取得できた場合は、画面にカードを作成して表示させる
      renderAppCards(appDataList);
      
      // ちょっとだけ遅らせてからアニメーションを呼ぶとカッコよく動きます
      setTimeout(() => {
        updateProgress(appDataList.length);
      }, 300);

    } catch (error) {
      // 取得失敗時 (Live Serverを使用していない時などに呼ばれます)
      console.error('Fetch Error:', error);
      galleryGrid.innerHTML = `
        <div class="loading-state">
          Error: README.mdが見つかりませんでした。ローカルサーバー(Live Serverなど)で実行するか、フォルダ構成を確認してください。<br>
          <span style="font-size:0.8rem; margin-top: 10px; display:inline-block">${error.message}</span>
        </div>
      `;
    }
  }

  // --------------------------------------------------
  // 5. アプリカード(HTML要素)を生成してブラウザ上に構築する
  // --------------------------------------------------
  function renderAppCards(apps) {
    // 既存の中身 (Loading文字など) を全部消す
    galleryGrid.innerHTML = '';

    apps.forEach(app => {
      // JSで <a> 要素を作る
      const card = document.createElement('a');
      card.className = 'app-card glass-panel'; // CSSクラスを付与
      card.href = app.url;
      card.target = '_blank'; // 新しいタブで開く
      card.rel = 'noopener noreferrer'; // セキュリティのおまじない

      // 番号用の要素を作る
      const numEl = document.createElement('div');
      numEl.className = 'app-number';
      // 🚨重要🚨: textContent を使うことで、変数の中に悪意のあるHTMLコードが
      // 混ざっていても、必ず「ただの文字列」として表示されます。これがXSS対策です！
      numEl.textContent = `#${app.number}`;

      // 名前用の要素を作る
      const nameEl = document.createElement('div');
      nameEl.className = 'app-name';
      nameEl.textContent = app.name; // ここも textContent のみ！

      // パーツをカード(<a>)の中に合体させる
      card.appendChild(numEl);
      card.appendChild(nameEl);

      // 完成したカードをギャラリー(画面)に追加する
      galleryGrid.appendChild(card);
    });
  }

  // --------------------------------------------------
  // 6. 検索機能: 入力に一致するカードだけを絞り込む
  // --------------------------------------------------
  searchInput.addEventListener('input', (event) => {
    // ユーザーが入力した文字を取得し、すべて小文字に統一(英字などでの検索漏れを防ぐ)
    const keyword = event.target.value.toLowerCase().trim();
    
    // 画面上にある全てのカード取得
    const cards = document.querySelectorAll('.app-card');

    cards.forEach(card => {
      // 各カードの中の文字(番号と名前)を取得し、小文字にする
      const cardText = card.textContent.toLowerCase();
      
      // 入力キーワードが含まれているか判定
      if (cardText.includes(keyword)) {
        // 合致していれば見せる
        card.classList.remove('hidden');
      } else {
        // 合致していなければ隠す
        card.classList.add('hidden');
      }
    });
  });

  // ========== メイン処理スタート ==========
  // ここまで準備してきた関数を呼び出してアプリを起動します
  fetchAndRenderApps();
});
