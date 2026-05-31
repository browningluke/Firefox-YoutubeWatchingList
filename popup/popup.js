const YOUTUBE_BASE_URL = "https://youtube.com/watch?";

const state = {
  items: [],
  query: "",
  sort: "newest"
};

const elements = {};

function formatTime(secs) {
  const totalSeconds = Math.max(0, Math.floor(Number(secs) || 0));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (totalSeconds < 3600) {
    return `${Math.floor(totalSeconds / 60)}:${String(seconds).padStart(2, "0")}`;
  }

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function cleanDiv() {
  elements.itemList.innerHTML = "";
}

function buildURL(id, params = [], secs = 0) {
  const cleanParams = Array.isArray(params) ? params : [];
  const startSeconds = Math.max(0, Math.floor(Number(secs) || 0));
  const paramSuffix = cleanParams.length > 0 ? `&${cleanParams.join("&")}` : "";
  return `${YOUTUBE_BASE_URL}v=${encodeURIComponent(id)}&t=${startSeconds}${paramSuffix}`;
}

function getSortedItems(items) {
  const sortedItems = [...items];

  switch (state.sort) {
    case "oldest":
      sortedItems.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      break;
    case "title":
      sortedItems.sort((a, b) => (a.title || "").localeCompare(b.title || "", undefined, { sensitivity: "base" }));
      break;
    case "newest":
    default:
      sortedItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      break;
  }

  return sortedItems;
}

function getVisibleItems() {
  const query = state.query.trim().toLowerCase();

  const filteredItems = query.length === 0
    ? state.items
    : state.items.filter((item) => {
      const title = (item.title || "").toLowerCase();
      const channel = (item.channel || "").toLowerCase();
      return title.includes(query) || channel.includes(query);
    });

  return getSortedItems(filteredItems);
}

function createButton(label, action, id, className) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.dataset.action = action;
  button.dataset.id = id;
  return button;
}

function createItemCard(item) {
  const card = document.createElement("article");
  card.className = "item";

  const info = document.createElement("div");
  info.className = "item-info";

  const title = document.createElement("h2");
  title.className = "title";
  title.textContent = item.title || "Untitled video";
  info.appendChild(title);

  const hasDuration = Number(item.duration) > 0;
  const watchedSeconds = Math.max(0, Math.floor(Number(item.secs) || 0));

  if (hasDuration) {
    const progress = document.createElement("div");
    progress.className = "progress";

    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";
    const percentWatched = Math.max(0, Math.min(100, Math.round((watchedSeconds / Number(item.duration)) * 100)));
    progressFill.style.width = `${percentWatched}%`;

    progress.appendChild(progressFill);
    info.appendChild(progress);
  }

  if (item.channel) {
    const channel = document.createElement("div");
    channel.className = "channel";
    channel.textContent = item.channel;
    info.appendChild(channel);
  }

  const timeMeta = document.createElement("div");
  timeMeta.className = "time-meta";
  timeMeta.textContent = hasDuration
    ? `${formatTime(watchedSeconds)} / ${formatTime(item.duration)}`
    : `at ${formatTime(watchedSeconds)}`;
  info.appendChild(timeMeta);

  const buttonGroup = document.createElement("div");
  buttonGroup.className = "button-group";
  buttonGroup.append(
    createButton("Restore", "restore", item.id, "restore-button"),
    createButton("Delete", "delete", item.id, "delete-button")
  );
  info.appendChild(buttonGroup);

  card.appendChild(info);

  const thumbnail = document.createElement("img");
  thumbnail.className = "item-thumbnail";
  thumbnail.alt = item.title || "Saved video thumbnail";
  thumbnail.onerror = () => {
    thumbnail.style.display = "none";
    card.classList.add("image-hidden");
  };

  if (item.frame_data) {
    thumbnail.src = item.frame_data;
    card.appendChild(thumbnail);
  } else {
    card.classList.add("image-hidden");
  }

  return card;
}

function renderEmptyState(hasQuery) {
  const emptyState = document.createElement("div");
  emptyState.className = "empty-state";

  const message = document.createElement("div");
  message.className = "empty-title";

  if (hasQuery) {
    message.textContent = `No results for "${state.query.trim()}"`;
    emptyState.appendChild(message);
  } else {
    const icon = document.createElement("div");
    icon.className = "empty-icon";
    icon.textContent = "▶";

    const hint = document.createElement("div");
    hint.className = "empty-subtitle";
    hint.textContent = "Right-click a YouTube video or use Alt+Shift+S to save";

    message.textContent = "No saved videos yet";
    emptyState.append(icon, message, hint);
  }

  elements.itemList.appendChild(emptyState);
}

function renderItems() {
  cleanDiv();

  const visibleItems = getVisibleItems();
  const hasQuery = state.query.trim().length > 0;

  if (visibleItems.length === 0) {
    renderEmptyState(hasQuery);
    return;
  }

  const fragment = document.createDocumentFragment();
  visibleItems.forEach((item) => {
    fragment.appendChild(createItemCard(item));
  });
  elements.itemList.appendChild(fragment);
}

async function getAllItemsFromDB() {
  const resp = await browser.runtime.sendMessage({ action: "idbGetAll", data: null });

  if ("error" in resp) {
    throw new Error(resp.error);
  }

  return Array.isArray(resp.data) ? resp.data : [];
}

async function loadItemsFromDB() {
  state.items = await getAllItemsFromDB();
  renderItems();
}

async function removeFromDB(key) {
  const resp = await browser.runtime.sendMessage({ action: "idbRemove", data: key });
  if ("error" in resp) {
    console.error("Failed to delete item");
    throw new Error(resp.error);
  }
}

async function openTab(key) {
  const itemResp = await browser.runtime.sendMessage({ action: "idbGet", data: key });
  if ("error" in itemResp) {
    console.error("Failed to get item");
    throw new Error(itemResp.error);
  }

  const item = itemResp.data;
  const url = buildURL(item.id, item.params, item.secs);
  await browser.tabs.create({ url });
  await removeFromDB(key);
  await loadItemsFromDB();
}

async function exportItems() {
  const items = await getAllItemsFromDB();
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "watching-list-export.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function handleListClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button || !elements.itemList.contains(button)) {
    return;
  }

  const { action, id } = button.dataset;

  switch (action) {
    case "restore":
      await openTab(id);
      break;
    case "delete":
      await removeFromDB(id);
      await loadItemsFromDB();
      break;
    default:
      throw new Error("Unknown button clicked");
  }
}

function handleSearchInput(event) {
  state.query = event.target.value;
  renderItems();
}

function handleSortChange(event) {
  state.sort = event.target.value;
  renderItems();
}

async function init() {
  elements.itemList = document.getElementById("item-list");
  elements.search = document.getElementById("search");
  elements.sort = document.getElementById("sort");
  elements.exportBtn = document.getElementById("export-btn");

  elements.itemList.addEventListener("click", (event) => {
    handleListClick(event).catch((error) => {
      console.error(error);
    });
  });
  elements.search.addEventListener("input", handleSearchInput);
  elements.sort.addEventListener("change", handleSortChange);
  elements.exportBtn.addEventListener("click", () => {
    exportItems().catch((error) => {
      console.error(error);
    });
  });

  await loadItemsFromDB();
}

window.addEventListener("DOMContentLoaded", () => {
  init().catch((error) => {
    console.error(error);
  });
});
