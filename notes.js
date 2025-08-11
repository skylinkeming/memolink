chrome.storage.local.get(null, (data) => {
  const noteList = document.getElementById("noteList");

  Object.keys(data).forEach(url => {
    const page = data[url];
    if (!page.highlights || !page.highlights.length) return;

    const container = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = page.title || url;
    container.appendChild(title);

    page.highlights.forEach((h, idx) => {
      const item = document.createElement("div");
      item.innerHTML = `
        <div style="background:${h.color}; font-weight:${h.bold ? 'bold' : 'normal'}; font-style:${h.italic ? 'italic' : 'normal'}">
          ${h.text}
        </div>
        <textarea>${h.note || ''}</textarea>
        <button class="saveBtn" data-url="${url}" data-idx="${idx}">儲存</button>
        <button class="deleteBtn" data-url="${url}" data-idx="${idx}">刪除</button>
      `;
      container.appendChild(item);
    });

    noteList.appendChild(container);
  });

  noteList.addEventListener("click", (e) => {
    if (e.target.classList.contains("saveBtn")) {
      const url = e.target.dataset.url;
      const idx = e.target.dataset.idx;
      const newNote = e.target.previousElementSibling.value;
      chrome.storage.local.get([url], (res) => {
        res[url].highlights[idx].note = newNote;
        chrome.storage.local.set({ [url]: res[url] });
      });
    }

    if (e.target.classList.contains("deleteBtn")) {
      const url = e.target.dataset.url;
      const idx = e.target.dataset.idx;
      chrome.storage.local.get([url], (res) => {
        res[url].highlights.splice(idx, 1);
        chrome.storage.local.set({ [url]: res[url] }, () => location.reload());
      });
    }
  });
});
