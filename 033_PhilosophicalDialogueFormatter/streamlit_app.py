import streamlit as st
import re
import base64
import math

# ==============================================================================
# 0. Constants & Config
# ==============================================================================

# SVG for Favicon (Book icon)
SVG_ICON = """
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="10" y="10" width="80" height="80" rx="5" ry="5" fill="#8B4513" />
  <path d="M15 15 H85 V85 H15 Z" fill="#F5F5DC" />
  <path d="M50 15 V85" stroke="#8B4513" stroke-width="2" />
  <path d="M20 30 H45 M20 40 H45 M20 50 H45 M55 30 H80 M55 40 H80 M55 50 H80" stroke="#000" stroke-width="2" />
</svg>
"""
b64_icon = base64.b64encode(SVG_ICON.encode('utf-8')).decode('utf-8')
favicon_url = f"data:image/svg+xml;base64,{b64_icon}"

st.set_page_config(
    page_title="Philosophical Dialogue Formatter",
    page_icon=favicon_url,
    layout="wide",
    initial_sidebar_state="expanded"
)

# Bilingual Dictionary
TRANS = {
    "ja": {
        "title": "哲学的対話メーカー",
        "subtitle": "AIとの対話を、美しい書籍フォーマットへ。",
        "input_label": "チャットログ入力 (自動クリーニング機能付き)",
        "input_placeholder": "ここにGeminiやChatGPTのログを全選択コピー(Cmd+A)して貼り付けてください。\nUIの文字やタイムスタンプは自動で削除されます。",
        "settings": "設定 / Settings",
        "mode": "レイアウト / Layout",
        "mode_v": "縦書き (Japanese Vertical)",
        "mode_h": "横書き (Western Horizontal)",
        "names": "登場人物 / Names",
        "name_user": "User役",
        "name_ai": "AI役",
        "meta": "メタ情報 / Meta Info",
        "pagination": "ページ切替 / Pagination",
        "page_label": "表示ページ",
        "chars_per_page": "1ページあたりの文字数目安"
    },
    "en": {
        "title": "Philosophical Dialogue Formatter",
        "subtitle": "Turn AI chats into beautiful book formats.",
        "input_label": "Chat Log Input (Auto-Cleaning)",
        "input_placeholder": "Paste parsed text here (e.g. Cmd+A from Gemini).\nUI noise will be removed automatically.",
        "settings": "Settings",
        "mode": "Layout",
        "mode_v": "Vertical (Japanese Style)",
        "mode_h": "Horizontal (Western Style)",
        "names": "Names",
        "name_user": "User Role",
        "name_ai": "AI Role",
        "meta": "Meta Info",
        "pagination": "Pagination",
        "page_label": "Current Page",
        "chars_per_page": "Chars per page (approx)"
    }
}

# ==============================================================================
# 1. Text Parsing & Cleaning Logic
# ==============================================================================

def clean_text(text):
    """
    Remove UI noise from copied chat logs.
    GeminiやChatGPTのUIテキストを行単位で削除します。
    """
    lines = text.split('\n')
    cleaned_lines = []
    
    # ノイズとなる行の正規表現パターン
    # Patterns for noise lines
    noise_patterns = [
        r"^回答案を表示", r"^Show matches", 
        r"^volume_up", r"^thumb_up", r"^thumb_down", r"^share", r"^more_vert", r"^content_copy", 
        r"^bad_response", r"^good_response",
        r"^\d{1,2}:\d{2}$", # Timestamp like 10:30
        r"^Google", # Footer
        r"^Gemini 詳しい情報",
        r"^モデルの回答案"
    ]
    
    # Combine into one regex for efficiency
    noise_regex = re.compile("|".join(noise_patterns), re.IGNORECASE)
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue # Skip empty lines here? No, keep paragraph breaks logic later.
                     # Actually, clean_text should probably preserve structure but remove known garbage.
        
        if noise_regex.search(stripped):
            continue
            
        cleaned_lines.append(line)
        
    return "\n".join(cleaned_lines)

def parse_with_regex(text):
    """
    Try to extract blocks using 'User:' / 'Model:' labels.
    """
    lines = text.split('\n')
    parsed = []
    current_speaker = None
    buffer = []
    
    # Regex for Speaker labels: "User:", "Gemini:", "**User**:", "ユーザー"
    # Also detects simple standalone names if followed by newline or content
    regex_speaker = re.compile(r"^(?:\*\*|\[)?\s*(User|Model|Gemini|Assistant|AI|Human|Me|You|あなた|ユーザー|モデル|回答者|質問者|ChatGPT|Claude|Bard)\s*(?:\*\*|\])?\s*[:：]?\s*(.*)", re.IGNORECASE)
    
    for line in lines:
        line = line.strip()
        if not line: continue
        
        match = regex_speaker.match(line)
        is_speaker_line = False
        role_str = ""
        content_start = ""
        
        if match:
            role_str = match.group(1).lower()
            content_start = match.group(2)
            # If explicit punctuation OR content is empty (header), stick freely.
            if ':' in line or '：' in line or content_start == "":
                is_speaker_line = True
        
        if is_speaker_line:
            # Save previous block
            if current_speaker:
                parsed.append({"speaker": current_speaker, "text": "\n".join(buffer)})
            
            # Determine new speaker
            if role_str in ['user', 'human', 'me', 'you', 'あなた', 'ユーザー', '質問者']:
                current_speaker = 'user'
            else:
                current_speaker = 'model'
            
            buffer = [content_start] if content_start else []
        else:
            if current_speaker:
                buffer.append(line)
            else:
                # No speaker yet. Wait or treat as buffer?
                # Let's start with User if unknown
                pass 

    if current_speaker and buffer:
        parsed.append({"speaker": current_speaker, "text": "\n".join(buffer)})
        
    return parsed

