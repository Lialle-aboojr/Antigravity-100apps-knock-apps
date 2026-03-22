/* ============================================
   Simple Screen Recorder - メインJavaScript
   画面録画の全ロジックを管理する
   ============================================ */

// 即時実行関数でスコープを保護（グローバル汚染防止）
(function () {
  'use strict';

  // ========================================
  // DOM要素の取得
  // ========================================
  const previewVideo = document.getElementById('preview-video');
  const previewPlaceholder = document.getElementById('preview-placeholder');
  const previewWrapper = document.getElementById('preview-wrapper');
  const recordingIndicator = document.getElementById('recording-indicator');
  const pausedIndicator = document.getElementById('paused-indicator');
  const recTimerBadge = document.getElementById('rec-timer-badge');
  const timerValue = document.getElementById('timer-value');
  const timerDisplay = document.getElementById('timer-display');
  const statusText = document.getElementById('status-text');
  const resultSection = document.getElementById('result-section');
  const resultVideo = document.getElementById('result-video');

  const btnShare = document.getElementById('btn-share');
  const btnMic = document.getElementById('btn-mic');
  const btnRecord = document.getElementById('btn-record');
  const btnPause = document.getElementById('btn-pause');
  const btnStop = document.getElementById('btn-stop');
  const btnDownload = document.getElementById('btn-download');
  const btnNewRecording = document.getElementById('btn-new-recording');

  // ========================================
  // アプリケーションの状態管理
  // ========================================
  let screenStream = null;       // 画面共有のストリーム
  let micStream = null;          // マイクのストリーム
  let combinedStream = null;     // 画面+音声の結合ストリーム
  let mediaRecorder = null;      // MediaRecorderインスタンス
  let recordedChunks = [];       // 録画データの断片を格納する配列
  let recordedBlobUrl = null;    // 録画完了後のBlobURL

  let isMicOn = false;           // マイクの状態
  let isRecording = false;       // 録画中フラグ
  let isPaused = false;          // 一時停止フラグ

  // タイマー関連
  let timerInterval = null;      // タイマーのsetInterval ID
  let elapsedSeconds = 0;        // 経過秒数

  // ========================================
  // ユーティリティ関数
  // ========================================

  /**
   * 秒数を HH:MM:SS 形式の文字列に変換する
   * @param {number} totalSeconds - 合計秒数
   * @returns {string} フォーマットされた時間文字列
   */
  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [hours, minutes, seconds]
      .map(function (v) { return v.toString().padStart(2, '0'); })
      .join(':');
  }

  /**
   * ステータステキストを安全に更新する（textContentを使用してXSS防止）
   * @param {string} message - 表示するメッセージ
   * @param {string} [className] - 付与するCSSクラス名
   */
  function updateStatus(message, className) {
    // innerHTMLではなくtextContentを使用（XSS対策）
    statusText.textContent = message;
    // すべてのステータスクラスをリセット
    statusText.className = 'status-text';
    if (className) {
      statusText.classList.add(className);
    }
  }

  /**
   * ファビコンのフォールバック処理
   * favicon.pngが読み込めなかった場合、SVG Data URIをセットする
   */
  function setupFaviconFallback() {
    var faviconLink = document.getElementById('favicon-link');
    if (!faviconLink) return;

    // 画像読み込みのテスト
    var testImg = new Image();
    testImg.onerror = function () {
      // SVGでビデオカメラアイコンをファビコンとして使用
      var svgFavicon = 'data:image/svg+xml,' + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">' +
        '<rect width="64" height="64" rx="12" fill="#1a1a2e"/>' +
        '<circle cx="32" cy="32" r="18" fill="#ff3b5c"/>' +
        '</svg>'
      );
      faviconLink.href = svgFavicon;
    };
    testImg.src = 'favicon.png';
  }

  // ========================================
  // 画面共有の制御
  // ========================================

  /**
   * 画面共有を開始する
   * Screen Capture APIを使用してディスプレイのストリームを取得
   */
  async function startScreenShare() {
    try {
      // getDisplayMediaが使えるかチェック
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        updateStatus('⚠️ このブラウザは画面共有に対応していません / Screen sharing is not supported', 'status-error');
        return;
      }

      // 既存のストリームがあればクリーンアップ
      if (screenStream) {
        stopScreenShare();
      }

      // 画面共有のストリームを取得（ユーザーが画面・ウィンドウ・タブを選択）
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always' // カーソルを常に表示
        },
        audio: true // システム音声も取得を試みる（ブラウザ依存）
      });

      // プレビュー表示を更新
      previewVideo.srcObject = screenStream;
      previewVideo.classList.add('active');
      previewPlaceholder.classList.add('hidden');

      // 録画ボタンを有効化
      btnRecord.disabled = false;

      // 画面共有ボタンのスタイル変更
      btnShare.classList.add('sharing');
      btnShare.querySelector('.btn-label').innerHTML = '共有中<br><small>Sharing</small>';

      updateStatus('✅ 画面共有が開始されました / Screen sharing started', 'status-success');

      // ユーザーが画面共有を停止した時のハンドラ
      screenStream.getVideoTracks()[0].addEventListener('ended', function () {
        handleScreenShareEnded();
      });

    } catch (error) {
      // ユーザーがキャンセルした場合
      if (error.name === 'NotAllowedError') {
        updateStatus('❌ 画面共有がキャンセルされました / Screen sharing was cancelled', 'status-error');
      } else if (error.name === 'NotFoundError') {
        updateStatus('❌ 共有できる画面が見つかりません / No screen found to share', 'status-error');
      } else {
        updateStatus('❌ エラーが発生しました / An error occurred: ' + error.message, 'status-error');
      }
    }
  }

  /**
   * 画面共有を停止する
   */
  function stopScreenShare() {
    if (screenStream) {
      screenStream.getTracks().forEach(function (track) {
        track.stop();
      });
      screenStream = null;
    }

    // プレビューをリセット
    previewVideo.srcObject = null;
    previewVideo.classList.remove('active');
    previewPlaceholder.classList.remove('hidden');

    // ボタンのスタイルをリセット
    btnShare.classList.remove('sharing');
    btnShare.querySelector('.btn-label').innerHTML = '画面共有<br><small>Screen Share</small>';

    // 録画中でなければ録画ボタンを無効化
    if (!isRecording) {
      btnRecord.disabled = true;
    }
  }

  /**
   * ユーザーが直接画面共有を停止した時の処理
   */
  function handleScreenShareEnded() {
    // 録画中なら録画も停止
    if (isRecording) {
      stopRecording();
    }
    stopScreenShare();
    updateStatus('画面共有が終了しました / Screen sharing ended', '');
  }

  // ========================================
  // マイクの制御
  // ========================================

  /**
   * マイクのON/OFFを切り替える
   */
  async function toggleMic() {
    if (isMicOn) {
      // マイクをOFFにする
      if (micStream) {
        micStream.getTracks().forEach(function (track) {
          track.stop();
        });
        micStream = null;
      }
      isMicOn = false;
      btnMic.classList.remove('mic-on');
      btnMic.querySelector('.btn-icon').textContent = '🎤';
      btnMic.querySelector('.btn-label').innerHTML = 'マイク ON<br><small>Mic ON</small>';
      updateStatus('🎤 マイクをOFFにしました / Microphone turned OFF', '');
    } else {
      // マイクをONにする
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          updateStatus('⚠️ このブラウザはマイク入力に対応していません / Microphone is not supported', 'status-error');
          return;
        }

        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        isMicOn = true;
        btnMic.classList.add('mic-on');
        btnMic.querySelector('.btn-icon').textContent = '🔊';
        btnMic.querySelector('.btn-label').innerHTML = 'マイク OFF<br><small>Mic OFF</small>';
        updateStatus('🎤 マイクをONにしました / Microphone turned ON', 'status-success');
      } catch (error) {
        if (error.name === 'NotAllowedError') {
          updateStatus('❌ マイクのアクセスが拒否されました / Microphone access denied', 'status-error');
        } else {
          updateStatus('❌ マイクエラー / Microphone error: ' + error.message, 'status-error');
        }
      }
    }
  }

  // ========================================
  // 録画の制御
  // ========================================

  /**
   * 録画用の結合ストリームを作成する
   * 画面のビデオ/オーディオトラック + マイクのオーディオトラックを統合
   * @returns {MediaStream} 結合されたストリーム
   */
  function createCombinedStream() {
    var tracks = [];

    // 画面共有のビデオトラックを追加
    if (screenStream) {
      screenStream.getVideoTracks().forEach(function (track) {
        tracks.push(track);
      });
      // 画面共有のオーディオトラック（システム音声）がある場合追加
      screenStream.getAudioTracks().forEach(function (track) {
        tracks.push(track);
      });
    }

    // マイクのオーディオトラックを追加
    if (micStream && isMicOn) {
      micStream.getAudioTracks().forEach(function (track) {
        tracks.push(track);
      });
    }

    return new MediaStream(tracks);
  }

  /**
   * 録画を開始する
   */
  function startRecording() {
    // 画面共有がないと録画できない
    if (!screenStream) {
      updateStatus('⚠️ まず画面共有を開始してください / Please start screen sharing first', 'status-error');
      return;
    }

    // MediaRecorderの対応チェック
    if (typeof MediaRecorder === 'undefined') {
      updateStatus('⚠️ このブラウザはMediaRecorderに対応していません / MediaRecorder is not supported', 'status-error');
      return;
    }

    // 結合ストリームを作成
    combinedStream = createCombinedStream();

    // 録画データの初期化
    recordedChunks = [];

    // MIME typeの選択（ブラウザ対応順）
    var mimeType = '';
    var mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ];

    for (var i = 0; i < mimeTypes.length; i++) {
      if (MediaRecorder.isTypeSupported(mimeTypes[i])) {
        mimeType = mimeTypes[i];
        break;
      }
    }

    try {
      var options = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }

      mediaRecorder = new MediaRecorder(combinedStream, options);
    } catch (error) {
      updateStatus('❌ 録画の初期化に失敗しました / Failed to initialize recording: ' + error.message, 'status-error');
      return;
    }

    // データが利用可能になった時のハンドラ
    mediaRecorder.ondataavailable = function (event) {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    // 録画停止時のハンドラ
    mediaRecorder.onstop = function () {
      handleRecordingComplete();
    };

    // エラー時のハンドラ
    mediaRecorder.onerror = function (event) {
      updateStatus('❌ 録画中にエラーが発生しました / Recording error occurred', 'status-error');
      resetRecordingState();
    };

    // 録画開始（1秒ごとにデータを取得）
    mediaRecorder.start(1000);

    // 状態を更新
    isRecording = true;
    isPaused = false;

    // タイマーを開始
    startTimer();

    // UIを更新
    updateRecordingUI();
    updateStatus('🔴 録画中... / Recording...', 'status-recording');

    // 録画結果エリアを非表示にする
    resultSection.classList.remove('active');

    // 以前のBlobURLを解放
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
      recordedBlobUrl = null;
    }
  }

  /**
   * 録画を一時停止する
   */
  function pauseRecording() {
    if (!mediaRecorder || mediaRecorder.state !== 'recording') return;

    mediaRecorder.pause();
    isPaused = true;

    // タイマーを停止
    stopTimer();

    // UIを更新
    updatePausedUI();
    updateStatus('⏸ 一時停止中... / Paused...', 'status-paused');
  }

  /**
   * 録画を再開する
   */
  function resumeRecording() {
    if (!mediaRecorder || mediaRecorder.state !== 'paused') return;

    mediaRecorder.resume();
    isPaused = false;

    // タイマーを再開
    startTimer();

    // UIを更新
    updateRecordingUI();
    updateStatus('🔴 録画中... / Recording...', 'status-recording');
  }

  /**
   * 録画を停止する
   */
  function stopRecording() {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') return;

    mediaRecorder.stop();

    // タイマーを停止
    stopTimer();

    // 状態をリセット
    isRecording = false;
    isPaused = false;

    // UIをリセット
    resetRecordingUI();
    updateStatus('⏳ 録画を処理中... / Processing recording...', '');
  }

  /**
   * 録画完了時の処理
   * Blobを作成してプレビュー表示とダウンロードを準備する
   */
  function handleRecordingComplete() {
    if (recordedChunks.length === 0) {
      updateStatus('⚠️ 録画データがありません / No recording data available', 'status-error');
      return;
    }

    // 録画データをBlobに変換
    var blob = new Blob(recordedChunks, { type: 'video/webm' });

    // 古いURLを解放してメモリリークを防ぐ
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }

    // BlobからURLを生成
    recordedBlobUrl = URL.createObjectURL(blob);

    // 結果ビデオにURLをセット
    resultVideo.src = recordedBlobUrl;

    // 結果セクションを表示
    resultSection.classList.add('active');

    updateStatus('✅ 録画が完了しました！ / Recording complete!', 'status-success');
  }

  // ========================================
  // ダウンロード機能
  // ========================================

  /**
   * 録画した動画をWebMファイルとしてダウンロードする
   */
  function downloadRecording() {
    if (!recordedBlobUrl) {
      updateStatus('⚠️ ダウンロードするデータがありません / No data to download', 'status-error');
      return;
    }

    // ファイル名に日時を含める
    var now = new Date();
    var dateStr = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') + '_' +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');

    var fileName = 'screen_recording_' + dateStr + '.webm';

    // ダウンロードリンクを動的に生成
    var a = document.createElement('a');
    a.href = recordedBlobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    // DOM要素を即座に除去
    document.body.removeChild(a);

    updateStatus('💾 ダウンロード開始: ' + fileName + ' / Downloading...', 'status-success');
  }

  // ========================================
  // タイマー機能
  // ========================================

  /**
   * タイマーを開始する（1秒ごとにカウントアップ）
   */
  function startTimer() {
    // 既存のタイマーがあればクリア
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    timerInterval = setInterval(function () {
      elapsedSeconds++;
      var timeStr = formatTime(elapsedSeconds);
      timerValue.textContent = timeStr;
      recTimerBadge.textContent = timeStr;
    }, 1000);
  }

  /**
   * タイマーを停止する（表示はそのまま維持）
   */
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  /**
   * タイマーをリセットする
   */
  function resetTimer() {
    stopTimer();
    elapsedSeconds = 0;
    timerValue.textContent = '00:00:00';
    recTimerBadge.textContent = '00:00:00';
  }

  // ========================================
  // UI更新関数
  // ========================================

  /**
   * 録画中のUIに切り替える
   */
  function updateRecordingUI() {
    // プレビュー枠の赤ボーダー
    previewWrapper.classList.add('is-recording');
    previewWrapper.classList.remove('is-paused');

    // 録画インジケーター表示
    recordingIndicator.classList.add('active');
    pausedIndicator.classList.remove('active');

    // タイマー色
    timerDisplay.classList.add('is-recording');
    timerDisplay.classList.remove('is-paused');

    // ボタン状態
    btnShare.disabled = true;
    btnRecord.disabled = true;
    btnRecord.classList.add('is-recording');
    btnPause.disabled = false;
    btnPause.querySelector('.btn-icon').textContent = '⏸';
    btnPause.querySelector('.btn-label').innerHTML = '一時停止<br><small>Pause</small>';
    btnStop.disabled = false;
  }

  /**
   * 一時停止中のUIに切り替える
   */
  function updatePausedUI() {
    // プレビュー枠のオレンジボーダー
    previewWrapper.classList.remove('is-recording');
    previewWrapper.classList.add('is-paused');

    // インジケーター表示
    recordingIndicator.classList.remove('active');
    pausedIndicator.classList.add('active');

    // タイマー色
    timerDisplay.classList.remove('is-recording');
    timerDisplay.classList.add('is-paused');

    // 一時停止ボタンを「再開」に変更
    btnPause.querySelector('.btn-icon').textContent = '▶️';
    btnPause.querySelector('.btn-label').innerHTML = '再開<br><small>Resume</small>';
  }

  /**
   * 録画停止後のUIをリセットする
   */
  function resetRecordingUI() {
    previewWrapper.classList.remove('is-recording', 'is-paused');
    recordingIndicator.classList.remove('active');
    pausedIndicator.classList.remove('active');
    timerDisplay.classList.remove('is-recording', 'is-paused');

    btnShare.disabled = false;
    btnRecord.disabled = !screenStream;
    btnRecord.classList.remove('is-recording');
    btnPause.disabled = true;
    btnPause.querySelector('.btn-icon').textContent = '⏸';
    btnPause.querySelector('.btn-label').innerHTML = '一時停止<br><small>Pause</small>';
    btnStop.disabled = true;
  }

  /**
   * 録画状態を完全にリセットする（エラー時など）
   */
  function resetRecordingState() {
    isRecording = false;
    isPaused = false;
    resetTimer();
    resetRecordingUI();
    mediaRecorder = null;
    combinedStream = null;
  }

  /**
   * すべてを初期状態に戻す（新しい録画ボタン用）
   */
  function resetAll() {
    // 録画結果をクリーンアップ
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
      recordedBlobUrl = null;
    }
    resultVideo.src = '';
    resultSection.classList.remove('active');
    recordedChunks = [];

    // タイマーをリセット
    resetTimer();

    // 状態をリセット
    resetRecordingState();

    // 画面共有が残っていればプレビューを維持、なければプレースホルダー表示
    if (screenStream && screenStream.active) {
      btnRecord.disabled = false;
      updateStatus('✅ 準備完了。録画を開始できます / Ready. You can start recording', 'status-success');
    } else {
      stopScreenShare();
      updateStatus('画面共有を開始してください / Please start screen sharing', '');
    }
  }

  // ========================================
  // イベントリスナーの登録
  // ========================================

  // 画面共有ボタン
  btnShare.addEventListener('click', function () {
    if (screenStream && screenStream.active) {
      // 共有中ならトグルで停止
      stopScreenShare();
      updateStatus('画面共有を停止しました / Screen sharing stopped', '');
    } else {
      startScreenShare();
    }
  });

  // マイクボタン
  btnMic.addEventListener('click', function () {
    toggleMic();
  });

  // 録画開始ボタン
  btnRecord.addEventListener('click', function () {
    startRecording();
  });

  // 一時停止/再開ボタン
  btnPause.addEventListener('click', function () {
    if (isPaused) {
      resumeRecording();
    } else {
      pauseRecording();
    }
  });

  // 停止ボタン
  btnStop.addEventListener('click', function () {
    stopRecording();
  });

  // ダウンロードボタン
  btnDownload.addEventListener('click', function () {
    downloadRecording();
  });

  // 新しい録画ボタン
  btnNewRecording.addEventListener('click', function () {
    resetAll();
  });

  // ページを離れる前の確認（録画中の場合）
  window.addEventListener('beforeunload', function (event) {
    if (isRecording) {
      event.preventDefault();
      event.returnValue = '録画中です。このページを離れると録画データが失われます。';
    }
  });

  // ページ離脱時のクリーンアップ
  window.addEventListener('unload', function () {
    // ストリームを停止
    if (screenStream) {
      screenStream.getTracks().forEach(function (track) { track.stop(); });
    }
    if (micStream) {
      micStream.getTracks().forEach(function (track) { track.stop(); });
    }
    // BlobURLを解放
    if (recordedBlobUrl) {
      URL.revokeObjectURL(recordedBlobUrl);
    }
  });

  // ========================================
  // 初期化処理
  // ========================================

  // ファビコンのフォールバックセットアップ
  setupFaviconFallback();

})();
