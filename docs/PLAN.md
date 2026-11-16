# ImprovEx: Plan (v0.9, 2026-11-16)

A phone app that listens to a song, suggests a key and scale, and gives you a virtual handpan to play along with.

## Decisions
- **Platform:** Android first. v1 is a PWA in Chrome, written in plain JS (no framework/bundler) and hosted on GitHub Pages. Libraries are OK if their licences are acceptable.
- **Song source:** Spotify or YouTube, running in Android split screen next to ImprovEx. The phone mic records the phone speaker (Chord ai shows the quality is fine).
- **Listening:** hold-to-record (hold = record, release = analyse), so the length is adjustable. A minimum of about 5 s is needed for a useful result; shorter takes show a "too short" hint. Not continuous; can be used at any time.
- **Keys/scales:** any root and any mode/scale.
- **Layout:** the most common handpan layout (ding + 8 tone fields, alternating left/right around the rim), with a configurable pad count.
- **Notation:** notes shown as names plus scale degrees 1–7. Chords get Roman numerals (v2).
- **Sound:** samples, not synthesis. Jesse has no handpan to record. Test set: Shellopan samples from Handpaner (`samples/shellopan/`). Jesse plans to buy SampleScience Virtual Handpan (pay-what-you-want) as a second option. Licence decision deferred until the app goes beyond personal use.
- **Users:** Jesse mainly; a kids mode is possible later.
- **Licensing:** private use first, with a licensing register kept from the start (see below).

## v1 scope
1. Split screen: Spotify/YouTube on one side, ImprovEx on the other.
2. **Listen:** record with `getUserMedia({audio:{echoCancellation:false, noiseSuppression:false, autoGainControl:false}})`, then stop the tracks right away to release the mic.
3. **Analyse:** build a pitch-class profile (chroma), score every combination of 12 roots × scale library, and show the top 3 with a confidence value.
4. **Root and scale dropdowns:** pre-filled with the top suggestion, editable.
5. **Handpan:** ding in the centre plus N tone fields around the rim, notes ascending alternately left and right. Default N = 8; range 6–12. The ding always sits in the C3–B3 band (all notes stay within the Shellopan C2–G6 samples). Must fit half the screen. Multi-touch, low latency.

## v2 (parked)
- **Riffs:** capture from the song (Basic Pitch) or from humming (monophonic pitch tracking). Pads light in order, with note names and degrees 1–7. Playback on the handpan at 100/75/50 % speed plus loop.
  - Notes not on any pad: mark them as missing and suggest scales that contain them.
  - Save riffs (a riff library per song).
- Continuous note/chord detection, with chords as Roman numerals.
- Bottom notes, and a kids mode.
- Native Android app using AudioPlaybackCapture (Android 10+, consent prompt) to record other apps' audio directly. An AudioRelay community list reports that Spotify and YouTube allow capture.

## Scale library (reference voicings, tonefield.pages.dev)
| Scale | Ding | Tone fields |
|---|---|---|
| D Kurd 9 (most common) | D3 | A3 Bb3 C4 D4 E4 F4 G4 A4 |
| D Celtic Minor | D3 | A3 C4 D4 E4 F4 G4 A4 C5 |
| C# Amara | C#3 | G#3 B3 C#4 D#4 E4 F#4 G#4 B4 |
| D Hijaz | D3 | A3 Bb3 C#4 D4 E4 F4 G4 A4 |
| F Pygmy | F3 | G3 Ab3 C4 Eb4 F4 G4 Ab4 C5 |
| C# Annaziska | C#3 | G#3 A3 B3 C#4 D#4 E4 F#4 G#4 |

Store each scale as intervals plus a voicing pattern so it can be built from any root. Dropdown order: **standard modes first** (Ionian/major, Dorian, Phrygian, Lydian, Mixolydian, Aeolian/minor, Locrian), then major/minor pentatonic, harmonic and melodic minor, and blues, then the handpan scales (Kurd, Celtic Minor, Amara, Hijaz, Pygmy, Annaziska…).

## Samples: the open problem
Transposing to all 12 keys needs roughly C3 to F#5.
- **FreePats Hang** (CC0 1.0, verified): a real Hang, multisampled with round-robin layers, but only the notes of one D minor instrument (likely about D3–A4). Pitch shifting covers the missing semitones inside that range with a ≤1 semitone shift. Above about A4 the shifts get large. Jesse considers this insufficient for testing.
- **SampleScience Virtual Handpan** (free/pay-what-you-like, 57 notes): built by physical modelling and sound design, not recorded from a real handpan. It comes as VST/AU/Decent Sampler; whether raw WAVs are accessible and what the licence is are both unstated, so ask the author.
- Single-sample tongue-drum "handpans" (Pianobook, Joonas Ylanne): one sample stretched over the range, so low quality. Licence is weak.
- Freesound one-shots from different uploaders: mixed timbre and per-file licences. Last resort.

