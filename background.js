const DATABASE_NAME = "ytw-db";
const DB_VERSION = 1;
const STORE_NAME = `videos${DB_VERSION}`;

const schema = [
  ["params", "params", { unique: false }],
  ["createdAt", "createdAt", { unique: false }],
  ["frame_data", "frame_data", { unique: false }],
  ["secs", "secs", { unique: false }],
  ["title", "title", { unique: false }]
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

function indexDBWrapper(fn) {
  return new Promise(
    function (resolve, reject) {
      const request = indexedDB.open(DATABASE_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        reject(Error("DB not created!"));
      };

      request.onsuccess = function (event) {
        const db = event.target.result;
        // console.log("Database opened successfully");

        const transaction = db.transaction([STORE_NAME], "readwrite");
        const objectStore = transaction.objectStore(STORE_NAME);

        const request = fn(objectStore);

        request.onsuccess = function () {
          // console.log("Transaction success!!");
          resolve(request.result);
        };

        request.onerror = function (event) {
          reject(Error(`Error adding object: ${event.target.error}`));
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
  });
}

function indexDBGet(key) {
  return indexDBWrapper((objectStore) => {
    return objectStore.get(key);
  });
}

// ---
// Saving video
// ---

async function saveVideo(tabId) {
  let videoData = await browser.tabs.sendMessage(tabId, { action: "ywlGetVideoData" });
  // TODO Save video data
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
