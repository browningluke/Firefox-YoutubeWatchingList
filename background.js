// Create root context menu
const rootID = browser.contextMenus.create({
  id: `ywl-root`,
  title: "Save Video to Watching List",
  contexts: ["all"],
});

function saveVideo(tabId) {
  browser.tabs.sendMessage(tabId, { action: "ywlGetVideoData" })
  .then((videoData) => {
    // TODO Save video data
  });
}

browser.contextMenus.onClicked.addListener((_, tab) => {
  // Grab content (url of link selected, or page)
  let content = tab.url

  // If page is youtube video
  if (/(youtube\.com|youtu\.be)\/watch/.test(content)) {
    saveVideo(tab.id);
  } else {
    console.log("Not a youtube video, ignoring...");
  }
});
