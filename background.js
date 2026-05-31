const DATABASE_NAME = "ytw-db";
const DB_VERSION = 1;
const STORE_NAME = `videos${DB_VERSION}`;

const schema = [
  ["params", "params", { unique: false }],
  ["createdAt", "createdAt", { unique: false }],
  ["frame_data", "frame_data", { unique: false }],
  ["secs", "secs", { unique: false }],
  ["title", "title", { unique: false }],
  ["duration", "duration", { unique: false }],
  ["channel", "channel", { unique: false }]
]

// Create root context menu
const rootID = browser.contextMenus.create({
  id: `ywl-root`,
  title: "Save Video to Watching List",
  contexts: ["all"],
});

// ---
// IndexDB functions
// ---

function ensureObjectStore(event) {
  const db = event.target.result;
  let objectStore;

  if (db.objectStoreNames.contains(STORE_NAME)) {
    objectStore = event.target.transaction.objectStore(STORE_NAME);
  } else {
    objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: false });
  }

  schema.forEach((item) => {
    if (!objectStore.indexNames.contains(item[0])) {
      console.log("Creating index: ", item[0]);
      objectStore.createIndex(...item);
    }
  });
}

function indexDBWrapper(fn, onUpdateFn) {
  return new Promise(
    function (resolve, reject) {
      const request = indexedDB.open(DATABASE_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        if (onUpdateFn) {
          onUpdateFn(event);
        }
      };

      request.onsuccess = function (event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.close();
          reject(Error("DB not created!"));
          return;
        }

        const transaction = db.transaction([STORE_NAME], "readwrite");
        const objectStore = transaction.objectStore(STORE_NAME);
        let result;

        const request = fn(objectStore);

        request.onsuccess = function () {
          result = request.result;
        };

        request.onerror = function (event) {
          db.close();
          reject(Error(`Error performing IndexedDB request: ${event.target.error}`));
        };

        transaction.onabort = function (event) {
          db.close();
          reject(Error(`Error completing transaction: ${event.target.error}`));
        };

        transaction.oncomplete = function () {
          db.close();
          resolve(result);
        };
      };

      request.onerror = function (event) {
        reject(Error(`Error opening database:  ${event.target.error}`));
      };
    }
  );
}

function indexDBGetAll() {
  return indexDBWrapper((objectStore) => {
    return objectStore.getAll();
  }, ensureObjectStore);
}

function indexDBGet(key) {
  return indexDBWrapper((objectStore) => {
    return objectStore.get(key);
  }, ensureObjectStore);
}

function indexDBCount() {
  return indexDBWrapper((objectStore) => {
    return objectStore.count();
  }, ensureObjectStore);
}

function updateBadge() {
  indexDBCount().then((count) => {
    browser.browserAction.setBadgeText({ text: count > 0 ? String(count) : "" });
    browser.browserAction.setBadgeBackgroundColor({ color: "#cc0000" });
  }).catch(() => {
    browser.browserAction.setBadgeText({ text: "" });
  });
}

function indexDBAdd(obj) {
  const object = {
    ...obj,
    createdAt: Math.floor(Date.now() / 1000)
  };

  return indexDBWrapper((objectStore) => {
    return objectStore.put(object);
  }, ensureObjectStore).then((result) => {
    updateBadge();
    return result;
  });
}

function indexDBRemove(key) {
  return indexDBWrapper((objectStore) => {
    return objectStore.delete(key);
  }, ensureObjectStore).then((result) => {
    updateBadge();
    return result;
  });
}

updateBadge();

// ---
// IndexDB rpc-like implmentation
// ---

// Listen for messages from the popup script
browser.runtime.onMessage.addListener((message, _, sendResponse) => {
  switch (message.action) {
    case "idbGetAll":
      indexDBGetAll().then((items) => {
        sendResponse({ data: items });
      }).catch((err) => {
        sendResponse({ data: [], error: err });
      });
      break;
    case "idbRemove":
      indexDBRemove(message.data).then((_) => {
        sendResponse({});
      }).catch((err) => {
        sendResponse({ error: err });
      });
      break;
    case "idbGet":
      indexDBGet(message.data).then((item) => {
        sendResponse({ data: item });
      }).catch((err) => {
        sendResponse({ data: null, error: err });
      });
      break;
    default:
      break;
  }

  return true;
});

// ---
// Saving video
// ---

async function saveVideo(tabId) {
  let videoData = await browser.tabs.sendMessage(tabId, { action: "ywlGetVideoData" });
  try {
    // Add to db
    await indexDBAdd(videoData);

    // Close tab
    await browser.tabs.remove(tabId);
  } catch (e) {
    console.error("Failed to store video in db");
    throw e;
  }
}

browser.contextMenus.onClicked.addListener(async (_, tab) => {
  // Grab content (url of link selected, or page)
  let content = tab.url

  // If page is youtube video
  if (/(youtube\.com|youtu\.be)\/watch/.test(content)) {
    await saveVideo(tab.id);
  } else {
    console.log("Not a youtube video, ignoring...");
  }
});

browser.commands.onCommand.addListener(async (command) => {
  if (command === "save-video") {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    if (tabs.length > 0 && /(youtube\.com|youtu\.be)\/watch/.test(tabs[0].url)) {
      await saveVideo(tabs[0].id);
    }
  }
});
