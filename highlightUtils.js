export function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---- 節點定位 ----
export function getXPath(node) {
  if (!node) return null;
  const isText = node.nodeType === Node.TEXT_NODE;
  let el = isText ? node.parentNode : node;

  const parts = [];
  // 找到選取範圍外面第一層的tag在整個文件同類型tag中是第幾個
  while (el && el.nodeType === Node.ELEMENT_NODE) {
    let idx = 1;
    let sib = el.previousSibling;
    while (sib) {
      if (sib.nodeType === Node.ELEMENT_NODE && sib.nodeName === el.nodeName)
        idx++;
      sib = sib.previousSibling;
    }
    parts.unshift(el.nodeName.toLowerCase() + "[" + idx + "]");
    el = el.parentNode;
  }

  // 該文字節點在父元素底下第幾個 text node（從 0 起算）
  let textIndex = null;
  if (isText) {
    textIndex = 0;
    let s = node.parentNode.firstChild;
    while (s) {
      if (s.nodeType === Node.TEXT_NODE) {
        if (s === node) break;
        textIndex++;
      }
      s = s.nextSibling;
    }
  }

  return { path: "/" + parts.join("/"), textIndex };
}

// export function resolveXPath(xp) {
//   /* 從 { path, textIndex } 找回文字節點 */
// }

// ---- Range / Node 處理 ----
export function firstTextNodeInRange(range) {
  if (range.startContainer.nodeType === Node.TEXT_NODE)
    return range.startContainer;
  const w = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (n) =>
        range.intersectsNode(n)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    },
  );
  return w.nextNode();
}
export function lastTextNodeInRange(range) {
  if (range.endContainer.nodeType === Node.TEXT_NODE) return range.endContainer;
  const w = document.createTreeWalker(
    range.commonAncestorContainer,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (n) =>
        range.intersectsNode(n)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT,
    },
  );
  let last = null,
    n;
  while ((n = w.nextNode())) last = n;
  return last;
}

// 將目前選取轉成錨點資訊（start/end 各自的 xpath/textIndex/offset） 存檔用
export function selectionToXPathAnchors(sel = window.getSelection()) {
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0).cloneRange();

  const startText = firstTextNodeInRange(range);
  const endText = lastTextNodeInRange(range);
  if (!startText || !endText) return null;

  const startXP = getXPath(startText);
  const endXP = getXPath(endText);

  const startOffset =
    range.startContainer === startText ? range.startOffset : 0;
  const endOffset =
    range.endContainer === endText ? range.endOffset : endText.nodeValue.length;

  return {
    start: {
      xpath: startXP.path,
      textIndex: startXP.textIndex,
      offset: startOffset,
    },
    end: {
      xpath: endXP.path,
      textIndex: endXP.textIndex,
      offset: endOffset,
    },
  };
}

// （可選）從 XPath + textIndex 反查回文字節點，方便還原
function resolveXPath({ path, textIndex }) {
  const el = document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null,
  ).singleNodeValue;
  if (!el) return null;
  if (textIndex == null) return el; // 元素節點
  let idx = 0,
    n = el.firstChild;
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) {
      if (idx === textIndex) return n;
      idx++;
    }
    n = n.nextSibling;
  }
  return null;
}

export function prevTextNode(node) {}
export function nextTextNode(node) {
  /* ... */
}

// ---- 上下文擷取 ----
export function getContextAroundSelection(
  range,
  beforeLen = 20,
  afterLen = 20,
) {
  /* ... */
}

// ---- 主流程：從選取產生錨點資料 ----
export function extractHighlightPayloadFromSelection(rangeOrSel) {
  /* ... */
}
