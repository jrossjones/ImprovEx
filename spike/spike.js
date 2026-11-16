'use strict';
/* ImprovEx spike test page: plain JS, no build step.
   Covers docs/SPIKE-TESTS.md groups A–E. Throwaway code. */
const VERSION = 'spike-0.2';
const $ = s => document.querySelector(s);

// ---------- notes & samples ----------
const FILE_NAMES = ['C','Cs','D','Ds','E','F','Fs','G','Gs','A','As','B'];
const DISP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const MIDI_MIN = 36, MIDI_MAX = 91;               // C2..G6 (Shellopan set)
const SAMPLE_BASE = '../samples/shellopan/';
const fileFor = m => FILE_NAMES[m % 12] + (Math.floor(m / 12) - 1) + '.flac';
const nn = m => DISP[m % 12] + (Math.floor(m / 12) - 1);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const fmtMs = v => (typeof v === 'number' && !isNaN(v)) ? (v * 1000).toFixed(1) + ' ms' : 'n/a';
const db = v => v > 0 ? (20 * Math.log10(v)).toFixed(1) + ' dBFS' : '-inf';

// ---------- log ----------
const logEl = $('#log');
function log(msg) {
  const line = `[${(performance.now() / 1000).toFixed(2)}s] ${msg}`;
  console.log(line);
  logEl.textContent = line + '\n' + logEl.textContent;
}
['visibilitychange', 'focus', 'blur', 'pageshow', 'online', 'offline'].forEach(ev =>
  window.addEventListener(ev, () => log(`window ${ev}${ev === 'visibilitychange' ? ': ' + document.visibilityState : ''}`)));
let resizeT; window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => log(`resize ${innerWidth}x${innerHeight}`), 300); });

// ---------- tabs ----------
document.querySelectorAll('nav button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
function showTab(name) {
  document.querySelectorAll('nav button').forEach(x => x.classList.toggle('active', x.dataset.tab === name));
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.id === 'tab-' + name));
  if (name === 'diag') renderDiag();
}

// ---------- audio context ----------
let ctx = null;
function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    ctx.onstatechange = () => log('AudioContext state: ' + ctx.state);
    log(`AudioContext created sr=${ctx.sampleRate} base=${fmtMs(ctx.baseLatency)} out=${fmtMs(ctx.outputLatency)}`);
  }
  return ctx;
}

// ---------- sample loading (C4) ----------
const buffers = new Map();
let loadStats = null;
async function loadSamples() {
  const c = getCtx();
  buffers.clear();
  const t0 = performance.now();
  let bytes = 0; const fails = [];
  await Promise.all(range(MIDI_MIN, MIDI_MAX).map(async m => {
    try {
      const r = await fetch(SAMPLE_BASE + fileFor(m));
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const ab = await r.arrayBuffer();
      bytes += ab.byteLength;
      buffers.set(m, await c.decodeAudioData(ab));
    } catch (e) { fails.push(fileFor(m) + ': ' + (e.message || e.name)); }
  }));
  loadStats = { ms: Math.round(performance.now() - t0), decoded: buffers.size, of: MIDI_MAX - MIDI_MIN + 1, MB: +(bytes / 1e6).toFixed(2), fails };
  log(`Samples ${buffers.size}/${loadStats.of} decoded in ${loadStats.ms} ms (${loadStats.MB} MB)` + (fails.length ? ' FAILS: ' + fails.join(', ') : ''));
}

// ---------- playing (C1, C2, C3, C5) ----------
let tapCount = 0, firstTapLogged = false;
function playNote(m) {
  const c = getCtx();
  if (!firstTapLogged) { firstTapLogged = true; log('first tap; AudioContext state was ' + c.state); }
  if (c.state !== 'running') { log('tap while AudioContext ' + c.state + ' -> resume()'); c.resume(); }
  const buf = buffers.get(m);
  if (!buf) { log('no sample for ' + nn(m)); return; }
  const src = c.createBufferSource(); src.buffer = buf;
  const g = c.createGain(); const t = c.currentTime;
  g.gain.setValueAtTime(1, t);
  if ($('#fade').checked) {
    const fadeStart = Math.max(0.05, buf.duration - 0.6);
    g.gain.setValueAtTime(1, t + fadeStart);
    g.gain.linearRampToValueAtTime(0.0001, t + buf.duration - 0.01);
  }
  src.connect(g).connect(c.destination);
  src.start(t);
  tapCount++;
}