### Findings 2026-11-16
- **Yishama Virtual Pantam** (inspected in the browser): an Angular 14 app embedded via iframe (`yishama.com/virtual-pantam/`), built by Hadas Segal in 2021. It plays sound through the Web Audio API (`AudioContext` + `decodeAudioData`) and loads **one MP3 per semitone, Db2 to E6 (52 notes), plus `SLAP.mp3`**, from `/virtual-pantam/assets/notes/<Note><Octave>.mp3`. Scales are defined in its JS (Kurd, Pygmy, Hijaz, Aegean, Harmonic minor, Yuki and more), with top and bottom shell images. **No licence is stated**, and the page doesn't say how the sounds were made, so treat them as proprietary. This is the model to copy (chromatic per-semitone samples, no pitch shifting needed), but not the files. Possible step: ask Yishama / Hadas Segal for permission (contact via linktr.ee/hadassegal).
- **SampleScience Virtual Handpan**: free on Gumroad ($0+, an email is needed for the download). Physically modelled, then multisampled: "one multi-sampled handpan sound", 57 notes. Formats: VST/AU plugin 43.2 MB, Decent Sampler 38.8 MB, Kontakt 163 MB. No licence/EULA on the product page or on Gumroad. A Decent Sampler library usually contains the raw sample files plus an XML preset, so the files are probably extractable; confirm after download. Ask SampleScience about using them in an app.

- **Yishama licence search (2nd pass)**: no licence or recording credits on the playground pages (current or `-old`), the Google Play listing or the App Store listing. The footer says "All rights reserved to YISHAMA LLC". Android/iOS app developer: Yhonatan Ale-Yahav ("Yishama"). Web playground: Hadas Segal. Conclusion: proprietary, so permission is needed (ask Yishama LLC).
- **New candidate: Handpaner** (handpaner.com, github.com/Robhub/handpaner, Robin Bergère). An open-source handpan/scale tool (Nuxt/Vue/Capacitor). Samples were recorded by Matthieu of Shellopan (shellopan.fr). The repo LICENSE is MIT (2020, "Robin"), covers "Software" and makes no mention of audio. Whether the samples are covered is unclear, so ask Robin (via the Handpaner Facebook page). **Samples confirmed: `static/shellopan/*.flac`, fully chromatic C2 to G6 (56 FLAC files, one per semitone, sharps named `Cs`, `Ds`, `Fs`, `Gs`, `As`).** This covers the C3–F#5 needed for every key without pitch shifting. No separate licence/README file in that folder. Leading candidate for test samples, pending Robin's/Shellopan's OK on the sample licence. **Copied to `samples/shellopan/` on 2026-11-16 (private testing; see SOURCE.md). Files are 44.1 kHz/16-bit mono, about 2 s each, so a short ring may need a release fade or tail extension.** Permission emails drafted in `docs/emails/`.
- **SampleScience pricing context**: the Free Plugins Bundle is $1, and Free Sample Packs is $1+. The SampleScience Complete 2024 list price is $1,543 for 60 plugins (about $26 average), with a sale price of $199. Fair pay-what-you-want payment for Virtual Handpan: about $5–15 for private use. Payment does not establish any licence.

## Risks to test first (spike on Jesse's Android phone)
- Does Chrome's mic or Web Audio pause or duck Spotify/YouTube? There are user reports of Chrome on Android stopping Spotify.
- Does opening the mic put Android into call mode, lowering media volume or quality?
- Touch-to-sound latency.
- Split screen: are both apps active, and is the handpan usable at half screen?
- Sample tails: the Shellopan files are about 2 s long. Is a fade enough?

## Licensing register
| Component | Licence | Status |
|---|---|---|
| Spotify Basic Pitch (v2) | Apache-2.0 | verified |
| Essentia.js | AGPL-3.0 | verified, avoid |
| Tonal.js 6.4.3 | MIT | verified (npm package.json); ESM `dist/index.mjs`, browser build `browser/tonal.min.js` |
| Tone.js 15.1.22 | MIT | verified (jsDelivr); ESM build available |
| FreePats Hang samples | CC0 1.0 | verified |
| SampleScience Virtual Handpan | unstated (no EULA on page or Gumroad) | ask author |
| Yishama Virtual Pantam samples | "All rights reserved, YISHAMA LLC" | do not use without permission |
| Handpaner samples (Shellopan) | repo MIT, samples unclear | ask Robin Bergère |
| Pianobook / Joonas Ylanne handpan | "free to use", no formal licence | weak |

## References
- Look and feel: Yishama Virtual Pantam, Chord ai, Handpan Constellation Studio, Tonalics online handpan.

## Confidence display
**Chosen for v1: Fit % + close call / clear winner + mini-handpan heat preview.** The other ideas are kept for later.

- **Fit %:** the share of the heard note energy that falls inside the scale ("87 % of what I heard fits").
- **Close call / clear winner:** based on the margin between #1 and #2. A small margin shows "close call, try both".
- **Mini-handpan heat preview:** each suggestion shows a small handpan whose pads glow by how often their note was heard. Song notes that are missing from the scale appear as red dots on the rim.
- **Note wheel:** 12 notes in a circle (chromatic or circle of fifths) with brightness = how much was heard, and the scale's notes drawn as a polygon on top. A good fit = a bright polygon.
- **Shared-notes chip:** e.g. "same notes as C major", which explains major/relative-minor ambiguity instead of hiding it.
- **Audition:** tap a suggestion to hear its scale played once over the song.

## Open questions (v1)
1. Run the spike (see docs/SPIKE-TESTS.md): the results decide PWA vs native.

Libraries are vendored in `vendor/` (Tonal 6.4.3, Tone.js 15.1.22; see vendor/README.md).

## Pending (outside the build)
- Permission emails to Robin Bergère and SampleScience (drafts in docs/emails/). Licence decision deferred until the app goes beyond personal use.
