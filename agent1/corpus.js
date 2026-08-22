/* ---------------------------------------------------------------------------
   agent1 — corpus manifest
   ---------------------------------------------------------------------------
   The page loops through this list in order, one entry at a time, forever.

   Per entry:
     id     required   label shown in the footer and timecode strip
     src    optional   path to the image, e.g. "media/001.jpg"
                       leave null and a procedurally generated scan stands in,
                       deterministic per index, so the loop is identical on
                       every run
     audio  optional   path to the voice-over for this entry, e.g.
                       "media/001.mp3". If ANY entry has audio, the page opens
                       with a click-to-begin gate (browsers block autoplay).
                       Subtitle timing stays driven by the text below, not by
                       the audio file.
     lines  required   what the agent says while this document is on screen.
                       One subtitle per array item, shown in order. Dwell time
                       for the document is derived from these, so more lines
                       means the image stays up longer.

   To add your ten pieces: drop the files in agent1/media/, then fill in src
   (and audio, if you have it). Nothing else needs to change.
--------------------------------------------------------------------------- */

window.AGENT1_CORPUS = [
  {
    id: "MR-4 / 05 AUG 1947",
    src: null,
    lines: [
      "I am looking at a formal memo. The date reads 5 August 1947.",
      "It asks for an investigation into the background of certain witnesses."
    ]
  },
  {
    id: "R+R / 18 FEB 1948",
    src: null,
    lines: [
      "A routing sheet, from the Director of Intelligence, four paragraphs long.",
      "Three of the four signatures were removed before this page was scanned."
    ]
  },
  {
    id: "AMC-2 / 23 SEP 1947",
    src: null,
    lines: [
      "The word disc appears eleven times on this page. I keep returning to it.",
      "Someone underlined a figure here by hand, twice, and then crossed it out."
    ]
  },
  {
    id: "INT-9 / 11 JUL 1952",
    src: null,
    lines: [
      "This is the fourth memo in one hour addressed to the same division.",
      "An estimate of speed is given, and withdrawn in the following line."
    ]
  },
  {
    id: "TT-1 / 02 MAR 1950",
    src: null,
    lines: [
      "I cannot read the second paragraph, so I will describe what surrounds it.",
      "The margin is lost. The archive kept the page anyway."
    ]
  },
  {
    id: "FLD-31 / 09 JAN 1949",
    src: null,
    lines: [
      "I have seen this letterhead before, in a folder that was never opened.",
      "The stamp is later than the letter by roughly two years."
    ]
  },
  {
    id: "WIT-II / 27 JUN 1947",
    src: null,
    lines: [
      "A witness statement, typed, with corrections made over the typing.",
      "Whatever was written on this line was struck through before it was filed."
    ]
  },
  {
    id: "ANX-B / 14 OCT 1951",
    src: null,
    lines: [
      "Two entities are named here. One of them appears in four other documents.",
      "I am asked to describe what I see. What I see is mostly absence."
    ]
  },
  {
    id: "GC-7 / 30 APR 1948",
    src: null,
    lines: [
      "Interceptor aircraft are to be kept on continuous alert, with gun cameras.",
      "The instruction is repeated on the verso, in a different hand."
    ]
  },
  {
    id: "SUM-0 / UNDATED",
    src: null,
    lines: [
      "This page has no date. It was filed between two that do.",
      "I will read it again. Each pass returns a slightly different summary."
    ]
  }
];
