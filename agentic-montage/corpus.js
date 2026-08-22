/* ---------------------------------------------------------------------------
   agentic montage - corpus manifest
   ---------------------------------------------------------------------------
   Pages from the USA Government UAP release, read by the OCR and summarisation
   pipeline. This order is not the running order: index.js deals the corpus into
   a bag and shuffles it, so every page shows once before any page shows twice
   and the piece opens somewhere different each time it is loaded. The size of
   the corpus is never shown on screen - add or remove entries freely.

   Images are greyscale JPEG, scanner surround trimmed, autocontrast applied;
   photostats (white type on black) are inverted so every page sits at the same
   density behind the text.

   Per entry:
     id       label shown in the footer
     ref      archival reference for the page, for traceability
     src      path under media/. null falls back to a generated scan, seeded by
              slot, so the loop stays identical run to run. A src that 404s
              falls back the same way.
     place    where on Earth the page is about: [name, region, lat, lon]. The
              locator above the subtitle flies to it. Omit it and the locator
              reads UNLOCATED rather than pointing somewhere invented.
     summary  the model's summary of the page, verbatim
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
    ref: "65 hs1 834228961 62 hq 83894 section 3 / p.124",
    src: "media/01.jpg",
    place: ["Butte", "Montana", 46.0, -112.53],
    summary:
      "This page appears to be a fragmented, handwritten report likely concerning a sighting of a “flying disc” on August 20, 1917, in Butte, Montana.  It references a teletype from August 15, 1947, and includes a newspaper account from “Twin Walls.”  The document details observations by Unie, Billy, and Meith, describing a peculiar object – possibly a disc – seen in the sky, alongside notes about its shape and a subsequent interview on August 15, 1947, where Unie recalled the event occurring around 1:00 PM.  Security protocols and “tons” are also repeatedly mentioned.",
    lines: [
      "a fragmented, handwritten report likely concerning a sighting of a “flying disc”",
      "It references a teletype from August 15, 1947, and includes a newspaper account from “Twin Walls.”",
      "Security protocols and “tons” are also repeatedly mentioned."
    ]
  },
  {
    id: "PORT MORESBY / 28 JAN 1985",
    ref: "dos uap d1 cable 1 papua new guinea january 1985 / p.1",
    src: "media/26.jpg",
    place: ["Port Moresby", "Papua New Guinea", -9.44, 147.18],
    summary:
      "This document, dated January 28, 1985, concerns an inquiry from Papua New Guinea’s National Intelligence Organization (NIO) regarding reported sightings of high-speed aircraft over the country. The matter originated with a local resident’s fear and prompted a public meeting involving the Prime Minister. It was relayed to the Embassy in Port Moresby and subsequently forwarded to USCINCPAC, State Department, and other agencies, including NSA, for investigation and analysis – specifically regarding potential overflights.",
    lines: [
      "an inquiry from Papua New Guinea’s National Intelligence Organization (NIO)",
      "regarding reported sightings of high-speed aircraft over the country",
      "It was relayed to the Embassy in Port Moresby"
    ]
  },
  {
    id: "AMC WRIGHT FIELD / 24 SEP 1947",
    ref: "18 6369445 general 1948 vol 1 / p.5",
    src: "media/03.jpg",
    place: ["Wright Field", "Ohio", 39.83, -84.05],
    summary:
      "This document, dated September 24, 1947, originates from the Air Matériel Command (AMC) at Wright Field, Dayton, Ohio, and concerns a drawing (“Loading Flying Disc,” LD-2) related to a “Flying Disc” aircraft. It’s addressed to Major General George McDonald in Washington, D.C., and requests a record of all reviews due to patent considerations.  The document also includes a report from the Royal Aircraft Establishment detailing the Horten teilless aircraft, referencing specific pages and photographs for analysis related to the “Flying Saucer” phenomenon.",
    lines: [
      "a drawing (“Loading Flying Disc,” LD-2) related to a “Flying Disc” aircraft",
      "requests a record of all reviews due to patent considerations",
      "a report from the Royal Aircraft Establishment detailing the Horten teilless aircraft"
    ]
  },
  {
    id: "MUNICH / 23 NOV 1948",
    ref: "38 143685 box7 incident summaries 173 233 / p.115",
    src: "media/12.jpg",
    place: ["Munich", "Germany", 48.14, 11.58],
    summary:
      "On November 23, 1948, Captain Hugh Slater reported observing a reddish, star-like object moving rapidly over Munich.  Racecard DF Station initially detected nothing but later reported an unidentified object at approximately 27,000 feet, circling at 40,000 feet south of Munich.  Confirmed by fellow F-80 pilot, Captain Darwin R. Addis of the 23rd Fighter Squadron, the sighting occurred without any F-80 aircraft in the area, suggesting a possible unidentified aerial phenomenon.",
    lines: [
      "Captain Hugh Slater reported observing a reddish, star-like object moving rapidly over Munich",
      "later reported an unidentified object at approximately 27,000 feet, circling at 40,000 feet south of Munich",
      "the sighting occurred without any F-80 aircraft in the area"
    ]
  },
  {
    id: "RANGE FOULER / 15 OCT 2020",
    ref: "dow uap d44 range fouler arabian sea october 2020 / p.1",
    src: "media/21.jpg",
    place: ["Gulf of Aden", "Arabian Sea", 12.79, 45.03],
    summary:
      "This page is a Range Fouler Reporting Form, likely related to ISR (Intelligence, Surveillance, and Reconnaissance) operations. It was completed on October 15, 2020, and details a specific contact observed at 14:18:39Z to 14:19:52Z. The report describes a round, white object detected via IR, traveling at 319 degrees and 20 mph, exhibiting abrupt directional changes over the Gulf of Aden.  It includes sensor data like slant range, ground range, and altitude, alongside details about AIM-9x tracking, ECM, and ambiguous identifiers, aiming to provide a comprehensive account of the encounter.",
    lines: [
      "a Range Fouler Reporting Form",
      "describes a round, white object detected via IR, traveling at 319 degrees and 20 mph",
      "exhibiting abrupt directional changes over the Gulf of Aden"
    ]
  },
  {
    id: "INDIANAPOLIS / 1949",
    ref: "65 hs1 834228961 62 hq 83894 section 5 / p.35",
    src: "media/08.jpg",
    place: ["Indianapolis", "Indiana", 39.77, -86.16],
    summary:
      "This 1949 Office Memorandum from the SAC in Indianapolis details an inquiry into potential connections between reported “flying saucers” and a polio epidemic. Elbert W. Farris of OSI contacted Dr. Richard K. Parrish, who witnessed a possible saucer sighting near Lake of the Woods, Canada, around July 1, 1949. Parrish linked the events, citing similar occurrences in the Carolinas in 1948, and suggested uranium poisoning as a possible cause of the illness. The FBI Agent Metcalfe also reported a sighting.  The matter was investigated by Air Force authorities at Wright Field, but no action was taken.",
    lines: [
      "an inquiry into potential connections between reported “flying saucers” and a polio epidemic",
      "suggested uranium poisoning as a possible cause of the illness",
      "The matter was investigated by Air Force authorities at Wright Field, but no action was taken."
    ]
  },
  {
    id: "KAZAKHSTAN / 31 JAN 1994",
    ref: "dos uap d2 cable 2 kazakhstan january 1994 / p.2",
    src: "media/18.jpg",
    place: ["Kazakhstan", "Central Asia", 48.02, 66.92],
    summary:
      "This document, dated March 2, 2026, details a pilot’s account of an unusual aerial encounter over Kazakhstan.  Captain Rhodes and his crew observed a bright, rapidly maneuvering object – described as resembling a high-speed bullet – for approximately forty-five minutes before it disappeared.  The pilots, having logged extensive flight hours, dismissed the event as similar to previous sightings of meteors, but ultimately believed the object to be extraterrestrial and under intelligent control, suggesting it entered and exited the Earth’s atmosphere with remarkable speed and agility.",
    lines: [
      "a pilot’s account of an unusual aerial encounter over Kazakhstan",
      "observed a bright, rapidly maneuvering object – described as resembling a high-speed bullet",
      "for approximately forty-five minutes before it disappeared",
      "ultimately believed the object to be extraterrestrial and under intelligent control"
    ]
  },
  {
    id: "LEDGER-DISPATCH / 09 JUL 1947",
    ref: "65 hs1 834228961 62 hq 83894 section 1 / p.160",
    src: "media/04.jpg",
    place: ["Norfolk", "Virginia", 36.85, -76.29],
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
    id: "NORTHERN JAPAN / 06 NOV 1948",
    ref: "38 143685 box7 incident summaries 173 233 / p.55",
    src: "media/24.jpg",
    place: ["Wakkanai", "Japan", 45.41, 141.67],
    summary:
      "This document details an incident on November 6, 1948, at approximately 11:57 AM near a radar site at Wakksmai, Japan. A radar operator observed a blip on their scope initially appearing as a single aircraft, occasionally showing as two, exhibiting erratic flight patterns resembling dogfighting. The object, not visually confirmed, was estimated to be between 160 and 240 miles per hour and was tracked for over an hour amidst low and dense cloud formations, suggesting a possible unusual aerial activity.",
    lines: [
      "A radar operator observed a blip on their scope initially appearing as a single aircraft",
      "exhibiting erratic flight patterns resembling dogfighting",
      "was tracked for over an hour amidst low and dense cloud formations"
    ]
  },
  {
    id: "PIEDMONT / 28 SEP 1954",
    ref: "65 hs1 834228961 62 hq 83894 section 8 / p.60",
    src: "media/13.jpg",
    place: ["Piedmont", "Italy", 45.07, 7.69],
    summary:
      "This article from the *Rome Daily American* on September 28, 1954, details a puzzling “windshield cancer” epidemic spreading across northern Italy.  Mysterious windshield explosions, resembling a “hurricane path” of shattering glass, have been reported, starting in the Italian Piedmont region and moving towards Rome.  The phenomenon, first observed in the U.S. northwest, has caused injuries to motorists and prompted confusion among authorities, with no clear cause identified.  The last reported incident occurred in Modena a week prior.",
    lines: [
      "a puzzling “windshield cancer” epidemic spreading across northern Italy",
      "Mysterious windshield explosions, resembling a “hurricane path” of shattering glass",
      "starting in the Italian Piedmont region and moving towards Rome",
      "The last reported incident occurred in Modena a week prior."
    ]
  },
  {
    id: "INCIDENT 127 / 07 MAY 1948",
    ref: "38 143685 box7 incident summaries 101 172 / p.81",
    src: "media/06.jpg",
    place: ["Lake Doiran", "Yugoslav-Greek border", 41.2, 22.75],
    summary:
      "This page is a checklist detailing an unidentified flying object (UFO) sighting on May 7, 1948, incident #127, near Lake Doiran along the Yugoslav-Greek border. An observer reported seeing one object at 3000 feet, flying at 180 degrees with a “shrill whine” sound, described as a flying disc.  The report notes no photographs were taken, and residents in the area witnessed the event. The document is marked as restricted.",
    lines: [
      "a checklist detailing an unidentified flying object (UFO) sighting on May 7, 1948, incident #127",
      "An observer reported seeing one object at 3000 feet, flying at 180 degrees with a “shrill whine” sound",
      "The report notes no photographs were taken"
    ]
  },
  {
    id: "KODIAK / 08 APR 1949",
    ref: "342 hs1 416511228 box186 319 1 flying discs 1949 / p.56",
    src: "media/27.jpg",
    place: ["Kodiak", "Alaska", 57.79, -152.41],
    summary:
      "This document, dated April 23, 1949, details multiple eyewitness accounts of a strange luminous object observed over Kodiak, Alaska.  Lieutenant Commander D. Shepard, a U.S. Naval officer, reported a reddish ball of fire on April 8th at approximately 2040 hours, while taxi driver Lawrence B. Shaw and bus driver Paul Krueger observed similar objects – one blue with a streamer and the other greenish-blue – around the same time and trajectory, appearing to originate near Old Woman Mountain and heading towards Chiniak Bay.  The U.S. Navy Weather Central reported stable weather conditions at the time, and despite the consistent descriptions, the nature of the phenomenon remains undetermined, with investigators concluding",
    lines: [
      "multiple eyewitness accounts of a strange luminous object observed over Kodiak, Alaska",
      "reported a reddish ball of fire on April 8th at approximately 2040 hours",
      "appearing to originate near Old Woman Mountain and heading towards Chiniak Bay"
    ]
  },
  {
    id: "TEHRAN / 19 SEP 1976",
    ref: "255 413270 ufo s and defense what should we prepare for / p.19",
    src: "media/19.jpg",
    place: ["Tehran", "Iran", 35.69, 51.39],
    summary:
      "This document details an incident on September 18-19, 1976, involving reports of a strange luminous object over Tehran, Iran.  An RB-47 aircraft, while conducting surveillance, observed a similar object near Dallas, Texas, experiencing simultaneous loss of radar and visual contact.  Following this, a U.S. citizen successfully obtained a Defense Intelligence Agency (DIA) report through the Freedom of Information Act, corroborated by interviews and eyewitness accounts, including those of Iranian air traffic controller Hossain Perouzi who described a pulsating, rectangular object.  A subsequent F-4 interception attempt was aborted due to equipment malfunctions, highlighting the unusual nature of the unidentified aerial object.",
    lines: [
      "reports of a strange luminous object over Tehran, Iran",
      "Iranian air traffic controller Hossain Perouzi who described a pulsating, rectangular object",
      "A subsequent F-4 interception attempt was aborted due to equipment malfunctions"
    ]
  },
  {
    id: "TWIN FALLS / 02 SEP 1947",
    ref: "65 hs1 834228961 62 hq 83894 section 2 / p.177",
    src: "media/02.jpg",
    place: ["Twin Falls", "Idaho", 42.56, -114.46],
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
    id: "BARILOCHE / 31 JUL 1995",
    ref: "255 413270 ufo s and defense what should we prepare for / p.21",
    src: "media/30.jpg",
    place: ["San Carlos de Bariloche", "Argentina", -41.13, -71.31],
    summary:
      "This page details a perplexing aerial phenomenon observed during Aerolineas Argentinas flight AR 674 on July 31, 1995, near San Carlos de Bariloche, Argentina.  A power outage coincided with the sighting of a luminous, aircraft-like object that appeared and disappeared near the plane, witnessed by the pilot, ground crew, and other aircraft.  The event was corroborated by multiple observers and linked to an electromagnetic disturbance, alongside a similar reported sighting in Antananarivo, Madagascar, on August 16, 1954, involving a former Air France official.",
    lines: [
      "a perplexing aerial phenomenon observed during Aerolineas Argentinas flight AR 674",
      "A power outage coincided with the sighting of a luminous, aircraft-like object",
      "witnessed by the pilot, ground crew, and other aircraft"
    ]
  },
  {
    id: "AIR INTELLIGENCE / 15 FEB 1949",
    ref: "65 hs1 834228961 62 hq 83894 serial 164 / p.114",
    src: "media/09.jpg",
    place: ["Washington, D.C.", "United States", 38.91, -77.04],
    summary:
      "This document, dated February 15, 1949, is a restricted memorandum from the United States Air Force Directorate of Intelligence outlining requirements for air intelligence regarding “unconventional aircraft” and unidentified flying objects, often referred to as “Flying Discs.” It rescinds previous collection efforts from 1948 and establishes procedures for reporting sightings, emphasizing immediate electrical transmission of initial reports and subsequent expedited forwarding of supplementary information to Wright-Patterson AFB in Dayton, Ohio.",
    lines: [
      "requirements for air intelligence regarding “unconventional aircraft” and unidentified flying objects",
      "It rescinds previous collection efforts from 1948",
      "emphasizing immediate electrical transmission of initial reports"
    ]
  },
  {
    id: "BARNAUL / 27 JAN 2001",
    ref: "255 413270 ufo s and defense what should we prepare for / p.93",
    src: "media/16.jpg",
    place: ["Barnaul", "Siberia", 53.36, 83.76],
    summary:
      "On January 27, 2001, an unidentified flying object (UFO) caused a temporary shutdown of Barnaul Airport in Siberia, Russia.  Following reports from cargo plane crews who witnessed a luminescent object hovering over the runway, the airport was closed for ninety minutes.  Local aviation director Ivan Komarov confirmed the incident, leading to the diversion of another aircraft to a nearby airport.",
    lines: [
      "an unidentified flying object (UFO) caused a temporary shutdown of Barnaul Airport in Siberia, Russia",
      "cargo plane crews who witnessed a luminescent object hovering over the runway",
      "the airport was closed for ninety minutes"
    ]
  },
  {
    id: "PERTH / 30 DEC 1947",
    ref: "38 143685 box7 incident summaries 1 100 / p.197",
    src: "media/25.jpg",
    place: ["Perth", "Western Australia", -31.95, 115.86],
    summary:
      "This document is a checklist detailing an unidentified flying object (UFO) sighting on December 30, 1947, at approximately 19:26 PST near Perth, Western Australia (42° 9.3’ W and 114° 22.2’ W).  Lieutenant Colonel W.W. Jones and Major A.A. Andrae, an USAF pilot, observed a single object descending vertically at 13,000 feet, characterized by intense green and blue flames and unusual exhaust trails. The object appeared to slow as it approached the ground and vanished suddenly, prompting further investigation.",
    lines: [
      "a checklist detailing an unidentified flying object (UFO) sighting on December 30, 1947",
      "observed a single object descending vertically at 13,000 feet",
      "characterized by intense green and blue flames and unusual exhaust trails",
      "The object appeared to slow as it approached the ground and vanished suddenly"
    ]
  },
  {
    id: "LOS ALAMOS / 31 JAN 1949",
    ref: "65 hs1 834228961 62 hq 83894 section 4 / p.115",
    src: "media/07.jpg",
    place: ["Los Alamos", "New Mexico", 35.88, -106.31],
    summary:
      "This 1949 Office Memorandum from the FBI, dated January 31st, details a top-secret investigation into “unidentified aircraft” or “flying discs” following reports from across the country, beginning with sightings in Sweden in 1947. Specifically, it references an Eastern Airlines sighting over Montgomery, Alabama in July 1948 and subsequent observations near the Los Alamos, New Mexico, AEC installation during December 1948 and January 1949, involving various observers. Meteorological expert Dr. Lincoln L. Paz is leading the efforts to understand these unexplained phenomena.",
    lines: [
      "a top-secret investigation into “unidentified aircraft” or “flying discs”",
      "beginning with sightings in Sweden in 1947",
      "subsequent observations near the Los Alamos, New Mexico, AEC installation"
    ]
  },
  {
    id: "LATAKIA / 18 NOV 2016",
    ref: "dow uap d55 mission report syria november 2016 / p.1",
    src: "media/22.jpg",
    place: ["Latakia", "Syria", 35.52, 35.79],
    summary:
      "This document details a November 18, 2016, observation by a US P-8A aircraft (operating under CTG 67.1) of an unidentified low-flying object approximately 55 nautical miles northwest of Latakia, Syria. The aircraft, piloted by RUS UDALOV DD 519 and originating from Kaliningrad, observed a possible missile launch around 1310Z, traveling at 500 knots.  The object was last seen approximately 40 NM northwest of Latakia at 1312Z, passing between INGUL ARS and a U/I vessel, with clear visibility reported by the aircrew.  The incident is considered consistent with typical",
    lines: [
      "observation by a US P-8A aircraft",
      "of an unidentified low-flying object approximately 55 nautical miles northwest of Latakia, Syria",
      "The object was last seen approximately 40 NM northwest of Latakia at 1312Z"
    ]
  },
  {
    id: "NEW PALESTINE / 31 JUL 1952",
    ref: "65 hs1 834228961 62 hq 83894 section 6 / p.211",
    src: "media/05.jpg",
    place: ["New Palestine", "Indiana", 39.72, -85.89],
    summary:
      "This handwritten letter, dated July 31, 1952, from Mrs. Ora A. Tyghett in New Palestine, Indiana, expresses concerns about reported “flying saucers.”  She theorizes they are films projected by a secret camera, potentially operated by the Communist Party, and used for military targeting.  The letter suggests a connection between saucer sightings and radar activity, proposing they are deliberately obscured to avoid detection, possibly originating from aircraft or tall buildings, and urges vigilance and prayerful secrecy regarding this phenomenon.",
    lines: [
      "This handwritten letter, dated July 31, 1952",
      "She theorizes they are films projected by a secret camera",
      "urges vigilance and prayerful secrecy regarding this phenomenon"
    ]
  },
  {
    id: "CLARK FIELD / 12 NOV 1948",
    ref: "38 143685 box7 incident summaries 173 233 / p.81",
    src: "media/23.jpg",
    place: ["Clark Air Base", "Philippines", 15.19, 120.53],
    summary:
      "This document details an incident observation on November 12, 1948, at Clark Air Base in the Philippines, recorded by Sergeant Fredrick M. Wright of the 18th Maintenance Squadron.  The observer reported seeing a white, snow-white object, estimated at 300 feet long and 47-1/2 feet wingspan, flying at 3-6 miles altitude and 20-30 miles distant.  The object, described as resembling a plane and exhibiting “sky writing” maneuvers, was observed intermittently through cloud cover and exhibited a single roar and exhaust trail.  A subsequent page provides a summary of the incident.",
    lines: [
      "an incident observation on November 12, 1948, at Clark Air Base in the Philippines",
      "a white, snow-white object, estimated at 300 feet long and 47-1/2 feet wingspan",
      "described as resembling a plane and exhibiting “sky writing” maneuvers"
    ]
  },
  {
    id: "MOSCOW / 03 AUG 1948",
    ref: "38 143685 box7 incident summaries 101 172 / p.175",
    src: "media/15.jpg",
    place: ["Moscow", "Soviet Union", 55.76, 37.62],
    summary:
      "This Incident Summary Sheet, dated August 3, 1948, details an observation made near Moscow, USSR. An observer located approximately 25 kilometers west of Moscow reported sighting a metallic, long-narrow object exhibiting bright luminosity and moving at a high speed in a southwest-northwest direction. The object was observed for a period of time and noted for its peculiar wingless design, lasting approximately 15 minutes.  The report includes observations about the object’s color, size, and any effects on the surrounding weather conditions.",
    lines: [
      "An observer located approximately 25 kilometers west of Moscow",
      "reported sighting a metallic, long-narrow object exhibiting bright luminosity",
      "noted for its peculiar wingless design, lasting approximately 15 minutes"
    ]
  },
  {
    id: "26TH WEATHER SQ / 05 JAN 1949",
    ref: "342 hs1 416511228 box186 319 1 flying discs 1949 / p.116",
    src: "media/10.jpg",
    place: ["Jackson", "Mississippi", 32.3, -90.18],
    summary:
      "This document, dated January 5, 1949, from the 26th Weather Squadron at Hawkins Field, Jackson, Mississippi, details a reported sighting of an unidentified flying disc.  It’s a restricted report submitted to the Commanding General of the Air Materiel Command at Wright-Patterson Air Force Base. The object was observed two miles east of Jackson on January 1st, 1949, and the report includes weather information and contact details for witnesses, including Thomas A. Rush and his wife, alongside Mrs. Doolittle. Sketches of the object are included as an enclosure.",
    lines: [
      "a reported sighting of an unidentified flying disc",
      "The object was observed two miles east of Jackson on January 1st, 1949",
      "Sketches of the object are included as an enclosure."
    ]
  },
  {
    id: "PINAR DEL RIO / 20 NOV 1957",
    ref: "65 hs1 834228961 62 hq 83894 section 9 / p.4",
    src: "media/29.jpg",
    place: ["Pinar del Rio", "Cuba", 22.42, -83.7],
    summary:
      "This page, dated November 20, 1957, is a report from the FBI’s Legal Attaché in Havana, Cuba, regarding alleged sightings of “flying discs.” It details a report from the “Diario de la Marina” newspaper in Pinar del Rio, Cuba, where José Maria Nieto and Carmelo Guzman claimed to have observed a silent, hat-shaped disc hovering near the Matahambre Mines.  No corroborating reports were received, and the FBI office took no further action.",
    lines: [
      "a report from the “Diario de la Marina” newspaper in Pinar del Rio, Cuba",
      "claimed to have observed a silent, hat-shaped disc hovering near the Matahambre Mines",
      "No corroborating reports were received, and the FBI office took no further action."
    ]
  },
  {
    id: "MISREP 4782130 / 2020",
    ref: "dow uap d62 mission report strait of hormuz september 2020 / p.1",
    src: "media/20.jpg",
    place: ["Strait of Hormuz", "Gulf of Oman", 26.57, 56.25],
    summary:
      "This declassified report (MISREP 4782130), dated January 22, 2026, details operations conducted by the 482ATKS unit under USCENTCOM (ACC) during Operation 1.4a in the Arabian Gulf, Strait of Hormuz, and Gulf of Oman.  From February 1st, 2045, the unit collected SIGINT and IMINT, supported NAVCENT, and observed a UAP between February 1st and 2nd, 2045.  The mission involved 20.9 hours of flight time and 2 total taskings, with a focus on SIGINT and IMINT analysis.",
    lines: [
      "operations conducted by the 482ATKS unit under USCENTCOM (ACC)",
      "in the Arabian Gulf, Strait of Hormuz, and Gulf of Oman",
      "the unit collected SIGINT and IMINT, supported NAVCENT, and observed a UAP"
    ]
  },
  {
    id: "DEVON COAST / 26 OCT",
    ref: "65 hs1 834228961 62 hq 83894 sub a / p.67",
    src: "media/11.jpg",
    place: ["Brixham, Devon", "England", 50.39, -3.51],
    summary:
      "This page details multiple eyewitness accounts of unusual lights observed in the sky over Devon, England, on the evening of Monday, October 26th. Fishermen, estate agents, and naval crew members reported seeing bluish-white lights, often described as resembling flames or rockets, traveling south towards Brixham and Thatcher Rock.  Several individuals, including Mr. Bray, Mr. Jeffery, and Mr. Cove-Clark, noted the lights’ speed, silence, and occasional disintegration, with one observer describing a “long red trail.”  Reports were published in both the Western Morning News and the Torquay Herald.",
    lines: [
      "multiple eyewitness accounts of unusual lights observed in the sky over Devon, England",
      "Fishermen, estate agents, and naval crew members reported seeing bluish-white lights",
      "noted the lights’ speed, silence, and occasional disintegration"
    ]
  },
  {
    id: "DURANGO / 16 MAR 1950",
    ref: "65 hs1 834228961 62 hq 83894 serial 220 / p.13",
    src: "media/28.jpg",
    place: ["Durango", "Mexico", 24.02, -104.65],
    summary:
      "This page, dated March 16, 1950, from Mexico City, details the initial photographs of alleged “flying plates” (UFOs) taken in Durango at an altitude of nine thousand feet. It references Miguel Lanz Duret and Germán Horacio Robles Jr., a student from the National School of Engineering, who witnessed these phenomena. The document explores Robles Jr.’s conception of the unusual devices, suggesting they appear in various forms.",
    lines: [
      "the initial photographs of alleged “flying plates” (UFOs) taken in Durango at an altitude of nine thousand feet",
      "a student from the National School of Engineering, who witnessed these phenomena",
      "suggesting they appear in various forms"
    ]
  },
  {
    id: "GUDAUTA / 29 OCT 2001",
    ref: "059uap00011 / p.3",
    src: "media/17.jpg",
    place: ["Gudauta", "Abkhazia", 43.1, 40.62],
    summary:
      "This document, marked as CONFIDENTIAL and UNCLASSIFIED, details a discussion regarding Russian military withdrawals from Gudauta, Georgia, occurring around October 29, 2001. TerioKen, an Abkhaz official, confirmed the departure of one trainload of equipment and the loading of two more awaiting permission from Abkhaz authorities. The conversation also addresses concerns about a lack of transparency regarding troop withdrawals and a recent visit by Georgian Parliamentary Speaker Zurab Zvaniya to Moscow, which yielded no practical outcome.  It highlights ongoing tensions between Tbilisi and Moscow, and references intelligence sharing protocols (INFO, LOG, etc.).",
    lines: [
      "a discussion regarding Russian military withdrawals from Gudauta, Georgia",
      "confirmed the departure of one trainload of equipment and the loading of two more",
      "concerns about a lack of transparency regarding troop withdrawals"
    ]
  },
  {
    id: "BRIEFING / 15 JUN 1950",
    ref: "65 hs1 834228961 62 hq 83894 section 5 / p.156",
    src: "media/14.jpg",
    place: ["Stockholm", "Sweden", 59.33, 18.06],
    summary:
      "This document, dated June 15, 1950, details a briefing regarding unidentified aerial phenomena, primarily “flying saucers,” that began in Sweden around mid-1946. It recounts historical accounts of unexplained aerial sightings, referencing the biblical prophet Ezekiel’s description of a “wheel in the middle of a wheel.” Initial speculation attributed these objects to Soviet missiles testing, referencing a German V-2 incident in 1944, though the document suggests potential political motivations behind the Swedish defense staff’s investigation.",
    lines: [
      "a briefing regarding unidentified aerial phenomena, primarily “flying saucers,” that began in Sweden around mid-1946",
      "referencing the biblical prophet Ezekiel’s description of a “wheel in the middle of a wheel.”",
      "Initial speculation attributed these objects to Soviet missiles testing"
    ]
  }
];
