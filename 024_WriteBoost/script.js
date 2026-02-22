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
    const paperLabelDisplay = document.getElementById('paperLabel'); // ラベル切り替え用
    const paperCountDisplay = document.getElementById('paperCount');

    // ランク関連のDOM要素
    const rankTitle = document.getElementById('rankTitle');
    const rankSubtitle = document.getElementById('rankSubtitle');
    const nextRankMessage = document.getElementById('nextRankMessage');
    const rankBasis = document.getElementById('rankBasis'); // 判定基準表示用
    const progressBar = document.getElementById('progressBar');

    // ボタン
    const copyBtn = document.getElementById('copyBtn');
    const resetBtn = document.getElementById('resetBtn');

    // ランク定義 (日本語/文字数ベース)
    const RANKS_JA = [
        { name: 'Newbie', ja: '新人', threshold: 0, color: '#8DB600' },       // 0 - 99
        { name: 'Writer', ja: '作家', threshold: 100, color: '#2779BD' },     // 100 - 499
        { name: 'Professional', ja: 'プロ', threshold: 500, color: '#6B4E71' }, // 500 - 1999
        { name: 'Great Master', ja: '大文豪', threshold: 2000, color: '#D4AF37' } // 2000+
    ];

    // ランク定義 (英語/単語数ベース)
    const RANKS_EN = [
        { name: 'Newbie', ja: '新人', threshold: 0, color: '#8DB600' },       // 0 - 49
        { name: 'Writer', ja: '作家', threshold: 50, color: '#2779BD' },      // 50 - 249
        { name: 'Professional', ja: 'プロ', threshold: 250, color: '#6B4E71' }, // 250 - 999
        { name: 'Great Master', ja: '大文豪', threshold: 1000, color: '#D4AF37' } // 1000+
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
        if (!text) return { count: 0, isJa: true }; // 空の場合はデフォルトで日本語扱いとする（ランク0なので影響なし）

        const isJa = isJapanese(text);

        if (isJa) {
            // 日本語モード: 文字数 (Character Count)
            // 改行のみを除去して文字数をカウント
            return { count: text.replace(/\n/g, '').length, isJa: true };
        } else {
            // 英語モード: 単語数 (Word Count)
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

        // 判定基準と換算表示の更新
        if (isJa) {
            // 日本語モード設定
            countLabelDisplay.textContent = '文字数 / Characters';
            rankBasis.textContent = '(判定基準: 文字数)';

            // 原稿用紙換算 (400文字 = 1枚)
            const sheets = (count / 400).toFixed(1);

            paperLabelDisplay.textContent = '原稿用紙換算 / Manuscript Sheets';
            paperCountDisplay.innerHTML = `${sheets}<span class="unit"> 枚</span>`;

        } else {
            // 英語モード設定
            countLabelDisplay.textContent = '単語数 / Words';
            rankBasis.textContent = '(Rank Basis: Word Count)';

            // ページ換算 (250語 = 1ページ)
            const pages = (count / 250).toFixed(1);

            paperLabelDisplay.textContent = 'ページ換算 / Page Count';
            paperCountDisplay.innerHTML = `${pages}<span class="unit"> pages</span>`;
        }

        // カードは常に表示（内容は動的に切り替わる）
        paperCard.style.display = 'block';

        // 2. ランクの更新 (言語情報も含めて渡す)
        updateRank(count, isJa);
    }

    /**
     * 現在の数値と言語に基づいてランクとプログレスバーを更新する
     */
    function updateRank(count, isJa) {
        // 使用するランク定義を選択
        const RANK_SYSTEM = isJa ? RANKS_JA : RANKS_EN;

        // 現在のランクを決定
        let currentRankIndex = 0;

        for (let i = RANK_SYSTEM.length - 1; i >= 0; i--) {
            if (count >= RANK_SYSTEM[i].threshold) {
                currentRankIndex = i;
                break;
            }
        }

        const rank = RANK_SYSTEM[currentRankIndex];

        // ランク情報の表示更新
        rankTitle.textContent = rank.name;
        rankSubtitle.textContent = rank.ja;
        rankTitle.style.color = rank.color;

        // 次のランクまでの計算
        const nextRankIndex = currentRankIndex + 1;

        if (nextRankIndex < RANK_SYSTEM.length) {
            const nextRank = RANK_SYSTEM[nextRankIndex];
            const remaining = nextRank.threshold - count;
            const currentLevelStart = rank.threshold;
            const nextLevelStart = nextRank.threshold;

            // プログレスバーの進捗率
            let progress = 0;
            if (nextLevelStart > currentLevelStart) {
                progress = ((count - currentLevelStart) / (nextLevelStart - currentLevelStart)) * 100;
            }

            // 0-100%の範囲に収める
            progress = Math.min(Math.max(progress, 0), 100);

            let remainingMsg = '';
            if (isJa) {
                remainingMsg = `次のランクまで: あと ${remaining} 文字`;
            } else {
                remainingMsg = `Next Rank: ${remaining} words to go`;
            }
            nextRankMessage.textContent = remainingMsg;

            progressBar.style.width = `${progress}%`;
            progressBar.style.backgroundColor = rank.color;
        } else {
            // 最高ランク到達時
            if (isJa) {
                nextRankMessage.textContent = '最高ランク到達！';
            } else {
                nextRankMessage.textContent = 'Max Rank Reached!';
            }
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