// ---------- scales ----------
// Standard modes first (cross-checked against Tonal), then other scales, then handpan scales.
// start = semitones above the ding where the first tone field begins (handpan style: the 5th).
const SCALES = [
  { id: 'major', label: 'Major (Ionian)', tonal: 'major', semis: [0, 2, 4, 5, 7, 9, 11] },
  { id: 'dorian', label: 'Dorian', tonal: 'dorian', semis: [0, 2, 3, 5, 7, 9, 10] },
  { id: 'phrygian', label: 'Phrygian', tonal: 'phrygian', semis: [0, 1, 3, 5, 7, 8, 10] },
  { id: 'lydian', label: 'Lydian', tonal: 'lydian', semis: [0, 2, 4, 6, 7, 9, 11] },
  { id: 'mixolydian', label: 'Mixolydian', tonal: 'mixolydian', semis: [0, 2, 4, 5, 7, 9, 10] },
  { id: 'aeolian', label: 'Minor (Aeolian)', tonal: 'aeolian', semis: [0, 2, 3, 5, 7, 8, 10] },
  { id: 'locrian', label: 'Locrian', tonal: 'locrian', semis: [0, 1, 3, 5, 6, 8, 10] },
  { id: 'majpent', label: 'Major pentatonic', tonal: 'major pentatonic', semis: [0, 2, 4, 7, 9] },
  { id: 'minpent', label: 'Minor pentatonic', tonal: 'minor pentatonic', semis: [0, 3, 5, 7, 10] },
  { id: 'harmmin', label: 'Harmonic minor', tonal: 'harmonic minor', semis: [0, 2, 3, 5, 7, 8, 11] },
  { id: 'melmin', label: 'Melodic minor', tonal: 'melodic minor', semis: [0, 2, 3, 5, 7, 9, 11] },
  { id: 'blues', label: 'Blues', tonal: 'blues', semis: [0, 3, 5, 6, 7, 10] },
  { id: 'kurd', label: 'Kurd (handpan)', semis: [0, 2, 3, 5, 7, 8, 10], start: 7 },
  { id: 'celtic', label: 'Celtic minor (handpan)', semis: [0, 2, 3, 5, 7, 10], start: 7 },
  { id: 'amara', label: 'Amara (handpan)', semis: [0, 2, 3, 5, 7, 10], start: 7 },
  { id: 'hijaz', label: 'Hijaz (handpan)', semis: [0, 2, 3, 5, 7, 8, 11], start: 7 },
  { id: 'pygmy', label: 'Pygmy (handpan)', semis: [0, 2, 3, 7, 10], start: 2 },
  { id: 'annaziska', label: 'Annaziska (handpan)', semis: [0, 2, 3, 5, 7, 8, 10], start: 7 },
];
SCALES.forEach(s => { if (s.start == null) s.start = s.semis.includes(7) ? 7 : s.semis.find(x => x >= 6); });
let tonalReport = 'not checked';
function checkTonal() {
  if (!window.Tonal) { tonalReport = 'MISSING (vendor/tonal/tonal.min.js not loaded)'; return; }
  const bad = [];
  for (const s of SCALES.filter(s => s.tonal)) {
    try {
      const semis = Tonal.Scale.get('C ' + s.tonal).intervals.map(i => Tonal.Interval.semitones(i));
      if (semis.join() !== s.semis.join()) bad.push(`${s.tonal}: tonal=[${semis}]`);
    } catch (e) { bad.push(s.tonal + ': ' + e.message); }
  }
  tonalReport = bad.length ? 'loaded, mismatches: ' + bad.join('; ') : 'loaded, all modes match';
  log('Tonal check: ' + tonalReport);
}

const DEG = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];
const degLabel = (semi, sc) => (semi === 6 && sc.semis.includes(5)) ? 'b5' : DEG[semi];

// Ding always in C3..B3; tone fields ascend through the scale from sc.start.
function padNotes(rootPc, sc, n) {
  const ding = 48 + rootPc, notes = [];
  for (let m = ding + sc.start; notes.length < n && m <= MIDI_MAX; m++)
    if (sc.semis.includes((m - ding) % 12)) notes.push(m);
  return { ding, notes };
}
// Rim positions: lowest note at the bottom, ascending alternately left/right.
function positions(n) {
  const pts = [];
  for (let j = 0; j < n; j++) {
    const a = Math.PI / 2 + (j + 0.5) * 2 * Math.PI / n; // screen coords: +y is down
    pts.push({ x: Math.cos(a), y: Math.sin(a) });
  }
  pts.sort((p, q) => (Math.round((q.y - p.y) * 1e6)) || (p.x - q.x));
  return pts;
}

