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
