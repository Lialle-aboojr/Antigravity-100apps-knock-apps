/**
 * BizMail Generator - Logic Script
 * 
 * 機能概要:
 * 1. ユーザー入力の監視とメール本文のリアルタイム生成
 * 2. シチュエーション別のテンプレート管理
 * 3. クリップボードへのコピー機能とトースト通知
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // 1. 要素の取得 (DOM Elements)
    // ============================================
    const situationSelect = document.getElementById('situation');
    const recipientCompanyInput = document.getElementById('recipientCompany');
    const recipientNameInput = document.getElementById('recipientName');
    const senderNameInput = document.getElementById('senderName');
    const variableContentInput = document.getElementById('variableContent');

    const previewSubject = document.getElementById('previewSubject');
    const previewBody = document.getElementById('previewBody');
    const copyButton = document.getElementById('copyButton');
    const toast = document.getElementById('toast');

    // ============================================
    // 2. テンプレート定義 (Email Templates)
    // ============================================
    // 各シチュエーションごとの件名フォーマットと本文生成関数を定義
    const templates = {
        // 謝罪メール
        apology: {
            subject: (data) => `【お詫び】${data.variableSummary || '件名について'}`,
            body: (data) => 
`${data.recipientCompany}
${data.recipientName} 様

いつも大変お世話になっております。
${data.senderName}です。

この度は、${data.variableContent}の件につきまして、
多大なるご迷惑をおかけし、深くお詫び申し上げます。

今後はこのようなことがないよう、再発防止に努めてまいる所存です。
何卒ご容赦賜りますようお願い申し上げます。

引き続きどうぞよろしくお願いいたします。

--------------------------------------------------
${data.senderName}
--------------------------------------------------`
        },
        // 会議案内メール
        meeting: {
            subject: (data) => `【会議案内】${data.variableSummary || 'お打ち合わせについて'}`,
            body: (data) => 
`${data.recipientCompany}
${data.recipientName} 様

いつも大変お世話になっております。
${data.senderName}です。

件名の会議につきまして、以下の通りご案内申し上げます。

■日時・場所・議題など
${data.variableContent}

ご多忙の折、誠に恐縮ではございますが、
ご出席いただけますようお願い申し上げます。

ご不明な点がございましたら、お気軽にご連絡ください。

--------------------------------------------------
${data.senderName}
--------------------------------------------------`
        },
        // 御礼メール
        highlight: {
            subject: (data) => `【御礼】${data.variableSummary || '先日はありがとうございました'}`,
            body: (data) => 
`${data.recipientCompany}
${data.recipientName} 様

いつも大変お世話になっております。
${data.senderName}です。

先日は、${data.variableContent}いただき、誠にありがとうございました。
おかげさまで、大変有意義な時間となりました。

今後ともご指導ご鞭撻のほど、何卒よろしくお願い申し上げます。
またお目にかかれることを楽しみにしております。

--------------------------------------------------
${data.senderName}
--------------------------------------------------`
        },
        // 日程調整メール
        schedule: {
            subject: (data) => `【日程調整】${data.variableSummary || 'お打ち合わせの日程について'}`,
            body: (data) => 
`${data.recipientCompany}
${data.recipientName} 様

いつも大変お世話になっております。
${data.senderName}です。

お打ち合わせの日程につきまして、以下の通り候補を挙げさせていただきます。

■日程候補
${data.variableContent}

上記の中でご都合のよろしい日時がございましたら、
お知らせいただけますでしょうか。

もし上記日程でご都合がつかない場合は、
恐れ入りますが、候補日をご教示いただけますと幸いです。

何卒よろしくお願い申し上げます。

--------------------------------------------------
${data.senderName}
--------------------------------------------------`
        }
    };

    /**
     * 変数コンテンツから短いサマリー（件名用）を抽出するヘルパー関数
     * 1行目を取得し、長ければ切り詰める等の処理を想定
     */
    function extractSummary(text) {
        if (!text) return '';
        const firstLine = text.split('\n')[0];
        return firstLine.length > 15 ? firstLine.substring(0, 15) + '...' : firstLine;
    }

    // ============================================
    // 3. プレビュー更新ロジック (Update Preview)
    // ============================================
    function updatePreview() {
        const currentSituation = situationSelect.value;
        const template = templates[currentSituation];

        // フォームの値を取得。空の場合はデフォルト値を設定して見栄えを保つ
        const data = {
            recipientCompany: recipientCompanyInput.value || '（相手の会社名）',
            recipientName: recipientNameInput.value || '（相手の名前）',
            senderName: senderNameInput.value || '（自分の名前）',
            variableContent: variableContentInput.value || '（詳細内容）',
            variableSummary: extractSummary(variableContentInput.value)
        };

        // 件名と本文を生成してDOMに反映
        previewSubject.textContent = template.subject(data);
        previewBody.textContent = template.body(data);
    }

    // 各入力フィールドのイベントリスナーを設定
    const inputs = [situationSelect, recipientCompanyInput, recipientNameInput, senderNameInput, variableContentInput];
    
    inputs.forEach(input => {
        // 'input'イベントはキー入力ごとに発火、'change'はセレクトボックス変更時などに発火
        input.addEventListener('input', updatePreview);
        input.addEventListener('change', updatePreview);
    });

    // 初期表示のために一度実行
    updatePreview();

    // ============================================
    // 4. クリップボードコピー機能 (Copy to Clipboard)
    // ============================================
    copyButton.addEventListener('click', () => {
        // 件名と本文を結合してコピーするテキストを作成
        const subject = previewSubject.textContent;
        const body = previewBody.textContent;
        const textToCopy = `件名: ${subject}\n\n${body}`;

        // Clipboard APIを使用
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showToast();
            })
            .catch(err => {
                console.error('コピーに失敗しました:', err);
                alert('コピーに失敗しました。');
            });
    });

    /**
     * トースト通知を表示する関数
     */
    function showToast() {
        toast.classList.remove('hidden');
        
        // 3秒後に非表示にする
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
});
