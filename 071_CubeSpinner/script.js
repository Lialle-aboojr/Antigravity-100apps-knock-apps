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
// 無印良品風のクリーンな背景色（CSSの #fafafa と統一）
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
renderer.setPixelRatio(window.devicePixelRatio); // 高解像度ディスプレイ（Retinaなど）への対応
sceneContainer.appendChild(renderer.domElement);

// ==========================================
// 2. マウス・スマホでのドラッグ回転（OrbitControls）
// ==========================================
// CDNから読み込んだOrbitControlsを使って、複雑な回転計算を自動化します
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 慣性（スッと止まらず滑らかに止まる）を有効化
controls.dampingFactor = 0.05; // 慣性の強さ
controls.enableZoom = false;   // ズーム機能をオフ（今回は回転のみ楽しむため）
controls.enablePan = false;    // 平行移動をオフ
controls.autoRotate = true;    // 初期状態で自動回転をオン
controls.autoRotateSpeed = 2.0; // 自動回転のスピード

// ==========================================
// 3. 多面体の形状（Geometry）と質感（Material）
// ==========================================

// 各種形状の定義。サイズを統一感が出るように微調整しています
const geometries = {
  cube: new THREE.BoxGeometry(1.5, 1.5, 1.5),
  octahedron: new THREE.OctahedronGeometry(1.4),
  dodecahedron: new THREE.DodecahedronGeometry(1.4),
  icosahedron: new THREE.IcosahedronGeometry(1.4)
};

// メインのマテリアル（質感）
// MeshNormalMaterialは面が向いている方向によって色が虹色のように変わる、サイバーでモダンな質感です
const mainMaterial = new THREE.MeshNormalMaterial({
  flatShading: true // ポリゴンの面をパキッと見せる（ローポリ風・リッチな表現）
});

// ワイヤーフレーム（枠線）用のマテリアル
// メッシュの上に重ねることで、SFチックな遊び心を加えます
let wireframeMaterial = new THREE.LineBasicMaterial({
  color: 0x333333, // 初期色はダークグレー
  transparent: true,
  opacity: 0.3
});

let currentMesh = null;
let currentWireframe = null;

// 指定された形を作成してシーンに追加する関数
function createShape(type) {
  // すでに図形がある場合は、一度シーンから取り除きます
  if (currentMesh) {
    scene.remove(currentMesh);
  }

  // ドロップダウンの型文字に合う形状を取得します
  const geometry = geometries[type] || geometries.cube;
  
  // 形状と質感を組み合わせてメッシュ（実体）を作ります
  currentMesh = new THREE.Mesh(geometry, mainMaterial);
  
  // 形状から「枠線」だけを抽出して、ワイヤーフレームを作ります
  const edges = new THREE.EdgesGeometry(geometry);
  currentWireframe = new THREE.LineSegments(edges, wireframeMaterial);
  
  // メッシュの中にワイヤーフレームを子要素として追加します（一緒に回転させるため）
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
  
  // OrbitControlsによる慣性や自動回転の更新
  controls.update(); 
  
  // シーンとカメラを通じて画面にレンダリング（描画）します
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

// マジックカラー機能：ボタンを押すたびに全体の雰囲気を変える
changeColorBtn.addEventListener('click', () => {
  // 背景色のパレット（無印風のやさしいパステル/グレー系）
  const bgColors = [
    '#fafafa', '#f0f4f8', '#fff0f5', '#f5fff0', '#fdf6e3', '#e6e6fa', '#f5f5f5'
  ];
  // ワイヤーフレーム（枠線）のパレット（サイバーで鮮やかな色合い + ダーク色）
  const wireColors = [
    0x333333, 0xff0055, 0x00ffcc, 0x7700ff, 0xffaa00, 0x0088ff, 0xffffff
  ];

  // パレットからランダムな色を選びます
  const randomBg = bgColors[Math.floor(Math.random() * bgColors.length)];
  const randomWire = wireColors[Math.floor(Math.random() * wireColors.length)];

  // 背景色を変更
  scene.background = new THREE.Color(randomBg);
  document.body.style.backgroundColor = randomBg; // bodyの余白の色も統一
  
  // ワイヤーフレームの色を変更（Three.jsの色形式であるHexにセット）
  wireframeMaterial.color.setHex(randomWire);
});
