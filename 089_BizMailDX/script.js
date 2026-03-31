// --- アプリケーションの状態管理 ---
let csvData = [];          // 取得した全顧客データ
let selectedCompany = null; // 現在選択されている顧客情報

// 定型文テンプレートの定義 (6種類)
const templates = {
    '1': "件名: 【見積依頼】図面送付およびお見積りのお願い / Request for Quotation\n\n{取引先名}\n{部署名}\n{担当者名} {敬称}\n\nいつも大変お世話になっております。\n株式会社〇〇の〇〇です。\n\nさて、首記の件につきまして、新規部品（{主要取引品目}）の見積りをお願いしたくご連絡いたしました。\n詳細な仕様および図面ファイルにつきましては、別途添付の通りです。\n\nお手数ですが、ご確認いただき、〇月〇日までにお見積書をご提示いただけますでしょうか。\nご不明な点がございましたら、遠慮なくご連絡ください。\n\nよろしくお願い申し上げます。",
    '2': "件名: 【発注書送付】ご注文のご連絡 / Purchase Order\n\n{取引先名}\n{部署名}\n{担当者名} {敬称}\n\nいつもお世話になっております。\n株式会社〇〇の〇〇です。\n\n先日はお見積りをいただき、誠にありがとうございました。\n社内にて検討の結果、貴社に発注させていただくこととなりました。\n\n正式な発注書（PDFファイル）を本メールに添付しておりますので、ご査収ください。\n納品先や検収条件につきましては、発注書内の記載をご確認お願いいたします。\n\n本件につきまして、ご不明点等ございましたらお知らせください。\n引き続きよろしくお願い申し上げます。",
    '3': "件名: 【納期確認】発注済み部品の出荷日について / Delivery Schedule Confirmation\n\n{取引先名}\n{部署名}\n{担当者名} {敬称}\n\nいつも大変お世話になっております。\n株式会社〇〇の〇〇です。\n\n〇月〇日付で発注いたしました「{主要取引品目}」の納期につきまして、状況を確認したくご連絡いたしました。\n現在の進捗状況および、予定されている出荷日をお知らせいただけますでしょうか。\n\nお忙しいところ大変恐縮ですが、プロジェクトの進捗に影響があるため、お早めにご回答いただけますと幸いです。\n\nよろしくお願い申し上げます。",
    '4': "件名: 【発送完了のお知らせ】納品物発送のご連絡 / Shipping Notification\n\n{取引先名}\n{部署名}\n{担当者名} {敬称}\n\nいつもお世話になっております。\n株式会社〇〇の〇〇です。\n\nご注文いただいておりました「{主要取引品目}」につきまして、\n本日、貴社指定の納品先へ向けて発送を完了いたしましたのでご報告いたします。\n\n配送業者: 〇〇運輸\n送り状番号: XXX-XXXX-XXXX\n到着予定日: 〇月〇日（午前中）\n\n納品書および検収依頼書を同梱しておりますので、到着次第ご確認のほどよろしくお願いいたします。\n引き続きご愛顧のほどよろしくお願い申し上げます。",
    '5': "件名: 【受領・検収完了のご報告】納品物の確認完了 / Receipt & Inspection Report\n\n{取引先名}\n{部署名}\n{担当者名} {敬称}\n\nいつも大変お世話になっております。\n株式会社〇〇の〇〇です。\n\n先日ご手配いただきました「{主要取引品目}」につきまして、\n無事に弊社へ到着し、外観および動作の検収が完了いたしました。\n\n特に問題等はございませんでしたので、本メールにて検収完了のご報告とさせていただきます。\n迅速かつ丁寧なご対応に感謝申し上げます。\n\nまた次回の案件につきましても、どうぞよろしくお願いいたします。",
    '6': "件名: 【請求書発行のお願い】今月度のご請求について / Request for Invoice\n\n{取引先名}\n{部署名}\n{担当者名} {敬称}\n\nいつもお世話になっております。\n株式会社〇〇の〇〇です。\n\n今月度の締め処理（月末締め）に伴い、ご請求書の発行をお願いしたくご連絡いたしました。\n\n当月中に完了いたしました「{主要取引品目}」の納品分につきまして、\n弊社の検収が完了しておりますので、請求書（PDF）をメールにてお送りいただけますでしょうか。\n原本の郵送は不要です。\n\nお手数をおかけいたしますが、〇月〇日（〇）までにご送付いただけますと幸いです。\nよろしくお願い申し上げます。"
};

