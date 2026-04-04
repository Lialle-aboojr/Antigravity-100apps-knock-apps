// ファビコンのフォールバック処理（画像が生成前、または読み込めない場合は絵文字のSVGを表示）
document.addEventListener('DOMContentLoaded', () => {
    const favicon = document.getElementById('dynamic-favicon');
    const img = new Image();
    img.src = favicon.href;
    
    img.onerror = () => {
        // 読み込みエラー時は、医療のシンボルをSVGテキストにしてData URIに変換
        const emoji = "🏥"; // テーマに合わせた絵文字
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`;
        favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    };
});

// XSS対策：入力されたテキストを安全に画面表示するためのエスケープ関数
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, function(match) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        };
        return escapeMap[match];
    });
}

// フォーム内の主要要素を取得
const form = document.getElementById('medilog-form');
const submitBtn = document.getElementById('submit-btn');
const statusContainer = document.getElementById('status-container');
const loadingIndicator = document.getElementById('loading-indicator');
const loadingText = document.getElementById('loading-text');
const aiSummary = document.getElementById('ai-summary');
const aiSummaryText = document.getElementById('ai-summary-text');
const successMessage = document.getElementById('success-message');

// フォーム送信時のイベント処理
form.addEventListener('submit', function(e) {
    e.preventDefault(); // デフォルトの送信処理（画面遷移）をブロック

    // 入力値の取得（今回はモックなのでUI表示用のみ使用）
    const detailsVal = document.getElementById('details').value;
    
    // UIのリセット：元のフォームを隠し、ステータス表示エリアを準備
    form.classList.add('hidden');
    statusContainer.classList.remove('hidden');
    
    // 他の表示を一旦初期化して隠す
    loadingIndicator.classList.remove('hidden');
    aiSummary.classList.add('hidden');
    successMessage.classList.add('hidden');
    
    // もし「もう一度記録する」ボタンがあれば削除しておく
    const existingResetBtn = document.getElementById('reset-btn');
    if (existingResetBtn) existingResetBtn.remove();
    
    // 【ステップ1】AI分析中のローディング表示
    loadingText.innerHTML = 'AIが診察内容と添付ファイルを分析中...<br><span class="en-text">AI is analyzing...</span>';
    
    // 2秒後にダミーのAI要約を表示
    setTimeout(() => {
        // 安全に表示するため、エスケープ関数を通す
        const safeDetails = escapeHTML(detailsVal);
        // 入力値が長い場合は15文字でカットしてサマリーっぽくする
        const snippet = safeDetails.length > 15 ? safeDetails.substring(0, 15) + '...' : safeDetails;
        
        // 要約テキストのDOMを更新
        aiSummaryText.innerHTML = `<strong>【AI Summary】</strong><br>入力された症状と検査結果（${snippet || '未入力'}）から、順調な回復傾向が見られます。<br>次回は該当の数値に注意して医師に相談してください。`;
        
        // 要約をフワッと表示する
        aiSummary.classList.remove('hidden');

        // 【ステップ2】直後にローディングテキストをGoogle連携保存へ切り替え
        loadingText.innerHTML = 'Googleカレンダー・ドライブに保存中...<br><span class="en-text">Saving to Google...</span>';
        
        // さらに2秒後（全体で4秒後）、保存完了メッセージを表示
        setTimeout(() => {
            // ローディングを消す
            loadingIndicator.classList.add('hidden');
            // サクセスメッセージを表示
            successMessage.classList.remove('hidden');
            
            // 処理が完了したので、次回入力のためにフォームをリセット
            form.reset();
            
            // 下部に「もう一度記録する (フォームに戻る)」ためのボタンを生成して追加
            const resetBtn = document.createElement('button');
            resetBtn.id = 'reset-btn';
            resetBtn.className = 'submit-btn';
            resetBtn.style.marginTop = '20px';
            resetBtn.style.backgroundColor = 'var(--text-light)';
            resetBtn.style.boxShadow = 'none';
            resetBtn.textContent = '◀ 新しい記録を追加 (Add Another)';
            resetBtn.onclick = () => {
                // 初期状態に戻す
                statusContainer.classList.add('hidden');
                form.classList.remove('hidden');
            };
            statusContainer.appendChild(resetBtn);

        }, 2000);

    }, 2000); // 最初の2秒タイマー
});
