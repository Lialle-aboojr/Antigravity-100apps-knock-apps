/**
 * Custom Slider Studio
 * メインロジック / Main Logic
 * 
 * このファイルは以下の役割を担います：
 * 1. UI状態の管理（画像リスト、各種設定値）
 * 2. プレビュースライダーのリアルタイム描画
 * 3. エクスポート用コードの生成
 */

// 初期設定 / Initial Configuration
const config = {
    images: [
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=80',
        'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80',
        'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80'
    ],
    speed: 3.0,
    borderRadius: 0,
    animation: 'slide', // 'slide' or 'fade'
    showNav: true,
    showDots: true,
    autoPlay: true
};

// DOM要素の取得 / DOM Elements
const elements = {
    imageUrlInput: document.getElementById('image-url-input'),
    addImageBtn: document.getElementById('add-image-btn'),
    imageList: document.getElementById('image-list'),
    speedRange: document.getElementById('speed-range'),
    speedValue: document.getElementById('speed-value'),
    radiusRange: document.getElementById('radius-range'),
    radiusValue: document.getElementById('radius-value'),
    animRadios: document.getElementsByName('anim-type'),
    navToggle: document.getElementById('nav-toggle'),
    dotsToggle: document.getElementById('dots-toggle'),
    autoplayToggle: document.getElementById('autoplay-toggle'),
    generateBtn: document.getElementById('generate-btn'),
    previewContainer: document.getElementById('slider-preview-container'),
    codeModal: document.getElementById('code-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    codeOutput: document.getElementById('code-output'),
    copyCodeBtn: document.getElementById('copy-code-btn')
};

// 現在のスライダーインスタンス（プレビュー用）
let previewSlider = null;

// ==========================================
// 1. イベントリスナーの設定 / Event Listeners
// ==========================================

function init() {
    renderImageList();
    updatePreview();

    // 画像追加 / Add Image
    elements.addImageBtn.addEventListener('click', () => {
        const url = elements.imageUrlInput.value.trim();
        if (url) {
            config.images.push(url);
            elements.imageUrlInput.value = '';
            renderImageList();
            updatePreview();
        }
    });

    // スピード変更 / Speed Change
    elements.speedRange.addEventListener('input', (e) => {
        config.speed = parseFloat(e.target.value);
        elements.speedValue.textContent = config.speed.toFixed(1) + 's';
        updatePreview();
    });

    // 角丸変更 / Border Radius Change
    elements.radiusRange.addEventListener('input', (e) => {
        config.borderRadius = parseInt(e.target.value);
        elements.radiusValue.textContent = config.borderRadius + 'px';
        updatePreview(); // スタイル更新のみで良いが簡易化のため再生成
    });

    // アニメーション変更 / Animation Change
    elements.animRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                config.animation = e.target.value;
                updatePreview();
            }
        });
    });

    // トグルスイッチ / Toggles
    elements.navToggle.addEventListener('change', (e) => {
        config.showNav = e.target.checked;
        updatePreview();
    });

    elements.dotsToggle.addEventListener('change', (e) => {
        config.showDots = e.target.checked;
        updatePreview();
    });

    elements.autoplayToggle.addEventListener('change', (e) => {
        config.autoPlay = e.target.checked;
        updatePreview();
    });

    // コード生成 / Generate Code
    elements.generateBtn.addEventListener('click', openCodeModal);

    // モーダル操作 / Modal Controls
    elements.closeModalBtn.addEventListener('click', () => {
        elements.codeModal.classList.add('hidden');
    });

    elements.copyCodeBtn.addEventListener('click', () => {
        elements.codeOutput.select();
        document.execCommand('copy');
        elements.copyCodeBtn.textContent = 'コピーしました！ / Copied!';
        setTimeout(() => {
            elements.copyCodeBtn.textContent = 'コピーする / Copy to Clipboard';
        }, 2000);
    });
}

// ==========================================
// 2. UI更新処理 / UI Updates
// ==========================================

function renderImageList() {
    elements.imageList.innerHTML = '';
    config.images.forEach((url, index) => {
        const li = document.createElement('li');
        li.className = 'image-item';
        li.innerHTML = `
            <div style="display:flex; align-items:center; overflow:hidden;">
                <img src="${url}" alt="thumb">
                <span class="image-url" title="${url}">${url}</span>
            </div>
            <button class="delete-btn" onclick="removeImage(${index})">&times;</button>
        `;
        elements.imageList.appendChild(li);
    });
}

