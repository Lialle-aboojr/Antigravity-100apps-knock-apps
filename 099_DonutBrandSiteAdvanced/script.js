/**
 * 099 DonutBrandSite Advanced
 * 
 * Intersection Observer, Hero Carousel, Rich Modal with Inner Navigation
 * 全てをVanilla JSで実装。XSS対策として textContent を徹底。
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
    // 2. 大画面インタラクティブ・カルーセル
    // ==========================================
    const carouselItems = document.querySelectorAll('.carousel-item');
    const nameEl = document.getElementById('carouselName');
    const descEl = document.getElementById('carouselDesc');
    const carouselTrack = document.querySelector('.carousel-track');

    // DOMからデータを抽出して配列化
    const donutData = Array.from(carouselItems).map(item => ({
        index: parseInt(item.getAttribute('data-index')),
        name: item.getAttribute('data-name'),
        nameJa: item.getAttribute('data-name-ja'),
        desc: item.getAttribute('data-desc'),
        img: item.getAttribute('data-img')
    }));

    let currentIndex = 0;
    const totalItems = carouselItems.length;

    // カルーセルの状態を更新
    function updateCarousel() {
        carouselItems.forEach((item, index) => {
            item.classList.remove('active', 'prev', 'next', 'hidden-left', 'hidden-right');

            const pos = (index - currentIndex + totalItems) % totalItems;

            if (pos === 0) {
                item.classList.add('active'); // 中央
            } else if (pos === 1) {
                item.classList.add('next');   // 右
            } else if (pos === 2) {
                item.classList.add('hidden-right'); 
            } else if (pos === 3) {
                item.classList.add('hidden-left');  
            } else if (pos === 4) {
                item.classList.add('prev');   // 左
            }
        });

        // テキスト情報のフワッとした切り替え
        nameEl.classList.add('fade-out');
        descEl.classList.add('fade-out');
        
        setTimeout(() => {
            // 安全な textContent で書き換え (XSS対策)
            nameEl.textContent = donutData[currentIndex].name;
            descEl.textContent = donutData[currentIndex].nameJa;
            
            nameEl.classList.remove('fade-out');
            descEl.classList.remove('fade-out');
        }, 400); // CSSの opacity トランジション時間と合わせる
    }

    // カルーセル画像のクリック処理
    carouselItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            if (item.classList.contains('active')) {
                // 中央のアイテムをクリックしたらモーダルを開く
                openModal(index);
            } else {
                // それ以外は中央へ移動
                currentIndex = index;
                updateCarousel();
            }
        });
    });

    // 初期化
    updateCarousel();

    // スワイプ操作対応
    let touchStartX = 0;
    let touchEndX = 0;

    carouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        if (touchStartX - touchEndX > 50) {
            currentIndex = (currentIndex + 1) % totalItems;
            updateCarousel();
        } else if (touchEndX - touchStartX > 50) {
            currentIndex = (currentIndex - 1 + totalItems) % totalItems;
            updateCarousel();
        }
    }

    // ==========================================
    // 3. リッチなモーダルウィンドウ処理
    // ==========================================
    const modalOverlay = document.getElementById('detailModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalImage = document.getElementById('modalImage');
    const modalTitleEn = document.getElementById('modalTitleEn');
    const modalTitleJa = document.getElementById('modalTitleJa');
    const modalDescription = document.getElementById('modalDescription');
    const thumbnailList = document.getElementById('thumbnailList');
    const modalContent = document.querySelector('.modal-content'); // トランジション用

    // モーダルを開く関数
    function openModal(dataIndex) {
        // コンテンツをセット
        setModalContent(dataIndex, false);
        // サムネイルを生成
        generateThumbnails(dataIndex);
        
        // モーダル表示
        modalOverlay.classList.remove('hidden');
        // 少し遅延させないと opacity のトランジションが効かないため
        setTimeout(() => {
            modalOverlay.classList.add('active');
        }, 10);
        
        // 背景のスクロールを止める
        document.body.style.overflow = 'hidden';
    }

    // モーダルを閉じる関数
    function closeModal() {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            modalOverlay.classList.add('hidden');
            document.body.style.overflow = ''; // スクロール復活
        }, 500); // 0.5s transition
    }

    // モーダル内のコンテンツをセットする（transition付）
    function setModalContent(index, useTransition = true) {
        const data = donutData[index];

        if (useTransition) {
            // ふわっと切り替えるためのクラスを追加
            modalContent.classList.add('modal-transitioning');
            
            setTimeout(() => {
                // 安全な textContent および setAttribute を使用（XSS対策）
                modalImage.setAttribute('src', data.img);
                modalImage.setAttribute('alt', data.name);
                modalTitleEn.textContent = data.name;
                modalTitleJa.textContent = data.nameJa;
                modalDescription.textContent = data.desc;
                
                // 少し待ってから表示クラスを外してフェードイン
                setTimeout(() => {
                    modalContent.classList.remove('modal-transitioning');
                }, 50);
            }, 400); // CSSの opacity 時間(0.4s)に合わせる
        } else {
            // 初回表示時は直接セット
            modalImage.setAttribute('src', data.img);
            modalImage.setAttribute('alt', data.name);
            modalTitleEn.textContent = data.name;
            modalTitleJa.textContent = data.nameJa;
            modalDescription.textContent = data.desc;
        }
    }

    // モーダル内のサムネイル（インナーナビゲーション）を生成
    function generateThumbnails(activeIndex) {
        // 初期化
        thumbnailList.innerHTML = '';
        
        donutData.forEach((data, index) => {
            const btn = document.createElement('button');
            btn.className = 'thumb-btn';
            btn.setAttribute('aria-label', `View ${data.name}`);
            
            if (index === activeIndex) {
                btn.classList.add('is-active-thumb');
            }

            const img = document.createElement('img');
            img.setAttribute('src', data.img);
            img.setAttribute('alt', `Thumbnail of ${data.name}`);
            
            btn.appendChild(img);

            // サムネイルクリック時の処理
            btn.addEventListener('click', () => {
                if (btn.classList.contains('is-active-thumb')) return;
                
                // アクティブ状態の更新
                document.querySelectorAll('.thumb-btn').forEach(b => b.classList.remove('is-active-thumb'));
                btn.classList.add('is-active-thumb');
                
                // メインコンテンツ切り替え
                setModalContent(index, true);
                
                // 裏のカルーセル自体も連動させておく
                currentIndex = index;
                updateCarousel();
            });

            thumbnailList.appendChild(btn);
        });
    }

    // モーダル閉じるイベント
    modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        // オーバーレイ部分（背景）をクリックした場合のみ閉じる
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    // ESCキーでも閉じられるようにする（アクセシビリティ）
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });
});