def parse_fallback(text):
    """
    Fallback: Split by empty lines, alternate speakers. User -> Model -> User...
    """
    # Split by double newlines or just distinct blocks
    blocks = re.split(r'\n\s*\n', text)
    parsed = []
    is_user = True # Start with User
    
    for block in blocks:
        clean = block.strip()
        if not clean: continue
        
        parsed.append({
            "speaker": "user" if is_user else "model",
            "text": clean
        })
        is_user = not is_user
        
    return parsed

def parse_chat_log(raw_text):
    cleaned = clean_text(raw_text)
    
    # 1. Try Regex
    parsed = parse_with_regex(cleaned)
    
    # 2. Fallback if regex failed (0 or 1 blocks found might be failure)
    if len(parsed) < 2:
        fallback_parsed = parse_fallback(cleaned)
        if len(fallback_parsed) > len(parsed):
            return fallback_parsed
            
    return parsed

# ==============================================================================
# 2. Pagination Logic (Python-side)
# ==============================================================================

def paginate_dialogues(dialogues, chars_per_page=400):
    """
    Split dialogues into pages correctly.
    Returns: [ [dialogue_obj, ...], [dialogue_obj, ...], ... ]
    """
    pages = []
    current_page = []
    current_char_count = 0
    
    for d in dialogues:
        text_len = len(d['text'])
        
        # If adding this block exceeds limit significantly, push to next page
        # But if it's the *only* block on this page, we must keep it (even if long)
        if current_char_count + text_len > chars_per_page and current_page:
            # Close current page
            pages.append(current_page)
            current_page = []
            current_char_count = 0
        
        current_page.append(d)
        current_char_count += text_len
        
    if current_page:
        pages.append(current_page)
        
    return pages if pages else [[]]

# ==============================================================================
# 3. Formatting Helper (Tate-chu-yoko for Vertical)
# ==============================================================================

def apply_tate_chu_yoko(text, is_vertical=True):
    if not is_vertical: return text
    # 1-3 digits -> span with tcy class
    # Python regex replace with callback?
    # Streamlit renders markdown/html. We need HTML spans.
    
    def replace_digits(match):
        return f'<span class="tcy">{match.group(1)}</span>'
        
    text = re.sub(r'(\d{1,3})', replace_digits, text)
    text = re.sub(r'([!?]{1,2})', replace_digits, text)
    return text

# ==============================================================================
# 4. CSS Generation
# ==============================================================================

def get_css(mode):
    # Common vars
    bg_color = "#fcfbf6"
    text_color = "#2b2b2b"
    font_mincho = '"HiraMinProN-W3", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "MS PMincho", serif'
    font_serif = '"Times New Roman", "Times", "Georgia", serif'

    common = f"""
    <style>
    .stApp {{
        background-color: {bg_color};
        color: {text_color};
    }}
    .dialogue-container {{
        background-color: {bg_color};
        /* 固定高さ (Fixed Height) */
        height: 85vh; 
        width: 100%;
        padding: 40px;
        box-sizing: border-box;
        overflow: hidden; /* Hide overflow, rely on pagination */
        position: relative;
    }}
    .speaker-name {{
        font-weight: bold;
        color: #444;
    }}
    .tcy {{
        text-combine-upright: all;
        -webkit-text-combine: horizontal;
        display: inline-block;
    }}
    </style>
    """
    
    if mode == "vertical":
        return common + f"""
        <style>
        .dialogue-container {{
            writing-mode: vertical-rl;
            text-orientation: mixed;
            font-family: {font_mincho};
            /* Start text from right */
            display: flex;
            flex-direction: column; 
            flex-wrap: wrap; 
            align-content: flex-start; /* Right aligned in vertical-rl */
        }}
        .dialogue-block {{
            margin-left: 2em; /* Spacing between expected paragraphs */
            text-indent: 1em;
            line-height: 2.0;
            max-height: 100%; /* Ensure it doesn't break out vertically */
        }}
        .speaker-name {{
            margin-left: 0.5em;
        }}
        h1.book-title {{
            font-size: 2em; 
            margin-left: 4em; 
            font-weight: bold;
        }}
        .meta-text {{ margin-left: 2em; }}
        hr {{ border-left: 1px solid #ccc; width: 1px; height: 100%; margin: 0 2em; border-top: none; }}
        </style>
        """
    else:
        return common + f"""
        <style>
        .dialogue-container {{
            writing-mode: horizontal-tb;
            font-family: {font_serif};
            max-width: 800px;
            margin: 0 auto;
            overflow-y: auto; /* Allow scroll in horizontal mode if needed */
        }}
        .dialogue-block {{
            margin-bottom: 2em;
            line-height: 1.8;
            text-align: justify;
        }}
        .speaker-name {{
            display: block;
            margin-bottom: 0.2em;
            font-variant: small-caps;
        }}
        h1.book-title {{
            text-align: center; 
            font-size: 2.5em; 
            margin-bottom: 2em;
        }}
        hr {{ border-top: 1px solid #ccc; margin: 2em 0; }}
        </style>
        """

