"use strict";

// DOM要素の取得
const pianoContainer = document.getElementById("piano");
const unlockBtn = document.getElementById("unlock-audio-btn");
const waveformSelect = document.getElementById("waveform-select"); // 音色選択用のセレクトボックス

// 録音機能のための変数とDOM要素
let isRecording = false;
let isPlaying = false;
let recordStartTime = 0;
let recordedNotes = []; // { midi, startTime, duration } の配列。弾いた音を記録
let activeRecordNotes = {}; // midi -> startTime の連想配列。現在押されている鍵盤の開始時刻を管理
let playbackTimeouts = []; // 再生中の setTimeout ID の配列

const recordBtn = document.getElementById("record-btn");
const stopBtn = document.getElementById("stop-btn");
const playBtn = document.getElementById("play-btn");
const clearBtn = document.getElementById("clear-btn");

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
 * 録音UI・ボタン状態の更新
 */
function updateUIControls() {
    if (isRecording) {
        recordBtn.classList.add("recording");
        recordBtn.disabled = true;
        playBtn.disabled = true;
        clearBtn.disabled = true;
        stopBtn.disabled = false;
    } else if (isPlaying) {
        playBtn.classList.add("playing");
        recordBtn.disabled = true;
        playBtn.disabled = true;
        clearBtn.disabled = true;
        stopBtn.disabled = false;
    } else {
        recordBtn.classList.remove("recording");
        playBtn.classList.remove("playing");
        recordBtn.disabled = false;
        stopBtn.disabled = true;
        
        const hasNotes = recordedNotes.length > 0;
        playBtn.disabled = !hasNotes;
        clearBtn.disabled = !hasNotes;
    }
}

// 録音開始イベント
recordBtn.addEventListener("click", () => {
    if (isPlaying) return;
    initAudio(); // 録音開始時にもAudio初期化を試みる
    
    // 録音状態リセット
    isRecording = true;
    recordedNotes = [];
    activeRecordNotes = {};
    recordStartTime = performance.now();
    
    updateUIControls();
});

// 録音・再生停止イベント
stopBtn.addEventListener("click", () => {
    // 録音中だった場合の処理
    if (isRecording) {
        isRecording = false;
        const now = performance.now();
        
        // 録音停止時にまだ押しっぱなしの鍵盤があれば、そこまでの長さで記録する
        for (let midi in activeRecordNotes) {
            const start = activeRecordNotes[midi];
            recordedNotes.push({
                midi: parseInt(midi),
                startTime: start,
                duration: (now - recordStartTime) - start
            });
        }
        activeRecordNotes = {}; // リセット
    }
    
    // 再生中だった場合の処理
    if (isPlaying) {
        isPlaying = false;
        // 予約済みのすべての再生タイマーをキャンセル
        playbackTimeouts.forEach(t => clearTimeout(t));
        playbackTimeouts = [];
        
        // 再生中だった音をすべて強制停止する
        KEYS.forEach(k => stopPlaying(k, true));
    }
    
    updateUIControls();
});

// 再生開始イベント
playBtn.addEventListener("click", () => {
    // 録音なし、または他の動作中の場合は無視
    if (isRecording || isPlaying || recordedNotes.length === 0) return;
    
    initAudio();
    isPlaying = true;
    updateUIControls();
    
    let maxEndTime = 0;
    
    // 記録された各音階に対してタイマーをセット
    recordedNotes.forEach(note => {
        const keyInfo = KEYS.find(k => k.midi === note.midi);
        if (!keyInfo) return;
        
        const startTime = note.startTime;
        const endTime = note.startTime + note.duration;
        
        if (endTime > maxEndTime) {
            maxEndTime = endTime;
        }
        
        // 発音開始の予約
        const t1 = setTimeout(() => {
            if (!isPlaying) return;
            startPlaying(null, keyInfo, true); // trueはplayback中であることを示すフラグ
        }, startTime);
        
        // 発音停止の予約
        const t2 = setTimeout(() => {
            if (!isPlaying) return;
            stopPlaying(keyInfo, true);
        }, endTime);
        
        playbackTimeouts.push(t1, t2);
    });
    
    // 全ての音が鳴り終わった後（+500msの余韻確保後）に自動停止状態に戻す
    const tEnd = setTimeout(() => {
        if (isPlaying) {
            stopBtn.click(); // 停止時と同じ処理を呼ぶ
        }
    }, maxEndTime + 500);
    playbackTimeouts.push(tEnd);
});

// 録音データ消去イベント
clearBtn.addEventListener("click", () => {
    if (isRecording || isPlaying) return;
    recordedNotes = [];
    updateUIControls();
});

