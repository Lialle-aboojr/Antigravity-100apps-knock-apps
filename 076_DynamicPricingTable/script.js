/**
 * Simple Pricing Table
 * 
 * JavaScriptの役割:
 * 動的なHTML生成（ループ処理）を廃止し、
 * 月額/年額のトグルスイッチが切り替わった際に、すでにHTML上にある
 * 「金額」「単位テキスト」の文字だけをスムーズに書き換える機能に限定しました。
 */

// HTMLの各プランカードにあるIDのリスト
const planIds = ['basic', 'pro', 'enterprise'];

// 月額/年額切り替えスイッチ（チェックボックス）の要素を取得
const billingToggle = document.getElementById('billing-toggle');

/**
 * 月額/年額スイッチを切り替えた時の処理（アニメーション付き）
 */
const togglePricing = () => {
    // 現在のスイッチの状態（チェックが入っていれば「年額」モード）
    const isAnnual = billingToggle.checked;
    
    // 3つのプランそれぞれに対して、順次処理を行う
    planIds.forEach(planId => {
        // HTML要素を取得する
        const priceElement = document.getElementById(`price-${planId}`);
        const durationJa = document.getElementById(`duration-ja-${planId}`);
        const durationEn = document.getElementById(`duration-en-${planId}`);
        
        // すべての要素が存在する場合のみ処理を走らせる
        if (priceElement && durationJa && durationEn) {
            
            // 1. まず、ふわっと消えるアニメーションのためのクラスを追加
            priceElement.classList.add('price-animating');
            
            // 2. 0.15秒（150ミリ秒）遅らせて、文字がパッと透明になった瞬間にテキストを書き換える
            setTimeout(() => {
                
                // HTMLの属性（data-annual / data-monthly）に仕込んでおいた金額の数値を取得
                const newPrice = isAnnual 
                    ? priceElement.getAttribute('data-annual') 
                    : priceElement.getAttribute('data-monthly');
                
                // 【セキュリティ】ユーザー入力ではないが、確実にテキストとして扱うため「textContent」で挿入
                priceElement.textContent = newPrice;
                
                // 横にある「/ 月」などの期間テキストも、状態に合わせて書き換える
                durationJa.textContent = isAnnual ? '/ 月 (年一括)' : '/ 月';
                durationEn.textContent = isAnnual ? '/ mo (Annually)' : '/ mo';
                
                // 3. 最後に、アニメーション用のクラスを外して、再びふわっと表示（フェードイン）させる
                priceElement.classList.remove('price-animating');
                
            }, 150); // CSSの transition（0.3秒）の半分のタイミングに設定
        }
    });
};

// スイッチがクリック（変更）されたら `togglePricing` を実行するように登録
billingToggle.addEventListener('change', togglePricing);

// 念のため、ページ読み込み直後にも一回実行して、表示ズレがないかを合わせる
togglePricing();
