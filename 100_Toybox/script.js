/* ==========================================
   Toybox - 100 Apps Knock -
   物理演算ポートフォリオ メインスクリプト
   ========================================== */

// =============================================
// 1. 定数定義: 100個のアプリデータ
// =============================================
const APPS = [
  { id: 1, name: "Pomodolo Timer", category: "ライフスタイル" },
  { id: 2, name: "Maaman", category: "遊び・エンタメ" },
  { id: 3, name: "Gradient Breeze", category: "UI・デザイン" },
  { id: 4, name: "BizMail Generator", category: "ツール・実用" },
  { id: 5, name: "Recipe Resizer+", category: "ライフスタイル" },
  { id: 6, name: "Deep Breath Flow", category: "ライフスタイル" },
  { id: 7, name: "Smart Case Converter", category: "ツール・実用" },
  { id: 8, name: "My Comic Shelf", category: "遊び・エンタメ" },
  { id: 9, name: "Emoji Battle Arena", category: "遊び・エンタメ" },
  { id: 10, name: "Smooth FAQ Accordion", category: "UI・デザイン" },
  { id: 11, name: "Neumorphism Generator", category: "UI・デザイン" },
  { id: 12, name: "Password Generator", category: "ツール・実用" },
  { id: 13, name: "Fresh Keeper", category: "ライフスタイル" },
  { id: 14, name: "Miyabi Pass", category: "ツール・実用" },
  { id: 15, name: "Zen Mixer", category: "ライフスタイル" },
  { id: 16, name: "Text Polisher", category: "ツール・実用" },
  { id: 17, name: "Review Vault", category: "ツール・実用" },
  { id: 18, name: "Simple Mole", category: "遊び・エンタメ" },
  { id: 19, name: "The Petty Curse", category: "遊び・エンタメ" },
  { id: 20, name: "Coordinate Hunter", category: "遊び・エンタメ" },
  { id: 21, name: "Modal Architect", category: "UI・デザイン" },
  { id: 22, name: "Interactive Particles", category: "UI・デザイン" },
  { id: 23, name: "SHADOWCRAFT", category: "UI・デザイン" },
  { id: 24, name: "Write Boost", category: "ツール・実用" },
  { id: 25, name: "Dinner Roulette AI", category: "ライフスタイル" },
  { id: 26, name: "Autophagy Cycle", category: "ライフスタイル" },
  { id: 27, name: "Universal Filler Text Generator", category: "ツール・実用" },
  { id: 28, name: "Cinema Roulette Pro", category: "遊び・エンタメ" },
  { id: 29, name: "Memory Garden", category: "ライフスタイル" },
  { id: 30, name: "Power Pulse", category: "ライフスタイル" },
  { id: 31, name: "Custom Slider Studio", category: "UI・デザイン" },
  { id: 32, name: "Cursor Follower", category: "UI・デザイン" },
  { id: 33, name: "Philosophical Dialogue Formatter", category: "ツール・実用" },
  { id: 34, name: "Type Try", category: "遊び・エンタメ" },
  { id: 35, name: "Text Polish", category: "ツール・実用" },
  { id: 36, name: "Aesthetics Ratio Calculator", category: "UI・デザイン" },
  { id: 37, name: "Secret App (TBD)", category: "ツール・実用" },
  { id: 38, name: "Multi-Kitchen Timer", category: "ライフスタイル" },
  { id: 39, name: "CSS Loading Maker", category: "UI・デザイン" },
  { id: 40, name: "Health Metrics Calculator", category: "ライフスタイル" },
  { id: 41, name: "Quick QR Generator", category: "ツール・実用" },
  { id: 42, name: "スマートゴミ出しリマインダー", category: "ライフスタイル" },
  { id: 43, name: "ハンバーガーメニュービルダー", category: "UI・デザイン" },
  { id: 44, name: "推し活貯金箱", category: "遊び・エンタメ" },
  { id: 45, name: "Flex & Grid Layout Simulator", category: "UI・デザイン" },
  { id: 46, name: "Digital Kaleidoscope", category: "UI・デザイン" },
  { id: 47, name: "Classic Kaleidoscope", category: "UI・デザイン" },
  { id: 48, name: "Smart Shopping List", category: "ライフスタイル" },
  { id: 49, name: "Particle Mirage", category: "UI・デザイン" },
  { id: 50, name: "世界時計ダッシュボード", category: "ツール・実用" },
  { id: 51, name: "UniConvert", category: "ツール・実用" },
  { id: 52, name: "タイピング勇者 / Typing Hero", category: "遊び・エンタメ" },
  { id: 53, name: "Memento Time", category: "ライフスタイル" },
  { id: 54, name: "String Replacer", category: "ツール・実用" },
  { id: 55, name: "Mood & Shred Contact", category: "ツール・実用" },
  { id: 56, name: "郵便番号かんたん検索", category: "ツール・実用" },
  { id: 57, name: "エンタメ割り勘電卓", category: "ツール・実用" },
  { id: 58, name: "404 Error Page Maker", category: "UI・デザイン" },
  { id: 59, name: "EyeRelax Trainer", category: "ライフスタイル" },
  { id: 60, name: "WorldLiveCamRoulette", category: "遊び・エンタメ" },
  { id: 61, name: "Bilingual Quote Generator", category: "ツール・実用" },
  { id: 62, name: "Random Fluff Viewer", category: "遊び・エンタメ" },
  { id: 63, name: "PianoKeyboard", category: "遊び・エンタメ" },
  { id: 64, name: "GlitchArtGenerator", category: "UI・デザイン" },
  { id: 65, name: "Network Status Checker", category: "ツール・実用" },
  { id: 66, name: "Digital Rain Effect", category: "UI・デザイン" },
  { id: 67, name: "タイムトラベル早見表", category: "遊び・エンタメ" },
  { id: 68, name: "Tategaki Studio", category: "ツール・実用" },
  { id: 69, name: "DonutBrandSite", category: "UI・デザイン" },
  { id: 70, name: "100 Apps Knock Portfolio", category: "UI・デザイン" },
  { id: 71, name: "Polyhedron Spinner", category: "UI・デザイン" },
  { id: 72, name: "Daily Quote Gallery", category: "ライフスタイル" },
  { id: 73, name: "Edo Breakout", category: "遊び・エンタメ" },
  { id: 74, name: "Live Markdown Editor", category: "ツール・実用" },
  { id: 75, name: "SimpleScreenRecorder", category: "ツール・実用" },
  { id: 76, name: "Simple Pricing Table", category: "UI・デザイン" },
  { id: 77, name: "Morphism UI Lab", category: "UI・デザイン" },
  { id: 78, name: "Interactive Ripple", category: "UI・デザイン" },
  { id: 79, name: "Weekly Routine Planner", category: "ライフスタイル" },
  { id: 80, name: "PixelArtEditor", category: "UI・デザイン" },
  { id: 81, name: "15 Puzzle", category: "遊び・エンタメ" },
  { id: 82, name: "Hanabi Canvas", category: "UI・デザイン" },
  { id: 83, name: "Simple D3 Graph Maker", category: "ツール・実用" },
  { id: 84, name: "SvgDrawAnimator", category: "UI・デザイン" },
  { id: 85, name: "Retro Bowling", category: "遊び・エンタメ" },
  { id: 86, name: "DotEaterMaze", category: "遊び・エンタメ" },
  { id: 87, name: "EmotionJournal", category: "ライフスタイル" },
  { id: 88, name: "Theme Switcher UI Collection", category: "UI・デザイン" },
  { id: 89, name: "BizMail DX", category: "ツール・実用" },
  { id: 90, name: "Recipe Cost Calculator", category: "ライフスタイル" },
  { id: 91, name: "Habit Stamp Calendar", category: "ライフスタイル" },
  { id: 92, name: "MediLog", category: "ライフスタイル" },
  { id: 93, name: "Smart LP Architect", category: "UI・デザイン" },
  { id: 94, name: "Mom's AI Recipe Book", category: "ライフスタイル" },
  { id: 95, name: "PinNote", category: "ツール・実用" },
  { id: 96, name: "TypographyShowcase", category: "UI・デザイン" },
  { id: 97, name: "SmartCafeKiosk", category: "UI・デザイン" },
  { id: 98, name: "KineticChaos", category: "UI・デザイン" },
  { id: 99, name: "Donut Brand Site Advanced", category: "UI・デザイン" },
  { id: 100, name: "Toybox (100th App)", category: "遊び・エンタメ" }
];

