# DiscogsTube

A lightweight YouTube player replacement for [Discogs](https://www.discogs.com/) release and master pages.

DiscogsTube uses its own YouTube iframe player instead of Discogs' playlist synchronization. It loads videos with `loadVideoById()`, displays a full-length clickable video list, and fetches the original YouTube titles.

## Features

- Reliable video switching without Discogs' playlist controls
- Original YouTube video titles (with a fallback when a title is unavailable)
- A full-length video list integrated into the Discogs video section
- Cleaner YouTube embeds: hides Share, Watch later, Watch on YouTube, captions, fullscreen controls and recommendation overlays
- Keeps the channel information, volume, settings, timeline and playback controls
- Works on Discogs release and master pages

## Installation

DiscogsTube is a **userscript**, so you need a userscript manager. **Violentmonkey is not required**; other managers are available:

| Userscript manager | Browser support | DiscogsTube compatibility |
| --- | --- | --- |
| [Violentmonkey](https://violentmonkey.github.io/) | Firefox / Waterfox and compatible browsers | **Tested in Waterfox** |
| [Tampermonkey](https://www.tampermonkey.net/) | Firefox, Chrome, Edge, Safari, Opera | Not yet tested |
| [Greasemonkey](https://addons.mozilla.org/firefox/addon/greasemonkey/) | Firefox and compatible browsers | Not yet tested |
| [FireMonkey](https://addons.mozilla.org/firefox/addon/firemonkey/) | Firefox and compatible browsers | Not yet tested |

1. Install **one** of the userscript managers above.
2. In its dashboard, create a new userscript and paste the contents of [`DiscogsTube.user.js`](DiscogsTube.user.js). If your manager supports installing a local `.user.js` file, you can use that option instead.
3. Enable the script and grant site access as prompted. DiscogsTube runs on **Discogs release/master pages** and inside **embedded YouTube frames** to clean up the controls; both contexts must be allowed.
4. Disable any older Discogs video replacement scripts to avoid conflicts.
5. Open or reload a Discogs release or master page.

**Compatibility note:** The current v0.9 implementation was tested with **Violentmonkey in Waterfox only**. Other managers may handle the `@inject-into page` directive, page context, and frame injection differently; their support is not yet verified. Browser support for a manager does not imply that DiscogsTube has been tested with it.

## Notes

- Current release: **v0.9.0**, tested in Waterfox.
- This project is unofficial and is not affiliated with Discogs or YouTube.
- YouTube's iframe UI and Discogs' page structure may change. Some videos or titles may be unavailable due to external restrictions.
- The v0.9 userscript is included **unchanged**, preserving the working, user-tested implementation.
