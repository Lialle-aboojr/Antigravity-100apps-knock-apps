/**
 * Dynamic Pricing Table - 可変料金テーブル
 * 
 * 料金プランのデータ（ここを変更するだけでプランが増減・内容変更されます）
 * ※ユーザー様へ: プランを増やしたい場合は、{ ... } のブロックをコピペして追加してください。
 */
const pricingPlans = [
    {
        id: 'basic',                // プランの一意のID（英語アルファベット推奨）
        name: 'Basic',              // プラン名
        monthlyPrice: 1900,         // 月額料金（カンマなしの数値）
        annualPrice: 1520,          // 年額料金の月割額（例: 20%オフ）
        features: [                 // 機能リスト（必要なだけ追加可能）
            '1ユーザー / 1 User',
            '5GB ストレージ / 5GB Storage',
            '基本サポート / Basic Support',
            'コミュニティアクセス / Community Access'
        ],
        isPopular: false,           // このプランを目立たせる場合は true にする
        ctaText: '無料で始める / Start for Free',  // ボタンのテキスト
        ctaType: 'secondary'        // 'primary' (塗りつぶし) or 'secondary' (枠線のみ)
    },
    {
        id: 'pro',
        name: 'Pro',
        monthlyPrice: 4900,
        annualPrice: 3920,
        features: [
            '5ユーザー / 5 Users',
            '50GB ストレージ / 50GB Storage',
            '優先メールサポート / Priority Email Support',
            '高度な分析機能 / Advanced Analytics',
            'カスタムドメイン / Custom Domain'
        ],
        isPopular: true,            // Proプランを一番人気として強調表示する
        ctaText: 'Proへアップグレード / Get Pro',
        ctaType: 'primary'
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        monthlyPrice: 9900,
        annualPrice: 7920,
        features: [
            '無制限ユーザー / Unlimited Users',
            '1TB ストレージ / 1TB Storage',
            '24/7 電話サポート / 24/7 Phone Support',
            '専任マネージャー / Dedicated Manager',
            'SLA保証 / SLA Guarantee',
            'SSO認証 / SSO Authentication'
        ],
        isPopular: false,
        ctaText: 'お問い合わせ / Contact Us',
        ctaType: 'secondary'
    }
];

// DOM要素（HTMLの要素）の取得
const cardsContainer = document.getElementById('pricing-cards-container');
const billingToggle = document.getElementById('billing-toggle');

/**
 * チェックマークのSVGアイコン（画像）のHTML文字列を返す関数
 */
const getCheckIcon = () => `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
`;

/**
 * 数値をカンマ区切りの文字列にする関数
 * 例: 1900 -> "1,900"
 */
const formatPrice = (num) => num.toLocaleString('ja-JP');

/**
 * 【セキュリティ対策】安全にHTML要素を生成する関数（XSS対策）
 * ユーザーが入力した可能性のあるテキストを、見えないプログラムとしてではなく
 * 純粋な「文字」として扱うために `textContent` を使用します。
 */
const createSafeElement = (tag, text, classNames = []) => {
    const el = document.createElement(tag); // 指定されたタグ（divなど）を作成
    if (text) {
        el.textContent = text; // 安全にテキストを挿入
    }
    if (classNames.length > 0) {
        el.classList.add(...classNames); // クラス名（デザイン用）を追加
    }
    return el;
};

/**
 * JavaScriptのデータをもとに、カードのHTMLを組み立てて画面に表示する関数
 */