// =============================================
// 2. フォルダ名スラッグマップ（実際のリポジトリ構成に完全一致）
// =============================================
const SLUG_MAP = {
  1: "PomodoloTimer",
  2: "Maaman",
  3: "gradient-breeze",
  4: "BizMail-Generator",
  5: "RecipeResizer+",
  6: "DeepBreathFlow",
  7: "SmartCaseConverter",
  8: "MyComicShelf",
  9: "EmojiBattleArena",
  10: "SmoothFAQAccordion",
  11: "NeumorphismGenerator",
  12: "PasswordGenerator",
  13: "FreshKeeper",
  14: "MiyabiPass",
  15: "ZenMixer",
  16: "TextPolisher",
  17: "ReviewVault",
  18: "SimpleMole",
  19: "ThePettyCurse",
  20: "CoordinateHunter",
  21: "ModalArchitect",
  22: "InteractiveParticles",
  23: "SHADOWCRAFT",
  24: "WriteBoost",
  25: "DinnerRouletteAI",
  26: "AutophagyCycle",
  27: "UniversalFillerTextGenerator",
  28: "CinemaRoulettePro",
  29: "MemoryGarden",
  30: "PowerPulse",
  31: "CustomSliderStudio",
  32: "CursorFollower",
  33: "PhilosophicalDialogueFormatter",
  34: "TypeTry",
  35: "TextPolish",
  36: "AestheticsRatioCalculator",
  37: "SecretApp",
  38: "Multi-KitchenTimer",
  39: "CSSLoadingMaker",
  40: "HealthMetricsCalculator",
  41: "QuickQRGenerator",
  42: "SmartTrashReminder",
  43: "HamburgerMenuBuilder",
  44: "OshiSavingsBox",
  45: "Flex&GridLayoutSimulator",
  46: "DigitalKaleidoscope",
  47: "ClassicKaleidoscope",
  48: "SmartShoppingList",
  49: "ParticleMirage",
  50: "WorldClockDashboard",
  51: "UniConvert",
  52: "TypingHero",
  53: "MementoTime",
  54: "StringReplacer",
  55: "MoodShredContact",
  56: "PostalCodeFinder",
  57: "PayTiltRoulette",
  58: "ErrorPageMaker",
  59: "EyeRelaxTrainer",
  60: "WorldLiveCamRoulette",
  61: "BilingualQuoteGenerator",
  62: "RandomFluffViewer",
  63: "PianoKeyboard",
  64: "GlitchArtGenerator",
  65: "NetworkStatusChecker",
  66: "MatrixRainEffect",
  67: "TimeTravelReference",
  68: "TategakiStudio",
  69: "DonutBrandSite",
  70: "AppsKnockPortfolio",
  71: "CubeSpinner",
  72: "DailyQuoteGallery",
  73: "EdoBreakout",
  74: "LiveMarkdownEditor",
  75: "SimpleScreenRecorder",
  76: "DynamicPricingTable",
  77: "MorphismUiLab",
  78: "InteractiveRipple",
  79: "WeeklyRoutinePlanner",
  80: "PixelArtEditor",
  81: "FifteenPuzzle",
  82: "HanabiCanvas",
  83: "SimpleD3GraphMaker",
  84: "SvgDrawAnimator",
  85: "RetroBowling",
  86: "DotEaterMaze",
  87: "EmotionJournal",
  88: "ThemeSwitcherUiCollection",
  89: "BizMailDX",
  90: "RecipeCostCalculator",
  91: "HabitStampCalendar",
  92: "MediLog",
  93: "SmartLPArchitect",
  94: "MomsAiRecipeBook",
  95: "PinNote",
  96: "TypographyShowcase",
  97: "SmartCafeKiosk",
  98: "KineticChaos",
  99: "DonutBrandSiteAdvanced",
  100: "Toybox"
};

