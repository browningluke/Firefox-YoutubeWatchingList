function grabVideoUri() {
  const content = document.URL;

  // Grab all params and trim existing time (t=\d*)
  const [_, uncleanParams] = content.split("?");
  let params = uncleanParams.split("&").filter((i) => {
    return !i.match(/^t=\d*/);
  });

  // Grab and remove video id from param list
  const videoIdIndex = params.findIndex((v) => v.match(/^v=/));
  let videoId;
  if (videoIdIndex > -1) {
    videoId = params[videoIdIndex].replace("v=", "");
    params.splice(videoIdIndex, 1);
  } else {
    throw new Error("Cannot find video ID");
  }

  console.log(`Saving video\nid: ${videoId}\nparams: ${params}`);

  return {
    id: videoId,
    params: params
  }
}

// Function to handle messages from the background script
function handleMessage(request, _, sendResponse) {
  if (request.action == "ywlGetVideoData") {
    const uriInfo = grabVideoUri();

    sendResponse(uriInfo);
  }
}

// Listen for messages from the background script
browser.runtime.onMessage.addListener(handleMessage);
