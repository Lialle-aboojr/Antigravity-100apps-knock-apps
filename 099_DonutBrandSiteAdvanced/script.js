/**
 * 099 DonutBrandSite Advanced
 * 
 * Intersection Observer, 大きなHero Carousel表示, 
 * リッチなModal Window + Inner Navigation
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
    // 2. インタラクティブ無限カルーセル（大画面・ふわっふわ仕様）
    // ==========================================
    const carouselItems = document.querySelectorAll('.carousel-item');
    const nameEl = document.getElementById('carouselName');
    const descEl = document.getElementById('carouselDesc');
    const carouselTrack = document.querySelector('.carousel-track');

    // HTMLのdata属性からデータを抽出
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
            // セキュリティ対策（XSS防御）：textContentを利用して値をセット
            nameEl.textContent = donutData[currentIndex].name;
            descEl.textContent = donutData[currentIndex].nameJa;
            
            nameEl.classList.remove('fade-out');
            descEl.classList.remove('fade-out');
        }, 500); // 新しいCSSのアニメーション（長め）に合わせる
    }

    // カルーセル画像のクリック処理
    carouselItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            if (item.classList.contains('active')) {
                // 中央のアイテムをクリックしたらモーダルを開く
                openModal(index);
            } else {
                // それ以外はクリックで中央へ移動
                currentIndex = index;
                updateCarousel();
            }
        });
    });

    // 初期化
    updateCarousel();

    // スマホ向けスワイプ操作対応
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
    // 3. リッチなモーダルウィンドウとインナーナビ
    // ==========================================
    const modalOverlay = document.getElementById('detailModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalImage = document.getElementById('modalImage');
    const modalTitleEn = document.getElementById('modalTitleEn');
    const modalTitleJa = document.getElementById('modalTitleJa');
    const modalDescription = document.getElementById('modalDescription');
    const thumbnailList = document.getElementById('thumbnailList');
    const modalContent = document.querySelector('.modal-content');

    // モーダルを開く
    function openModal(dataIndex) {
        setModalContent(dataIndex, false);
        generateThumbnails(dataIndex);
        
        modalOverlay.classList.remove('hidden');
        setTimeout(() => {
            modalOverlay.classList.add('active');
        }, 10);
        
        document.body.style.overflow = 'hidden'; // 背景スクロール停止
    }

    // モーダルを閉じる
    function closeModal() {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            modalOverlay.classList.add('hidden');
            document.body.style.overflow = '';
        }, 500);
    }

    // モーダル内コンテンツを切り替える
    function setModalContent(index, useTransition = true) {
        const data = donutData[index];

        if (useTransition) {
            modalContent.classList.add('modal-transitioning');
            setTimeout(() => {
                // XSS対策としてDOMへ安全にセット
                modalImage.setAttribute('src', data.img);
                modalImage.setAttribute('alt', data.name);
                modalTitleEn.textContent = data.name;
                modalTitleJa.textContent = data.nameJa;
                modalDescription.textContent = data.desc;
                
                setTimeout(() => {
                    modalContent.classList.remove('modal-transitioning');
                }, 50);
            }, 400); 
        } else {
            modalImage.setAttribute('src', data.img);
            modalImage.setAttribute('alt', data.name);
            modalTitleEn.textContent = data.name;
            modalTitleJa.textContent = data.nameJa;
            modalDescription.textContent = data.desc;
        }
    }

    // サムネイル生成
    function generateThumbnails(activeIndex) {
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

            btn.addEventListener('click', () => {
                if (btn.classList.contains('is-active-thumb')) return;
                
                document.querySelectorAll('.thumb-btn').forEach(b => b.classList.remove('is-active-thumb'));
                btn.classList.add('is-active-thumb');
                
                setModalContent(index, true);
                
                currentIndex = index;
                updateCarousel();
            });

            thumbnailList.appendChild(btn);
        });
    }

    modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });
});