// =============================================
// 3. カラーパレット（パステル＋アクセント）
// =============================================
const COLORS = [
  "#A8E6CF", // ミントグリーン
  "#FFD3B6", // ピーチ
  "#D4A5FF", // ラベンダー
  "#FF6B6B", // トマトレッド（アクセント）
  "#FFD700", // ゴールド（アクセント）
  "#87CEEB", // スカイブルー
  "#FFB7C5", // チェリーブロッサム
  "#B5EAD7", // セージグリーン
  "#FFC3A0", // サーモンピンク
  "#FF9999", // コーラルレッド
  "#C9B1FF", // パープルヘイズ
  "#FDFD96", // パステルイエロー
  "#77DD77", // パステルグリーン
  "#AEC6CF", // パステルブルー
  "#F3B0C3", // ローズピンク
  "#C1E1C1"  // ティーグリーン
];

// =============================================
// 4. カテゴリ一覧
// =============================================
const CATEGORIES = [
  "ライフスタイル",
  "遊び・エンタメ",
  "UI・デザイン",
  "ツール・実用"
];

// =============================================
// 5. 形状バリエーション
// =============================================
const SHAPES = ["shape-circle", "shape-square", "shape-rounded"];

// =============================================
// 6. グローバル変数
// =============================================
let engine, world, runner, mouseConstraint;
let bodies = [];         // Matter.jsの物理ボディ配列
let domElements = [];    // 対応するDOM要素配列
let itemSize = 60;       // 各アイテムのサイズ（初期値、後で計算）
let currentMode = "normal"; // normal | aligned | filtered
let currentFilter = null;   // 現在選択中のカテゴリ
let alignTargets = null;    // 整列モード時のターゲット座標
let alignFrameCount = 0;    // 整列開始からのフレーム数
let walls = [];          // 壁（境界）ボディ配列
let headerHeight = 100;  // ヘッダー＋コントロールの高さ
// 通常時のコリジョンフィルター設定を保存
let originalCollisionFilters = [];
// ドラッグ中のアプリインデックスを保持（ドロップゾーン判定用）
let draggedAppIndex = -1;
// 整列モード中にドラッグされているか（enddragで整列位置に戻す判定用）
let isDraggingInAligned = false;
// 【修正2】 ワープホール用の固定物理ボディ
let warpHoleBody = null;

// =============================================
// 7. ユーティリティ関数
// =============================================

/**
 * アプリのリンクURLを生成する
 * 実際のリポジトリのフォルダ名に基づくURL
 */
function generateLink(app) {
  // 3桁ゼロ埋めのID
  const paddedId = String(app.id).padStart(3, "0");
  // スラッグマップから取得
  const slug = SLUG_MAP[app.id] || "Unknown";
  return "https://lialle-aboojr.github.io/Antigravity-100apps-knock-apps/"
    + paddedId + "_" + slug + "/index.html";
}

/**
 * XSS対策: テキストを安全にDOM要素に設定する
 * textContentを使用し、innerHTMLは使わない
 */
function safeSetText(element, text) {
  element.textContent = text;
}

/**
 * アイテムサイズを画面に基づいて計算する
 * モバイル端末では従来の1.5倍のサイズにする
 */