// ---------- handpan UI (D2) ----------
const state = { rootPc: 2, scale: 'kurd', n: 8, chroma: null };
const panEl = $('#pan');
function renderPan() {
  const sc = SCALES.find(s => s.id === state.scale);
  const { ding, notes } = padNotes(state.rootPc, sc, state.n);
  const pts = positions(notes.length);
  const R = 0.36, d = Math.min(0.2, 0.9 * 2 * R * Math.sin(Math.PI / Math.max(notes.length, 2)));
  panEl.innerHTML = '';
  addPad(ding, 0.5, 0.5, 0.26, true, sc);
  notes.forEach((m, i) => addPad(m, 0.5 + pts[i].x * R, 0.5 + pts[i].y * R, d, false, sc));
  $('#notes').textContent = `Ding ${nn(ding)} | ` + notes.map(nn).join(' ') + (notes.length < state.n ? ` (only ${notes.length} fit in sample range)` : '');
  applyHeat();
}
function addPad(m, cx, cy, d, isDing, sc) {
  const el = document.createElement('div');
  el.className = 'pad' + (isDing ? ' ding' : '');
  Object.assign(el.style, { left: (cx - d / 2) * 100 + '%', top: (cy - d / 2) * 100 + '%', width: d * 100 + '%', height: d * 100 + '%' });
  el.dataset.midi = m;
  el.innerHTML = `<span>${nn(m)}</span><small>${degLabel((m - state.rootPc + 120) % 12, sc)}</small>`;
  panEl.appendChild(el);
}
function applyHeat() {
  const ch = state.chroma;
  panEl.querySelectorAll('.pad').forEach(p => {
    p.style.background = ch ? `rgba(232,163,61,${(0.12 + 0.75 * ch[+p.dataset.midi % 12]).toFixed(2)})` : '';
  });
}
panEl.addEventListener('pointerdown', e => {
  const pad = e.target.closest('.pad');
  if (!pad) return;
  e.preventDefault();
  playNote(+pad.dataset.midi);
  pad.classList.add('hit'); setTimeout(() => pad.classList.remove('hit'), 110);
  if ($('#flash').checked) { const f = $('#flashov'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 60); }
});
panEl.addEventListener('contextmenu', e => e.preventDefault());

function initControls() {
  const rootSel = $('#root'), scaleSel = $('#scale'), padSel = $('#pads');
  DISP.forEach((n, i) => rootSel.add(new Option(n, i)));
  SCALES.forEach(s => scaleSel.add(new Option(s.label, s.id)));
  range(6, 12).forEach(n => padSel.add(new Option(n + ' pads', n)));
  rootSel.value = state.rootPc; scaleSel.value = state.scale; padSel.value = state.n;
  rootSel.onchange = () => { state.rootPc = +rootSel.value; renderPan(); };
  scaleSel.onchange = () => { state.scale = scaleSel.value; renderPan(); };
  padSel.onchange = () => { state.n = +padSel.value; renderPan(); };
}

