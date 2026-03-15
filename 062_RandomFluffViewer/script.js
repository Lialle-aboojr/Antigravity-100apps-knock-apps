/**
 * Random Fluff Viewer - メインスクリプト
 * 今回はプログラミング未経験者でも動きが分かるように、
 * 処理の順番ごとに日本語で詳しいコメントをつけています。
 */

// 1. 各ボタンや画像を表示する場所（HTMLの要素）を変数として準備します。
const toggleRadios = document.querySelectorAll('input[name="animal-type"]'); // 猫・犬の選択スイッチ
const fetchButton = document.getElementById('fetch-button'); // 新しい画像を取得するボタン
const copyButton = document.getElementById('copy-button'); // URLをコピーするボタン
const animalImage = document.getElementById('animal-image'); // 画像を表示する<img>タグ
const loadingSpinner = document.getElementById('loading-spinner'); // くるくる回るローディング
const errorMessage = document.getElementById('error-message'); // エラーを表示するテキスト
const copyFeedback = document.getElementById('copy-feedback'); // 「コピーしました!」というメッセージ

// 2. 現在画面に表示されている画像のURLを記憶しておく変数です。
let currentImageUrl = '';

// 3. 画像を取得する関数です。ボタンが押された時や最初の一回目に呼ばれます。
async function fetchAnimalImage() {
    // 画面の表示をローディング中（通信中）の状態に変更します
    animalImage.style.display = 'none'; // 古い画像を隠す
    errorMessage.style.display = 'none'; // エラーも隠す
    loadingSpinner.style.display = 'block'; // ローディングを表示する
    copyButton.disabled = true; // 取得中はコピーボタンを押せないようにする

    // 現在どちらの動物が選ばれているかを確認します（'cat' または 'dog'）
    const selectedAnimal = document.querySelector('input[name="animal-type"]:checked').value;
    
    // 取得先のAPIのURLを決める変数です
    let apiUrl = '';

    // 選ばれた動物ごとにURLを設定します
    if (selectedAnimal === 'cat') {
        apiUrl = 'https://api.thecatapi.com/v1/images/search';
    } else if (selectedAnimal === 'dog') {
        apiUrl = 'https://dog.ceo/api/breeds/image/random';
    }

    try {
        // API通信を行い、データを取得します（fetchといいます）
        const response = await fetch(apiUrl);
        
        // その通信が成功したかチェックします
        if (!response.ok) {
            // 通信失敗の場合はエラーとして扱う
            throw new Error('画像の取得に失敗しました。 / Failed to fetch image.');
        }

        // 取得したデータ（文字の集まり）をJavaScriptで扱いやすい形（JSON）に変換します
        const data = await response.json();
        
        // 取得した画像データのURLを抜き出します。CatとDogで少しデータの形が違います。
        let imageUrl = '';
        if (selectedAnimal === 'cat') {
            // Cat APIの場合は、データのリストの0番目の中に 'url' が入っています
            imageUrl = data[0].url;
        } else if (selectedAnimal === 'dog') {
            // Dog APIの場合は、データの 'message' の中にURLがそのまま入っています
            imageUrl = data.message;
        }

        // XSS(クロスサイトスクリプティング)対策:
        // 受け取ったURLが本当に「http」または「https」から始まっているか確認します。
        // javascript:alert(1) のような悪いコードがセットされるのを防ぐ非常に重要な処理です。
        if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
            // 安全なURLであると確認できたら、画像タグの「src」属性としてセットします
            animalImage.src = imageUrl;
            // コピー用に変数にも保存しておきます
            currentImageUrl = imageUrl;
            
            // 画像が読み込み終わったら画面に出すように設定します
            animalImage.onload = function() {
                loadingSpinner.style.display = 'none'; // ローディングを消す
                animalImage.style.display = 'block'; // 画像を表示する
                copyButton.disabled = false; // コピーボタンを押せるようにする
            };
        } else {
            // もし「http」から始まらない怪しいURLだったらエラーにします
            throw new Error('不正な画像URLが検出されました。 / Invalid image URL detected.');
        }

    } catch (error) {
        // 通信が切れていたり、エラーが起きた場合の処理です
        console.error('Error fetching image:', error);
        loadingSpinner.style.display = 'none'; // ローディングを消す
        errorMessage.textContent = 'エラーが発生しました。もう一度お試しください。 / Error occurred. Please try again.';
        errorMessage.style.display = 'block'; // エラーメッセージを表示する
    }
}

// 4. URLをクリップボードにコピーする関数です。
async function copyImageUrl() {
    // 画像URLが空の場合は何もしません
    if (!currentImageUrl) return;

    try {
        // ブラウザの「クリップボードに書き込む」機能を使ってURLをコピーします
        await navigator.clipboard.writeText(currentImageUrl);
        
        // コピーに成功したら「コピーしました!」メッセージを表示します
        copyFeedback.classList.add('show');
        
        // 2秒（2000ミリ秒）後に自動でメッセージを消します
        setTimeout(() => {
            copyFeedback.classList.remove('show');
        }, 2000);
    } catch (err) {
        // 万が一コピーに失敗した場合の処理です
        console.error('Failed to copy: ', err);
        alert('クリップボードへのコピーに失敗しました。 / Failed to copy to clipboard.');
    }
}

// 5. 各ボタンが押された時の動作（イベント）を登録します。

// ①「新しい画像」ボタンがクリックされたら、画像取得処理を実行します
fetchButton.addEventListener('click', fetchAnimalImage);

// ②「URLをコピー」ボタンがクリックされたら、コピー処理を実行します
copyButton.addEventListener('click', copyImageUrl);

// ③ 猫・犬のスイッチが切り替わった時も、自動的に新しい画像を取得します
toggleRadios.forEach(radio => {
    radio.addEventListener('change', fetchAnimalImage);
});

// 6. アプリケーションの起動時（ページが読み込まれた直後）の処理
// 画面が開いたらすぐ、自動的に最初の1枚目を取得して表示します。
document.addEventListener('DOMContentLoaded', fetchAnimalImage);