function calculateItemSize() {
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var isMobile = vw <= 768;

  if (isMobile) {
    // モバイル: PC版の計算結果をベースに1.5倍にする
    var mobileBaseSize = Math.floor(vw * 0.085);
    var mobileSize = Math.round(mobileBaseSize * 1.5);
    return Math.max(45, Math.min(64, mobileSize));
  } else {
    // PC: 面積ベースの従来計算
    var area = vw * vh;
    var baseSize = Math.sqrt((area * 0.8) / 100) * 1.1;
    return Math.max(50, Math.min(120, baseSize));
  }
}

/**
 * ヘッダーとコントロールの合計高さを計測する
 */
function measureHeaderHeight() {
  const header = document.getElementById("app-header");
  const controls = document.getElementById("controls");
  const hh = header ? header.offsetHeight : 0;
  const ch = controls ? controls.offsetHeight : 0;
  return hh + ch + 8; // 余白
}

/**
 * ドロップゾーンの表示・非表示を制御する
 */
function showDropZone() {
  var dz = document.getElementById("drop-zone");
  if (dz) dz.classList.add("visible");
}

function hideDropZone() {
  var dz = document.getElementById("drop-zone");
  if (dz) {
    dz.classList.remove("visible");
    dz.classList.remove("highlight");
  }
}

/**
 * 【修正4】 マウス位置がドロップゾーンのワープホール内にあるか判定する
 * .drop-zone-hole 要素の円形範囲で当たり判定を行う
 */
function isInDropZone(mouseX, mouseY) {
  var hole = document.querySelector(".drop-zone-hole");
  if (!hole) return false;
  var rect = hole.getBoundingClientRect();
  // 円形の中心と半径を計算
  var cx = rect.left + rect.width / 2;
  var cy = rect.top + rect.height / 2;
  var radius = rect.width / 2;
  // マウス位置と中心の距離
  var dx = mouseX - cx;
  var dy = mouseY - cy;
  var dist = Math.sqrt(dx * dx + dy * dy);
  // 少し余裕を持たせた判定（半径の1.3倍）— サイズが大きくなったので適切な余裕
  return dist <= radius * 1.3;
}

/**
 * 【修正2】 ワープホールのDOM位置から、物理ボディの中心座標を計算する
 */
function getWarpHolePhysicsPosition() {
  var hole = document.querySelector(".drop-zone-hole");
  if (!hole) return null;
  var rect = hole.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    radius: rect.width / 2
  };
}

/**
 * 【修正2】 ワープホールの固定物理ボディを生成・更新する
 * アイコンがワープホールを覆い隠さないようにする
 */
function createOrUpdateWarpHoleBody() {
  var pos = getWarpHolePhysicsPosition();
  if (!pos) return;

  // 既存のボディがあれば位置・サイズを更新
  if (warpHoleBody) {
    Matter.Body.setPosition(warpHoleBody, { x: pos.x, y: pos.y });
    // 半径が変わった場合は再生成が必要（Matter.jsはサイズ変更不可のため）
    var currentRadius = warpHoleBody.circleRadius;
    if (Math.abs(currentRadius - pos.radius) > 5) {
      Matter.Composite.remove(world, warpHoleBody);
      warpHoleBody = null;
    } else {
      return; // 位置だけ更新して終了
    }
  }

  // 新規生成: ワープホールと同じ位置・サイズの固定円形ボディ
  warpHoleBody = Matter.Bodies.circle(pos.x, pos.y, pos.radius * 0.85, {
    isStatic: true,
    label: "warp-hole-barrier",
    restitution: 0.6,
    friction: 0.1,
    // マウスのドラッグ対象にならないようにする
    collisionFilter: {
      group: 0,
      category: 0x0004,
      mask: 0x0001  // 通常のアイテム（category: 0x0001相当）と衝突する
    }
  });

  Matter.Composite.add(world, warpHoleBody);
}

/**
 * 【修正2】 ワープホールの物理ボディを除去する
 */
function removeWarpHoleBody() {
  if (warpHoleBody) {
    if (Matter.Composite.allBodies(world).includes(warpHoleBody)) {
      Matter.Composite.remove(world, warpHoleBody);
    }
    warpHoleBody = null;
  }
}