// ---------- hold to listen (A1, A3, A4, B1, B2, D3) ----------
const MIN_S = 5, MAX_S = 60;
const WORKLET = `class Rec extends AudioWorkletProcessor{process(inputs){const c=inputs[0]&&inputs[0][0];if(c)this.port.postMessage(c.slice(0));return true;}}registerProcessor('rec',Rec);`;
let workletReady = null, rec = null, recCycles = 0, lastPcm = null, lastSettings = null;
const recBtn = $('#rec');
function ensureWorklet(c) {
  if (!workletReady) workletReady = c.audioWorklet.addModule(URL.createObjectURL(new Blob([WORKLET], { type: 'application/javascript' })));
  return workletReady;
}
recBtn.addEventListener('pointerdown', e => { e.preventDefault(); try { recBtn.setPointerCapture(e.pointerId); } catch { } startRec(); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(ev => recBtn.addEventListener(ev, () => { if (rec) stopRec(ev); }));
recBtn.addEventListener('contextmenu', e => e.preventDefault());
function resetRecBtn() { recBtn.classList.remove('on'); recBtn.textContent = 'Hold to listen'; $('#meterbar').style.width = '0'; }

async function startRec() {
  if (rec) return;
  const r = rec = { chunks: [], n: 0, peak: 0, sumsq: 0, clipped: 0, lastRms: 0, stopRequested: false };
  recBtn.classList.add('on'); recBtn.textContent = 'Listening… release to analyse';
  $('#verdict').textContent = ''; $('#suggest').innerHTML = '';
  try {
    const c = getCtx();
    if (c.state !== 'running') await c.resume();
    await ensureWorklet(c);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    r.stream = stream;
    const track = stream.getAudioTracks()[0];
    r.settings = lastSettings = track.getSettings();
    ['mute', 'unmute', 'ended'].forEach(ev => track.addEventListener(ev, () => log('mic track ' + ev)));
    log('mic open: ' + JSON.stringify(r.settings));
    r.src = c.createMediaStreamSource(stream);
    r.node = new AudioWorkletNode(c, 'rec');
    r.sink = c.createGain(); r.sink.gain.value = 0;
    r.node.port.onmessage = ev => {
      const d = ev.data; r.chunks.push(d); r.n += d.length;
      let s = 0;
      for (let i = 0; i < d.length; i++) { const v = d[i], a = Math.abs(v); if (a > r.peak) r.peak = a; if (a >= 0.999) r.clipped++; s += v * v; }
      r.sumsq += s; r.lastRms = Math.sqrt(s / d.length);
    };
    r.src.connect(r.node).connect(r.sink).connect(c.destination);
    r.timer = setInterval(() => tickRec(r), 100);
    if (r.stopRequested) stopRec('released early');
  } catch (err) {
    log('mic error: ' + err.name + ' ' + err.message);
    $('#recinfo').textContent = 'Mic error: ' + err.name + ' - ' + err.message;
    if (r.stream) r.stream.getTracks().forEach(t => t.stop());
    rec = null; resetRecBtn();
  }
}
function tickRec(r) {
  const secs = r.n / getCtx().sampleRate;
  $('#rectime').textContent = secs.toFixed(1) + ' s' + (secs < MIN_S ? ' (min ' + MIN_S + ')' : '');
  $('#meterbar').style.width = Math.min(100, r.lastRms * 400) + '%';
  if (secs >= MAX_S) stopRec('max ' + MAX_S + ' s');
}
function stopRec(reason) {
  const r = rec;
  if (!r) return;
  if (!r.stream) { r.stopRequested = true; return; }   // mic still opening
  rec = null;
  clearInterval(r.timer);
  r.stream.getTracks().forEach(t => t.stop());
  try { r.src.disconnect(); r.node.disconnect(); r.sink.disconnect(); } catch { }
  resetRecBtn();
  recCycles++;
  const sr = getCtx().sampleRate, secs = r.n / sr, rms = Math.sqrt(r.sumsq / Math.max(1, r.n));
  log(`mic released (${reason}) after ${secs.toFixed(1)} s; cycle #${recCycles}`);
  $('#rectime').textContent = secs.toFixed(1) + ' s';
  $('#recinfo').textContent =
    `Cycle #${recCycles} | ${secs.toFixed(1)} s @ ${sr} Hz\n` +
    `Peak ${db(r.peak)} | RMS ${db(rms)} | clipped samples ${r.clipped}\n` +
    `Mic settings: ${JSON.stringify(r.settings)}`;
  if (secs < MIN_S) { $('#verdict').textContent = `Too short - hold for at least ${MIN_S} s`; return; }
  if (rms < 0.003) { $('#verdict').textContent = 'Too quiet - nothing usable heard (turn the music up)'; return; }
  const pcm = new Float32Array(r.n); let o = 0;
  for (const ch of r.chunks) { pcm.set(ch, o); o += ch.length; }
  lastPcm = pcm; $('#playback').disabled = false;
  const t0 = performance.now();
  const { chroma, frames } = chromaOf(pcm, sr);
  log(`analysis: ${frames} frames in ${Math.round(performance.now() - t0)} ms`);
  showSuggestions(chroma);
}
$('#playback').onclick = () => {
  if (!lastPcm) return;
  const c = getCtx(), b = c.createBuffer(1, lastPcm.length, c.sampleRate);
  b.copyToChannel(lastPcm, 0);
  const s = c.createBufferSource(); s.buffer = b; s.connect(c.destination); s.start();
};

// ---------- analysis (B3): chroma + Krumhansl-Kessler key profiles ----------
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k, b = a + half;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const ncr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
}
function chromaOf(pcm, sr) {
  const N = 8192, hop = 4096;
  const win = new Float64Array(N); for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
  // 60-1000 Hz with a 1/sqrt(f) weight: tested best against the 5th/dominant bias from harmonics (also with a phone-speaker filter).
  const LO = 60, HI = 1000;
  const kmin = Math.ceil(LO * N / sr), kmax = Math.floor(HI * N / sr);
  const wt = new Float64Array(kmax + 1); for (let k = kmin; k <= kmax; k++) wt[k] = Math.pow((k * sr / N) / LO, -0.5);
  const pcOf = new Int8Array(kmax + 1);
  for (let k = kmin; k <= kmax; k++) pcOf[k] = ((Math.round(69 + 12 * Math.log2(k * sr / N / 440)) % 12) + 12) % 12;
  const chroma = new Float64Array(12), re = new Float64Array(N), im = new Float64Array(N), lm = new Float64Array(kmax + 1);
  let frames = 0;
  for (let s = 0; s + N <= pcm.length; s += hop) {
    for (let i = 0; i < N; i++) { re[i] = pcm[s + i] * win[i]; im[i] = 0; }
    fft(re, im);
    let mean = 0;
    for (let k = kmin; k <= kmax; k++) { lm[k] = Math.log1p(1000 * Math.hypot(re[k], im[k])); mean += lm[k]; }
    mean /= (kmax - kmin + 1);
    const fr = new Float64Array(12); let sum = 0;
    for (let k = kmin; k <= kmax; k++) { const v = (lm[k] - mean) * wt[k]; if (v > 0) { fr[pcOf[k]] += v; sum += v; } }
    if (sum > 0) for (let p = 0; p < 12; p++) chroma[p] += fr[p] / sum;
    frames++;
  }
  const mx = Math.max(...chroma) || 1;
  return { chroma: Array.from(chroma, v => v / mx), frames };
}
const KK_MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
const KK_MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
function pearson(a, b) {
  const n = a.length, ma = a.reduce((x, y) => x + y) / n, mb = b.reduce((x, y) => x + y) / n;
  let num = 0, da = 0, dbb = 0;
  for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; dbb += (b[i] - mb) ** 2; }
  return num / Math.sqrt(da * dbb || 1);
}
function rankKeys(ch) {
  const tot = ch.reduce((a, b) => a + b, 0) || 1, out = [];
  for (let r = 0; r < 12; r++)
    for (const [type, prof, scale] of [['major', KK_MAJ, 'major'], ['minor', KK_MIN, 'aeolian']]) {
      const rot = Array.from({ length: 12 }, (_, i) => prof[(i - r + 12) % 12]);
      const sc = SCALES.find(s => s.id === scale);
      const fit = sc.semis.reduce((a, s) => a + ch[(r + s) % 12], 0) / tot;
      out.push({ root: r, type, scale, corr: pearson(ch, rot), fit });
    }
  return out.sort((a, b) => b.corr - a.corr);
}
// Confidence display chosen for v1: fit % + clear winner / close call + mini handpan heat preview.
function showSuggestions(ch) {
  state.chroma = ch; applyHeat(); drawChroma(ch);
  const top = rankKeys(ch).slice(0, 3);
  const margin = top[0].corr - top[1].corr;
  const verdict = margin < 0.03 ? 'Close call - try the top two' : margin < 0.08 ? 'Likely' : 'Clear winner';
  $('#verdict').textContent = `${verdict} (margin ${margin.toFixed(3)})`;
  const box = $('#suggest'); box.innerHTML = '';
  top.forEach((k, i) => {
    const name = `${DISP[k.root]} ${k.type}`;
    const rel = k.type === 'major' ? `same notes as ${DISP[(k.root + 9) % 12]} minor` : `same notes as ${DISP[(k.root + 3) % 12]} major`;
    const div = document.createElement('div'); div.className = 'sugg';
    div.innerHTML = `<div><b>${i + 1}. ${name}</b> - ${Math.round(k.fit * 100)} % of what I heard fits<br><span class="small">${rel} · r=${k.corr.toFixed(3)}</span><br></div>` +
      miniPan(k.root, SCALES.find(s => s.id === k.scale), ch) +
      `<div class="bar"><i style="width:${Math.round(k.fit * 100)}%"></i></div>`;
    const use = document.createElement('button'); use.textContent = 'Use';
    use.onclick = () => { state.rootPc = k.root; state.scale = k.scale; $('#root').value = k.root; $('#scale').value = k.scale; renderPan(); showTab('play'); };
    div.firstChild.appendChild(use);
    box.appendChild(div);
  });
  log('suggestions: ' + top.map(k => `${DISP[k.root]} ${k.type} r=${k.corr.toFixed(3)} fit=${Math.round(k.fit * 100)}%`).join(' | '));
}
// Mini handpan: pads glow by how much their note was heard; strong song notes missing from the scale = red dots on the rim.
function miniPan(rootPc, sc, ch) {
  const { ding, notes } = padNotes(rootPc, sc, state.n), pts = positions(notes.length);
  const glow = m => `rgba(232,163,61,${(0.15 + 0.8 * ch[m % 12]).toFixed(2)})`;
  let svg = `<svg class="mini" viewBox="-50 -50 100 100"><circle r="48" fill="#2b2a33"/><circle r="12" fill="${glow(ding)}"/>`;
  notes.forEach((m, i) => svg += `<circle cx="${(pts[i].x * 34).toFixed(1)}" cy="${(pts[i].y * 34).toFixed(1)}" r="8" fill="${glow(m)}"/>`);
  const inScale = new Set(sc.semis.map(s => (rootPc + s) % 12));
  for (let pc = 0; pc < 12; pc++) if (!inScale.has(pc) && ch[pc] > 0.6) {
    const a = -Math.PI / 2 + pc * Math.PI / 6;
    svg += `<circle cx="${(Math.cos(a) * 46).toFixed(1)}" cy="${(Math.sin(a) * 46).toFixed(1)}" r="3.5" fill="#e33"/>`;
  }
  return svg + '</svg>';
}
function drawChroma(ch) {
  const cv = $('#chroma'), g = cv.getContext('2d'), w = cv.width, h = cv.height, bw = w / 12;
  g.clearRect(0, 0, w, h); g.font = '22px system-ui'; g.textAlign = 'center';
  ch.forEach((v, i) => {
    g.fillStyle = '#e8a33d'; g.fillRect(i * bw + 6, (h - 30) * (1 - v), bw - 12, (h - 30) * v);
    g.fillStyle = '#ccc'; g.fillText(DISP[i], i * bw + bw / 2, h - 6);
  });
}

