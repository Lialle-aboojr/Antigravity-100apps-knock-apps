/**
 * Smooth FAQ Accordion Script
 * 
 * 機能:
 * 1. アコーディオンの開閉コントロール（常に1つだけ開く）
 * 2. ダークモードの切り替え
 */

document.addEventListener('DOMContentLoaded', () => {
    // === アコーディオン機能 ===
    
    // 全ての質問ボタンを取得します
    const questions = document.querySelectorAll('.faq-question');

    questions.forEach((question) => {
        question.addEventListener('click', () => {
            // クリックされた質問に関連する回答エリアを取得
            // .nextElementSibling は、その要素の「次の要素」を指します（ここでは .faq-answer）
            const answer = question.nextElementSibling;
            
            // 現在のステータス（開いているかどうか）をチェック
            // 'aria-expanded'属性はアクセシビリティのためにも重要です
            const isExpanded = question.getAttribute('aria-expanded') === 'true';

            // --- 他の全ての質問を閉じる処理 ---
            questions.forEach((otherQuestion) => {
                // 自分自身でなければ、閉じる処理を行う
                if (otherQuestion !== question) {
                    otherQuestion.setAttribute('aria-expanded', 'false');
                    // 回答エリアの高さを0にして隠す
                    otherQuestion.nextElementSibling.style.maxHeight = null;
                }
            });

            // --- クリックされた質問の開閉切り替え ---
            if (isExpanded) {
                // すでに開いていた場合は閉じる
                question.setAttribute('aria-expanded', 'false');
                answer.style.maxHeight = null;
            } else {
                // 閉じていた場合は開く
                question.setAttribute('aria-expanded', 'true');
                
                // 【重要】アニメーションのために scrollHeight（内容の高さ）を設定する
                // これにより、中身の量に応じてぴったりの高さまで滑らかに伸びます
                answer.style.maxHeight = answer.scrollHeight + "px";
            }
        });
    });

    // === ダークモード切り替え機能 ===

    const themeToggle = document.getElementById('theme-toggle');
    
    // ユーザーのOSの設定がダークモードかどうかを確認
    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");

    // 初期設定：OSの設定に合わせてテーマを適用
    if (prefersDarkScheme.matches) {
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
    }

    // トグルボタンがクリックされた時の処理
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        
        // 現在が 'dark' なら 'light' に、そうでなければ 'dark' に切り替える
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // HTMLタグの属性を書き換えることで、CSSの変数が切り替わる
        document.documentElement.setAttribute('data-theme', newTheme);
    });
});
