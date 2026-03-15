"use strict";

// DOM要素の取得
const pianoContainer = document.getElementById("piano");
const unlockBtn = document.getElementById("unlock-audio-btn");

// AudioContext（Web Audio APIのコア機能）の準備
let audioCtx = null;

/**
 * MIDIノート番号から周波数（Hz）を計算する関数
 * A4(ラ) = 440Hz を基準とした平均律計算
 */
function getFrequency(midiNumber) {
    const A4_FREQ = 440;
    const A4_INDEX = 69; // A4はMIDI規格で69番
    return A4_FREQ * Math.pow(2, (midiNumber - A4_INDEX) / 12);
}

// 25鍵盤（C4〜C6）の設定データ
// type: 白鍵(white)か黒鍵(black)か
// keyMap: 対応するPCのキーボード
// midi: 音階のMIDIノート番号（C4が60）
const KEYS = [
    { note: "C4", type: "white", keyMap: "Z", midi: 60 },
    { note: "C#4", type: "black", keyMap: "S", midi: 61 },
    { note: "D4", type: "white", keyMap: "X", midi: 62 },
    { note: "D#4", type: "black", keyMap: "D", midi: 63 },
    { note: "E4", type: "white", keyMap: "C", midi: 64 },
    { note: "F4", type: "white", keyMap: "V", midi: 65 },
    { note: "F#4", type: "black", keyMap: "G", midi: 66 },
    { note: "G4", type: "white", keyMap: "B", midi: 67 },
    { note: "G#4", type: "black", keyMap: "H", midi: 68 },
    { note: "A4", type: "white", keyMap: "N", midi: 69 },
    { note: "A#4", type: "black", keyMap: "J", midi: 70 },
    { note: "B4", type: "white", keyMap: "M", midi: 71 },
    
    { note: "C5", type: "white", keyMap: "Q", midi: 72 },
    { note: "C#5", type: "black", keyMap: "2", midi: 73 },
    { note: "D5", type: "white", keyMap: "W", midi: 74 },
    { note: "D#5", type: "black", keyMap: "3", midi: 75 },
    { note: "E5", type: "white", keyMap: "E", midi: 76 },
    { note: "F5", type: "white", keyMap: "R", midi: 77 },
    { note: "F#5", type: "black", keyMap: "5", midi: 78 },
    { note: "G5", type: "white", keyMap: "T", midi: 79 },
    { note: "G#5", type: "black", keyMap: "6", midi: 80 },
    { note: "A5", type: "white", keyMap: "Y", midi: 81 },
    { note: "A#5", type: "black", keyMap: "7", midi: 82 },
    { note: "B5", type: "white", keyMap: "U", midi: 83 },
    
    { note: "C6", type: "white", keyMap: "I", midi: 84 }
];

// 今鳴っている音のオシレーター（発振器）を管理するオブジェクト
// 【重要】音が伸びっぱなしになるのを防ぐため、どこの鍵盤を押したかを記憶している
const activeOscillators = {};

/**
 * XSS対策用のサニタイズ関数
 * テキストとしてDOMに挿入する際に、HTMLタグとして解釈されないように無害化する処理
 */
