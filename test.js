import { generateUUID, selectionToXPathAnchors } from "./highlightUtils.js";

//劃線資料 存進storage
//重新整理時 能讀到storage裡的資料
//存的資料 加上xpath, 前後文
//重新整理時 能找到xpath,前後文對應的node
//並套用存取的highlight樣式

//改用 new Highlight
//然後用xpath來還原

let currentSelection = null;
let currentRange = null;
let toolbar = null;
let highlightData = [
  {
    id: "",
    text: "",
    color: "",
    fontWeight: "",
    fontStyle: "",
  },
];

document.addEventListener("DOMContentLoaded", () => {
  getStoredDataAndApplyHighlight();
});

//綁定滑鼠放開事件
document.addEventListener("mouseup", () => {
  console.log("mouse up");

  currentSelection = window.getSelection();

  if (!currentSelection.isCollapsed) {
    currentRange = currentSelection.getRangeAt(0);
    showToolbar(currentRange);
  } else {
    removeExistingToolbar();
  }
});

function showToolbar(range) {
  removeExistingToolbar();

  toolbar = document.createElement("div");
  toolbar.className = "highlight-toolbar";
  toolbar.innerHTML = `
                      <div id="colorBtn"></div>
                      <div id="boldBtn">B</div>
                      <div id="italicBtn">U</div>
                      <div id="noteBtn"></div>
                  `;

  toolbar.addEventListener("mouseup", (e) => {
    e.stopPropagation();
  });
  toolbar.addEventListener("mousedown", (e) => {
    e.preventDefault();
  });

  //定位
  const rect = range.getBoundingClientRect();
  toolbar.style.top = `${window.scrollY + rect.top - 40}px`;
  toolbar.style.left = `${window.scrollX + rect.left}px`;

  document.body.appendChild(toolbar);

  //綁定點擊事件
  document.querySelector("#colorBtn").addEventListener("click", () => {
    changeSelectionStyle({ backgroundColor: "yellow" });
  });
  document.querySelector("#boldBtn").addEventListener("click", () => {
    changeSelectionStyle({ fontWeight: "bold" });
  });
  document.querySelector("#italicBtn").addEventListener("click", () => {
    changeSelectionStyle({ fontStyle: "italic" });
  });
}

function removeExistingToolbar() {
  if (toolbar) {
    document.body.removeChild(toolbar);
    toolbar = null;
  }
}

function getSelectionSpanId() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    let node = range.commonAncestorContainer;

    // 從選取範圍的共同祖先節點往上尋找
    while (node && node !== contentArea) {
      // 檢查節點類型，並確認它是一個 `<span>` 且有 ID
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        node.tagName === "SPAN" &&
        node.id
      ) {
        // 如果找到，就可以取用它的 ID
        const highlightId = node.id;
        console.log("找到了重點的 ID:", highlightId);
        // 這裡你可以使用這個 ID 來做後續的動作，例如刪除或修改
        break;
      }
      // 繼續往父節點尋找
      node = node.parentNode;
    }
  }
}

function changeSelectionStyle({ backgroundColor, fontWeight, fontStyle }) {
  if (currentSelection) {
    const selection = currentSelection;

    highlightData = JSON.parse(localStorage.getItem("highlightData"));
    let storedSameIdHighlight;
    if (!highlightData) {
      highlightData = [];
    } else {
      storedSameIdHighlight = highlightData.find(
        (h) => h.id == getSelectionSpanId(),
      );
    }
    const highlight = {
      createdAt: new Date().toLocaleString(),
      ...(storedSameIdHighlight ? storedSameIdHighlight : {}),
      updatedAt: new Date().toLocaleString(),
      text: currentSelection.toString(),
      color: backgroundColor,
      fontWeight: fontWeight,
      fontStyle: fontStyle,
      anchor: {
        ...selectionToXPathAnchors(currentSelection),
      },
    };

    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // span.style.borderBottom = "2px solid " + color; // 設置底部邊框顏色

      addHighlightStyle(range, highlight);
      //   currentRange.surroundContents(span);
      selection.removeAllRanges();
      selection.addRange(range);
    }
    saveHighlightData(highlight);
  }
}

const getNodeFromData = (xpath, textIndex) => {
  try {
    const result = document.evaluate(
      xpath,
      document,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null,
    );
    const parentNode = result.singleNodeValue;
    if (!parentNode) {
      return null;
    }
    let count = 0;
    for (const child of parentNode.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        if (count === textIndex) {
          return child;
        }
        count++;
      }
    }
  } catch (e) {
    console.error("Failed to get node from XPath:", e);
  }
  return null;
};

function getStoredDataAndApplyHighlight() {
  highlightData = JSON.parse(localStorage.getItem("highlightData"));
  highlightData.forEach((h) => {
    const startNode = getNodeFromData(
      h.anchor.start.xpath,
      h.anchor.start.textIndex,
    );
    const endNode = getNodeFromData(h.anchor.end.xpath, h.anchor.end.textIndex);
    if (startNode && endNode) {
      const range = document.createRange();
      range.setStart(startNode, h.anchor.start.offset);
      range.setEnd(endNode, h.anchor.end.offset);
      addHighlightStyle(range, h);
    }
  });
}

function addHighlightStyle(range, h) {
  const span = document.createElement("span");
  span.id = h.id;

  const changeSpanStyle = (span, { color, fontWeight, fontStyle }) => {
    if (h.color) {
      span.style.backgroundColor = color;
    }
    if (h.fontStyle) {
      span.style.fontStyle = fontStyle;
    }
    if (h.fontWeight) {
      span.style.fontWeight = fontWeight;
    }
  };

  changeSpanStyle(span, h);

  //   span.classList.add("highlight");
  try {
    //用span元素包住選取的內容
    range.surroundContents(span);
  } catch (e) {
    // 處理無法直接包圍的複雜範圍
    const frag = range.extractContents();
    const newSpan = document.createElement("span");
    newSpan.id = h.id;
    // newSpan.classList.add("highlight");
    changeSpanStyle(newSpan, h);
    newSpan.appendChild(frag);
    range.insertNode(newSpan);
  }
}

function saveHighlightData(highlight) {
  if (localStorage.getItem("highlightData")) {
    highlightData = JSON.parse(localStorage.getItem("highlightData"));
    let existingData = highlightData.find((item) => item.id === highlight.id);
    if (existingData) {
      let existingData = {
        ...existingData,
        ...highlight,
      };
    } else {
      highlightData.push({
        id: generateUUID(),
        ...highlight,
        createdAt: new Date().toLocaleString(),
      });
    }
    localStorage.setItem("highlightData", JSON.stringify(highlightData));
  } else {
    highlightData = [
      {
        id: generateUUID(),
        ...highlight,
        createdAt: new Date().toLocaleString(),
      },
    ];
    localStorage.setItem("highlightData", JSON.stringify(highlightData));
  }
}
