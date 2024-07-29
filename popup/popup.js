// ---
// Loading / Displaying items
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

window.onload = () => loadItems([
  { title: "test1", secs: 100, id: "dQw4w9WgXcQ", frame_data: "<some png data>" }
]);