// グローバル関数として公開（HTMLから呼ぶため）
window.removeImage = function(index) {
    if (config.images.length <= 1) {
        alert("画像は最低1枚必要です。 / You need at least one image.");
        return;
    }
    config.images.splice(index, 1);
    renderImageList();
    updatePreview();
};

// ==========================================
// 3. プレビュー & スライダー生成ロジック / slider Logic
// ==========================================

// スライダーを再生成してプレビューエリアに描画
function updatePreview() {
    // コンテナをクリア
    elements.previewContainer.innerHTML = '';
    
    // スライダーのHTML構造を作成
    const sliderHTML = generateSliderHTML(false); // false = インラインスタイル用ではない
    elements.previewContainer.innerHTML = sliderHTML;
    
    // スライダーのCSSを適用（プレビュー用）
    applyPreviewStyles();

    // スライダーの動作を開始
    startSlider('#slider-preview-container .css-slider', config);
}

// プレビュー用のスタイル適用
function applyPreviewStyles() {
    const slider = elements.previewContainer.querySelector('.css-slider');
    if (!slider) return;
    
    slider.style.borderRadius = config.borderRadius + 'px';
    // スライドかフェードかによってクラスを切り替えるCSSロジックはスクリプトで制御
}


// ==========================================
// 4. コード生成と出力 / Code Generation
// ==========================================

/**
 * ユーザーに提供する最終的なコードを生成します。
 * HTML / CSS / JS をすべてひとまとめにします。
 */
