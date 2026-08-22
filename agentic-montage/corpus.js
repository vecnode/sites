/* ---------------------------------------------------------------------------
   agentic montage - corpus manifest
   ---------------------------------------------------------------------------
   Pages from the USA Government UAP release, run through the OCR and
   summarisation pipeline (CRAFT -> gemma-3-4b-it). The page loops through them
   in order, one at a time, forever. The size of the corpus is never shown on
   screen - add or remove entries freely.

   Source run:  20260713_121751_release-1
   Summaries:   20260713_121751_release-1_OCR-SUMMARIES.csv
   Images:      greyscale JPEG, 1600px tall, autocontrast; photostats (white
                type on black) inverted so every page sits at the same density.

   Per entry:
     id       label shown in the footer
     src      path under media/. null falls back to a generated scan, seeded by
              slot, so the loop stays identical run to run. A src that 404s
              falls back the same way.
     source   original filename in the release, for traceability
     summary  the model's summary of the page, verbatim from the CSV
     audio    optional voice-over, e.g. "media/01.mp3". If ANY entry has audio
              the page opens with a click-to-begin gate, because browsers block
              autoplay. Subtitle timing stays driven by lines, not by the audio.
     lines    the subtitles. Every line is cut verbatim out of the summary above
              it, so the agent only ever speaks its own description of the page.
              Their combined length sets how long the page stays on screen.
--------------------------------------------------------------------------- */

