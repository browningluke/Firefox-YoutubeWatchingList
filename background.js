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
