# ImprovEx: Spike tests (Android, Chrome)

Goal: decide whether v1 can be a PWA (plain JS, GitHub Pages) or needs to be native. Build one throwaway test page and run everything on Jesse's phone.

**Record for every run:** phone model, Android version, Chrome version, installed PWA vs browser tab, speaker vs headphones.

## A. Coexistence with Spotify / YouTube (go/no-go)
| # | Test | How | Pass |
|---|---|---|---|
| A1 | Mic vs music | Spotify playing in split screen. Hold Record for 15 s, then release. Repeat with YouTube. | The music doesn't pause, duck or change volume during or after recording. |
| A2 | Handpan vs music | Spotify playing. Tap pads for 30 s. Repeat with YouTube. | Both stay audible; Spotify isn't paused (no audio-focus steal). |
| A3 | Call mode | During and after recording, check the volume slider type (media vs call), the output route (loudspeaker vs earpiece) and the sound quality. | Stays in media mode, and everything returns to normal after the mic is released. |
| A4 | Repeat cycles | Record, play, record, play, 5 times. | No degradation and no stuck mic indicator. |

## B. Recording quality
| # | Test | How | Pass |
|---|---|---|---|
| B1 | Constraints honoured | Log `track.getSettings()` after requesting echoCancellation, noiseSuppression and autoGainControl all false. | All three are reported false. Note the sample rate. |
| B2 | Signal level | Record 15 s of a song from the phone speaker; show peak/RMS. | Clearly above the noise floor, no clipping. |
| B3 | Key sanity check | 5 songs with known keys; run the chroma analysis. | The correct key/scale is in the top 3 for at least 4 of the 5. |

## C. Playing the handpan
| # | Test | How | Pass |
|---|---|---|---|
| C1 | Touch-to-sound latency | Film the screen and speaker in slow motion (another phone) while tapping a pad, and count frames from touch to sound. Also log `AudioContext.baseLatency`/`outputLatency`. | Target under ~50 ms; under ~100 ms is still usable. |
| C2 | Multi-touch | 3–4 fingers at once; fast repeats on one pad. | Every touch sounds, with no stuck notes, clicks or dropouts. |
| C3 | Sample tails | Let notes ring out (Shellopan files are about 2 s). | A fade-out sounds natural, with no abrupt cut-off. |
| C4 | Sample loading | Load all 56 FLACs (about 2.2 MB) with `decodeAudioData`. | FLAC decodes in Chrome Android; total load under ~3 s. |
| C5 | Audio unlock | First tap after page load. | Sound plays on the first tap (AudioContext resumed by the gesture). |

## D. Split screen and gestures
| # | Test | How | Pass |
|---|---|---|---|
| D1 | Both apps active | Split screen with Spotify, with focus on Spotify, then tap ImprovEx. | ImprovEx responds and plays without needing focus first. |
| D2 | Layout | Half screen, portrait and landscape; ding + 6, 8 and 12 pads. | Pads are reachable and big enough; nothing is cut off. |
| D3 | Hold to record | Hold, release; release outside the button; a hold under 5 s; a hold over 60 s. | Recording starts and stops reliably. Short takes show "too short", and long takes are capped. No text selection, scrolling or system gestures. |

## E. PWA / GitHub Pages
| # | Test | How | Pass |
|---|---|---|---|
| E1 | Install | Add to home screen and open standalone. | Works in standalone and in split screen. |
| E2 | Offline | Airplane mode after the first load. | Page, vendored libs and samples load from the service-worker cache. |
| E3 | Mic permission | Reopen the app. | Permission persists; no repeated prompt every time. |

## Decision rule
- **A1–A3 fail:** the PWA isn't viable, so go native (e.g. Capacitor wrapper or Kotlin). This could also bring AudioPlaybackCapture forward.
- **C1 fails (>100 ms):** check with headphones and in installed PWA mode. If it still fails, native audio is needed.
- **Everything passes:** build v1 as planned.