window.AGENT1_CORPUS = [
  {
    id: "SAC BUTTE / 20 AUG 1947",
    src: "media/01.jpg",
    source: "65-hs1-834228961-62-hq-83894-section-3-page-124.png",
    summary:
      "This page appears to be a fragmented, handwritten report likely concerning a sighting of a “flying disc” on August 20, 1917, in Butte, Montana.  It references a teletype from August 15, 1947, and includes a newspaper account from “Twin Walls.”  The document details observations by Unie, Billy, and Meith, describing a peculiar object – possibly a disc – seen in the sky, alongside notes about its shape and a subsequent interview on August 15, 1947, where Unie recalled the event occurring around 1:00 PM.  Security protocols and “tons” are also repeatedly mentioned.",
    lines: [
      "a fragmented, handwritten report likely concerning a sighting of a “flying disc”",
      "It references a teletype from August 15, 1947, and includes a newspaper account from “Twin Walls.”",
      "Security protocols and “tons” are also repeatedly mentioned."
    ]
  },
  {
    id: "TWIN FALLS / 02 SEP 1947",
    src: "media/02.jpg",
    source: "65-hs1-834228961-62-hq-83894-section-2-page-177.png",
    summary:
      "This document, an Office Memorandum from the U.S. Government dated September 2, 1947, details a reported sighting of unusual flying discs in Twin Falls, Idaho.  The information originates from Remytel teletype from August 20, 1947, relayed by Mr. H. Hedstrom, Executive Director of the Twin Falls Housing Authority.  Over a period of approximately 30 minutes, witnesses – including Mrs. Hedstrom, Mrs. Henry Schultz, and Twin Falls Police officers – observed numerous groups of objects moving in triangular formations, initially northeasterly and later southwesterly, with varying numbers of objects ranging from three to fifty.",
    lines: [
      "a reported sighting of unusual flying discs in Twin Falls, Idaho",
      "Over a period of approximately 30 minutes",
      "observed numerous groups of objects moving in triangular formations",
      "with varying numbers of objects ranging from three to fifty"
    ]
  },
  {
    id: "AMC WRIGHT FIELD / 24 SEP 1947",
    src: "media/03.jpg",
    source: "18-6369445-general-1948-vol-1-page-5.png",
    summary:
      "This document, dated September 24, 1947, originates from the Air Matériel Command (AMC) at Wright Field, Dayton, Ohio, and concerns a drawing (“Loading Flying Disc,” LD-2) related to a “Flying Disc” aircraft. It’s addressed to Major General George McDonald in Washington, D.C., and requests a record of all reviews due to patent considerations.  The document also includes a report from the Royal Aircraft Establishment detailing the Horten teilless aircraft, referencing specific pages and photographs for analysis related to the “Flying Saucer” phenomenon.",
    lines: [
      "a drawing (“Loading Flying Disc,” LD-2) related to a “Flying Disc” aircraft",
      "requests a record of all reviews due to patent considerations",
      "a report from the Royal Aircraft Establishment detailing the Horten teilless aircraft"
    ]
  },
  {
    id: "LEDGER-DISPATCH / 09 JUL 1947",
    src: "media/04.jpg",
    source: "65-hs1-834228961-62-hq-83894-section-1-page-160.png",
    summary:
      "This 1947 Ledger-Dispatch article reports on a Norfolk, Virginia teenager, Bill Turrentine, who photographed a large, gray, “flying football”-like object. Turrentine, 15, claims to have seen the object – described as resembling a burned crisp – on Tuesday between 11 a.m. and noon while using an old camera with a shutter speed of 1/100th of a second. Despite taking three shots, only one produced a usable image. The article notes previous reports of flying discs and saucers, but no one else witnessed this particular sighting, and photo experts deemed the photograph a good effort despite a minor flaw in the film.",
    lines: [
      "a Norfolk, Virginia teenager, Bill Turrentine, who photographed a large, gray, “flying football”-like object",
      "described as resembling a burned crisp",
      "Despite taking three shots, only one produced a usable image.",
      "no one else witnessed this particular sighting"
    ]
  },
  {
    id: "NEW PALESTINE / 31 JUL 1952",
    src: "media/05.jpg",
    source: "65-hs1-834228961-62-hq-83894-section-6-page-211.png",
    summary:
      "This handwritten letter, dated July 31, 1952, from Mrs. Ora A. Tyghett in New Palestine, Indiana, expresses concerns about reported “flying saucers.”  She theorizes they are films projected by a secret camera, potentially operated by the Communist Party, and used for military targeting.  The letter suggests a connection between saucer sightings and radar activity, proposing they are deliberately obscured to avoid detection, possibly originating from aircraft or tall buildings, and urges vigilance and prayerful secrecy regarding this phenomenon.",
    lines: [
      "This handwritten letter, dated July 31, 1952",
      "She theorizes they are films projected by a secret camera",
      "urges vigilance and prayerful secrecy regarding this phenomenon"
    ]
  },
  {
    id: "INCIDENT 127 / 07 MAY 1948",
    src: "media/06.jpg",
    source: "38-143685-box7-incident-summaries-101-172-page-81.png",
    summary:
      "This page is a checklist detailing an unidentified flying object (UFO) sighting on May 7, 1948, incident #127, near Lake Doiran along the Yugoslav-Greek border. An observer reported seeing one object at 3000 feet, flying at 180 degrees with a “shrill whine” sound, described as a flying disc.  The report notes no photographs were taken, and residents in the area witnessed the event. The document is marked as restricted.",
    lines: [
      "a checklist detailing an unidentified flying object (UFO) sighting on May 7, 1948, incident #127",
      "An observer reported seeing one object at 3000 feet, flying at 180 degrees with a “shrill whine” sound",
      "The report notes no photographs were taken"
    ]
  },
  {
    id: "LOS ALAMOS / 31 JAN 1949",
    src: "media/07.jpg",
    source: "65-hs1-834228961-62-hq-83894-section-4-page-115.png",
    summary:
      "This 1949 Office Memorandum from the FBI, dated January 31st, details a top-secret investigation into “unidentified aircraft” or “flying discs” following reports from across the country, beginning with sightings in Sweden in 1947. Specifically, it references an Eastern Airlines sighting over Montgomery, Alabama in July 1948 and subsequent observations near the Los Alamos, New Mexico, AEC installation during December 1948 and January 1949, involving various observers. Meteorological expert Dr. Lincoln L. Paz is leading the efforts to understand these unexplained phenomena.",
    lines: [
      "a top-secret investigation into “unidentified aircraft” or “flying discs”",
      "beginning with sightings in Sweden in 1947",
      "subsequent observations near the Los Alamos, New Mexico, AEC installation"
    ]
  },
  {
    id: "INDIANAPOLIS / 1949",
    src: "media/08.jpg",
    source: "65-hs1-834228961-62-hq-83894-section-5-page-35.png",
    summary:
      "This 1949 Office Memorandum from the SAC in Indianapolis details an inquiry into potential connections between reported “flying saucers” and a polio epidemic. Elbert W. Farris of OSI contacted Dr. Richard K. Parrish, who witnessed a possible saucer sighting near Lake of the Woods, Canada, around July 1, 1949. Parrish linked the events, citing similar occurrences in the Carolinas in 1948, and suggested uranium poisoning as a possible cause of the illness. The FBI Agent Metcalfe also reported a sighting.  The matter was investigated by Air Force authorities at Wright Field, but no action was taken.",
    lines: [
      "an inquiry into potential connections between reported “flying saucers” and a polio epidemic",
      "suggested uranium poisoning as a possible cause of the illness",
      "The matter was investigated by Air Force authorities at Wright Field, but no action was taken."
    ]
  },
  {
    id: "AIR INTELLIGENCE / 15 FEB 1949",
    src: "media/09.jpg",
    source: "65-hs1-834228961-62-hq-83894-serial-164-page-114.png",
    summary:
      "This document, dated February 15, 1949, is a restricted memorandum from the United States Air Force Directorate of Intelligence outlining requirements for air intelligence regarding “unconventional aircraft” and unidentified flying objects, often referred to as “Flying Discs.” It rescinds previous collection efforts from 1948 and establishes procedures for reporting sightings, emphasizing immediate electrical transmission of initial reports and subsequent expedited forwarding of supplementary information to Wright-Patterson AFB in Dayton, Ohio.",
    lines: [
      "requirements for air intelligence regarding “unconventional aircraft” and unidentified flying objects",
      "It rescinds previous collection efforts from 1948",
      "emphasizing immediate electrical transmission of initial reports"
    ]
  },
  {
    id: "26TH WEATHER SQ / 05 JAN 1949",
    src: "media/10.jpg",
    source: "342-hs1-416511228-box186-319-1-flying-discs-1949-page-116.png",
    summary:
      "This document, dated January 5, 1949, from the 26th Weather Squadron at Hawkins Field, Jackson, Mississippi, details a reported sighting of an unidentified flying disc.  It’s a restricted report submitted to the Commanding General of the Air Materiel Command at Wright-Patterson Air Force Base. The object was observed two miles east of Jackson on January 1st, 1949, and the report includes weather information and contact details for witnesses, including Thomas A. Rush and his wife, alongside Mrs. Doolittle. Sketches of the object are included as an enclosure.",
    lines: [
      "a reported sighting of an unidentified flying disc",
      "The object was observed two miles east of Jackson on January 1st, 1949",
      "Sketches of the object are included as an enclosure."
    ]
  }
];
