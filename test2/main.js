
import {highlightText, getSelectedTextChunks } from './highlightUtils.js';

let toolbar = null;
let currentSelection = null;
let targetStrings = [];

// 頁面讀取後 取回重點資料
document.addEventListener("DOMContentLoaded", () => {
  //   getStoredDataAndApplyHighlight();
});

// 綁定滑鼠放開事件 如果放開的時候有選取文字 則顯示toolbar
document.addEventListener("mouseup", () => {
  console.log("mouse up");
    console.log(getSelectedTextChunks());

  targetStrings = getSelectedTextChunks();
  targetStrings.forEach(text=>{
    highlightText(text);
  });

  currentSelection = window.getSelection();

  if (!currentSelection.isCollapsed) {
    let currentRange = currentSelection.getRangeAt(0);
    showToolbar(currentRange);
  } else {
    removeExistingToolbar();
  }
});

//畫出toolbar toolbar上綁定事件
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
    //避免點擊toolbar時選取文字被取消
    e.preventDefault();
  });

  //定位
  const rect = range.getBoundingClientRect();
  toolbar.style.top = `${window.scrollY + rect.top - 40}px`;
  toolbar.style.left = `${window.scrollX + rect.left}px`;

  document.body.appendChild(toolbar);

  //綁定點擊事件
  document.querySelector("#colorBtn").addEventListener("click", () => {
    handleClickToolbarButton({ backgroundColor: "yellow" });
  });
  document.querySelector("#boldBtn").addEventListener("click", () => {
    handleClickToolbarButton({ fontWeight: "bold" });
  });
  document.querySelector("#italicBtn").addEventListener("click", () => {
    handleClickToolbarButton({ fontStyle: "italic" });
  });
}

function handleClickToolbarButton({ backgroundColor, fontWeight, fontStyle }) {
  // 檢查selection的選取文字內容是否有與已存的highlight內容重疊
  // 如果有 而且與已存highlight的xpath相同 則視為編輯
  // 否則視為新增

  // 如果在選取新的文字下點擊 => 新增一個highlight

  // 在已經存檔的選取文字上點擊 => 編輯
  changeSelectionStyle({ backgroundColor, fontWeight, fontStyle });
}

//隱藏toolbar
function removeExistingToolbar() {
  if (toolbar) {
    document.body.removeChild(toolbar);
    toolbar = null;
  }
}

//改變選取文字的樣式
function changeSelectionStyle({ backgroundColor, fontWeight, fontStyle }) {}

//編輯既有重點的樣式
function editSelectionStyle({ backgroundColor, fontWeight, fontStyle }) {}

//移除選取文字的樣式
function removeSelectionStyle() {}
