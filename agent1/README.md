# agent1

A real-time simulation of the agent-based media-montage system: the agent reads a
corpus of declassified documents and speaks about what it sees, in subtitles, over
a montage that keeps moving.

## Adding the corpus

1. Put the images in `media/` (jpg or png, roughly portrait, any size — they are
   letterboxed with `background-size: contain`).
2. In `corpus.js`, set `src` on each entry, e.g. `src: "media/001.jpg"`.
3. Optionally set `audio: "media/001.mp3"` for a voice-over. If any entry has audio
   the page opens with a click-to-begin gate, because browsers block autoplay.
4. Edit `lines` — these are the subtitles, and their combined length decides how
   long the document stays on screen.

Entries with `src: null` fall back to a procedurally generated scan, seeded by the
entry index, so the loop is byte-identical on every run. A `src` that 404s falls
back the same way rather than showing a blank frame.

The list loops in order, forever. Ten entries is the intended size.

## Controls

- `space` pause / resume (everything is on one clock, so it stops exactly)
- `c` hide the chrome — columns, timecodes, footer — leaving montage and subtitle
- `f` fullscreen

The cursor hides after three seconds. For a conference, load the page, press `f`,
then `c` if you want the bare projection.
