# Agentic Montage

A real-time simulation of the agent-based media-montage system: the agent reads
a corpus of declassified documents and speaks about what it sees, in subtitles,
over a montage that keeps moving.

Live at `/sites/agentic-montage/`.

## The corpus

Ten pages from the USA Government UAP release, chosen across handwritten
reports, teletype memoranda, a newspaper clipping, a photostat checklist and an
Air Force intelligence requirement, so the montage keeps changing texture.

- `corpus.js` is the manifest — the only file you edit to change the piece.
- `media/01.jpg` … `10.jpg` are the pages, greyscale, 1600px tall, ~2.9 MB total.
- Each entry keeps `source` (the original filename in the release) and
  `summary` (the pipeline's summary of that page, verbatim from
  `20260713_121751_release-1_OCR-SUMMARIES.csv`). The subtitles in `lines` were
  written from those summaries.

Images were converted from the release PNGs (~2500×3200, 1–10 MB each) with
greyscale, Lanczos resize to 1600px tall, autocontrast, and JPEG q80. Photostats
— white type on black — are inverted at conversion so every page sits at the
same density behind the text.

## Changing the corpus

1. Put the pages in `media/`.
2. Point `src` at them in `corpus.js`.
3. Write `lines` — these are the subtitles, and their combined length decides how
   long each page stays on screen. Three lines is roughly twenty seconds, so one
   pass through ten pages runs about three and a half minutes.
4. Optionally add `audio: "media/01.mp3"` for a voice-over. If any entry has
   audio the page opens with a click-to-begin gate, because browsers block
   autoplay. Subtitle timing stays driven by `lines`, not by the audio file.

An entry with `src: null` falls back to a procedurally generated scan, seeded by
its slot in the list, so the loop is identical on every run. A `src` that 404s
falls back the same way rather than showing a blank frame.

The list loops in order, forever.

## Controls

- `space` pause / resume — everything runs off one clock, so it stops exactly
- `c` hide the chrome (columns, timecodes, footer), leaving montage and subtitle
- `f` fullscreen

The cursor hides after three seconds. For a conference: load the page, `f`, then
`c` if you want the bare projection. The montage pauses by itself when the
window is hidden and resumes without jumping, so a machine left on the page
overnight will not have drifted.
