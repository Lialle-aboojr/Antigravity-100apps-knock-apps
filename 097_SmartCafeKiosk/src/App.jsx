import React, { useState, useRef } from 'react';
import { Coffee, Utensils, CakeSlice, Plus, Minus, X, CheckCircle2, ShoppingBag, UtensilsCrossed, ChevronLeft, ChevronRight, Star, Cookie, ConciergeBell } from 'lucide-react';
import { categories, menuItems } from './data';

// カテゴリIDからlucide-reactのアイコンを動的にマッピング
const IconMap = {
  Coffee,
  Sandwich: Utensils,
  Cake: CakeSlice,
  Star,
  Cookie,
  ConciergeBell
};

export default function App() {
  // === 状態管理（State） ===
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [cart, setCart] = useState([]);
  
  // 画面フル表示用の商品詳細状態
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 注文プロセスのステップ管理 (0: 閉じる, 1: カート確認画面, 2: お召し上がり方選択, 3: 完了)
  const [checkoutStep, setCheckoutStep] = useState(0);

  // デスクトップ版のサイドバーカートの開閉状態
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // === UI操作関数 ===
  // カテゴリタブの横スクロール制御
  const tabsRef = useRef(null);
  const scrollTabs = (direction) => {
    if (tabsRef.current) {
      const scrollAmount = 250; // スクロール量
      tabsRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // === カート操作関数 ===
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    // カート追加後、詳細画面を閉じてサイドバーを開く(デスクトップのみ)
    setSelectedProduct(null);
    if (window.innerWidth > 900) {
      setIsSidebarOpen(true);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.id === productId) {
            const newQuantity = Math.max(0, item.quantity + delta);
            return { ...item, quantity: newQuantity };
          }
          return item;
        })
        .filter((item) => item.quantity > 0);
    });
  };

  const resetOrder = () => {
    setCart([]);
    setCheckoutStep(0);
    setSelectedProduct(null);
    setIsSidebarOpen(false); // サイドバーも閉じる
  };

  // 合計金額・合計数量
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  const displayedItems = menuItems.filter((item) => item.categoryId === activeCategory);

  // === 共通コンポーネント: カートリスト ===
  const CartItemList = () => (
    <>
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
      <div className="cart-footer">
        <div className="cart-total">
          <span>合計 / Total</span>
          <span className="cart-total-amount">¥{totalAmount.toLocaleString()}</span>
        </div>
        {checkoutStep === 1 ? (
          <button 
            className="checkout-btn" 
            disabled={cart.length === 0}
            onClick={() => setCheckoutStep(2)}
          >
            レジへ進む / Proceed to Checkout
          </button>
        ) : (
          <button 
            className="checkout-btn" 
            disabled={cart.length === 0}
            onClick={() => setCheckoutStep(1)}
          >
            マイオーダーを確認 / Review Order
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="app-container">
      {/* メインコンテンツエリア */}
      <main className="main-content">
        <header className="app-header">
          {/* 生成された新しい横長のブランドロゴを左上に配置 */}
          <div className="brand">
            <img src="/app-logo.png" alt="Smart Cafe Logo" className="brand-logo" />
          </div>
        </header>

        {/* スクロール可能なカテゴリタブ */}
        <div className="category-tabs-wrapper">
          <button className="scroll-arrow left" onClick={() => scrollTabs('left')}>
            <ChevronLeft size={24} />
          </button>
          
          <div className="category-tabs" ref={tabsRef}>
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

          <button className="scroll-arrow right" onClick={() => scrollTabs('right')}>
            <ChevronRight size={24} />
          </button>
        </div>

        <div className="menu-area">
          <div className="menu-grid">
            {displayedItems.map((item) => (
              <div 
                key={item.id} 
                className="product-card" 
                onClick={() => setSelectedProduct(item)} // 詳細を開く
              >
                <div className="product-img-wrap">
                  <img src={item.image} alt={item.nameJa} className="product-img" loading="lazy" />
                </div>
                <div className="product-info">
                  <h3 className="product-name-ja">{item.nameJa}</h3>
                  <p className="product-name-en">{item.nameEn}</p>
                  <div className="product-bottom">
                    <span className="product-price">¥{item.price.toLocaleString()}</span>
                    <span className="view-btn">詳細</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* モバイル用フローティングカートボタン（カート内に商品がある時のみ表示） */}
        <button 
          className={`mobile-cart-float ${cart.length > 0 ? 'show' : ''}`}
          onClick={() => setCheckoutStep(1)}
        >
          <div className="float-left">
            <ShoppingBag size={24} />
            <span>オーダーを確認</span>
          </div>
          <div className="cart-badge">{totalQuantity}</div>
        </button>

        {/* 商品詳細画面 */}
        {selectedProduct && (
          <div className="product-detail-overlay">
            <div className="detail-header">
              <button className="back-btn" onClick={() => setSelectedProduct(null)}>
                <ChevronLeft size={24} /> もどる / Back
              </button>
            </div>
            <div className="detail-content">
              <div className="detail-img-wrap">
                <img src={selectedProduct.image} alt={selectedProduct.nameJa} className="detail-img" />
              </div>
              <div className="detail-info">
                <div>
                  <h2 className="detail-title-ja">{selectedProduct.nameJa}</h2>
                  <p className="detail-title-en">{selectedProduct.nameEn}</p>
                  <p className="detail-price">¥{selectedProduct.price.toLocaleString()}</p>
                </div>
                <div className="detail-desc">{selectedProduct.description}</div>
                <div className="detail-action">
                  <button className="add-to-cart-large" onClick={() => addToCart(selectedProduct)}>
                    <Plus size={24} />
                    カートに追加 / Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* デスクトップ用右側スライドイン・サイドバーカート */}
      <aside className={`cart-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <div className="cart-header-title">
            <ShoppingBag size={24} color="var(--primary)" />
            <h2>マイオーダー / Order</h2>
          </div>
          <button className="close-sidebar-btn" onClick={() => setIsSidebarOpen(false)}>
            <X size={24} />
          </button>
        </div>
        <CartItemList />
      </aside>

      {/* デスクトップ用：カート引き出し用「付箋ボタン」 */}
      <button 
        className={`desktop-cart-toggle ${isSidebarOpen ? 'open' : ''}`} 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      >
        <div className="toggle-inner">
          <div className="toggle-icon">
            {isSidebarOpen ? <X size={24} /> : <ShoppingBag size={24} />}
          </div>
          <span>カートの中を見る / View Cart</span>
          {totalQuantity > 0 && <div className="toggle-badge">{totalQuantity}</div>}
        </div>
      </button>

      {/* マルチステップ・チェックアウトモーダル */}
      {checkoutStep > 0 && (
        <div className="modal-overlay" onClick={() => checkoutStep === 1 && setCheckoutStep(0)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            
            {checkoutStep === 1 && (
              <>
                <div className="cart-header">
                  <div className="cart-header-title">
                    <ShoppingBag size={24} color="var(--primary)" />
                    <h2>ご注文の確認 / Review</h2>
                  </div>
                  <button className="close-modal" onClick={() => setCheckoutStep(0)}>
                    <X size={24} />
                  </button>
                </div>
                <CartItemList />
              </>
            )}

            {checkoutStep === 2 && (
              <div className="step-centered">
                <button 
                  className="close-modal" 
                  style={{ position: 'absolute', top: 16, right: 16 }}
                  onClick={() => setCheckoutStep(1)}
                >
                  <X size={24} />
                </button>
                <h2 className="modal-title">お召し上がり方</h2>
                <p className="modal-subtitle">Dining Preference</p>
                <div className="dining-options">
                  <button className="option-btn" onClick={() => setCheckoutStep(3)}>
                    <div className="option-icon"><UtensilsCrossed size={36} /></div>
                    <span className="option-text-ja">店内飲食</span>
                    <span className="option-text-en">Eat In</span>
                  </button>
                  <button className="option-btn" onClick={() => setCheckoutStep(3)}>
                    <div className="option-icon"><ShoppingBag size={36} /></div>
                    <span className="option-text-ja">お持ち帰り</span>
                    <span className="option-text-en">Take Out</span>
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === 3 && (
              <div className="step-centered success-message">
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
