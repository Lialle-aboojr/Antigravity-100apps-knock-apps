const STORAGE_KEY = 'pinnote_data';

// LocalStorage からデータを取得
export const loadPins = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Failed to load pins:", error);
    return [];
  }
};

// LocalStorage へデータを保存
export const savePins = (pins) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pins));
  } catch (error) {
    console.error("Failed to save pins:", error);
  }
};