// ---------- diagnostics (C1, C4, E1-E3) ----------
async function renderDiag() {
  const c = ctx, L = [];
  L.push('Version: ' + VERSION);
  L.push('UA: ' + navigator.userAgent);
  L.push('Display mode: ' + (matchMedia('(display-mode: standalone)').matches ? 'standalone (installed)' : 'browser tab'));
  L.push(`Viewport: ${innerWidth}x${innerHeight} @${devicePixelRatio}x`);
  L.push('AudioContext: ' + (c ? `${c.state} sr=${c.sampleRate} baseLatency=${fmtMs(c.baseLatency)} outputLatency=${fmtMs(c.outputLatency)}` : 'not created'));
  L.push('Samples: ' + (loadStats ? JSON.stringify(loadStats) : 'not loaded'));
  L.push('Tonal: ' + tonalReport);
  try { const r = await fetch('../vendor/tone/Tone.js'); L.push('Tone.js file: ' + (r.ok ? 'reachable' : 'HTTP ' + r.status) + ' (cached for offline, not executed in spike)'); } catch (e) { L.push('Tone.js file: ' + e.message); }
  L.push('Service worker: ' + (!('serviceWorker' in navigator) ? 'unsupported' : navigator.serviceWorker.controller ? 'controlling this page' : 'not controlling (reload once)'));
  try { const p = await navigator.permissions.query({ name: 'microphone' }); L.push('Mic permission: ' + p.state); } catch { L.push('Mic permission: query unsupported'); }
  L.push(`Pad taps: ${tapCount} | Record cycles: ${recCycles}`);
  L.push('Last mic settings: ' + (lastSettings ? JSON.stringify(lastSettings) : '-'));
  $('#diagout').textContent = L.join('\n');
}
$('#refreshDiag').onclick = renderDiag;
$('#reloadSamples').onclick = async () => { await loadSamples(); renderDiag(); };

