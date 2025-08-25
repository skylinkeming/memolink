/**
 * 在指定的父元素中尋找並高亮顯示目標文字，支援換行符。
 * @param {string} textToHighlight - 要高亮顯示的目標文字，可包含換行符。
 * @param {HTMLElement} [parentElement=document.body] - 開始尋找的父元素，預設為整個頁面的 <body>。
 */
export function highlightText(textToHighlight, parentElement = document.body) {
  if (!textToHighlight) return;

  // 1. 處理換行符：將換行符轉換為匹配任何空白字元的正規表達式
  //    先將特殊字元轉義，避免意外的正規表達式錯誤
  const escapedText = textToHighlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  //    將換行字元 (\n 或 \r) 替換為 \s+，以匹配任何一個或多個空白字元
  const regexPattern = escapedText.replace(/(\r\n|\n|\r)/g, "\\s+");
  const regex = new RegExp(regexPattern, "gi");

  // 2. 創建 TreeWalker 遍歷 DOM
  const walker = document.createTreeWalker(
    parentElement,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  let node;
  const nodesToProcess = [];
  while ((node = walker.nextNode())) {
    // 3. 檢查節點內容是否匹配修正後的正規表達式
    if (node.nodeValue.match(regex)) {
      nodesToProcess.push(node);
    }
  }

  // 4. 高亮符合條件的節點
  nodesToProcess.forEach((node) => {
    const parent = node.parentNode;
    // 使用修正後的正規表達式來替換內容
    const newHtml = node.nodeValue.replace(
      regex,
      `<span style="background-color: yellow; font-weight: bold;">$&</span>`
    );

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = newHtml;

    const fragments = [...tempDiv.childNodes];
    fragments.forEach((fragment) => {
      parent.insertBefore(fragment, node);
    });

    parent.removeChild(node);
  });
}

/**
 * 取得使用者選取的文字，並根據其所在的 HTML 標籤結構進行拆分。
 * @returns {string[]} 包含每個獨立文字區塊的字串陣列。
 */
export function getSelectedTextChunks() {
  const selection = window.getSelection();
  if (selection.rangeCount === 0) {
    return []; // 沒有選取任何文字
  }

  const range = selection.getRangeAt(0);
  // 複製選取範圍內的內容，包含 HTML 結構
  const fragment = range.cloneContents();
  const textChunks = [];
  const elements = [];

  // 遍歷所有複製出來的子節點
  fragment.childNodes.forEach((node) => {
    // 檢查節點的類型
    if (node.nodeType === Node.ELEMENT_NODE) {
      // 如果是 HTML 元素（如 <p>, <h2>），取出其包含的所有文字
      textChunks.push(node.textContent.trim());
    } else if (node.nodeType === Node.TEXT_NODE) {
      // 如果是純文字節點，直接取出文字
      textChunks.push(node.nodeValue.trim());
    }
  });

  // 移除陣列中的空字串
  return textChunks.filter((chunk) => chunk.length > 0);
}

/**
 * 從選取範圍中取得精準的定位資料。
 * @param {Selection} selection - 使用者的選取物件
 * @returns {object|null} 包含所有定位資訊的物件，如果選取無效則為 null。
 */
function getHighlightLocationData(selection) {
  if (selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  const startNode = range.startContainer;
  const parentElement = startNode.parentNode;

  // 1. 產生父元素的選擇器
  const parentSelector = generateCSSSelector(parentElement);

  // 2. 計算起始文字節點的索引
  let startNodeIndex = 0;
  let child = parentElement.firstChild;
  while (child) {
    if (child === startNode) {
      break;
    }
    child = child.nextSibling;
    startNodeIndex++;
  }

  // 3. 取得起始與結束的字元偏移量
  const startOffset = range.startOffset;
  const endOffset = range.endOffset;
  const highlightedText = range.toString();

  return {
    text: highlightedText,
    parentSelector: parentSelector,
    startNodeIndex: startNodeIndex,
    startOffset: startOffset,
    endOffset: endOffset,
  };
}

/**
 * 產生CSS選擇器路徑
 * @param {HTMLElement} el - 要產生選擇器的 DOM 元素
 * @returns {string} 該元素的 CSS Selector 字串
 */
function generateCSSSelectorPath(el) {
  // 如果元素沒有了，或不是有效的元素，直接回傳空字串
  if (!el || el.nodeType !== Node.ELEMENT_NODE) {
    return "";
  }

  // 如果元素有 ID，這是最簡單也最可靠的方式
  if (el.id) {
    return `#${el.id}`;
  }

  const parts = [];
  // 向上追溯到 body 或 html 標籤
  while (
    el &&
    el.nodeType === Node.ELEMENT_NODE &&
    el.tagName.toLowerCase() !== "body"
  ) {
    let selectorName = el.tagName.toLowerCase();

    // 如果有多個同類型的兄弟節點，加上 :nth-child(n) 來區分
    let siblingCount = 1;
    let sibling = el;
    while ((sibling = sibling.previousElementSibling)) {
      if (sibling.tagName.toLowerCase() === selectorName) {
        siblingCount++;
      }
    }
    // 只有當不是第一個兄弟節點時才加上 :nth-child
    if (siblingCount > 1) {
      selectorName += `:nth-child(${siblingCount})`;
    }

    parts.unshift(selectorName);
    el = el.parentNode;
  }

  // 加上 body 標籤作為開頭，讓選擇器更精確
  parts.unshift("body");

  return parts.join(" > ");
}
