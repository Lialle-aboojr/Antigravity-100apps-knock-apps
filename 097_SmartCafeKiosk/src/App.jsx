import React, { useState } from 'react';
import { Coffee, Utensils, CakeSlice, Plus, Minus, X, CheckCircle2, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { categories, menuItems } from './data';

// カテゴリIDからlucide-reactのアイコンをマッピング
const IconMap = {
  Coffee,
  Sandwich: Utensils,
  Cake: CakeSlice
};

export default function App() {
  // === 状態管理（State） ===
  // 1. 現在選択されているカテゴリ（初期値は1つ目のカテゴリのID）
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  // 2. カートに入っている商品のリスト
  const [cart, setCart] = useState([]);
  // 3. 注文確認用モーダルの表示状態
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  // 4. 注文が完了したかどうかの状態
  const [orderComplete, setOrderComplete] = useState(false);

  // === 関数: カートに商品を追加する ===
  const addToCart = (product) => {
    setCart((prevCart) => {
      // 既にカートに同じ商品があるかチェック
      const existingItem = prevCart.find((item) => item.id === product.id);
      
      if (existingItem) {
        // 同じ商品がある場合は、その商品の数量（quantity）だけ+1する
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // 新しい商品の場合は、数量1としてカート配列に追加
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // === 関数: カート内の商品数量を変更する ===
  // deltaには +1 または -1 が入ります
  const updateQuantity = (productId, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === productId) {
            // 数量を計算（0以下にならないようにMath.maxを使用）
            const newQuantity = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0); // 数量が0になった商品は配列から除外（削除）
    });
  };

  // === 関数: 注文データをリセットし、初期画面に戻す ===
  const resetOrder = () => {
    setCart([]); // カートを空にする
    setIsCheckoutModalOpen(false); // モーダルを閉じる
    setOrderComplete(false); // 完了状態をリセット
  };

  // === 関数: 注文を確定する処理 ===
  const handleCheckout = () => {
    // 実際のアプリではここでサーバーにデータを送ります
    setOrderComplete(true); // 完了画面に切り替え
  };

  // === 計算: カート内の合計金額 ===
  // reduceを使って、各商品の (価格 × 数量) を足し合わせる
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  // 現在のカテゴリに属する商品のみを抽出
  const displayedItems = menuItems.filter((item) => item.categoryId === activeCategory);

  return (
    <div className="app-container">
      {/* ===== メインコンテンツエリア（左側） ===== */}
      <main className="main-content">
        {/* ヘッダー */}
        <header className="app-header">
          <div className="brand">
            <Coffee size={32} />
            <div>
              <h1>Smart Cafe</h1>
              <p>Touch & Order Kiosk</p>
            </div>
          </div>
        </header>

        {/* カテゴリ切り替えタブ */}
        <div className="category-tabs">
          {categories.map((category) => {
            const Icon = IconMap[category.icon] || Coffee;
            return (
              <button
                key={category.id}
                className={`tab-btn ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(category.id)}
              >
                <Icon size={18} />
                {category.labelJa} <span>/ {category.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* メニュー商品一覧（グリッド表示） */}
        <div className="menu-area">
          <div className="menu-grid">
            {displayedItems.map((item) => (
              <div 
                key={item.id} 
                className="product-card" 
                onClick={() => addToCart(item)}
              >
                <div className="product-img-wrap">
                  {/* 【セキュリティ対策】ReactはデフォルトでXSSを防ぎますが、img src等の属性には信頼できるURLのみを使用することが鉄則です */}
                  <img src={item.image} alt={item.nameJa} className="product-img" loading="lazy" />
                </div>
                <div className="product-info">
                  <h3 className="product-name-ja">{item.nameJa}</h3>
                  <p className="product-name-en">{item.nameEn}</p>
                  <div className="product-bottom">
                    <span className="product-price">¥{item.price.toLocaleString()}</span>
                    {/* onClickイベントの伝播(バブリング)を防ぐため、e.stopPropagation()を使用 */}
                    <button 
                      className="add-btn" 
                      aria-label="カートに追加" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        addToCart(item); 
                      }}
                    >
                      <Plus size={24} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ===== カートエリア（右側サイドバーまたは下部） ===== */}
      <aside className="cart-sidebar">
        <div className="cart-header">
          <ShoppingBag size={24} color="var(--primary)" />
          <h2>カート / Cart</h2>
        </div>
        
        {/* 追加された商品のリスト表示 */}
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingBag size={48} opacity={0.2} />
              <p>商品を選択してください<br/>Please select items</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img src={item.image} alt={item.nameJa} className="cart-item-img" />
                <div className="cart-item-info">
                  <h4 className="cart-item-name">{item.nameJa}</h4>
                  <div className="cart-item-price">¥{(item.price * item.quantity).toLocaleString()}</div>
                </div>
                <div className="cart-item-actions">
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, -1)} aria-label="減少">
                    <Minus size={16} />
                  </button>
                  <span className="qty-text">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQuantity(item.id, 1)} aria-label="増加">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* カートのフッター（合計金額と注文ボタン） */}
        <div className="cart-footer">
          <div className="cart-total">
            <span>合計 / Total</span>
            <span className="cart-total-amount">¥{totalAmount.toLocaleString()}</span>
          </div>
          <button 
            className="checkout-btn" 
            disabled={cart.length === 0} // カートが空なら押せない（無効化）
            onClick={() => setIsCheckoutModalOpen(true)}
          >
            注文へ進む / Checkout
          </button>
        </div>
      </aside>

      {/* ===== 注文確認・完了モーダル ===== */}
      {isCheckoutModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            {!orderComplete ? (
              // 注文確認（店内・持ち帰り選択画面）
              <>
                <button 
                  className="close-modal" 
                  onClick={() => setIsCheckoutModalOpen(false)}
                  aria-label="閉じる"
                >
                  <X size={24} />
                </button>
                
                <h2 className="modal-title">お召し上がり方</h2>
                <p className="modal-subtitle">Dining Preference</p>
                
                <div className="dining-options">
                  <button className="option-btn" onClick={handleCheckout}>
                    <div className="option-icon">
                      <UtensilsCrossed size={36} />
                    </div>
                    <span className="option-text-ja">店内飲食</span>
                    <span className="option-text-en">Eat In</span>
                  </button>
                  <button className="option-btn" onClick={handleCheckout}>
                    <div className="option-icon">
                      <ShoppingBag size={36} />
                    </div>
                    <span className="option-text-ja">お持ち帰り</span>
                    <span className="option-text-en">Take Out</span>
                  </button>
                </div>
              </>
            ) : (
              // 注文完了画面
              <div className="success-message">
                <CheckCircle2 size={64} className="success-icon" />
                <h2 className="modal-title">ご注文完了</h2>
                <p className="modal-subtitle">Order Completed</p>
                <p>番号札を持ってお待ちください。<br/>Please wait with your number receipt.</p>
                <button className="home-btn" onClick={resetOrder}>
                  トップへ戻る / Back to Home
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