# ==============================================================================
# 5. Main App
# ==============================================================================

def main():
    # Sidebar
    lang = st.sidebar.radio("Language", ["日本語", "English"], index=0)
    L = TRANS["ja"] if lang == "日本語" else TRANS["en"]
    
    st.sidebar.markdown("---")
    
    # Mode
    mode_label = L['mode']
    mode_val = st.sidebar.radio(mode_label, [L['mode_v'], L['mode_h']])
    is_vertical = (mode_val == L['mode_v'])
    css_mode = "vertical" if is_vertical else "horizontal"
    
    # Names
    st.sidebar.subheader(L['names'])
    name_u = st.sidebar.text_input(L['name_user'], value="私" if lang=="日本語" else "Me")
    name_a = st.sidebar.text_input(L['name_ai'], value="AI")
    
    # Meta
    st.sidebar.subheader(L['meta'])
    title_text = st.sidebar.text_input("Title", value="無題 / Untitled")
    pre_text = st.sidebar.text_area("Preface", value="")
    post_text = st.sidebar.text_area("Postscript", value="")
    
    # Pagination Settings
    st.sidebar.markdown("---")
    st.sidebar.subheader(L['pagination'])
    # Slider just for controlling chunk size
    chars_limit = st.sidebar.number_input(L['chars_per_page'], min_value=100, max_value=2000, value=400, step=50)

    # Main Input
    st.title(L['title'])
    
    # Input Area (Collapsible?)
    with st.expander(L['input_label'], expanded=True):
        raw_text = st.text_area("", height=200, placeholder=L['input_placeholder'])
        
    # CSS Inject
    st.markdown(get_css(css_mode), unsafe_allow_html=True)
    
    # Processing
    if raw_text:
        # 1. Parse & Clean
        dialogues = parse_chat_log(raw_text)
        
        if not dialogues:
            st.warning("No dialogues detected. Try pasting a chat log.")
            return

        # 2. Add Meta info to stream if needed, OR just render them on specific pages?
        # Let's treat Title/Preface as Page 1 if they exist? 
        # Or just have Pages of dialogue.
        # Let's integrate Title into Page 1.
        
        # 3. Paginate
        # Separate meta pages? Or flow?
        # Let's keep it simple: Page 1 = Title + Preface (if any). Page 2... = content.
        # Actually proper book style: 
        #   Page 1: Title
        #   Page 2: Preface
        #   Page 3...: Dialogues
        # But for an app, maybe just flow dialogues.
        
        paginated_dialogues = paginate_dialogues(dialogues, chars_per_page=chars_limit)
        total_pages = len(paginated_dialogues)
        
        # Page Selection
        # Show "Page 1 / 5"
        col1, col2 = st.columns([1, 4])
        with col1:
            current_page_idx = st.number_input(L['page_label'], min_value=1, max_value=total_pages, value=1) - 1
            
        # Navigation Buttons (Optional enhancement)
        # st.button("Next") logic is tricky in Streamlit without session state callbacks, rely on number_input for now.
        
        # Render Current Page
        page_content = paginated_dialogues[current_page_idx]
        
        html_inner = ""
        
        # Title/Preface only on Page 1? 
        # Let's say Page 1 includes Title if User matches Page 1.
        # To make it robust:
        if current_page_idx == 0:
            html_inner += f'<h1 class="book-title">{apply_tate_chu_yoko(title_text, is_vertical)}</h1>'
            if pre_text:
                html_inner += f'<div class="dialogue-block meta-text">{apply_tate_chu_yoko(pre_text, is_vertical)}</div><hr>'
                
        # Dialogues
        for d in page_content:
            d_name = name_u if d['speaker'] == 'user' else name_a
            d_text = apply_tate_chu_yoko(d['text'], is_vertical).replace('\n', '<br>')
            html_inner += f"""
            <div class="dialogue-block">
                <span class="speaker-name">{d_name}</span>
                <span class="dialogue-text">{d_text}</span>
            </div>
            """
            
        # Postscript on Last Page
        if current_page_idx == total_pages - 1 and post_text:
             html_inner += f'<hr><div class="dialogue-block meta-text">{apply_tate_chu_yoko(post_text, is_vertical)}</div>'
             
        # Final Container
        st.markdown(f'<div class="dialogue-container">{html_inner}</div>', unsafe_allow_html=True)
        
        # Footer
        st.caption(f"Page {current_page_idx + 1} / {total_pages}")

if __name__ == "__main__":
    main()