// =============================================
// 8. Matter.js 初期化
// =============================================
function initPhysics() {
  // Matter.jsモジュールの展開
  var Engine = Matter.Engine;
  var World = Matter.World;
  var Bodies = Matter.Bodies;
  var Runner = Matter.Runner;
  var Mouse = Matter.Mouse;
  var MouseConstraint = Matter.MouseConstraint;
  var Events = Matter.Events;

  // enableSleeping: true でモジモジ問題を解消
  engine = Engine.create({
    enableSleeping: true
  });
  world = engine.world;
  engine.gravity.y = 1.2; // やや強めの重力で迫力を出す

  // ランナー生成・起動
  runner = Runner.create();
  Runner.run(runner, engine);

  // 壁（境界）の生成
  createWalls();

  // マウスコンストレイント設定
  var container = document.getElementById("toybox-container");
  var mouse = Mouse.create(container);

  // デバイスピクセル比の補正を無効化（DOM座標系に合わせる）
  mouse.pixelRatio = 1;

  mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
      stiffness: 0.2,   // バネの硬さ（柔らかめでピクミン風のふわっと感）
      damping: 0.1,
      render: { visible: false }
    }
  });

  // コンストレイントをワールドに追加
  World.add(world, mouseConstraint);

  // 【修正2】 ワープホール用の固定ボディを初期生成
  // DOMレンダリング後に座標を取得するため少し遅延
  setTimeout(function () {
    createOrUpdateWarpHoleBody();
  }, 100);

  // --- ドラッグイベント: つかむとフワッと拡大＋詳細パネル表示＋ドロップゾーン表示 ---
  Events.on(mouseConstraint, "startdrag", function (event) {
    var body = event.body;
    if (!body || body.isStatic) return;
    // ラベルからアプリインデックスを取得
    var idx = parseInt(body.label, 10);
    if (isNaN(idx) || idx < 0 || idx >= APPS.length) return;

    // スリープ中のボディを起こす
    Matter.Sleeping.set(body, false);

    // ドラッグ中のインデックスを保持
    draggedAppIndex = idx;

    // 整列モード中のドラッグフラグ
    if (currentMode === "aligned") {
      isDraggingInAligned = true;
      // 整列中のドラッグ時、コリジョンを一時的に無効化してスムーズに動かす
      body.collisionFilter = {
        group: -1,
        category: 0x0001,
        mask: 0x0000  // ドラッグ中は何とも衝突しない
      };
    }

    // DOM要素をドラッグ状態にする（CSS拡大）
    var el = domElements[idx];
    if (el) {
      el.classList.add("dragging");
      // フワッと2.5倍に拡大
      el.style.transition = "transform 0.1s ease-out, box-shadow 0.2s ease, filter 0.2s ease";
    }

    // 詳細パネルを表示
    showDetailPanel(APPS[idx]);

    // ドロップゾーンを表示
    showDropZone();
  });

  // --- ドラッグ終了: ドロップゾーン判定 + 整列時の帰還処理 ---
  Events.on(mouseConstraint, "enddrag", function (event) {
    var body = event.body;
    if (!body) return;
    var idx = parseInt(body.label, 10);
    if (isNaN(idx) || idx < 0 || idx >= APPS.length) return;

    // ドラッグ状態を解除
    var el = domElements[idx];
    if (el) {
      el.classList.remove("dragging");
      el.style.transition = "";
    }

    // 【修正4】 Matter.jsのenddragイベント内でドロップゾーン判定（確実な発火）
    var mousePos = event.mouse.position;
    var droppedInHole = isInDropZone(mousePos.x, mousePos.y);

    if (droppedInHole) {
      // ドロップホール内 → アプリを新規タブで開く
      var url = generateLink(APPS[idx]);
      window.open(url, "_blank", "noopener,noreferrer");
    }

    // 整列モード中にドラッグしてホール外で離した場合 → 元の整列位置に戻す
    if (currentMode === "aligned" && isDraggingInAligned) {
      isDraggingInAligned = false;
      // コリジョンフィルターを整列用に戻す
      body.collisionFilter = {
        group: -1,
        category: 0x0001,
        mask: 0x0002
      };

      if (!droppedInHole && alignTargets && alignTargets[idx]) {
        // 元の整列位置にアニメーションで戻す
        var target = alignTargets[idx];
        Matter.Body.setVelocity(body, { x: 0, y: 0 });
        Matter.Body.setAngularVelocity(body, 0);
        // ターゲットに向かって「吸い寄せ」力を加えて即座に移動開始
        var dx = target.x - body.position.x;
        var dy = target.y - body.position.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          var forceMag = 0.05;
          Matter.Body.applyForce(body, body.position, {
            x: (dx / dist) * forceMag,
            y: (dy / dist) * forceMag
          });
        }
      }
    }

    // ドロップゾーンを非表示
    hideDropZone();
    draggedAppIndex = -1;

    // 詳細パネルを非表示
    hideDetailPanel();
  });

  // --- マウス移動中のドロップゾーンハイライト ---
  Events.on(mouseConstraint, "mousemove", function (event) {
    if (draggedAppIndex < 0) return;
    var mousePos = mouseConstraint.mouse.position;
    var dz = document.getElementById("drop-zone");
    if (dz && dz.classList.contains("visible")) {
      if (isInDropZone(mousePos.x, mousePos.y)) {
        dz.classList.add("highlight");
      } else {
        dz.classList.remove("highlight");
      }
    }
  });

  // --- 毎フレームのDOM同期ループ ---
  Events.on(engine, "afterUpdate", syncDOMWithPhysics);
}

// =============================================
// 9. 壁（境界ボディ）の生成
// =============================================
function createWalls() {
  var Bodies = Matter.Bodies;
  var World = Matter.World;
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  var wallThickness = 60;

  // 既存の壁を除去
  if (walls.length > 0) {
    Matter.Composite.remove(world, walls);
    walls = [];
  }

  // 地面（下）
  var ground = Bodies.rectangle(
    vw / 2, vh + wallThickness / 2,
    vw * 3, wallThickness,
    { isStatic: true, label: "wall-ground", friction: 0.5 }
  );
  // 左壁
  var leftWall = Bodies.rectangle(
    -wallThickness / 2, vh / 2,
    wallThickness, vh * 3,
    { isStatic: true, label: "wall-left" }
  );
  // 右壁
  var rightWall = Bodies.rectangle(
    vw + wallThickness / 2, vh / 2,
    wallThickness, vh * 3,
    { isStatic: true, label: "wall-right" }
  );

  walls = [ground, leftWall, rightWall];
  World.add(world, walls);
}

