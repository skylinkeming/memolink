


export function findTextAppearTimes() {
  // 計算這次選取的文字在整個網頁內容中是第幾次出現
  const fullTextContent = contentArea.textContent;
  let occurrenceIndex = 0;
  let lastIndex = fullTextContent.indexOf(selectedText);

  // 判斷是否找到選取文字
  if (lastIndex !== -1) {
    let currentSearchIndex = 0;
    // 遍歷所有選取文字
    while (
      (currentSearchIndex = fullTextContent.indexOf(
        selectedText,
        currentSearchIndex,
      )) !== -1
    ) {
      // 如果目前找到的位置，就是使用者選取的起始位置
      if (currentSearchIndex === range.startOffset) {
        break;
      }
      occurrenceIndex++;
      currentSearchIndex += selectedText.length;
    }
  }
  Ï;
}
