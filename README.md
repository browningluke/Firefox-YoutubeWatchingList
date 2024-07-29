# Youtube Watching List - A Firefox Extension
<div align="center">
<a href="https://github.com/browningluke/Firefox-YoutubeWatchingList/releases/latest/download/YoutubeWatchingList.xpi"><img src="https://user-images.githubusercontent.com/585534/107280546-7b9b2a00-6a26-11eb-8f9f-f95932f4bfec.png" width="126px"></a>
</div>
A reading list saves your positions in books & articles. Why not have a watching list to save in-progress Youtube videos for later.

## Features
- Save current video to indexedDB
- List saved videos in extension popup
- Restore video at saved time from `Restore` button in popup

## Installation from Source

### Step 1

```
$ git clone https://github.com/browningluke/Firefox-YoutubeWatchingList.git
$ cd Firefox-YoutubeWatchingList
$ zip -r -FS ../youtube-watching-list.zip *
```

### Step 2

Go to `about:config`, change `xpinstall.signatures.required` to `false`.

### Step 3

Go to `about:addons`, and choose `Install Add-on from file option`, select the `youtube-watching-list.zip`.

### Step 4

Go to `about:config`, change `xpinstall.signatures.required` to `true`.