/**
 * 鍵盤UIの動的生成
 */
function initPiano() {
    KEYS.forEach(keyInfo => {
        // 鍵盤要素（<div>）の作成
        const keyEl = document.createElement("div");
        keyEl.className = `key ${keyInfo.type}-key`;
        keyEl.dataset.midi = keyInfo.midi;
        
        // キーのヒント（文字）を挿入
        const span = document.createElement("span");
        span.textContent = sanitizeText(keyInfo.keyMap);
        keyEl.appendChild(span);
        
        // ====== マウス・タッチイベントの登録 ====== //
        keyEl.addEventListener("mousedown", (e) => startPlaying(e, keyInfo));
        keyEl.addEventListener("touchstart", (e) => {
            e.preventDefault(); 
            startPlaying(e, keyInfo);
        }, { passive: false });
        
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
 */
function initAudio() {
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
        
        if (unlockBtn) {
            unlockBtn.classList.add("hidden");
        }
    }
    
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

unlockBtn.addEventListener("click", initAudio);

/**
 * 音を鳴らす関数
 * @param {Event} event マウス/タッチイベント本体（キーボード・自動再生の場合はnull）
 * @param {Object} keyInfo KEYS配列内の該当キーデータ
 * @param {Boolean} isPlayback 自動再生中かどうかのフラグ
 */
function startPlaying(event, keyInfo, isPlayback = false) {
    initAudio();
    
    // すでに同じ音が鳴っている場合は無視する
    if (activeOscillators[keyInfo.midi]) return;
    
    // 録音中で、かつユーザー自身が弾いた場合（再生機能からの呼び出しではない場合）、弾き始めのタイミングを記録
    if (isRecording && !isPlayback) {
        activeRecordNotes[keyInfo.midi] = performance.now() - recordStartTime;
    }
    
    // UIをハイライト（色を変えてへこませる）
    const keyEl = document.querySelector(`.key[data-midi="${keyInfo.midi}"]`);
    if (keyEl) {
        keyEl.classList.add("active");
    }
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    // セレクトボックスで選ばれた音色（波形）を適用する
    oscillator.type = waveformSelect.value;
    oscillator.frequency.value = getFrequency(keyInfo.midi);
    
    const now = audioCtx.currentTime;
    
    // エンベロープ設定（音の立ち上がりを調整）
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.8, now + 0.05);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start(now);
    
    activeOscillators[keyInfo.midi] = {
        oscillator: oscillator,
        gainNode: gainNode
    };
}

/**
 * 音を止める関数
 * @param {Object} keyInfo KEYS配列内の該当キーデータ
 * @param {Boolean} isPlayback 自動再生中かどうかのフラグ
 */
function stopPlaying(keyInfo, isPlayback = false) {
    const activeData = activeOscillators[keyInfo.midi];
    if (!activeData) return;
    
    // 録音中で、かつこの音が記録対象である場合、音の長さを計算して配列に保存
    if (isRecording && !isPlayback && activeRecordNotes[keyInfo.midi] !== undefined) {
        const start = activeRecordNotes[keyInfo.midi];
        const duration = (performance.now() - recordStartTime) - start;
        
        recordedNotes.push({
            midi: keyInfo.midi,
            startTime: start,
            duration: duration
        });
        
        delete activeRecordNotes[keyInfo.midi]; // 記録完了したので削除
    }
    
    // UIのハイライトを元に戻す
    const keyEl = document.querySelector(`.key[data-midi="${keyInfo.midi}"]`);
    if (keyEl) {
        keyEl.classList.remove("active");
    }
    
    const now = audioCtx.currentTime;
    
    // エンベロープ設定（音の消え方を調整）
    activeData.gainNode.gain.setValueAtTime(activeData.gainNode.gain.value, now);
    activeData.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    
    activeData.oscillator.stop(now + 0.3);
    delete activeOscillators[keyInfo.midi];
}

// ====== キーボード連動処理 ====== //
window.addEventListener("keydown", (e) => {
    if (e.repeat) return;
    
    const key = e.key.toUpperCase();
    const keyInfo = KEYS.find(k => k.keyMap === key);
    
    if (keyInfo) {
        startPlaying(null, keyInfo); // ユーザー操作なので第3引数はデフォルトのfalse
    }
});

window.addEventListener("keyup", (e) => {
    const key = e.key.toUpperCase();
    const keyInfo = KEYS.find(k => k.keyMap === key);
    
    if (keyInfo) {
        stopPlaying(keyInfo); // 同様に第3引数はfalse
    }
});

// ページ読み込み完了時に鍵盤を生成する
document.addEventListener("DOMContentLoaded", initPiano);