// =============================================
// 10. DOM要素とPhysicsボディの生成
// =============================================
function createItems() {
  var container = document.getElementById("toybox-container");
  var Bodies = Matter.Bodies;
  var World = Matter.World;
  var vw = window.innerWidth;

  // アイテムサイズ計算
  itemSize = calculateItemSize();
  headerHeight = measureHeaderHeight();

  // フォントサイズ計算（アイテムサイズに比例）
  var fontSize = Math.max(10, Math.floor(itemSize * 0.35));

  APPS.forEach(function (app, i) {
    // --- DOM要素の生成 ---
    var el = document.createElement("div");
    el.className = "toy-item";

    // ランダムな形状を割り当て
    var shapeClass = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    el.classList.add(shapeClass);

    // ランダムな色を割り当て
    var color = COLORS[i % COLORS.length];
    el.style.backgroundColor = color;

    // サイズ設定
    el.style.width = itemSize + "px";
    el.style.height = itemSize + "px";
    el.style.fontSize = fontSize + "px";

    // 通し番号を表示（XSS安全: textContent使用）
    safeSetText(el, String(app.id));

    // 画面外に初期配置（アニメーション前）
    el.style.transform = "translate(-9999px, -9999px)";
    el.style.display = "none";

    container.appendChild(el);
    domElements.push(el);

    // --- 物理ボディの生成 ---
    // Y座標を-2000〜-100の間でランダムに散らす（画面外上空から時間差で降る）
    var x = Math.random() * (vw - itemSize) + itemSize / 2;
    var y = -100 - Math.random() * 1900; // -100〜-2000の範囲
    var radius = itemSize / 2;

    var body = Bodies.circle(x, y, radius, {
      restitution: 0.8,      // 反発力を0.8に下げて落ち着きやすく
      friction: 0.2,          // 摩擦
      frictionAir: 0.01,      // 空気抵抗
      density: 0.002,         // 密度
      label: String(i),       // インデックスをラベルとして保存
      sleepThreshold: 60      // スリープに入るまでのフレーム閾値
    });

    bodies.push(body);
  });

  // 全ボディをまとめてワールドに追加
  World.add(world, bodies);

  // 上からドカドカ降ってくるアニメーション（時間差で表示）
  startDropAnimation();
}

// =============================================
// 11. 初期ドロップアニメーション（上から落下）
// =============================================
function startDropAnimation() {
  APPS.forEach(function (app, i) {
    setTimeout(function () {
      var el = domElements[i];
      if (el) {
        el.style.display = "flex";
      }
    }, i * 25); // 25ms間隔で順番に出現（約2.5秒で全出現）
  });
}

// =============================================
// 12. DOM要素と物理ボディの位置同期
// =============================================
function syncDOMWithPhysics() {
  var halfSize = itemSize / 2;
  // ドラッグ中のアイテムの拡大スケール
  var dragScale = 2.5;

  for (var i = 0; i < bodies.length; i++) {
    var body = bodies[i];
    var el = domElements[i];
    if (!el || !body) continue;

    // 非表示要素はスキップ
    if (el.style.display === "none") continue;

    var x = body.position.x - halfSize;
    var y = body.position.y - halfSize;
    var angle = body.angle;

    // ドラッグ中なら拡大表示
    if (el.classList.contains("dragging")) {
      el.style.transform =
        "translate(" + x + "px, " + y + "px) rotate(" + angle + "rad) scale(" + dragScale + ")";
    } else {
      el.style.transform =
        "translate(" + x + "px, " + y + "px) rotate(" + angle + "rad)";
    }
  }

  // 整列モード中: ボディをターゲット座標に向けてスムーズに移動
  // ドラッグ中のアイテムは整列吸い寄せから除外
  if (currentMode === "aligned" && alignTargets) {
    alignFrameCount++;
    // 補間係数: フレームが進むほど直接配置に近づく
    var lerpFactor = Math.min(0.15, 0.03 + alignFrameCount * 0.002);

    for (var j = 0; j < bodies.length; j++) {
      if (!alignTargets[j]) continue;
      // ドラッグ中のアイテムはスキップ（自由に動かせるようにする）
      if (j === draggedAppIndex && isDraggingInAligned) continue;

      var b = bodies[j];
      var target = alignTargets[j];
      // ターゲットとの差分ベクトル
      var dx = target.x - b.position.x;
      var dy = target.y - b.position.y;
      var dist = Math.sqrt(dx * dx + dy * dy);

      // 十分近ければ直接固定（振動を防止）
      if (dist < 1) {
        Matter.Body.setPosition(b, target);
        Matter.Body.setVelocity(b, { x: 0, y: 0 });
        Matter.Body.setAngle(b, 0);
        Matter.Body.setAngularVelocity(b, 0);
      } else {
        // 線形補間でスムーズに移動
        var newX = b.position.x + dx * lerpFactor;
        var newY = b.position.y + dy * lerpFactor;
        Matter.Body.setPosition(b, { x: newX, y: newY });
        // 速度を強くダンピング
        Matter.Body.setVelocity(b, {
          x: b.velocity.x * 0.3,
          y: b.velocity.y * 0.3
        });
        // 回転を停止へ
        Matter.Body.setAngle(b, b.angle * 0.9);
        Matter.Body.setAngularVelocity(b, b.angularVelocity * 0.3);
      }
    }
  }
}

