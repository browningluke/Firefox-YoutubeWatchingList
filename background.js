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
