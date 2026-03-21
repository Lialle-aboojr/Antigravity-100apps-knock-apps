// DOM要素の取得
const sceneContainer = document.getElementById('scene');
const shapeSelect = document.getElementById('shapeSelect');
const autoRotateToggle = document.getElementById('autoRotateToggle');
const changeColorBtn = document.getElementById('changeColorBtn');

// ==========================================
// 1. Three.js の基本セットアップ
// ==========================================

// シーン（3D空間）の作成
const scene = new THREE.Scene();
// 背景は常に固定のクリーンな薄いグレー（CSSの #fafafa と統一）
scene.background = new THREE.Color('#fafafa');

// カメラの作成 (視野角, アスペクト比, 近くの描画限界, 遠くの描画限界)
const camera = new THREE.PerspectiveCamera(
  45, 
  sceneContainer.clientWidth / sceneContainer.clientHeight, 
  0.1, 
  1000
);
// カメラを少し手前に引いて、オブジェクト全体が見えるようにします
camera.position.z = 5;

// レンダラー（描画エンジン）の作成
const renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias: true でエッジを滑らかに
renderer.setSize(sceneContainer.clientWidth, sceneContainer.clientHeight);
renderer.setPixelRatio(window.devicePixelRatio); // 高解像度ディスプレイへの対応
sceneContainer.appendChild(renderer.domElement);

// ==========================================
// 2. マウス・スマホでのドラッグ回転（OrbitControls）
// ==========================================
// CDNから読み込んだOrbitControlsを使って、複雑な回転計算を自動化します
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 慣性（弾性のある滑らかな動き）を有効化
controls.dampingFactor = 0.05; // 慣性の強さ
controls.enableZoom = false;   // 今回は回転のみを楽しむためズームをオフ
controls.enablePan = false;    // 平行移動もオフ
controls.autoRotate = true;    // 初期状態で自動回転をオン
controls.autoRotateSpeed = 2.0;

// ==========================================
// 3. 多面体の形状（Geometry）と質感（Material）
// ==========================================

// 各種形状の定義（それぞれの見栄えのバランスがいいサイズに調整済み）
const geometries = {
  cube: new THREE.BoxGeometry(1.5, 1.5, 1.5),
  octahedron: new THREE.OctahedronGeometry(1.4),
  dodecahedron: new THREE.DodecahedronGeometry(1.4),
  icosahedron: new THREE.IcosahedronGeometry(1.4)
};

// 【指定修正】メインのマテリアル（質感）
// 最初のCSSを用いたキューブのように、陰影のないフラットな単色を表現します
const mainMaterial = new THREE.MeshBasicMaterial({
  color: 0xe0e0e0, // 無印良品風の明るくクリーンなグレー
  transparent: true, // 少し透けさせて軽快さを出します
  opacity: 0.85
});

// 【指定修正】ワイヤーフレーム（枠線）用のマテリアル
// シンプルで細い線を面に重ねて、きれいな多面体を強調します
const wireframeMaterial = new THREE.LineBasicMaterial({
  color: 0xcccccc, // 背景や面になじむ薄いグレー
  transparent: true,
  opacity: 0.8
});

let currentMesh = null;
let currentWireframe = null;

// 指定された形を作成してシーンに追加する関数
function createShape(type) {
  // すでに図形がある場合は、安全に一度シーンから取り除きます
  if (currentMesh) {
    scene.remove(currentMesh);
  }

  // ドロップダウンのvalueに合う形状を取得します
  const geometry = geometries[type] || geometries.cube;
  
  // 形状と質感を組み合わせてメッシュ（実体）を作ります
  currentMesh = new THREE.Mesh(geometry, mainMaterial);
  
  // 形状から「枠線」だけを抽出して、ワイヤーフレームを作ります
  const edges = new THREE.EdgesGeometry(geometry);
  currentWireframe = new THREE.LineSegments(edges, wireframeMaterial);
  
  // メッシュの中にワイヤーフレームを含めます（一緒に回転させるため）
  currentMesh.add(currentWireframe);
  
  // 3D空間に配置します
  scene.add(currentMesh);
}

// 初期状態としてCube（立方体）を生成
createShape('cube');


// ==========================================
// 4. アニメーション（描画ループ）
// ==========================================
function animate() {
  // ブラウザの描画タイミングに合わせて永遠に繰り返します
  requestAnimationFrame(animate);
  
  // OrbitControlsによる慣性や自動回転を更新
  controls.update(); 
  
  // 画面にレンダリング（描画）します
  renderer.render(scene, camera);
}
// アニメーション開始
animate();


// ==========================================
// 5. UI（ボタンやセレクトボックス）のイベント
// ==========================================

// ウィンドウのサイズが変わった時、Canvasのサイズも一緒に合わせる処理
window.addEventListener('resize', () => {
  const width = sceneContainer.clientWidth;
  const height = sceneContainer.clientHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix(); // カメラの歪みを直す
});

// ドロップダウンで形を変えた時
shapeSelect.addEventListener('change', (e) => {
  createShape(e.target.value);
});

// 自動回転トグルの切り替え
autoRotateToggle.addEventListener('change', (e) => {
  controls.autoRotate = e.target.checked;
});

// カラーチェンジボタンの機能：【指定修正】面の色をランダムなパステルカラーに変更
changeColorBtn.addEventListener('click', () => {
  // 面の色を変えるためのパステルカラーパレット（明るくやさしい色合い）
  const shapeColors = [
    0xffd1dc, // パステルピンク
    0xd1e8e2, // ミントグリーン
    0xffeebb, // パステルイエロー
    0xd9e4f5, // パステルブルー
    0xe2d1f4, // ラベンダー
    0xfcefe0, // ピーチ
    0xe0e0e0  // 元のグレーに戻るチャンスも含む
  ];

  // パレットからランダムな色を選びます
  const randomColor = shapeColors[Math.floor(Math.random() * shapeColors.length)];

  // 多面体の表面（MeshBasicMaterial）の色を選択した色にアニメーションなしで一発変更します
  mainMaterial.color.setHex(randomColor);
});