// =============================================
// 13. 詳細パネルの表示・非表示
// =============================================
function showDetailPanel(app) {
  var panel = document.getElementById("detail-panel");
  var numEl = document.getElementById("panel-number");
  var nameEl = document.getElementById("panel-name");
  var catEl = document.getElementById("panel-category");
  var linkEl = document.getElementById("panel-link");

  // XSS安全にテキスト設定（textContent使用）
  safeSetText(numEl, "#" + app.id);
  safeSetText(nameEl, app.name);
  safeSetText(catEl, app.category);

  // リンク設定（安全にsetAttribute使用）
  var url = generateLink(app);
  linkEl.setAttribute("href", url);

  // パネルスライドイン
  panel.classList.remove("panel-hidden");
  panel.classList.add("panel-visible");
}

function hideDetailPanel() {
  var panel = document.getElementById("detail-panel");
  panel.classList.remove("panel-visible");
  panel.classList.add("panel-hidden");
}

// =============================================
// 14. 整列機能（番号順グリッド配置）
// =============================================
function alignItems() {
  var btnAlign = document.getElementById("btn-align");

  // 既に整列モードなら解除
  if (currentMode === "aligned") {
    currentMode = "normal";
    alignTargets = null;
    alignFrameCount = 0;
    engine.gravity.y = 1.2;
    btnAlign.classList.remove("active");

    // コリジョンフィルターを元に戻す
    bodies.forEach(function (body, i) {
      Matter.Body.setStatic(body, false);
      // スリープを解除して落下を再開
      Matter.Sleeping.set(body, false);
      if (originalCollisionFilters[i]) {
        body.collisionFilter = originalCollisionFilters[i];
      }
    });

    return;
  }

  // 整列モードに切り替え
  currentMode = "aligned";
  currentFilter = null;
  alignFrameCount = 0;
  btnAlign.classList.add("active");

  // カテゴリボタンのアクティブ状態を解除
  clearCategoryActive();

  // 重力を無効化
  engine.gravity.y = 0;

  // グリッドのレイアウト計算
  var vw = window.innerWidth;
  var vh = window.innerHeight;
  headerHeight = measureHeaderHeight();
  var padding = 10;
  var gap = 4;

  // 利用可能な領域に収まるように列数を計算
  var availWidth = vw - padding * 2;
  var availHeight = vh - headerHeight - padding * 2;
  var cols = Math.floor(availWidth / (itemSize + gap));
  if (cols < 1) cols = 1;
  var rows = Math.ceil(APPS.length / cols);

  // アイテムサイズが大きすぎる場合、縮小して収まるようにする
  var gridItemSize = itemSize;
  var totalGridHeight = rows * (gridItemSize + gap);
  if (totalGridHeight > availHeight) {
    gridItemSize = Math.floor((availHeight / rows) - gap);
    if (gridItemSize < 30) gridItemSize = 30;
  }

  // グリッドの開始X位置を中央揃え
  var gridWidth = cols * (gridItemSize + gap) - gap;
  var startX = (vw - gridWidth) / 2 + gridItemSize / 2;
  var startY = headerHeight + padding + gridItemSize / 2;

  // ID順に並べたターゲット座標を計算
  alignTargets = [];
  // APPSを正しいインデックス順で処理
  var sortedIndices = APPS.map(function (app, i) { return i; });
  sortedIndices.sort(function (a, b) { return APPS[a].id - APPS[b].id; });

  // 全ボディの整列ターゲットを設定
  var posMap = {};
  sortedIndices.forEach(function (origIdx, sortPosition) {
    var col = sortPosition % cols;
    var row = Math.floor(sortPosition / cols);
    posMap[origIdx] = {
      x: startX + col * (gridItemSize + gap),
      y: startY + row * (gridItemSize + gap)
    };
  });

  for (var i = 0; i < APPS.length; i++) {
    alignTargets.push(posMap[i] || { x: vw / 2, y: vh / 2 });
    // 速度をリセット
    Matter.Body.setVelocity(bodies[i], { x: 0, y: 0 });
    Matter.Body.setAngularVelocity(bodies[i], 0);

    // スリープを解除
    Matter.Sleeping.set(bodies[i], false);

    // 整列中はアイテム同士のコリジョンを無効化（壁とは衝突可能）
    originalCollisionFilters[i] = Object.assign({}, bodies[i].collisionFilter);
    bodies[i].collisionFilter = {
      group: -1,       // 負のグループ: 同グループのボディとは衝突しない
      category: 0x0001,
      mask: 0x0002     // 壁のみと衝突
    };

    // ボディを見えるようにする（フィルター後の場合）
    if (!Matter.Composite.allBodies(world).includes(bodies[i])) {
      Matter.Composite.add(world, bodies[i]);
    }
    domElements[i].style.display = "flex";
  }
}

