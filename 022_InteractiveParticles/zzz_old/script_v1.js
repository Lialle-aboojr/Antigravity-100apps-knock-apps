// キャンバスのセットアップ
const canvas = document.getElementById('canvas1');
const ctx = canvas.getContext('2d');

// キャンバスサイズをウィンドウサイズに合わせる
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// パーティクルを格納する配列
let particlesArray = [];

// 色相（Hue）のベース値。クリックで変化させる。
let hue = 0;

// マウスの位置情報を管理するオブジェクト
// 初期値はnullにしておき、最初は画面中央に重力を働かせる等の調整も可能だが、
// ここではマウスが動くまで何もしない設定にする。
const mouse = {
    x: undefined,
    y: undefined,
}

// ウィンドウのリサイズイベント
// ブラウザのサイズが変わったらキャンバスサイズを更新し、パーティクルも再生成する
window.addEventListener('resize', function(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // リサイズ時に少しパーティクルを補充しても面白いが、今回はシンプルにサイズ調整のみ
});

// マウス移動イベント
// カーソルの位置を更新し、パーティクルを引き寄せる
canvas.addEventListener('mousemove', function(event){
    mouse.x = event.x;
    mouse.y = event.y;
});

// タッチデバイス対応（タッチ移動）
canvas.addEventListener('touchmove', function(event){
    mouse.x = event.touches[0].clientX;
    mouse.y = event.touches[0].clientY;
}, {passive: true});


// クリック/タップイベント
// 色相をランダムに変更する
window.addEventListener('click', function(){
    hue = Math.random() * 360;
});


// パーティクル（光の粒）クラスの定義
class Particle {
    constructor(){
        // 初期位置をランダムに設定
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        
        // サイズ（半径）をランダムに (1px 〜 5px)
        this.size = Math.random() * 4 + 1;
        
        // 速度（移動量）の初期値
        // ランダムな方向にゆっくり動く
        this.speedX = Math.random() * 3 - 1.5;
        this.speedY = Math.random() * 3 - 1.5;
        
        // 固有の色。全体の色相(hue)をベースに少しばらつきを持たせる
        this.color = 'hsl(' + (hue + Math.random() * 20) + ', 100%, 50%)';
    }

    // 状態を更新するメソッド（物理演算の核）
    update(){
        // マウス位置との距離を計算（三平方の定理）
        let dx = 0;
        let dy = 0;
        
        // マウスが画面内にある場合のみ重力を計算
        if (mouse.x !== undefined && mouse.y !== undefined) {
            dx = mouse.x - this.x;
            dy = mouse.y - this.y;
            let distance = Math.sqrt(dx*dx + dy*dy);
            
            // 重力効果の計算
            // 距離が近いほど強く引き寄せる（擬似的な重力）
            // ただし、あまりに近すぎると計算が不安定になるので制限する
            // 6000ぐらいの定数を距離で割ることで、近いほどforceが大きくなる
            // さらに動きを滑らかにするため調整
            const forceDirectionX = dx / distance;
            const forceDirectionY = dy / distance;
            
            // 最大距離制限（あまり遠くまでは影響させない場合はここでif文を入れる）
            // ここでは画面全体に緩やかに効かせるため、距離に応じて力を弱める
            const maxDistance = 300; // 重力が効く範囲半径
            let force = 0;

            if (distance < maxDistance) {
                // (maxDistance - distance) / maxDistance で 0〜1 の間の力を計算
                // 近いほど 1 に近づく
                force = (maxDistance - distance) / maxDistance;
                
                // 加速力を速度に加算 (重力強度を調整、例えば abs * 3 等で強くなる)
                const gravityStrength = 2; 
                this.speedX += forceDirectionX * force * gravityStrength;
                this.speedY += forceDirectionY * force * gravityStrength;
            }
        }

        // 摩擦（慣性）の計算
        // 毎フレーム速度を少し減衰させることで、マウスが止まるとパーティクルも徐々に落ち着く
        // また、これで「行き過ぎて戻ってくる」ようなバネっぽい動きも自然に生まれる
        this.speedX *= 0.95; 
        this.speedY *= 0.95;

        // 座標の更新
        this.x += this.speedX;
        this.y += this.speedY;
        
        // 色の更新（クリックで変わった全体の色相に徐々に追従させる、またはキラキラさせる）
        // ここでは生成時の色を維持しつつ、hue変数が変わったときに次回の描画で反映させたい場合、
        // drawメソッドで色を指定するのが良いが、今回は個体差を残すためコンストラクタで決めた色を使う。
        // もし動的に色を変えるなら以下のようにする：
        this.color = 'hsl(' + (hue + Math.random() * 20) + ', 100%, 60%)';
    }

    // 描画メソッド
    draw(){
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// パーティクル生成関数
function init(){
    particlesArray = [];
    // パーティクルの数。画面サイズに応じて増やすと豪華になるが、重くなるので適度に。
    let numberOfParticles = 300; 
    
    for (let i = 0; i < numberOfParticles; i++){
        particlesArray.push(new Particle());
    }
}

// アニメーションループ関数
function animate(){
    // 前のフレームを消去する
    // fillRectで半透明の黒を重ねることで、光の軌跡（残像）を残すことができるテクニック
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 全パーティクルの更新と描画
    for (let i = 0; i < particlesArray.length; i++){
        particlesArray[i].update();
        particlesArray[i].draw();
    }
    
    // 次の描画フレームをリクエスト
    requestAnimationFrame(animate);
}

// 初期化と実行
init();
animate();

// マウスが画面外に出たら重力を解除する
window.addEventListener('mouseout', function(){
    mouse.x = undefined;
    mouse.y = undefined;
});