// --- 初期化処理 ---
document.addEventListener('DOMContentLoaded', () => {
    loadCSVData();
    setupEventListeners();
    setupFaviconFallback();
});

// --- データ取得と解析 ---
/**
 * スプレッドシート（公開CSV）からデータを取得して解析する関数
 */
async function loadCSVData() {
    // ユーザー提供のCSV URL
    const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQxeWpivMTShKMyNpxUGq-uaaYpc5F9dM6D3TSI3CA3cne3znBn6Fyi2N4x5_2ESWALTW2Hf6IYMR7R/pub?gid=0&single=true&output=csv';
    
    try {
        const response = await fetch(csvUrl);
        if (!response.ok) throw new Error('ネットワーク応答が正常ではありません。');
        
        const csvText = await response.text();
        csvData = parseCSV(csvText);
        
        // 取得したデータをリストに表示
        renderList(csvData);
    } catch (error) {
        console.error('CSV読み込みエラー:', error);
        document.getElementById('resultList').innerHTML = `<li class="no-results" style="color:#ef4444;">データの読み込みに失敗しました。<br>Failed to load data.</li>`;
    }
}

/**
 * CSVテキストを配列オブジェクトに変換するパーサー（簡易版）
 */
function parseCSV(csv) {
    const lines = csv.trim().split('\n');
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const dataList = [];
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // 空行はスキップ
        const values = lines[i].split(',').map(v => v.trim());
        const dataObj = {};
        
        headers.forEach((header, index) => {
            dataObj[header] = values[index] || '';
        });
        
        dataList.push(dataObj);
    }
    return dataList;
}

// --- UIレンダリング ---
/**
 * 検索結果リストを画面に描画する
 */
function renderList(list) {
    const listContainer = document.getElementById('resultList');
    listContainer.innerHTML = '';
    
    if (list.length === 0) {
        listContainer.innerHTML = '<li class="no-results">該当するデータがありません / No results found</li>';
        return;
    }
    
    list.forEach(item => {
        const li = document.createElement('li');
        li.className = 'result-item';
        
        // 開発時のXSS対策としてサニタイズ（DOMへの描画前に必ず実行）
        const name = sanitizeHTML(item['取引先名']);
        const dept = sanitizeHTML(item['部署名']);
        const person = sanitizeHTML(item['担当者名']);
        const title = sanitizeHTML(item['敬称']);
        
        // リストの行を構成するHTML
        li.innerHTML = `
            <div class="company-name">${name}</div>
            <div class="company-details">${dept} ${dept ? '-' : ''} ${person} ${title}</div>
        `;
        
        // リスト項目がクリックされた時の処理
        li.addEventListener('click', () => {
             // 選択状態のUI更新
             document.querySelectorAll('.result-item').forEach(el => el.classList.remove('selected'));
             li.classList.add('selected');
             
             // 選択中のデータを保持
             selectedCompany = item;
             
             // 状態表示テキストの更新
             const displayName = `${item['取引先名']} - ${item['担当者名']} ${item['敬称']}`;
             document.getElementById('displaySelected').textContent = displayName;
             document.getElementById('displaySelected').title = displayName; // ツールチップ用
             
             // メール本文の生成をトリガー
             generateMail();
        });
        
        listContainer.appendChild(li);
    });
}

/**
 * 選択データとテンプレートからメール本文を生成しプレビューに反映する
 */
