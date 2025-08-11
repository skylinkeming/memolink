let currentRange = null;

document.addEventListener("mouseup", () => {
  const selection = window.getSelection();
  if (!selection.isCollapsed) {
    currentRange = selection.getRangeAt(0);
    showToolbar(currentRange);
  }
});

function showToolbar(range) {
  removeToolbar();

  const toolbar = document.createElement("div");
  toolbar.className = "highlight-toolbar";
  toolbar.innerHTML = `
    <input type="color" id="colorPicker" value="#c8e6c9">
    <button id="boldBtn"><b>B</b></button>
    <button id="italicBtn"><i>I</i></button>
    <button id="noteBtn">📝</button>
  `;
  document.body.appendChild(toolbar);

  const rect = range.getBoundingClientRect();
  toolbar.style.top = `${window.scrollY + rect.top - 40}px`;
  toolbar.style.left = `${window.scrollX + rect.left}px`;

  let styles = { color: "#c8e6c9", bold: false, italic: false, note: "" };

  toolbar.querySelector("#colorPicker").oninput = (e) =>
    (styles.color = e.target.value);
  toolbar.querySelector("#colorPicker").onclick = () => {
    applyHighlight(range, styles);
  };
  toolbar.querySelector("#boldBtn").onclick = () =>
    (styles.bold = !styles.bold);
  toolbar.querySelector("#italicBtn").onclick = () =>
    (styles.italic = !styles.italic);
  toolbar.querySelector("#noteBtn").onclick = () => {
    styles.note = prompt("輸入筆記（可留空）") || "";
    removeToolbar();
  };
}

function removeToolbar() {
  document.querySelectorAll(".highlight-toolbar").forEach((t) => t.remove());
}

function applyHighlight(range, styles) {
  const span = document.createElement("span");
  console.log(range);
  span.className = "my-highlight";
  span.textContent = range.toString();
  span.style.backgroundColor = styles.color;
  if (styles.bold) span.style.fontWeight = "bold";
  if (styles.italic) span.style.fontStyle = "italic";
  span.dataset.note = styles.note;

  range.deleteContents();
  range.insertNode(span);

  saveHighlightData(span.textContent, styles);
}

function saveHighlightData(text, styles) {
  const pageUrl = location.href;
  const title = document.title;

  chrome.storage.local.get([pageUrl], (res) => {
    const pageData = res[pageUrl] || { title, highlights: [] };
    pageData.highlights.push({
      text,
      ...styles,
    });
    chrome.storage.local.set({ [pageUrl]: pageData });
  });
}

function restoreHighlights() {
  const pageUrl = location.href;
  chrome.storage.local.get([pageUrl], (res) => {
    const pageData = res[pageUrl];
    if (!pageData || !pageData.highlights) return;

    pageData.highlights.forEach((h) => {
      const mark = document.createElement("span");
      mark.className = "my-highlight";
      mark.textContent = h.text;
      mark.style.backgroundColor = h.color;
      if (h.bold) mark.style.fontWeight = "bold";
      if (h.italic) mark.style.fontStyle = "italic";
      mark.dataset.note = h.note;
      document.body.innerHTML = document.body.innerHTML.replace(
        h.text,
        mark.outerHTML
      );
    });
  });
}

restoreHighlights();

// ====== 進度紀錄功能 ======

// 用 XPath 取得元素唯一路徑
function getXPath(element) {
  if (element.id) return `//*[@id="${element.id}"]`;
  if (element === document.body) return "/html/body";
  let ix = 0;
  const siblings = element.parentNode.childNodes;
  for (let i = 0; i < siblings.length; i++) {
    const sibling = siblings[i];
    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix++;
      if (sibling === element) {
        return (
          getXPath(element.parentNode) +
          "/" +
          element.tagName.toLowerCase() +
          "[" +
          ix +
          "]"
        );
      }
    }
  }
}

// 從 XPath 找元素
function getElementByXPath(path) {
  return document.evaluate(
    path,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  ).singleNodeValue;
}

// 儲存目前閱讀位置
function saveReadingProgress() {
  const elements = document.elementsFromPoint(window.innerWidth / 2, 100);
  if (!elements || elements.length === 0) return;
  const firstVisible = elements.find((el) => el.tagName.match(/P|DIV|H[1-6]/));
  if (!firstVisible) return;

  const path = getXPath(firstVisible);
  chrome.storage.local.set({
    [location.href + "_progress"]: path,
  });
}

// 還原閱讀位置
function restoreReadingProgress() {
  chrome.storage.local.get([location.href + "_progress"], (res) => {
    const path = res[location.href + "_progress"];
    if (!path) return;
    const el = getElementByXPath(path);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

// 監聽滾動（防抖）
let scrollTimer = null;
window.addEventListener("scroll", () => {
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(saveReadingProgress, 500);
});

// 頁面載入完畢後還原位置
window.addEventListener("load", () => {
  setTimeout(restoreReadingProgress, 800);
});
