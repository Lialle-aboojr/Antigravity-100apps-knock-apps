import DOMPurify from 'dompurify';

// ユーザーの入力値を安全にレンダリングするためのサニタイズ関数
export const sanitizeText = (text) => {
  if (!text) return '';
  // スクリプトタグなどを除去
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};
