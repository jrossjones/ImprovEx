// ImprovEx spike service worker: cache-first for samples/vendor, network-first for app files.
const CACHE = 'improvex-spike-v2';
const NAMES = ['C','Cs','D','Ds','E','F','Fs','G','Gs','A','As','B'];
const ASSETS = ['./', './index.html', './spike.css', './spike.js', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  '../vendor/tonal/tonal.min.js', '../vendor/tone/Tone.js'];
for (let m = 36; m <= 91; m++) ASSETS.push('../samples/shellopan/' + NAMES[m % 12] + (Math.floor(m / 12) - 1) + '.flac');

self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;
  if (/\.flac$|\/vendor\//.test(url)) {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  } else {
    e.respondWith(fetch(e.request).then(r => {
      const copy = r.clone(); if (r.ok) caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true })));
  }
});
