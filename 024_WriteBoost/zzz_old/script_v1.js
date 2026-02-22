/**
 * WriteBoost - Main Logic
 * ユーザーの入力をリアルタイムで解析し、文字数・単語数・ランクを計算するスクリプト。
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM要素の取得
    const textInput = document.getElementById('textInput');
    const mainCountDisplay = document.getElementById('mainCount');
    const countLabelDisplay = document.getElementById('countLabel');
    const paperCard = document.getElementById('paperCard');
    const paperCountDisplay = document.getElementById('paperCount');
    
    // ランク関連のDOM要素
    const rankTitle = document.getElementById('rankTitle');
    const rankSubtitle = document.getElementById('rankSubtitle');
    const rankBadge = document.getElementById('rankBadge'); // 色を変える親要素があれば使うが今回はTitleの色を変える
    const nextRankMessage = document.getElementById('nextRankMessage');
    const progressBar = document.getElementById('progressBar');

    // ボタン
    const copyBtn = document.getElementById('copyBtn');
    const resetBtn = document.getElementById('resetBtn');

    // ランク定義
    // threshold: 次のランクに必要な数値ではなく、そのランクになるための最小値
    const RANKS = [
        { name: 'Newbie', ja: '新人', threshold: 0, color: '#8DB600' },       // 0 - 100
        { name: 'Writer', ja: '作家', threshold: 101, color: '#2779BD' },     // 101 - 500
        { name: 'Professional', ja: 'プロ', threshold: 501, color: '#6B4E71' }, // 501 - 2000
        { name: 'Great Master', ja: '大文豪', threshold: 2001, color: '#D4AF37' } // 2001+
    ];

    /**
     * 日本語が含まれているか判定する関数
     * ひらがな、カタカナ、漢字が含まれていれば日本語モードとみなす
     */
    function isJapanese(text) {
        // ひらがな: \u3040-\u309F, カタカナ: \u30A0-\u30FF, 漢字: \u4E00-\u9FAF
        const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
        return japaneseRegex.test(text);
    }

    /**
     * 文字数または単語数をカウントする関数
     */
    function countText(text) {
        if (!text) return { count: 0, isJa: true }; // 空の場合は0

        // 改行や前後の空白の扱い:
        // ここでは単純な文字数カウントとして、改行も1文字とみなすか、
        // あるいは純粋な「見える文字」だけにするか。
        // 一般的なエディタに合わせて「文字の長さ」をそのまま使いますが、
        // 英語のWord Countの場合は空白で区切ります。

        const isJa = isJapanese(text);

        if (isJa) {
            // 日本語モード: 単純な文字数 (空白は除外しないが、トリムはしない)
            // 実用性を考え、改行コードは1文字としてカウントされますが、
            // 厳密な執筆文字数としては、空白を除去する場合もあります。
            // ここでは要件の「文字数」に従い、lengthを返します。
            // ただし、見た目の空白だらけを防ぐなら trim() してもよいですが、
            // リアルタイム反映なので生の length を採用します。
            return { count: text.replace(/\n/g, '').length, isJa: true }; 
            // ※改行コードを除去してカウントするのが一般的な「文字数」に近い
        } else {
            // 英語モード: 単語数 (Words)
            // 空白(スペース、タブ、改行)で分割して、空文字以外をカウント
            const words = text.trim().split(/\s+/).filter(word => word.length > 0);
            return { count: words.length, isJa: false };
        }
    }

    /**
     * UIを更新するメイン関数
     */
    function updateUI() {
        const text = textInput.value;
        const result = countText(text);
        const count = result.count;
        const isJa = result.isJa;

        // 1. カウント表示の更新
        mainCountDisplay.textContent = count.toLocaleString();
        
        if (isJa) {
            countLabelDisplay.textContent = '文字数 / Characters';
            
            // 原稿用紙換算 (400文字 = 1枚)
            // 小数点第1位まで表示
            const pages = (count / 400).toFixed(1);
            paperCountDisplay.innerHTML = `${pages}<span class="unit"> 枚</span>`;
            paperCard.style.display = 'block'; // 表示
        } else {
            countLabelDisplay.textContent = '単語数 / Words';
            paperCard.style.display = 'none'; // 英語モードでは原稿用紙換算を隠す
        }

        // 2. ランクの更新
        updateRank(count);
    }

    /**
     * 現在の数値に基づいてランクとプログレスバーを更新する
     */
    function updateRank(count) {
        // 現在のランクを特定のロジックで決定
        // RANKS配列はthresholdの昇順で定義されている前提
        // 逆順に見て、countがthresholdを超えている最初のものを見つける
        let currentRankIndex = 0;
        
        for (let i = RANKS.length - 1; i >= 0; i--) {
            if (count >= RANKS[i].threshold) {
                currentRankIndex = i;
                break;
            }
        }

        const rank = RANKS[currentRankIndex];
        
        // ランク情報の表示更新
        rankTitle.textContent = rank.name;
        rankSubtitle.textContent = rank.ja;
        rankTitle.style.color = rank.color;

        // 次のランクまでの計算
        const nextRankIndex = currentRankIndex + 1;
        
        if (nextRankIndex < RANKS.length) {
            const nextRank = RANKS[nextRankIndex];
            const remaining = nextRank.threshold - count;
            const currentLevelStart = rank.threshold;
            const nextLevelStart = nextRank.threshold;
            
            // プログレスバーの進捗率＝(現在の値 - 現在のランクの開始値) / (次のランクの開始値 - 現在のランクの開始値)
            let progress = 0;
            if (nextLevelStart > currentLevelStart) {
                progress = ((count - currentLevelStart) / (nextLevelStart - currentLevelStart)) * 100;
            }
            
            // 100%を超えないように（念のため）
            progress = Math.min(Math.max(progress, 0), 100);

            nextRankMessage.textContent = `Next Rank: ${nextRank.name} まであと ${remaining}`;
            progressBar.style.width = `${progress}%`;
            progressBar.style.backgroundColor = rank.color; // 現在のランクの色でバーを表示
        } else {
            // 最高ランク到達時
            nextRankMessage.textContent = '最高ランク到達！素晴らしい！ (Max Rank Reached!)';
            progressBar.style.width = '100%';
            progressBar.style.backgroundColor = rank.color;
        }
    }

    /**
     * コピー機能
     */
    copyBtn.addEventListener('click', () => {
        const text = textInput.value;
        if (!text) return;

        navigator.clipboard.writeText(text).then(() => {
            // ボタンの見た目を一時的にフィードバック
            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span class="icon">✅</span> コピー完了!';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalText;
                copyBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
            alert('コピーに失敗しました。');
        });
    });

    /**
     * リセット機能
     */
    resetBtn.addEventListener('click', () => {
        if (textInput.value.length > 0) {
            if (confirm('入力内容をリセットしますか？ (Reset text?)')) {
                textInput.value = '';
                updateUI();
                textInput.focus();
            }
        }
    });

    // 文字入力時に即座に更新
    textInput.addEventListener('input', updateUI);

    // 初期化
    updateUI();
});
