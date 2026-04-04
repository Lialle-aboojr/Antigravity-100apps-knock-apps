import { useState } from 'react'
import './App.css'

function App() {
  // 言語設定 (ja | en)
  const [language, setLanguage] = useState('ja')

  // 入力フォームの状態
  const [industry, setIndustry] = useState('')
  const [target, setTarget] = useState('')
  const [usp, setUsp] = useState('')

  // 生成処理の状態
  const [isGenerating, setIsGenerating] = useState(false)
  
  // 生成された結果を保持する状態
  const [resultParams, setResultParams] = useState(null)

  // 言語ごとのテキスト定義
  const texts = {
    ja: {
      title: 'Smart LP Architect',
      subtitle: 'キーワードからLP（ランディングページ）の基本構成を自動生成します',
      btnLangJa: '日本語',
      btnLangEn: 'English',
      labelIndustry: '業種・サービス内容 (Industry)',
      placeholderIndustry: '例: 企業向けクラウド会計ソフト',
      labelTarget: 'ターゲット顧客 (Target Audience)',
      placeholderTarget: '例: 経理業務を効率化したい中小企業',
      labelUsp: '独自の強み (USP - Unique Selling Proposition)',
      placeholderUsp: '例: AIによる自動仕訳で入力時間を80%削減できる',
      generateBtn: '構成案を生成する',
      generatingBtn: '生成中...',
      resCatchphrase: '提案キャッチコピー',
      resBenefits: '主要ベネフィット（利点）',
      resStructure: 'LPセクション構成案',
      noResultText: '左側のフォームに入力し、「構成案を生成する」ボタンを押してください。'
    },
    en: {
      title: 'Smart LP Architect',
      subtitle: 'Automatically generate Landing Page structures from keywords',
      btnLangJa: '日本語',
      btnLangEn: 'English',
      labelIndustry: 'Industry / Service',
      placeholderIndustry: 'e.g., Cloud Accounting Software for Businesses',
      labelTarget: 'Target Audience',
      placeholderTarget: 'e.g., SMBs wanting to streamline accounting',
      labelUsp: 'Unique Selling Proposition (USP)',
      placeholderUsp: 'e.g., AI automation reduces data entry by 80%',
      generateBtn: 'Generate Structure',
      generatingBtn: 'Generating...',
      resCatchphrase: 'Suggested Catchphrase',
      resBenefits: 'Key Benefits',
      resStructure: 'LP Section Structure',
      noResultText: 'Fill out the form on the left and click "Generate Structure".'
    }
  }

  const t = texts[language]

  // 入力状況のチェック（全て入力済みか）
  const isFormValid = industry.trim() !== '' && target.trim() !== '' && usp.trim() !== ''

  // 生成ボタンが押された時の処理
  const handleGenerate = (e) => {
    e.preventDefault()
    if (!isFormValid) return

    setIsGenerating(true)
    setResultParams(null)

    // AIの生成を模した擬似的な遅延（1.5秒）を設定
    setTimeout(() => {
      // 実際はAPI通信を行わず、入力値をそのまま保存する
      // レンダリング時に現在選択されている言語に合わせて出力文字列を生成する
      setResultParams({
        industry: industry.trim(),
        target: target.trim(),
        usp: usp.trim()
      })
      setIsGenerating(false)
    }, 1500)
  }

  // 保存された入力値から、現在の言語に合わせた表示用コンテンツを生成する関数
  const getGeneratedContent = () => {
    if (!resultParams) return null

    const { industry: ind, target: tgt, usp: u } = resultParams

    if (language === 'ja') {
      return {
        catchphrase: `【${ind}に最適】\n${tgt}が抱える課題を解決に導く、新しいスタンダード。\n「${u}」で、あなたのビジネスを次のステージへ。`,
        benefits: [
          `${tgt}の潜在的なニーズに直接アプローチし、根本から課題を解消。`,
          `「${u}」という独自の強みにより、競合他社にはない圧倒的な価値を提供。`,
          `${ind}業界に特化しているため、導入直後からスムーズな運用と効果実感が可能。`
        ],
        structure: [
          { title: 'FV (ファーストビュー)', desc: `訪問者の目を引くキャッチコピーと、「${u}」を端的に表すメインビジュアル。` },
          { title: '共感・問題提起', desc: `「${tgt}の皆様、こんなお悩みはありませんか？」と問いかけ、当事者意識を引き出す。` },
          { title: '解決策の提示', desc: `そのお悩み、私たちの「${ind}」が解決します、という宣言。` },
          { title: '選ばれる理由 (強み)', desc: `最大の強みである「${u}」を中心に、3つのメリットとして分かりやすく図解。` },
          { title: '導入事例・お客様の声', desc: `${tgt}に近い属性の成功事例を提示し、信頼感を醸成する。` },
          { title: 'CTA (行動喚起)', desc: `お問い合わせや資料請求を促す、目立つアクションボタンの配置。` }
        ]
      }
    } else {
      return {
        catchphrase: `[Optimized for ${ind}]\nThe new standard to solve challenges faced by ${tgt}.\nTake your business to the next level with: "${u}".`,
        benefits: [
          `Directly addresses the underlying needs of ${tgt} to provide fundamental solutions.`,
          `Delivers unmatched value that competitors cannot offer, driven by our USP: "${u}".`,
          `Specialized for the ${ind} sector, ensuring immediate impact and seamless adoption.`
        ],
        structure: [
          { title: 'Hero Section (FV)', desc: `Eye-catching catchphrase and key visual immediately demonstrating "${u}".` },
          { title: 'Problem Identification', desc: `Ask "Are ${tgt} struggling with these issues?" to build empathy.` },
          { title: 'Solution Introduction', desc: `Introduce our "${ind}" as the perfect solution to their problems.` },
          { title: 'Why Choose Us (Benefits)', desc: `Break down the core USP "${u}" into 3 easily digestible key benefits with illustrations.` },
          { title: 'Social Proof / Testimonials', desc: `Showcase success stories from similar ${tgt} to build trust and credibility.` },
          { title: 'Call to Action (CTA)', desc: `Clear, prominent buttons encouraging inquiries, sign-ups, or demo requests.` }
        ]
      }
    }
  }

  const generatedContent = getGeneratedContent()

  return (
    <div className="app-container">
      <header className="header">
        <h1>
          {/* シンプルな建築のアイコン（絵文字で代用） */}
          <span role="img" aria-label="architect">🏗️</span>
          {t.title}
        </h1>
        <p>{t.subtitle}</p>
        
        {/* 言語切り替えボタン */}
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button 
            onClick={() => setLanguage('ja')} 
            style={{ 
              padding: '0.4rem 1rem', 
              borderRadius: '4px', 
              border: '1px solid var(--primary)', 
              background: language === 'ja' ? 'var(--primary)' : 'white', 
              color: language === 'ja' ? 'white' : 'var(--primary)'
            }}
          >
            {t.btnLangJa}
          </button>
          <button 
            onClick={() => setLanguage('en')} 
            style={{ 
              padding: '0.4rem 1rem', 
              borderRadius: '4px', 
              border: '1px solid var(--primary)', 
              background: language === 'en' ? 'var(--primary)' : 'white', 
              color: language === 'en' ? 'white' : 'var(--primary)'
            }}
          >
            {t.btnLangEn}
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* 入力フォーム側（左側） */}
        <section className="panel">
          <form onSubmit={handleGenerate}>
            <div className="form-group">
              <label htmlFor="industry">{t.labelIndustry}</label>
              <input
                id="industry"
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder={t.placeholderIndustry}
                disabled={isGenerating}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="target">{t.labelTarget}</label>
              <textarea
                id="target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder={t.placeholderTarget}
                disabled={isGenerating}
                rows={3}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="usp">{t.labelUsp}</label>
              <textarea
                id="usp"
                value={usp}
                onChange={(e) => setUsp(e.target.value)}
                placeholder={t.placeholderUsp}
                disabled={isGenerating}
                rows={3}
              />
            </div>

            <button 
              type="submit" 
              className="btn-generate"
              disabled={!isFormValid || isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="loading-spinner"></span>
                  {t.generatingBtn}
                </>
              ) : (
                t.generateBtn
              )}
            </button>
          </form>
        </section>

        {/* 結果表示側（右側） */}
        <section className="panel" aria-live="polite">
          {isGenerating ? (
            // 生成中のプレースホルダー
            <div className="results-placeholder">
              <span className="loading-spinner" style={{ borderColor: 'rgba(15, 76, 129, 0.2)', borderTopColor: 'var(--primary)', width: '40px', height: '40px', borderWidth: '4px' }}></span>
              <p style={{ marginTop: '1rem', color: 'var(--primary)' }}>Analyzing concepts...</p>
            </div>
          ) : !generatedContent ? (
            // 初期状態
            <div className="results-placeholder">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" py="2"></rect>
                <line x1="3" y1="9" x2="21" y2="9"></line>
                <line x1="9" y1="21" x2="9" y2="9"></line>
              </svg>
              <p>{t.noResultText}</p>
            </div>
          ) : (
            // 生成完了後の表示
            <div className="results-content">
              
              <div className="result-section">
                <h3><span role="img" aria-label="sparkles">✨</span> {t.resCatchphrase}</h3>
                {/* ユーザー入力が含まれるが、Reactは文字列を自動エスケープするためXSS攻撃に対して安全 */}
                <div className="result-box">
                  {generatedContent.catchphrase}
                </div>
              </div>

              <div className="result-section">
                <h3><span role="img" aria-label="star">🌟</span> {t.resBenefits}</h3>
                <ul className="layout-structure">
                  {generatedContent.benefits.map((benefit, index) => (
                    <li key={index} className="layout-item">
                      <div className="layout-item-number" style={{ width: '24px', height: '24px', fontSize: '0.8rem', backgroundColor: 'var(--success)' }}>
                         ✓
                      </div>
                      <div className="layout-item-content">
                        <div className="layout-item-desc" style={{ color: 'var(--text-main)' }}>
                          {benefit}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="result-section">
                <h3><span role="img" aria-label="blueprint">📐</span> {t.resStructure}</h3>
                <div className="layout-structure">
                  {generatedContent.structure.map((item, index) => (
                    <div key={index} className="layout-item">
                      <div className="layout-item-number">{index + 1}</div>
                      <div className="layout-item-content">
                        <div className="layout-item-title">{item.title}</div>
                        <div className="layout-item-desc">{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </section>
      </main>

      <footer className="footer">
        <p>© 2026 Smart LP Architect | Design by Antigravity</p>
      </footer>
    </div>
  )
}

export default App
