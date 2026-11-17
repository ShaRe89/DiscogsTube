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

1. Install [Violentmonkey](https://violentmonkey.github.io/) in your browser.
2. Open [`DiscogsTube.user.js`](DiscogsTube.user.js), then install its contents in Violentmonkey.
3. Disable previous versions of the Discogs YouTube replacement userscript to avoid conflicts.
4. Open or reload a Discogs release or master page.

## Notes

- Current release: **v0.9.0**, tested in Waterfox.
- This project is unofficial and is not affiliated with Discogs or YouTube.
- YouTube's iframe UI and Discogs' page structure may change. Some videos or titles may be unavailable due to external restrictions.
- The v0.9 userscript is included **unchanged**, preserving the working, user-tested implementation.