function sanitizeText(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * 鍵盤UIの動的生成
 */
function initPiano() {
    KEYS.forEach(keyInfo => {
        // 鍵盤要素（<div>）の作成
        const keyEl = document.createElement("div");
        keyEl.className = `key ${keyInfo.type}-key`;
        
        // CSSセレクタやJavaScriptで後から指定しやすいようにデータ属性を付与
        keyEl.dataset.midi = keyInfo.midi;
        
        // キーのヒント（文字）を挿入（テキストなのでtextContentを使い、念のためサニタイズも通す）
        const span = document.createElement("span");
        span.textContent = sanitizeText(keyInfo.keyMap);
        keyEl.appendChild(span);
        
        // ====== マウス・タッチイベントの登録 ====== //
        
        // 押した時
        keyEl.addEventListener("mousedown", (e) => startPlaying(e, keyInfo));
        keyEl.addEventListener("touchstart", (e) => {
            // e.preventDefault() はスクロール防止などタッチ特有の動きを抑えるため
            e.preventDefault(); 
            startPlaying(e, keyInfo);
        }, { passive: false });
        
        // 離した時（タップ終了時や、マウスが鍵盤の外に出た時も含む）
        keyEl.addEventListener("mouseup", () => stopPlaying(keyInfo));
        keyEl.addEventListener("mouseleave", () => stopPlaying(keyInfo));
        keyEl.addEventListener("touchend", (e) => {
            e.preventDefault();
            stopPlaying(keyInfo);
        }, { passive: false });
        
        // ピアノコンテナに追加
        pianoContainer.appendChild(keyEl);
    });
}

/**
 * AudioContext（サウンドエンジン）の初期化
 * 現代のブラウザはユーザーのアクション（クリック等）なしに自動で音声を鳴らすことを防ぐため、
 * 最初のアクション時にこれを初期化・再開する必要がある。
 */
function initAudio() {
    if (!audioCtx) {
        // ブラウザごとの差異を吸収
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        
        // 準備完了後、手動アンロックボタンは消す
        if(unlockBtn) {
            unlockBtn.classList.add("hidden");
        }
    }
    
    // サスペンド（休止）状態の場合は、再開させる
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

// 明示的にボタンで解除するためのイベントリスナー
unlockBtn.addEventListener("click", initAudio);

/**
 * 音を鳴らす関数
 */
function startPlaying(event, keyInfo) {
    // 確実にAudioContextを動かせる状態にする
    initAudio();
    
    // すでに同じ音が鳴っている場合は無視する（押しっぱなしでの連打防止）
    if (activeOscillators[keyInfo.midi]) return;
    
    // UIをハイライト（色を変えてへこませる）
    const keyEl = document.querySelector(`.key[data-midi="${keyInfo.midi}"]`);
    if (keyEl) {
        keyEl.classList.add("active");
    }
    
    // オシレーター（音の発生源）と、ゲインノード（音量調整）を作成
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // 音色を「triangle（三角波）」に設定。正弦波(sine)より少し深みがあり、楽器らしくなる
    oscillator.type = "triangle";
    oscillator.frequency.value = getFrequency(keyInfo.midi);
    
    // 時間管理用の現在時刻を取得
    const now = audioCtx.currentTime;
    
    // ===== エンベロープ設定（音の立ち上がりを調整）===== //
    // いきなり最大音量にすると「プツッ」とノイズが乗るため、わずかな時間をかけて音量を上げる
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.8, now + 0.05); // 0.05秒かけて0.8まで上げる
    
    // 機器の接続ルート： 音の発生源 → 音量調整 → スピーカー出力
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // 発音開始
    oscillator.start(now);
    
    // 後で音を止められるように、管理オブジェクトに保存しておく
    activeOscillators[keyInfo.midi] = {
        oscillator: oscillator,
        gainNode: gainNode
    };
}

/**
 * 音を止める関数
 */
function stopPlaying(keyInfo) {
    const activeData = activeOscillators[keyInfo.midi];
    if (!activeData) return;
    
    // UIのハイライトを元に戻す
    const keyEl = document.querySelector(`.key[data-midi="${keyInfo.midi}"]`);
    if (keyEl) {
        keyEl.classList.remove("active");
    }
    
    const now = audioCtx.currentTime;
    
    // ===== エンベロープ設定（音の消え方を調整）===== //
    // 一瞬で音を消すと不自然なので、少し余韻を残しながら消えていくようにする
    activeData.gainNode.gain.setValueAtTime(activeData.gainNode.gain.value, now);
    activeData.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // 0.3秒かけてほぼ無音に
    
    // 完全に音が消える頃（0.3秒後）に、オシレーター自体を停止して破棄
    activeData.oscillator.stop(now + 0.3);
    
    // 管理オブジェクトから削除し、次また押せる状態にする
    delete activeOscillators[keyInfo.midi];
}

// ====== キーボード連動処理 ====== //

// キーが押された時
window.addEventListener("keydown", (e) => {
    // 押しっぱなしによるイベント連続発火を防止（OSの設定により連続入力されるのを防ぐ）
    if (e.repeat) return;
    
    // 入力されたキーを大文字に変換して、KEYSの設定データ内から合致するものを探す
    const key = e.key.toUpperCase();
    const keyInfo = KEYS.find(k => k.keyMap === key);
    
    if (keyInfo) {
        startPlaying(null, keyInfo);
    }
});

// キーが離された時
window.addEventListener("keyup", (e) => {
    const key = e.key.toUpperCase();
    const keyInfo = KEYS.find(k => k.keyMap === key);
    
    if (keyInfo) {
        stopPlaying(keyInfo);
    }
});

// ページ読み込み完了時に鍵盤を生成する
document.addEventListener("DOMContentLoaded", initPiano);
