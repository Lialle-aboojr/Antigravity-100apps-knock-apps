/**
 * Intersection Observer によるフェードインアニメーション
 * および
 * インタラクティブ無限カルーセル（Vanilla JS）
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // 1. スクロールフェードイン (Intersection Observer)
    // ==========================================
    const fadeElements = document.querySelectorAll('.fade-in');
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    fadeElements.forEach(element => observer.observe(element));

    // ==========================================
    // 2. インタラクティブ無限カルーセル
    // ==========================================
    const carouselItems = document.querySelectorAll('.carousel-item');
    const nameEl = document.getElementById('carouselName');
    const descEl = document.getElementById('carouselDesc');
    const carouselTrack = document.querySelector('.carousel-track');

    // ドーナツの情報（HTMLの5つの画像に対応）
    const donutData = [
        { name: "Pistachio Glaze", desc: "ピスタチオグレーズ" },
        { name: "Dark Chocolate", desc: "ダークチョコレートガナッシュ" },
        { name: "Raspberry Fill", desc: "ラズベリーフィル" },
        { name: "Matcha Cream", desc: "抹茶ホワイトクリーム" },
        { name: "Classic Honey", desc: "クラシックハニーディップ" }
    ];

    let currentIndex = 0;
    const totalItems = carouselItems.length;

    // カルーセルの状態を更新する関数
    function updateCarousel() {
        carouselItems.forEach((item, index) => {
            // 全クラスを一度リセット
            item.classList.remove('active', 'prev', 'next', 'hidden-left', 'hidden-right');

            // 現在のインデックスを基準にした相対位置を計算（0〜4の範囲内に収める）
            const pos = (index - currentIndex + totalItems) % totalItems;

            // 5枚の画像に対してそれぞれクラスを割り当てる
            if (pos === 0) {
                item.classList.add('active'); // 中央
            } else if (pos === 1) {
                item.classList.add('next');   // 右に見切れる
            } else if (pos === 2) {
                item.classList.add('hidden-right'); // 右の見えない位置
            } else if (pos === 3) {
                item.classList.add('hidden-left');  // 左の見えない位置
            } else if (pos === 4) {
                item.classList.add('prev');   // 左に見切れる
            }
        });

        // テキスト情報のフワッとした切り替え
        nameEl.classList.add('fade-out');
        descEl.classList.add('fade-out');
        
        setTimeout(() => {
            // CSSのトランジション中にテキストを書き換え
            nameEl.textContent = donutData[currentIndex].name;
            descEl.textContent = donutData[currentIndex].desc;
            
            // クラスを外して再表示
            nameEl.classList.remove('fade-out');
            descEl.classList.remove('fade-out');
        }, 400); // CSSの opacity トランジション時間に合わせる
    }

    // 各画像をクリックした時の処理（中央に移動させる）
    carouselItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            if (item.classList.contains('active')) return; // 中央の要素は操作しない
            currentIndex = index;
            updateCarousel();
        });
    });

    // 初期化：最初の状態を描画
    updateCarousel();

    // ==========================================
    // スマホ向けのスワイプ操作対応
    // ==========================================
    let touchStartX = 0;
    let touchEndX = 0;

    // イベントリスナーが複数登録されないように注意
    carouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        // 右から左へスワイプ（次へ）
        if (touchStartX - touchEndX > 50) {
            currentIndex = (currentIndex + 1) % totalItems;
            updateCarousel();
        }
        // 左から右へスワイプ（前へ）
        else if (touchEndX - touchStartX > 50) {
            currentIndex = (currentIndex - 1 + totalItems) % totalItems;
            updateCarousel();
        }
    }
});