function generateCode() {
    const uniqueId = 'slider-' + Math.random().toString(36).substr(2, 9);
    
    const htmlPart = `
<!-- Custom Slider Start -->
<div id="${uniqueId}" class="css-slider-container">
    <div class="css-slider-wrapper">
${config.images.map((url, i) => `        <div class="css-slide ${i===0?'active':''}"><img src="${url}" alt="Slide ${i+1}"></div>`).join('\n')}
    </div>
    ${config.showNav ? `
    <button class="css-prev">❮</button>
    <button class="css-next">❯</button>` : ''}
    ${config.showDots ? `
    <div class="css-dots">
${config.images.map((_, i) => `        <span class="css-dot ${i===0?'active':''}" data-index="${i}"></span>`).join('\n')}
    </div>` : ''}
</div>
<!-- Custom Slider End -->`;

const cssPart = `
<style>
    /* Slider Styles */
    #${uniqueId} {
        position: relative;
        width: 100%;
        max-width: 800px; /* 必要に応じて変更 / Adjust as needed */
        margin: 0 auto;
        overflow: hidden;
        border-radius: ${config.borderRadius}px;
        aspect-ratio: 16/9;
        background: #eee;
    }

    #${uniqueId} .css-slider-wrapper {
        position: relative;
        width: 100%;
        height: 100%;
    }

    #${uniqueId} .css-slide {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        transition: opacity ${config.animation === 'fade' ? '1s' : '0.5s'} ease-in-out, transform 0.5s ease-in-out;
        ${config.animation === 'slide' ? 'transform: translateX(100%);' : ''}
        display: none; /* slideの初期配置用JSで上書きされます */
    }
    
    /* Active Slide State */
    #${uniqueId} .css-slide.active {
        opacity: 1;
        ${config.animation === 'slide' ? 'transform: translateX(0);' : ''}
        display: block;
        z-index: 2;
    }

    /* Previous Slide (for slide animation) */
    #${uniqueId} .css-slide.prev {
        ${config.animation === 'slide' ? 'transform: translateX(-100%); display: block; z-index: 1;' : ''}
    }
    
    #${uniqueId} .css-slide.next {
        ${config.animation === 'slide' ? 'transform: translateX(100%); display: block; z-index: 1;' : ''}
    }

    #${uniqueId} .css-slide img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    /* Navigation Arrows */
    #${uniqueId} .css-prev, #${uniqueId} .css-next {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background-color: rgba(0,0,0,0.5);
        color: white;
        border: none;
        padding: 10px 15px;
        cursor: pointer;
        font-size: 18px;
        border-radius: 5px;
        user-select: none;
        z-index: 10;
        transition: background 0.3s;
    }
    
    #${uniqueId} .css-prev:hover, #${uniqueId} .css-next:hover {
        background-color: rgba(0,0,0,0.8);
    }

    #${uniqueId} .css-prev { left: 10px; }
    #${uniqueId} .css-next { right: 10px; }

    /* Dots */
    #${uniqueId} .css-dots {
        position: absolute;
        bottom: 15px;
        width: 100%;
        text-align: center;
        z-index: 10;
    }

    #${uniqueId} .css-dot {
        cursor: pointer;
        height: 10px;
        width: 10px;
        margin: 0 4px;
        background-color: rgba(255,255,255,0.5);
        border-radius: 50%;
        display: inline-block;
        transition: background-color 0.3s;
    }

    #${uniqueId} .css-dot.active {
        background-color: white;
        transform: scale(1.2);
    }
</style>`;

const jsPart = `
<script>
(function() {
    const container = document.getElementById('${uniqueId}');
    const slides = container.querySelectorAll('.css-slide');
    const dots = container.querySelectorAll('.css-dot');
    const prevBtn = container.querySelector('.css-prev');
    const nextBtn = container.querySelector('.css-next');
    
    let currentIndex = 0;
    const speed = ${config.speed * 1000};
    const isFade = ${config.animation === 'fade'};
    const autoPlay = ${config.autoPlay};
    let timer;

    // スライドの初期化 / Init Slides
    function showSlide(index) {
        if (index >= slides.length) index = 0;
        if (index < 0) index = slides.length - 1;
        
        // クラスのリセット
        slides.forEach(slide => {
            slide.classList.remove('active', 'prev', 'next');
            if (!isFade) slide.style.display = 'none'; 
        });
        
        if (dots.length) {
            dots.forEach(dot => dot.classList.remove('active'));
            dots[index].classList.add('active');
        }

        // Slide Animation Logic
        if (!isFade) {
            // 現在のスライド
            slides[index].style.display = 'block';
            slides[index].classList.add('active');
            
            // 重要: 直前の位置状態などはCSS transitionに任せる簡易実装
            // 実際にはもっと複雑な前後管理が必要ですが、
            // 今回は "active" クラスの切り替えによるCSS Transitionで
            // フェードまたはスライドを実現します。
            // *スライドアニメーションを厳密に行うには、前後の要素を配置する必要がありますが、
            // 初心者向けコードの簡潔さを優先し、今回はCSSのactive切り替えを基本とします。
            // (CSS側で active に translateX(0) を当てています)
        } else {
            // Fade Animation
            slides[index].classList.add('active');
        }

        currentIndex = index;
    }

    function nextSlide() {
        showSlide(currentIndex + 1);
    }

    function prevSlide() {
        showSlide(currentIndex - 1);
    }

    // イベントリスナー / Event Listeners
    if (nextBtn) nextBtn.addEventListener('click', () => {
        resetTimer();
        nextSlide();
    });

    if (prevBtn) prevBtn.addEventListener('click', () => {
        resetTimer();
        prevSlide();
    });

    if (dots.length) {
        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                resetTimer();
                const idx = parseInt(e.target.dataset.index);
                showSlide(idx);
            });
        });
    }

    // 自動再生 / Auto Play
    function startTimer() {
        if (autoPlay) {
            timer = setInterval(nextSlide, speed);
        }
    }

    function resetTimer() {
        if (autoPlay) {
            clearInterval(timer);
            startTimer();
        }
    }

    // 初期表示 / Initial Display
    showSlide(0);
    startTimer();
})();
</script>`;

    return htmlPart + "\n" + cssPart + "\n" + jsPart;
}

// モーダルを開いてコードを表示
function openCodeModal() {
    const code = generateCode();
    elements.codeOutput.value = code;
    elements.codeModal.classList.remove('hidden');
}


// ==========================================
// 5. 内部プレビュー用ヘルパー (HTML生成のコピー版)
// ==========================================
// 本来は共通化すべきですが、プレビューと生成コードで少し構造を変える可能性があるため分けます。
// ここでは簡略化のため、generateCodeと同等のHTMLをコンテナに流し込み、
// ブラウザ内でそのままスクリプトを動かすのではなく、動的に関数を実行します。