const renderCards = () => {
    // まず中身をカラにする
    cardsContainer.innerHTML = ''; 
    
    // 現在のスイッチの状態を取得（チェックされていれば「年額」）
    const isAnnual = billingToggle.checked;

    // データ配列(pricingPlans)を1つずつ取り出して処理する
    pricingPlans.forEach(plan => {
        // --- 1. カード全体を囲む箱を作る ---
        const card = document.createElement('div');
        // 人気のプランなら 'popular' という目立たせるクラスをつける
        card.className = `pricing-card ${plan.isPopular ? 'popular' : ''}`;
        
        // --- 2. 人気バッジ (isPopularが true の場合のみ) ---
        if (plan.isPopular) {
            const badge = createSafeElement('div', '一番人気 / Most Popular', ['popular-badge']);
            card.appendChild(badge);
        }

        // --- 3. カードの上部（プラン名と金額） ---
        const header = document.createElement('div');
        header.className = 'card-header';
        
        // プラン名
        const planName = createSafeElement('h2', plan.name, ['plan-name']);
        
        // 金額を横に並べるためのコンテナ
        const priceContainer = document.createElement('div');
        priceContainer.className = 'plan-price-container';
        
        // 円マーク (¥)
        const currency = createSafeElement('span', '¥', ['plan-currency']);
        
        // 現在表示すべき金額（月額か、年額の月割か）
        const currentPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice;
        
        // 金額の数字部分
        const priceElement = createSafeElement('span', formatPrice(currentPrice), ['plan-price']);
        // 後で金額を切り替えるために、属性として元々の価格を保存しておく
        priceElement.setAttribute('data-monthly', formatPrice(plan.monthlyPrice));
        priceElement.setAttribute('data-annual', formatPrice(plan.annualPrice));
        priceElement.id = `price-${plan.id}`; // 識別用ID

        // 「/ 月」などの期間表示部分
        const duration = document.createElement('div');
        duration.className = 'plan-duration';
        
        // 日本語の期間表示
        const durationJa = createSafeElement('span', isAnnual ? '/ 月 (年一括)' : '/ 月');
        durationJa.id = `duration-ja-${plan.id}`;
        
        // 英語の期間表示
        const durationEn = createSafeElement('span', isAnnual ? '/ mo (Billed Annually)' : '/ mo', ['en-duration']);
        durationEn.id = `duration-en-${plan.id}`;
        
        // 期間の箱に文字を入れる
        duration.appendChild(durationJa);
        duration.appendChild(durationEn);

        // 金額の箱に ¥、金額、期間を入れる
        priceContainer.appendChild(currency);
        priceContainer.appendChild(priceElement);
        priceContainer.appendChild(duration);
        
        // ヘッダーにプラン名と金額の箱を入れる
        header.appendChild(planName);
        header.appendChild(priceContainer);
        card.appendChild(header); // ヘッダーをカードに追加

        // --- 4. 機能リスト ---
        const featureList = document.createElement('ul');
        featureList.className = 'feature-list';
        
        // features配列の中身を1つずつ取り出す
        plan.features.forEach(feature => {
            const li = document.createElement('li');
            li.className = 'feature-item';
            
            // チェックマークアイコン
            const iconSpan = document.createElement('span');
            iconSpan.className = 'feature-icon';
            iconSpan.innerHTML = getCheckIcon(); // アイコンは固定のタグなのでinnerHTMLで安全
            
            // 機能のテキスト
            const textSpan = createSafeElement('span', feature);
            
            li.appendChild(iconSpan);
            li.appendChild(textSpan);
            featureList.appendChild(li); // リストに項目を追加
        });
        
        card.appendChild(featureList); // リストをカードに追加

        // --- 5. ボタン ---
        const btn = createSafeElement('button', plan.ctaText, ['cta-button', plan.ctaType]);
        // ボタンがクリックされた時の動作
        btn.addEventListener('click', () => {
            alert(`${plan.name} プランが選択されました。データ送信処理などをここに記載します。`);
        });
        card.appendChild(btn); // ボタンをカードに追加

        // 完成したカードを画面上のコンテナに追加
        cardsContainer.appendChild(card);
    });
};

/**
 * 月額/年額スイッチを切り替えた時の処理（滑らかなアニメーション付き）
 */
const togglePricing = () => {
    // 現在のスイッチの状態（チェックあり＝年額）
    const isAnnual = billingToggle.checked;
    
    // すべてのプランに対して金額表示を更新する
    pricingPlans.forEach(plan => {
        const priceElement = document.getElementById(`price-${plan.id}`);
        const durationJa = document.getElementById(`duration-ja-${plan.id}`);
        const durationEn = document.getElementById(`duration-en-${plan.id}`);
        
        if (priceElement && durationJa && durationEn) {
            // ふわっと消えるアニメーションのためのクラスを追加
            priceElement.classList.add('price-animating');
            
            // 0.15秒（150ミリ秒）遅らせて、文字が透明になった瞬間に数字を書き換える
            setTimeout(() => {
                // 保存しておいた 月額 または 年額 のデータを取り出す
                const newPrice = isAnnual ? priceElement.getAttribute('data-annual') : priceElement.getAttribute('data-monthly');
                priceElement.textContent = newPrice;
                
                // 期間のテキストも書き換える
                durationJa.textContent = isAnnual ? '/ 月 (年一括)' : '/ 月';
                durationEn.textContent = isAnnual ? '/ mo (Billed Annually)' : '/ mo';
                
                // アニメーション用のクラスを外して、再びふわっと表示させる
                priceElement.classList.remove('price-animating');
            }, 150);
        }
    });
};

// --- 初期設定 ---

// スイッチがクリック（変更）されたら `togglePricing` を実行するように見張っておく
billingToggle.addEventListener('change', togglePricing);

// すぐに初回のカード描画を実行する
renderCards();