// ---------- test checklist ----------
const TESTS = [
  ['A1', 'Mic vs music: hold Listen 15 s while Spotify/YouTube plays - music keeps playing, same volume'],
  ['A2', 'Handpan vs music: tap pads 30 s while Spotify/YouTube plays - both audible, no pause'],
  ['A3', 'Call mode: volume slider stays "media", loudspeaker stays on, normal after release'],
  ['A4', '5x record + play cycles - no degradation, mic indicator goes away'],
  ['B1', 'Mic settings show echoCancellation/noiseSuppression/autoGainControl false'],
  ['B2', 'Level: peak/RMS clearly above noise, no clipping'],
  ['B3', 'Key check: correct key in top 3 for 4+ of 5 known songs (note songs + keys)'],
  ['C1', 'Latency: slow-mo video tap->sound (ms), plus base/output latency from Diag'],
  ['C2', 'Multi-touch: 3-4 fingers + fast repeats - no stuck/missed notes or clicks'],
  ['C3', 'Sample tails: ~2 s ring with/without tail fade sounds natural'],
  ['C4', 'Samples: all 56 decoded, load time from Diag'],
  ['C5', 'First tap after page load makes a sound'],
  ['D1', 'Split screen: tap ImprovEx while Spotify has focus - plays immediately'],
  ['D2', 'Layout at half screen, portrait + landscape, 6/8/12 pads'],
  ['D3', 'Hold to listen: release outside, <5 s hint, 60 s cap, no scroll/selection'],
  ['E1', 'Install to home screen; works standalone + split screen'],
  ['E2', 'Airplane mode after first load: app + samples still work'],
  ['E3', 'Mic permission remembered after reopening'],
];
const STORE = 'improvex-spike-results';
let results = {};
try { results = JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { }
function saveResults() { try { localStorage.setItem(STORE, JSON.stringify(results)); } catch { } }
function renderTests() {
  const box = $('#tests'); box.innerHTML = '';
  TESTS.forEach(([id, text]) => {
    const r = results[id] || { s: '', note: '' };
    const div = document.createElement('div'); div.className = 'test';
    div.innerHTML = `<div><b>${id}</b> ${text}</div><div class="row"><select><option value="">-</option><option>pass</option><option>partial</option><option>fail</option></select><input placeholder="notes / numbers"></div>`;
    const sel = div.querySelector('select'), inp = div.querySelector('input');
    sel.value = r.s; inp.value = r.note;
    sel.onchange = inp.oninput = () => { results[id] = { s: sel.value, note: inp.value }; saveResults(); };
    box.appendChild(div);
  });
}
$('#copy').onclick = async () => {
  const c = ctx;
  const md = [
    `# ImprovEx spike results (${new Date().toISOString().slice(0, 16)})`,
    `- ${VERSION} | ${navigator.userAgent}`,
    `- ${matchMedia('(display-mode: standalone)').matches ? 'installed PWA' : 'browser tab'} | ${innerWidth}x${innerHeight}`,
    `- AudioContext sr=${c ? c.sampleRate : '?'} base=${c ? fmtMs(c.baseLatency) : '?'} out=${c ? fmtMs(c.outputLatency) : '?'}`,
    `- Samples: ${loadStats ? `${loadStats.decoded}/${loadStats.of} in ${loadStats.ms} ms` : 'n/a'} | Tonal: ${tonalReport}`,
    `- Last mic settings: ${lastSettings ? JSON.stringify(lastSettings) : '-'}`,
    '', '| Test | Result | Notes |', '|---|---|---|',
    ...TESTS.map(([id]) => `| ${id} | ${(results[id] || {}).s || '-'} | ${((results[id] || {}).note || '').replace(/\|/g, '/')} |`),
  ].join('\n');
  $('#results').value = md;
  try { await navigator.clipboard.writeText(md); $('#copy').textContent = 'Copied'; }
  catch { $('#results').select(); $('#copy').textContent = 'Select + copy from the box'; }
  setTimeout(() => $('#copy').textContent = 'Copy results (markdown)', 2500);
};

// ---------- boot ----------
$('#ver').textContent = ' ' + VERSION;
initControls(); checkTonal(); renderPan(); renderTests();
loadSamples();
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(
    reg => log('service worker registered, scope ' + reg.scope),
    err => log('service worker failed: ' + err.message));
}
log('boot ' + VERSION);
