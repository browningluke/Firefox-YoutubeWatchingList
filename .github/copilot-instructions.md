# Copilot Instructions

## Project Overview

Firefox browser extension (Manifest V2) that saves in-progress YouTube videos to IndexedDB and lets users restore them later at the saved timestamp.

## Build & Lint

```bash
# Lint the extension
web-ext lint

# Package for manual installation
zip -r -FS ../youtube-watching-list.zip *

# Sign & release (requires AMO API credentials)
web-ext sign --channel="unlisted" --api-key=<KEY> --api-secret=<SECRET>
```

There is no test suite. The CI workflow (`firefox-sign.yml`) runs `web-ext lint` on every tagged release push.

Pre-commit hooks enforce YAML validity, end-of-file newlines, and no trailing whitespace (`.pre-commit-config.yaml`).

## Architecture

The extension has three distinct execution contexts that communicate only via message passing:

| File | Context | Responsibility |
|---|---|---|
| `background.js` | Background page | Owns all IndexedDB access; handles context menu; acts as RPC server |
| `content.js` | YouTube tab | Reads DOM/video state when queried; sends video data back |
| `popup/popup.js` | Extension popup | Renders saved videos; sends DB read/delete commands to background |

**Message flow:**
1. User right-clicks on a YouTube video → context menu fires in `background.js`
2. Background sends `{ action: "ywlGetVideoData" }` to the active tab's content script
3. `content.js` extracts video ID, URL params, current timestamp, title, and a 240×135 PNG frame; returns the data
4. Background stores the object in IndexedDB via `indexDBAdd()`, then closes the tab
5. Popup sends `idbGetAll` / `idbGet` / `idbRemove` messages to background; background responds with results

## IndexedDB Schema

- Database: `ytw-db` (version `DB_VERSION = 1`)
- Object store: `videos1` (name is `videos${DB_VERSION}` — changing `DB_VERSION` creates a new store)
- Key path: `id` (YouTube video ID string, e.g. `"dQw4w9WgXcQ"`) — not auto-incremented; saving the same video twice will throw
- Fields: `id`, `params` (extra URL param strings), `title`, `secs` (integer), `frame_data` (PNG data URL), `createdAt` (Unix timestamp, always set by `indexDBAdd`)

`indexDBWrapper()` in `background.js` is the single entry point for all DB operations. All callers pass a function that receives the object store.

## Key Conventions

- **`browser.*` API only** — never `chrome.*`; the extension targets Firefox (gecko, `strict_min_version: "112.0"`)
- **No direct DB access from popup or content script** — all IndexedDB calls go through background via `browser.runtime.sendMessage()`
- **Saving closes the tab** — `saveVideo()` calls `browser.tabs.remove()` after storing; restoring opens a new tab and removes the item from DB
- **Popup sorts newest-first** — items are sorted by `createdAt` descending before rendering
- **`createdAt` is injected by `indexDBAdd`**, not by callers; don't pass it in the object being saved
- **Releases follow semver** — push a `v*.*.*` tag to trigger the signing workflow and create a GitHub release
