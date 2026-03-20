/**
 * 画面内に要素が入ってきたらアニメーション（フェードイン）を実行するスクリプト
 * 
 * Intersection Observer API を使用して、指定したクラスを持つ要素を監視します。
 * プログラミング未経験の方でも変更不要でそのまま動作するように書いています。
 */

document.addEventListener('DOMContentLoaded', () => {
    // 監視対象となるすべての '.fade-in' クラスを持つ要素を取得
    const fadeElements = document.querySelectorAll('.fade-in');

    // Observerのオプション設定
    // rootMargin: 要素が画面に入る少し手前から判定を開始するための設定（ここでは通常通り0px）
    // threshold: 要素がどれくらい画面に入ったらイベントを発火させるかの割合 (0.1 = 10%)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    // 要素が画面内に入ったときの処理を定義
    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            // 要素が画面内（ビューポート内）に入って交差したら
            if (entry.isIntersecting) {
                // 'is-visible' クラスを付与し、CSSのアニメーションを発動させる
                entry.target.classList.add('is-visible');
                
                // 一度表示されたら監視を終了する（毎回アニメーションさせないため）
                observer.unobserve(entry.target);
            }
        });
    };

    // 新しいIntersection Observerインスタンスを作成
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // 取得した各要素に対して監視を開始
    fadeElements.forEach(element => {
        observer.observe(element);
    });
});
