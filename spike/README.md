# ImprovEx spike test page

A throwaway page for the phone tests in `docs/SPIKE-TESTS.md`. Plain JS, no build step. It uses `../vendor/` and `../samples/shellopan/`.

## Run on the phone (needs HTTPS for the microphone)
1. Push the repo to GitHub. GitHub Pages works for public repos (private repos need a paid plan).
2. Repo → Settings → Pages → *Deploy from a branch* → `main` / `(root)`.
3. Open `https://<user>.github.io/ImprovEx/spike/` in Chrome on the phone.
4. For E1, Chrome menu → *Add to Home screen / Install app*.

## Run on the laptop (quick check)
From the repo root run `python -m http.server 8000`, then open `http://localhost:8000/spike/` (localhost counts as secure, so the mic works).

## Tabs
- **Play:** root, scale and pad count (6–12). The ding is always C3–B3. Toggles for *tail fade* (C3) and *screen flash* (helps when filming latency, C1).
- **Listen:** hold to record, release to analyse (minimum 5 s, maximum 60 s). Shows the top 3 keys with fit %, a clear winner / close call verdict, a mini handpan heat preview, a chroma chart, level/clipping stats and the actual mic settings (B1/B2). After a listen, the Play pads glow by how much each note was heard.
- **Diag:** AudioContext latency, sample load time, Tonal check, service worker, mic permission, and an event log (focus/blur/visibility/AudioContext state/mic track events, useful for A1–A3 and D1).
- **Tests:** checklist A1–E3 with pass/partial/fail and notes, saved on the phone. *Copy results* gives you markdown to paste back to Claude.

## Notes
- After changing `spike.js`, `spike.css` or `index.html`, a normal reload picks it up (network-first). Samples and vendor files are cache-first, so bump `CACHE` in `sw.js` when those change.
- Tone.js is cached but deliberately not executed in the spike (it would create its own AudioContext and blur test A2).
- Key detection: chroma over 60–1000 Hz with 1/sqrt(f) weighting plus Krumhansl-Kessler profiles. Pre-checked in headless Chrome with a fake mic on 7 test clips (6 synthetic keys + a D minor clip built from the Shellopan samples, also through a simulated phone-speaker filter). All were detected correctly as #1. The first version (120–2000 Hz, unweighted) leaned towards the dominant (e.g. A minor for D minor). Real songs are test B3.
- Note names use sharps only (e.g. A#3 instead of Bb3 in D Kurd); proper spelling is for v1.