function generateSliderHTML() {
    // プレビュー用HTML構造
    let html = `
    <div class="css-slider" style="position:relative; width:100%; height:100%; overflow:hidden;">
        <div class="slides-inner" style="width:100%; height:100%; position:relative;">
    `;
    
    config.images.forEach((url, i) => {
        // activeクラスやスタイルはJSで制御
        html += `<div class="slide-item" style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover;">
            <img src="${url}" style="width:100%; height:100%; object-fit:cover;">
        </div>`;
    });
    
    html += `</div>`; // .slides-inner

    if (config.showNav) {
        html += `
            <button class="p-prev" style="position:absolute; top:50%; left:10px; transform:translateY(-50%); z-index:10; background:rgba(0,0,0,0.5); color:white; border:none; padding:10px; cursor:pointer; border-radius:4px;">❮</button>
            <button class="p-next" style="position:absolute; top:50%; right:10px; transform:translateY(-50%); z-index:10; background:rgba(0,0,0,0.5); color:white; border:none; padding:10px; cursor:pointer; border-radius:4px;">❯</button>
        `;
    }

    if (config.showDots) {
        html += `<div class="p-dots" style="position:absolute; bottom:15px; width:100%; text-align:center; z-index:10;">`;
        config.images.forEach((_, i) => {
            html += `<span class="p-dot" data-index="${i}" style="display:inline-block; width:10px; height:10px; background:rgba(255,255,255,0.5); margin:0 4px; border-radius:50%; cursor:pointer;"></span>`;
        });
        html += `</div>`;
    }

    html += `</div>`; // .css-slider
    return html;
}

// プレビュー上のスライダーを動かすロジック
// (生成されるコードのロジックと似ていますが、DOM要素を直接操作します)
let previewInterval;

function startSlider(selector, cfg) {
    if (previewInterval) clearInterval(previewInterval);
    
    const container = document.querySelector(selector);
    if (!container) return;

    const slides = container.querySelectorAll('.slide-item');
    const dots = container.querySelectorAll('.p-dot');
    const prevBtn = container.querySelector('.p-prev');
    const nextBtn = container.querySelector('.p-next');

    let idx = 0;
    const isFade = cfg.animation === 'fade';

    // スタイル初期化
    slides.forEach((s, i) => {
        s.style.transition = `opacity ${isFade?1:0.5}s ease, transform 0.5s ease`;
        if (i === 0) {
            s.style.opacity = '1';
            s.style.zIndex = '2';
            s.style.transform = 'translateX(0)';
        } else {
            s.style.opacity = isFade ? '0' : '1'; // スライドの場合はopacityは常に1でもよいが、簡易実装のため
            s.style.zIndex = '1';
            s.style.transform = isFade ? 'translateX(0)' : 'translateX(100%)';
            if(!isFade) s.style.display = 'none'; // 重なり防止
        }
    });

    if(dots.length > 0) dots[0].style.backgroundColor = 'white';

    function go(toIndex) {
        if (toIndex >= slides.length) toIndex = 0;
        if (toIndex < 0) toIndex = slides.length - 1;

        // ドット更新
        if (dots.length) {
            dots.forEach(d => d.style.backgroundColor = 'rgba(255,255,255,0.5)');
            dots[toIndex].style.backgroundColor = 'white';
        }

        // アニメーション実行
        if (isFade) {
            slides.forEach((s, i) => {
                if (i === toIndex) {
                    s.style.opacity = '1';
                    s.style.zIndex = '2';
                } else {
                    s.style.opacity = '0';
                    s.style.zIndex = '1';
                }
            });
        } else {
            // シンプルスライド実装 (生成コード側と合わせる)
            slides.forEach(s => {
                s.style.display = 'none';
                s.style.transform = 'translateX(100%)';
                s.style.zIndex = '1';
            });
            
            // 現在の表示
            slides[toIndex].style.display = 'block';
            // slight delay to allow display block to apply before transform
            requestAnimationFrame(() => {
                slides[toIndex].style.transform = 'translateX(0)';
                slides[toIndex].style.zIndex = '2';
            });
        }

        idx = toIndex;
    }

    if (prevBtn) prevBtn.onclick = () => {
        clearInterval(previewInterval);
        go(idx - 1);
        if(cfg.autoPlay) startLoop();
    };

    if (nextBtn) nextBtn.onclick = () => {
        clearInterval(previewInterval);
        go(idx + 1);
        if(cfg.autoPlay) startLoop();
    };
    
    if (dots.length) {
        dots.forEach(d => d.onclick = (e) => {
            clearInterval(previewInterval);
            go(parseInt(e.target.dataset.index));
            if(cfg.autoPlay) startLoop();
        });
    }

    function startLoop() {
        if (cfg.autoPlay) {
            previewInterval = setInterval(() => {
                go(idx + 1);
            }, cfg.speed * 1000);
        }
    }

    startLoop();
}

// アプリ開始
init();
