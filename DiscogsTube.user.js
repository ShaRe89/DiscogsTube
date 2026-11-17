// ==UserScript==
// @name         Discogs YouTube Replacement (experimental)
// @namespace    local.discogs.youtube-replacement
// @version      0.10.0
// @description  Stable Discogs player and video list; hide verified YouTube overlays.
// @match        https://www.discogs.com/*
// @match        https://discogs.com/*
// @match        https://www.youtube.com/embed/*
// @match        https://www.youtube-nocookie.com/embed/*
// @run-at       document-idle
// @grant        none
// @inject-into  page
// ==/UserScript==

(() => {
  'use strict';
  // Injected in the YouTube embed itself; Discogs cannot style this cross-origin iframe.
  if (/^(?:www\.)?youtube(?:-nocookie)?\.com$/.test(location.hostname) &&
      location.pathname.startsWith('/embed/')) {
    const hostFrom = value => { try { return new URL(value).hostname; } catch { return ''; } };
    const origin = new URLSearchParams(location.search).get('origin') || '';
    if (!/(^|\.)discogs\.com$/.test(hostFrom(origin)) &&
        !/(^|\.)discogs\.com$/.test(hostFrom(document.referrer))) return;
    const hide = () => {
      if (document.getElementById('discogs-youtube-hide-ui')) return;
      const css = document.createElement('style');
      css.id = 'discogs-youtube-hide-ui';
      // Confirmed on the current YouTube embed UI in Waterfox.
      css.textContent = `
        [aria-label="Share"],
        [aria-label="Watch later"],
        [aria-label="Watch on YouTube"],
        [aria-label^="Subtitles/CC"],
        [aria-label*="Full screen"],
        [aria-label*="Fullscreen"],
        .fullscreen-watch-next-entrypoint-wrapper,
        .fullscreen-recommendations-wrapper,
        .ytp-ce-element,
        .ytp-endscreen-content,
        .ytp-pause-overlay,
        .ytp-cards-teaser,
        .ytp-cards-button,
        .ytp-suggested-action,
        .ytp-autonav-endscreen-upnext-container,
        .ytPlayerStoryboardHost,
        .ytPlayerStoryboardStoryboardImageWrapper {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
      `;
      (document.head || document.documentElement).appendChild(css);
    };
    if (document.documentElement) hide();
    else document.addEventListener('DOMContentLoaded', hide, { once: true });
    return;
  }

  // Do not run Discogs' video replacement logic inside YouTube frames or other sites.
  if (!/(^|\.)discogs\.com$/.test(location.hostname) || window.top !== window) return;
  const TAG = '[Discogs Player]';
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let route = '', cleanup = () => {}, generation = 0, pending = 0;

  function videoId(value) {
    try {
      const u = new URL(value, location.href), h = u.hostname;
      const id = /(^|\.)youtu\.be$/.test(h) ? u.pathname.split('/')[1]
        : /(^|\.)youtube(-nocookie)?\.com$/.test(h) ?
          (u.searchParams.get('v') || u.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1])
        : /(^|\.)ytimg\.com$/.test(h) ? u.pathname.match(/\/vi(?:_webp)?\/([^/]+)/)?.[1]
        : null;
      return /^[\w-]{11}$/.test(id) ? id : null;
    } catch { return null; }
  }

  async function start(token) {
    let section;
    for (let n = 0; n < 100 && token === generation; n++) {
      const heading = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role="heading"]')]
        .find(h => /^Videos(?:\s*\(\d+\))?/i.test(h.textContent.trim()));
      section = heading?.closest('section') ||
        document.querySelector('img[src*="ytimg.com/vi/"]')?.closest('section');
      if (section) break;
      await sleep(100);
    }
    if (!section || token !== generation) return;

    let original = section.querySelector('button[aria-label="Play"] img, img[src*="ytimg.com/vi/"], iframe[src*="youtube.com/embed/"]');
    while (original && original.parentElement !== section) original = original.parentElement;
    original ||= [...section.children].find(e => String(e.className).includes('content_'));
    if (!original) return console.warn(TAG, 'Original-Videobereich nicht gefunden');

    const ids = new Set(), m = location.pathname.match(/^\/(release|master)\/(\d+)/);
    if (m) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const kind = m[1] === 'release' ? 'releases' : 'masters';
          const r = await fetch(`https://api.discogs.com/${kind}/${m[2]}`, { signal: controller.signal });
          if (r.ok) for (const v of (await r.json()).videos || []) {
            const id = videoId(v.uri);
            if (id) ids.add(id);
          }
        } finally { clearTimeout(timeout); }
      } catch { /* Fallback: IDs aus dem DOM lesen */ }
    }
    if (!ids.size) for (const e of section.querySelectorAll('img[src],a[href],iframe[src]')) {
      const id = videoId(e.getAttribute('src') || e.getAttribute('href'));
      if (id) ids.add(id);
    }
    if (!ids.size || token !== generation) return console.warn(TAG, 'Keine Video-IDs gefunden');

    const videos = [...ids], panel = document.createElement('div');
    panel.id = 'discogs-console-player';
    panel.style.cssText = 'display:block;width:100%;height:auto;min-height:0;max-height:none;overflow:visible;box-sizing:border-box';
    const screen = document.createElement('div');
    screen.style.cssText = 'position:relative;width:100%;aspect-ratio:16/9;background:#000;overflow:hidden';
    const target = document.createElement('div');
    target.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
    screen.append(target);
    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;width:100%;height:auto;max-height:none;overflow:visible;margin:6px 0 12px';
    panel.append(screen, list);
    const oldStyle = original.getAttribute('style');
    section.insertBefore(panel, original);
    original.style.setProperty('display', 'none', 'important');

    // Remove the iframe title that triggers the browser tooltip over the seek bar.
    // YouTube writes it again on video changes, so watch for replacements/updates.
    const removeIframeTitles = () => {
      panel.querySelectorAll('iframe[title]').forEach(frame => frame.removeAttribute('title'));
    };
    const titleObserver = new MutationObserver(removeIframeTitles);
    titleObserver.observe(panel, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['title']
    });
    removeIframeTitles();

    cleanup = () => {
      titleObserver.disconnect();
      panel.remove();
      if (oldStyle === null) original.removeAttribute('style');
      else original.setAttribute('style', oldStyle);
    };

    const buttons = videos.map((id, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = `Lade YouTube-Titel … (${i + 1})`;
      b.disabled = true;
      b.style.cssText = 'display:block;flex:none;width:100%;min-height:34px;height:auto;white-space:normal;overflow-wrap:anywhere;text-align:left;padding:8px 10px;border:0;border-bottom:1px solid #ddd;background:transparent;color:#1769cc;cursor:pointer;font:inherit;line-height:1.4';
      list.append(b);
      return b;
    });

    if (!window.YT?.Player && !document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      document.head.append(s);
    }
    for (let n = 0; n < 100 && !window.YT?.Player && token === generation; n++) await sleep(100);
    if (token !== generation) return;
    if (!window.YT?.Player) {
      cleanup();
      cleanup = () => {};
      return console.error(TAG, 'YouTube-API nicht geladen');
    }

    const player = new YT.Player(target, {
      width: '100%', height: '100%', videoId: videos[0],
      playerVars: { rel: 0, playsinline: 1, fs: 0, cc_load_policy: 0 },
      events: {
        onReady: () => buttons.forEach(b => b.disabled = false),
        onError: e => console.warn(TAG, 'YouTube-Fehler', e.data)
      }
    });
    buttons.forEach((b, i) => b.onclick = () => {
      buttons.forEach((x, j) => x.style.background = i === j ? '#dce9f8' : 'transparent');
      player.loadVideoById(videos[i]);
    });
    buttons[0].style.background = '#dce9f8';

    // Titel einzeln laden, ohne die Wiedergabe zu blockieren.
    videos.forEach(async (id, i) => {
      try {
        const url = 'https://www.youtube.com/oembed?format=json&url=' +
          encodeURIComponent('https://www.youtube.com/watch?v=' + id);
        const r = await fetch(url);
        if (!r.ok) throw Error(r.status);
        const title = (await r.json()).title;
        if (token === generation) buttons[i].textContent = title || id;
      } catch {
        if (token === generation) buttons[i].textContent = `YouTube-Titel nicht verfügbar (${id})`;
      }
    });
    console.log(TAG, videos.length, 'Videos eingebaut');
  }

  function checkRoute() {
    const path = location.pathname.match(/^\/(?:release|master)\/\d+/)?.[0] || '';
    if (path !== route) {
      route = path;
      ++generation;
      pending = 0;
      cleanup();
      cleanup = () => {};
    }
    if (path && !document.getElementById('discogs-console-player') && pending !== generation) {
      const token = generation;
      pending = token;
      void start(token).finally(() => {
        if (pending === token) pending = 0;
      });
    }
  }
  checkRoute();
  setInterval(checkRoute, 1500);
})();
