const YOUTUBE_BASE_URL = "https://youtube.com/watch?"

// ---
// Displaying items
// ---

function addItemsToDiv(items) {
  const itemList = document.getElementById('item-list');
  items.forEach(item => {
    const newItem = document.createElement('div');
    newItem.className = 'item';
    newItem.innerHTML = `
                    <div class="item-info">
                        <div class="title">${item.title}</div>
                        <div class="secs">Seconds: ${item.secs}</div>
                        <button id="${item.id}" class="restore-button">Restore</button>
                    </div>
                    <img src="${item.frame_data}" alt="${item.title}" class="item-image">
                `;
    itemList.appendChild(newItem);
  });
}

function cleanDiv() {
  const itemList = document.getElementById('item-list');
  itemList.innerHTML = '';
}

async function loadItemsFromDB() {
  cleanDiv();

  let resp = await browser.runtime.sendMessage({ action: 'idbGetAll', data: null });

  if ('error' in resp) {
    throw Error(resp.error);
  }

  // Sort in descending order (newest-first)
  const items = resp.data;
  items.sort((a, b) => {
    return b.createdAt - a.createdAt;
  });

  addItemsToDiv(items);
}

// Call the loadItems function when the page loads
window.onload = loadItemsFromDB;

// ---
// Opening tabs
// ---

function buildURL(id, params, secs) {
  return `${YOUTUBE_BASE_URL}v=${id}&t=${secs}` + (params.length > 0 ? "&" + params.join("&") : "");
}

async function openTab(key) {
  console.log("Opening tab from key: ", key);

  // Get item
  const itemResp = await browser.runtime.sendMessage({ action: 'idbGet', data: key });
  if ('error' in itemResp) {
    console.error("Failed to get item!!");
    throw itemResp.error;
  }

  const item = itemResp.data;

  // Build URL
  const url = buildURL(item.id, item.params, item.secs);
  await browser.tabs.create({ url: url });

  // Remove item from db
  let resp = await browser.runtime.sendMessage({ action: 'idbRemove', data: key });
  if ('error' in resp) {
    console.error("Failed to delete item!!");
    throw itemResp.error;
  }

  // Refresh UI
  loadItemsFromDB();
}

window.addEventListener("click", async (event) => {
  // Only handle button events
  if (event.target.tagName === 'BUTTON') {
    await openTab(event.target.id);
  }
});