function generateMail() {
    const previewArea = document.getElementById('emailPreview');
    const templateId = document.getElementById('templateSelect').value;
    
    // 宛先が未選択の場合
    if (!selectedCompany) {
        previewArea.value = '';
        return;
    }
    
    // テンプレートが未選択の場合
    if (!templateId) {
        previewArea.value = '';
        return;
    }
    
    let text = templates[templateId];
    
    // プレースホルダーを実際のデータに置換する
    text = text.replace(/{取引先名}/g, selectedCompany['取引先名'] || '');
    text = text.replace(/{部署名}/g, selectedCompany['部署名'] || '');
    text = text.replace(/{担当者名}/g, selectedCompany['担当者名'] || '');
    text = text.replace(/{敬称}/g, selectedCompany['敬称'] || '様');
    text = text.replace(/{主要取引品目}/g, selectedCompany['主要取引品目'] || '製品');
    
    // テキストエリアに挿入
    previewArea.value = text;
}

// --- イベントリスナーの登録 ---
function setupEventListeners() {
    // 検索入力時のリアルタイムな絞り込み
    document.getElementById('searchInput').addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        if (!query) {
            renderList(csvData); // クエリが空なら全件表示
            return;
        }
        
        // 取引先名、担当者名、主要取引品目のいずれかに部分一致するか
        const filtered = csvData.filter(item => {
            const company = (item['取引先名'] || '').toLowerCase();
            const person = (item['担当者名'] || '').toLowerCase();
            const product = (item['主要取引品目'] || '').toLowerCase();
            
            return company.includes(query) || person.includes(query) || product.includes(query);
        });
        
        renderList(filtered);
    });

    // テンプレート選択時の処理
    document.getElementById('templateSelect').addEventListener('change', () => {
        generateMail();
    });

    // コピーボタンの処理
    document.getElementById('copyBtn').addEventListener('click', async () => {
        const previewArea = document.getElementById('emailPreview');
        const text = previewArea.value;
        const btn = document.getElementById('copyBtn');
        
        if (!text || !selectedCompany || !document.getElementById('templateSelect').value) {
            alert("コピーするメール本文がありません。\n宛先とテンプレートを選択してください。\n\nPlease select recipient and template.");
            return;
        }
        
        try {
            // クリップボードAPIを使用してテキストをコピー（最新の標準的手法）
            await navigator.clipboard.writeText(text);
            
            // 成功時のUIフィードバック
            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> コピーしました！ / Copied!`;
            btn.classList.add('btn-success');
            
            setTimeout(() => {
                btn.innerHTML = originalHTML;
                btn.classList.remove('btn-success');
            }, 2000); // 2秒後に元の状態に戻す
        } catch(err) {
            console.error("クリップボードへのコピーに失敗しました:", err);
            
            // クリップボードAPIが使用できない場合のフォールバック
            previewArea.select();
            document.execCommand('copy');
            alert("テキストをコピーしました。 / Copied to clipboard.");
        }
    });
}

// --- セキュリティ & フォールバック機能 ---
/**
 * XSS対策用のHTMLサニタイズ関数
 * ユーザー入力が含まれる可能性のあるデータを画面に表示する前に通す
 */
function sanitizeHTML(str) {
    if (typeof str !== 'string' || str === '') return '';
    return str.replace(/[&<>"']/g, function(match) {
        const escape = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return escape[match];
    });
}

/**
 * 画像生成されたファビコンが読み込めなかった場合のフォールバック（SVG絵文字）
 */
function setupFaviconFallback() {
    const faviconElement = document.getElementById('headerIcon');
    faviconElement.addEventListener('error', function() {
        console.warn('ファビコン画像の読み込みに失敗したため、絵文字のフォールバックを使用します。');
        
        // 代替画像として非表示にする
        this.style.display = 'none';
        
        // 絵文字をSVG化してDataURIに変換し、ページのfaviconとして適用
        const emoji = '✉️';
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${emoji}</text></svg>`;
        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
        
        // head内のリンクを上書き
        const link = document.getElementById('dynamic-favicon');
        if (link) {
            link.href = url;
            link.type = "image/svg+xml";
        }
    });
}