// =============================================
// 15. カテゴリフィルター（弾き出し絞り込み）
// =============================================
function filterByCategory(category) {
  // モード変更
  currentMode = "filtered";
  currentFilter = category;
  alignTargets = null;

  // 整列ボタンのアクティブ解除
  document.getElementById("btn-align").classList.remove("active");

  // 重力を復活
  engine.gravity.y = 1.2;

  // 全アイテムをまずワールドに戻す
  APPS.forEach(function (app, i) {
    if (!Matter.Composite.allBodies(world).includes(bodies[i])) {
      Matter.Composite.add(world, bodies[i]);
      domElements[i].style.display = "flex";
    }
    // スリープを解除
    Matter.Sleeping.set(bodies[i], false);
  });

  // 該当しないアイテムに強力な力を適用して弾き飛ばす
  APPS.forEach(function (app, i) {
    if (app.category !== category) {
      var body = bodies[i];
      // ランダムな方向の強い力（主に上向き）
      var forceX = (Math.random() - 0.5) * 0.8;
      var forceY = -(0.3 + Math.random() * 0.5);
      Matter.Body.applyForce(body, body.position, {
        x: forceX,
        y: forceY
      });

      // 少し遅れてワールドから除去し、DOM要素を非表示
      setTimeout(function () {
        if (Matter.Composite.allBodies(world).includes(body)) {
          Matter.Composite.remove(world, body);
        }
        domElements[i].style.display = "none";
      }, 700);
    }
  });
}

// =============================================
// 16. リセット（すべて表示・再ドロップ）
// =============================================
function resetAll() {
  // モード初期化
  currentMode = "normal";
  currentFilter = null;
  alignTargets = null;
  alignFrameCount = 0;

  // ボタン状態リセット
  document.getElementById("btn-align").classList.remove("active");
  clearCategoryActive();

  // 重力を復活
  engine.gravity.y = 1.2;

  var vw = window.innerWidth;

  // 全アイテムを再配置
  APPS.forEach(function (app, i) {
    var body = bodies[i];

    // コリジョンフィルターを元に戻す（整列モードで変更されている場合）
    if (originalCollisionFilters[i]) {
      body.collisionFilter = originalCollisionFilters[i];
    }

    // ワールドにいなければ追加
    if (!Matter.Composite.allBodies(world).includes(body)) {
      Matter.Composite.add(world, body);
    }

    // Y座標を-2000〜-100の間でランダムに散らす
    var x = Math.random() * (vw - itemSize) + itemSize / 2;
    var y = -100 - Math.random() * 1900;
    Matter.Body.setPosition(body, { x: x, y: y });
    Matter.Body.setVelocity(body, { x: 0, y: 0 });
    Matter.Body.setAngle(body, 0);
    Matter.Body.setAngularVelocity(body, 0);
    Matter.Body.setStatic(body, false);
    // スリープを解除して落下再開
    Matter.Sleeping.set(body, false);

    // DOM要素を一旦非表示（ドロップアニメーションで順次表示する）
    domElements[i].style.display = "none";
  });

  // 時間差で再ドロップ
  startDropAnimation();
}

// =============================================
// 17. カテゴリボタンのアクティブ状態管理
// =============================================
function clearCategoryActive() {
  var catButtons = document.querySelectorAll(".ctrl-btn--cat");
  catButtons.forEach(function (btn) {
    btn.classList.remove("active");
  });
}

// =============================================
// 18. イベントリスナー設定
// =============================================
function setupEventListeners() {
  // 整列ボタン
  document.getElementById("btn-align").addEventListener("click", function () {
    alignItems();
  });

  // リセットボタン
  document.getElementById("btn-reset").addEventListener("click", function () {
    resetAll();
  });

  // カテゴリフィルターボタン
  var catButtons = document.querySelectorAll(".ctrl-btn--cat");
  catButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var category = btn.getAttribute("data-category");

      // 同じカテゴリを再度押したらリセット
      if (currentFilter === category) {
        resetAll();
        return;
      }

      // アクティブ状態を更新
      clearCategoryActive();
      btn.classList.add("active");

      // フィルター実行
      filterByCategory(category);
    });
  });

  // ウィンドウリサイズ時の壁更新 + ワープホール物理ボディ追従
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      createWalls();
      headerHeight = measureHeaderHeight();
      // 【修正2】 ワープホール物理ボディの位置を再計算・追従
      removeWarpHoleBody();
      createOrUpdateWarpHoleBody();
    }, 200);
  });
}

// =============================================
// 19. ヘッダーの位置調整
//     controlsの下にtoybox-containerが表示されるよう
//     コントロールバーの高さ分だけヘッダーをずらす
// =============================================
function adjustLayout() {
  var header = document.getElementById("app-header");
  var controls = document.getElementById("controls");
  if (header && controls) {
    var hh = header.offsetHeight;
    controls.style.top = hh + "px";
  }
}

// =============================================
// 20. メイン初期化
// =============================================
function init() {
  // レイアウト調整
  adjustLayout();

  // 物理エンジン初期化
  initPhysics();

  // アイテム生成
  createItems();

  // イベントリスナー設定
  setupEventListeners();
}

// =============================================
// アプリケーション起動
// =============================================
document.addEventListener("DOMContentLoaded", init);
