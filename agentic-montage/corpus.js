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
    family: "FBI HQ FILE",
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
    family: "STATE DEPT CABLES",
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
    family: "AMC / WRIGHT FIELD",
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
    family: "INCIDENT SUMMARIES",
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
    family: "USG UAP REPORTS",
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
    family: "FBI HQ FILE",
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
    family: "STATE DEPT CABLES",
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
    family: "FBI HQ FILE",
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
    family: "INCIDENT SUMMARIES",
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
    family: "FBI HQ FILE",
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
    family: "INCIDENT SUMMARIES",
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
    family: "FLYING DISCS 1949",
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
    family: "UFOS AND DEFENSE",
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
    family: "FBI HQ FILE",
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
    family: "UFOS AND DEFENSE",
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
    family: "FBI HQ FILE",
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
    family: "UFOS AND DEFENSE",
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
    family: "INCIDENT SUMMARIES",
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
    family: "FBI HQ FILE",
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
    family: "USG UAP REPORTS",
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
    family: "FBI HQ FILE",
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
    family: "INCIDENT SUMMARIES",
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
    family: "INCIDENT SUMMARIES",
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
    family: "FLYING DISCS 1949",
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
    family: "FBI HQ FILE",
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
    family: "USG UAP REPORTS",
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
    family: "FBI HQ FILE",
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
    family: "FBI HQ FILE",
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
    family: "EMBASSY CABLES",
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
    family: "FBI HQ FILE",
    src: "media/14.jpg",
    place: ["Stockholm", "Sweden", 59.33, 18.06],
    summary:
      "This document, dated June 15, 1950, details a briefing regarding unidentified aerial phenomena, primarily “flying saucers,” that began in Sweden around mid-1946. It recounts historical accounts of unexplained aerial sightings, referencing the biblical prophet Ezekiel’s description of a “wheel in the middle of a wheel.” Initial speculation attributed these objects to Soviet missiles testing, referencing a German V-2 incident in 1944, though the document suggests potential political motivations behind the Swedish defense staff’s investigation.",
    lines: [
      "a briefing regarding unidentified aerial phenomena, primarily “flying saucers,” that began in Sweden around mid-1946",
      "referencing the biblical prophet Ezekiel’s description of a “wheel in the middle of a wheel.”",
      "Initial speculation attributed these objects to Soviet missiles testing"
    ]
  },
  {
    id: "APOLLO 11 / 20 JUL 1969",
    ref: "nasa uap d4 apollo 11 technical crew debriefing 1969 / p.3",
    family: "NASA APOLLO",
    place: ["Houston", "Texas", 29.76, -95.37],
    src: "media/31.jpg",
    summary:
      "This page recounts a discussion during a space mission, likely Apollo, regarding an unidentified object observed through the spacecraft’s windows. The crew – Collins, Armstrong, and Aldrin – suspected it might be the S-IVB stage, initially estimated to be 6,000 miles away. They noted a possible “bump” and described the object as resembling an open suitcase, observing it with monoculars and considering its sizable dimension within their vicinity.",
    lines: [
      "an unidentified object observed through the spacecraft",
      "The crew – Collins, Armstrong, and Aldrin – suspected it might be the S-IVB stage",
      "described the object as resembling an open suitcase",
    ]
  },
  {
    id: "APOLLO 11 / JUL 1969",
    ref: "nasa uap d4 apollo 11 technical crew debriefing 1969 / p.11",
    family: "NASA APOLLO",
    place: ["Houston", "Texas", 29.76, -95.37],
    src: "media/32.jpg",
    summary:
      "This page appears to be a post-mission report discussing an observation of a bright light near Earth. The text suggests a possible explanation for the light – a reflection from a lake – rather than a laser beam aimed at the Moon.  It references “ALDRIN” and revises an initial conclusion, noting the unusual nature of the phenomenon observed at such a distance, and referencing a film where the event wasn’t anticipated.",
    lines: [
      "a post-mission report discussing an observation of a bright light near Earth",
      "a possible explanation for the light – a reflection from a lake",
      "noting the unusual nature of the phenomenon observed at such a distance",
    ]
  },
  {
    id: "APOLLO 17 / DEC 1972",
    ref: "nasa uap d6 apollo 17 technical crew debriefing 1973 / p.2",
    family: "NASA APOLLO",
    place: ["Houston", "Texas", 29.76, -95.37],
    src: "media/33.jpg",
    summary:
      "This page recounts observations from a lunar mission, likely Apollo, detailing a strange “tunnel” seen through the rendezvous window after a fireball subsided.  Evans describes a bright spot resembling a tunnel, with the fireball visible further back.  The crew also noted an unusual sighting of an “aircraft carrier superstructure” and experienced frequent light flashes during the flight, though visibility was hampered by fog and limited Earth observation due to a small crescent.  The text references CERNAN, SCHMITT, and the ALFMED experiment.",
    lines: [
      "detailing a strange “tunnel” seen through the rendezvous window after a fireball subsided",
      "an unusual sighting of an “aircraft carrier superstructure”",
      "experienced frequent light flashes during the flight",
    ]
  },
  {
    id: "SKYLAB / 1973",
    ref: "nasa uap d7 skylab technical crew debriefing 1973 / p.7",
    family: "NASA SKYLAB",
    place: ["Houston", "Texas", 29.76, -95.37],
    src: "media/34.jpg",
    summary:
      "This page discusses visual sightings during a countdown and subsequent orbital activity, likely related to a space mission. Participants, including LOUSMA and GARRIOTT, reported observing unusual satellite-like objects and a bright, unidentified red star – described as significantly brighter than Jupiter – approximately ten days before recovery. The discussion centers on confirming these sightings and awaiting identification information.",
    lines: [
      "reported observing unusual satellite-like objects and a bright, unidentified red star",
      "described as significantly brighter than Jupiter",
      "The discussion centers on confirming these sightings and awaiting identification information.",
    ]
  },
  {
    id: "GEMINI 7 / DEC 1965",
    ref: "255 t 763 r1b transcripts / p.1",
    family: "NASA GEMINI",
    place: ["Houston", "Texas", 29.76, -95.37],
    src: "media/35.jpg",
    summary:
      "This transcript details a Gemini 7 mission communication regarding unidentified objects observed during a flight. Astronauts reported a “bogey” at ten o’clock, debris, and hundreds of particles moving at approximately three to four miles, eventually entering polar orbit. The discussion also included a booster sighting and a brown bogey, referencing a P.A.O. (possibly a facility) and occurring roughly four hours and 24 minutes into the flight.",
    lines: [
      "regarding unidentified objects observed during a flight",
      "Astronauts reported a “bogey” at ten o’clock, debris, and hundreds of particles",
      "eventually entering polar orbit",
    ]
  },
  {
    id: "AYN AL-ASAD / 24 SEP 2024",
    ref: "dow uap d28 mission report east china sea 2024 / p.6",
    family: "USG UAP REPORTS",
    src: "media/36.jpg",
    place: ["Ayn al-Asad", "Iraq", 33.8, 42.44],
    summary:
      "This declassified document, released on October 24, 2025, details an Unidentified Aerial Phenomena (UAP) event observed near Ayn al-Asad Airbase (AAAB) in Iraq.  The UAP, detected on September 24, 2000Z, appeared to predetermine its path and created an IR lens flare, suggesting a significant heat source. It entered a restricted operating zone for a weapons calibration, engaging in a firefight with an AGM-176 missile before disappearing.  The document notes uncertainty regarding a potential detachment from the primary UAP and lacks information on its origin or precise characteristics.",
    lines: [
      "an Unidentified Aerial Phenomena (UAP) event observed near Ayn al-Asad Airbase (AAAB) in Iraq",
      "appeared to predetermine its path and created an IR lens flare, suggesting a significant heat source",
      "engaging in a firefight with an AGM-176 missile before disappearing",
    ]
  },
  {
    id: "MEDITERRANEAN / 13 JUL 2023",
    ref: "dow uap d54 mission report mediterranean sea na / p.7",
    family: "USG UAP REPORTS",
    src: "media/37.jpg",
    place: ["Mediterranean Sea", "off Algeria", 36.58, 2.93],
    summary:
      "This page details a reported Unidentified Aerial Phenomena (UAP) observation. On July 13, 2023 (1319Z), a single triangular and metallic UAP was sighted during a routine training exercise (RTB) over coordinates 36°34’53N, 02°55’943E at an altitude of 24,989 feet and a speed of 168 knots. The observation is categorized as a “Gentext” event, referencing a potential UAP event.",
    lines: [
      "a single triangular and metallic UAP was sighted during a routine training exercise (RTB)",
      "at an altitude of 24,989 feet and a speed of 168 knots",
    ]
  },
  {
    id: "NORTH ARABIAN SEA / 24 AUG 2020",
    ref: "dow uap d56 range fouler debrief arabian sea august 2020 / p.1",
    family: "USG UAP REPORTS",
    src: "media/38.jpg",
    place: ["North Arabian Sea", "Indian Ocean", 23.5, 63.5],
    summary:
      "This page is a Range Fouler Debrief Form, likely used for reporting aerial encounters during a mission. It requests detailed information about observed contacts, including squadron, pilot details, time, location (latitude/longitude), and mission specifics like engagement type (CAS, BFM). The form was completed on August 24, 2020, referencing an HSM-73 crew and noting three unidentified small air contacts observed in the North Arabian Sea.  The report details a westerly heading and lack of radar/IFF tracking, with no interaction observed between the aircraft and the contacts.",
    lines: [
      "noting three unidentified small air contacts observed in the North Arabian Sea",
      "The report details a westerly heading and lack of radar/IFF tracking",
      "with no interaction observed between the aircraft and the contacts",
    ]
  },
  {
    id: "LARISSA / 24 JAN 2024",
    ref: "dow uap d25 mission report greece january 2024 / p.7",
    family: "USG UAP REPORTS",
    src: "media/39.jpg",
    place: ["Larissa", "Greece", 39.64, 22.47],
    summary:
      "This document, declassified on October 24, 2025, by MG Richard A. Harrison of USCENTCOM, details an observation of an Unidentified Aerial Phenomena (UAP) on January 24, 2024 (DoD Acquisition Date: 250509:00ZJAN24). Observed at 0509Z, the UAP, described as a round diamond shape with a “tail,” maintained a steady flight path and exhibited an increased/decreased altitude profile.  The observation, captured on a SWIR camera, lasted approximately two minutes and involved a UAP traveling at 434 knots, prompting no reaction or engagement.",
    lines: [
      "the UAP, described as a round diamond shape with a “tail,” maintained a steady flight path",
      "The observation, captured on a SWIR camera, lasted approximately two minutes",
      "involved a UAP traveling at 434 knots, prompting no reaction or engagement",
    ]
  },
  {
    id: "SYRIAN COAST / 30 MAY 2022",
    ref: "dow uap d14 mission report iraq may 2022 / p.8",
    family: "USG UAP REPORTS",
    src: "media/40.jpg",
    place: ["Syrian coast", "Mediterranean Sea", 35.4, 35.9],
    summary:
      "This document, declassified on October 8, 2025, details an observation of an Unidentified Aerial Phenomenon (UAP) – designated 1.4a – on May 30, 2022 (DTG: 00:00Z).  A single UAP, potentially a Russian SU-30, approached and orbited 1.4a at altitudes ranging from FL190 to FL243 over the Syrian coast.  Weather was not a factor, and the mission of 1.4a continued without impact.  The observation was recorded by 36SXD991.4a and involved a lack of positive identification, with no reported",
    lines: [
      "A single UAP, potentially a Russian SU-30, approached and orbited 1.4a",
      "at altitudes ranging from FL190 to FL243 over the Syrian coast",
      "Weather was not a factor, and the mission of 1.4a continued without impact",
    ]
  },
  {
    id: "FIVE CONTACTS / 22 MAY 2022",
    ref: "dow uap d10 mission report middle east may 2022 / p.6",
    family: "USG UAP REPORTS",
    place: ["Al Asad", "Iraq", 33.78, 42.44],
    src: "media/41.jpg",
    summary:
      "This document, declassified by MG Richard A. Harrison on October 7, 2025, details an observation of unidentified aerial phenomena (UAPs) on May 22, 2022, at 061514:00Z.  Weather conditions – specifically dust – hampered visual collection efforts.  Five UAPs were observed flying across a screen, with one exhibiting characteristics resembling a missile.  The observation occurred near coordinates 38SMC531.4a961.4a, and the report, identified as USCENTCOM MDR 25-0093, indicates a satisfactory pre-coordinated effort to fill an intelligence gap.",
    lines: [
      "Five UAPs were observed flying across a screen, with one exhibiting characteristics resembling a missile",
      "The observation occurred near coordinates 38SMC531.4a961.4a",
      "indicates a satisfactory pre-coordinated effort to fill an intelligence gap",
    ]
  },
  {
    id: "FL600 CLUSTER / 31 MAR 2023",
    ref: "dow uap d20 mission report iraq 2023 / p.6",
    family: "USG UAP REPORTS",
    place: ["Prince Sultan Air Base", "Saudi Arabia", 24.06, 47.58],
    src: "media/42.jpg",
    summary:
      "This document, declassified on October 8, 2025, details an observation of unidentified aerial phenomena (UAP) by a 1.4a/1.4g flight (1.4a, 1.4g). Initial contact occurred on March 31, 2023, with potentially 10-20 UAPs sighted maneuvering near RLZ at an estimated altitude of FL600+.  The flight used a targeting pod to observe the objects, noting differences in comparison to star observations, and reporting no discernible effects on personnel.  The document references FOIA exemptions and various analytical codes and dates.",
    lines: [
      "potentially 10-20 UAPs sighted maneuvering near RLZ at an estimated altitude of FL600+",
      "The flight used a targeting pod to observe the objects, noting differences in comparison to star observations",
      "reporting no discernible effects on personnel",
    ]
  },
  {
    id: "SPHERE ON A POLE / 07 JUN 2024",
    ref: "dow uap d27 mission report united arab emirates october 2023 / p.7",
    family: "USG UAP REPORTS",
    place: ["Al Dhafra", "United Arab Emirates", 24.25, 54.55],
    src: "media/43.jpg",
    summary:
      "This declassified document, dated October 24, 2025, details an Unidentified Aerial Phenomenon (UAP) event observed on June 7, 2024 (070457:00Z).  The UAP, described as a glowing, spherical object with a cylindrical pole, was tracked moving at 140 knots and observed during a routine transit over 40RFM6@(11). Intelligence suggests a “no” response to interrogation and focuses on providing scan support for detecting dhows near SP, requesting specific situational reports regarding vessels, equipment, and personnel.",
    lines: [
      "The UAP, described as a glowing, spherical object with a cylindrical pole, was tracked moving at 140 knots",
      "observed during a routine transit over 40RFM6@(11)",
      "requesting specific situational reports regarding vessels, equipment, and personnel",
    ]
  },
  {
    id: "PERSIAN GULF / 20 AUG 2020",
    ref: "dow uap d61 mission report persian gulf august 2020 / p.6",
    family: "USG UAP REPORTS",
    src: "media/44.jpg",
    place: ["Persian Gulf", "Iran", 27.2, 56.3],
    summary:
      "This document, declassified on January 22, 2026, details a Guardcall and observation related to an Iranian Air Defense aircraft (callsign 1.4a) operating near Iran. On August 20, 2020, the aircraft was observed forming with unknown flying objects traveling northeast-northwest along the coast, tracked by 1.4a. A subsequent observation noted a different location and activity – the formation of flying objects – before communication was lost. The report originates from USCENTCOM MDR 26-0019 and was approved for release to AARO on January 26, 2026.",
    lines: [
      "the aircraft was observed forming with unknown flying objects traveling northeast-northwest along the coast",
      "A subsequent observation noted a different location and activity – the formation of flying objects",
      "before communication was lost",
    ]
  },
  {
    id: "WESTERN U.S. / 2026",
    ref: "western us event slides 5 08 2026 / p.2",
    family: "USPER EVENT SLIDES",
    place: ["Dugway Proving Ground", "Utah", 40.17, -112.93],
    src: "media/45.jpg",
    summary:
      "This page details a reported unidentified aerial phenomenon (UAP) witnessed by two USPER law enforcement agents in the Western U.S. during dusk. Witnesses described a glowing orange orb, initially estimated as 500-600 meters distant and roughly the size of a small helicopter cockpit, near a rock pinnacle.  Later analysis by the AARO suggests a diameter of 12-18 meters and a distance of approximately 1050 meters. The object was noted for its apparent hovering behavior and lack of sound.",
    lines: [
      "a glowing orange orb, initially estimated as 500-600 meters distant",
      "roughly the size of a small helicopter cockpit, near a rock pinnacle",
      "The object was noted for its apparent hovering behavior and lack of sound.",
    ]
  },
  {
    id: "DARK KITE / 2026",
    ref: "western us event slides 5 08 2026 / p.3",
    family: "USPER EVENT SLIDES",
    place: ["Dugway Proving Ground", "Utah", 40.17, -112.93],
    src: "media/46.jpg",
    summary:
      "This document details an unusual observation made by two federal law enforcement agents in the pre-dawn hours in the Western U.S.  USPER5 and USPER6 reported seeing a “car” with red and white lights approximately two to three feet off the ground, which then moved laterally at 15-20 mph with unusual “zero resistance.”  Using night vision goggles, USPER6 initially described it as a “thin line,” while USPER5 likened it to a dark kite.  Later, AARO described the object as triangular, suggesting a potential investigation by the Advanced Aerospace Threat Identification Program (AARO).",
    lines: [
      "with red and white lights approximately two to three feet off the ground",
      "which then moved laterally at 15-20 mph with unusual “zero resistance.”",
      "while USPER5 likened it to a dark kite",
    ]
  },
  {
    id: "ORB SWARM / 2025",
    ref: "usper statement redacted / p.2",
    family: "USPER STATEMENTS",
    place: ["Dugway Proving Ground", "Utah", 40.17, -112.93],
    src: "media/47.jpg",
    summary:
      "This document details a military training mission on [Date - 2207 hours] involving aircraft [CALL SIGN 1] investigating an unidentified “orb.”  Pilots and a witness observed a rapidly expanding swarm of orange orbs – initially near [CALL SIGN 1] at [COORDINATES], then over [ROAD NAME] and finally near [SITE CODE NAME] and [NEARBY TOWN NAME].  The orbs flared up and down in sequence, with a total of five observed, and were accompanied by a second group of orbs seen near the [MILITARY AIRCRAFT] en route to assist.",
    lines: [
      "Pilots and a witness observed a rapidly expanding swarm of orange orbs",
      "The orbs flared up and down in sequence, with a total of five observed",
      "were accompanied by a second group of orbs seen near the [MILITARY AIRCRAFT]",
    ]
  },
  {
    id: "CIGAR OVER THE RANGE / SEP 2023",
    ref: "serial 3 redacted / p.2",
    family: "FBI",
    place: ["Dugway Proving Ground", "Utah", 40.17, -112.93],
    src: "media/48.jpg",
    summary:
      "This page details a UAP observation from September 2023, recorded as part of FD-302. An agent reported seeing a cigar-shaped, metallic bronze object emitting an intense, diamond-white light approximately 500-3000 feet above the tree line. The object, described as being roughly the length of two Blackhawk helicopters, moved slowly from east to west and then vanished without a trace, leaving no contrails. The observer initially dismissed it as a test disruption but later recognized it as something unusual, prompting skepticism from colleagues.",
    lines: [
      "a cigar-shaped, metallic bronze object emitting an intense, diamond-white light",
      "approximately 500-3000 feet above the tree line",
      "moved slowly from east to west and then vanished without a trace, leaving no contrails",
    ]
  },
  {
    id: "MEXICO CITY / SEP 2023",
    ref: "059uap00013 / p.6",
    family: "EMBASSY CABLES",
    src: "media/49.jpg",
    place: ["Mexico City", "Mexico", 19.43, -99.13],
    summary:
      "This page documents a Congressional hearing regarding Unidentified Aerial Phenomena (UAP), specifically addressing a presentation by Mexican journalist Jaime Maussan. Maussan showcased alleged remains of non-human beings, which scientists have refuted as unsubstantiated. The hearing saw criticism of Maussan’s approach and previous claims of alien evidence.  The document includes details of personnel involved in the briefing and clearance process, alongside a photograph of Maussan’s presentation to Congress.",
    lines: [
      "a Congressional hearing regarding Unidentified Aerial Phenomena (UAP)",
      "Maussan showcased alleged remains of non-human beings, which scientists have refuted as unsubstantiated",
      "alongside a photograph of Maussan’s presentation to Congress",
    ]
  },
  {
    id: "FOOFIGHTER / 30 JAN 1945",
    ref: "331 120752 numeric files 1944 1945 37153 german armament equipment documents / p.17",
    family: "WWII FOO FIGHTERS",
    src: "media/50.jpg",
    place: ["Wissembourg–Landau", "Franco-German border", 49.12, 8.02],
    summary:
      "This page details a nighttime aerial sighting on January 30, 1945, by the 415th Night Fighter Squadron.  During the night of January 29-30, pilots observed a “Foofighter,” a mysterious light phenomenon, approximately 1000 feet away between Weissembourg and Landau.  Despite pilots requesting confirmation from GCI Control, no other aircraft (“Bogey A/C”) were reported in the area, suggesting a unique and unexplained event experienced by the squadron.",
    lines: [
      "a nighttime aerial sighting on January 30, 1945, by the 415th Night Fighter Squadron",
      "approximately 1000 feet away between Weissembourg and Landau",
      "suggesting a unique and unexplained event experienced by the squadron",
    ]
  },
  {
    id: "BAKERSFIELD / 03 JUL 1947",
    ref: "65 hs1 834228961 62 hq 83894 serial 130 / p.41",
    family: "FBI HQ FILE",
    src: "media/51.jpg",
    place: ["Bakersfield", "California", 35.37, -119.02],
    summary:
      "This article from *The Oregonian* on July 3, 1947, recounts an account by pilot Dick Rankin of observing unusual aircraft – dubbed “silver saucers” – over Bakersfield, California, on June 23rd. Rankin, a veteran pilot with over 7000 hours of flight time, described seeing ten discs initially heading north before seven returned south. He identified them as the Navy’s experimental XF5U-1 “flying flapjacks,” noting their unique shape and speed.  Only one of these aircraft was reportedly constructed and never flown.",
    lines: [
      "recounts an account by pilot Dick Rankin of observing unusual aircraft",
      "described seeing ten discs initially heading north before seven returned south",
      "He identified them as the Navy’s experimental XF5U-1",
    ]
  },
  {
    id: "NEWFOUNDLAND / 17 JUL 1947",
    ref: "65 hs1 834228961 62 hq 83894 serial 130 / p.31",
    family: "FBI HQ FILE",
    src: "media/52.jpg",
    place: ["Newfoundland", "Canada", 48.95, -55.6],
    summary:
      "This document is a witness statement, dated July 17, 1947, from William Evans regarding an unusual aerial sighting in Newfoundland. Taken by Mercedes Burke of the Intelligence Office, the statement describes a bright, round object with a tail – resembling a “flying saucer” – that appeared to move rapidly across the sky near Leggo’s store. Witness W. Tompkins and Mercedes Burke corroborate the account, suggesting a possible unidentified flying object.",
    lines: [
      "a witness statement, dated July 17, 1947, from William Evans regarding an unusual aerial sighting in Newfoundland",
      "describes a bright, round object with a tail",
      "that appeared to move rapidly across the sky near Leggo’s store",
    ]
  },
  {
    id: "MOUNT RAINIER / 16 JUN 1957",
    ref: "65 hs1 834228961 62 hq 83894 serial 130 / p.98",
    family: "FBI HQ FILE",
    src: "media/53.jpg",
    place: ["Mount Rainier", "Washington", 46.85, -121.76],
    summary:
      "This page recounts a pilot’s observation on June 16, 1957, at approximately 2:50 PM, while flying near Mt. Rainier. The pilot spotted a formation of nine unusual aircraft, initially mistaken for jet planes, flying south at 9,500 feet.  These aircraft reflected sunlight onto the pilot’s plane, allowing him to estimate their speed and observe their outline against the mountain’s snow-covered peak, marking a noteworthy and peculiar aerial event.",
    lines: [
      "The pilot spotted a formation of nine unusual aircraft, initially mistaken for jet planes",
      "flying south at 9,500 feet",
      "observe their outline against the mountain’s snow-covered peak",
    ]
  },
  {
    id: "SOCORRO / 24 APR 1964",
    ref: "65 hs1 834228961 62 hq 83894 serial 438 / p.2",
    family: "FBI HQ FILE",
    src: "media/54.jpg",
    place: ["Socorro", "New Mexico", 34.06, -106.9],
    summary:
      "This document details an incident on April 24, 1964, involving an alleged unidentified flying object (UFO) near Socorro, New Mexico. Special Agent D. Arthur Byrnes of the FBI investigated a report from Officer Lonnie Zamora, who described an object that “landed and has taken off.”  Sheriff’s deputies and state police officers were also present at the site, where Agent Byrnes noted four indentations in the ground, assessing Officer Zamora’s reliability before the event. The document, a loan from the FBI, restricts its distribution.",
    lines: [
      "an alleged unidentified flying object (UFO) near Socorro, New Mexico",
      "who described an object that “landed and has taken off.”",
      "Agent Byrnes noted four indentations in the ground",
      "assessing Officer Zamora’s reliability before the event",
    ]
  },
  {
    id: "SENATOR RUSSELL / 13 OCT 1947",
    ref: "341 110677 numerical file 5 2500 / p.4",
    family: "AIR INTELLIGENCE",
    place: ["Baku", "Azerbaijan", 40.41, 49.87],
    src: "media/55.jpg",
    summary:
      "This page details a debriefing following an observation of unidentified flying objects (UFOs) by Senator Russell and Mr. Efron on October 13, 1947, aboard a train traveling through the Middle East. Colonel Hathaway, an Air Force Attaché, led the discussion with Mr. Efron’s detailed notes. Witnesses reported seeing two saucer-shaped aircraft ascending vertically from a train, with one taking off from the south side of the track. The event prompted Soviet trainmen to close curtains, suggesting the passengers had witnessed something classified. Raw notes and additional comments are included, describing the objects’ movements and characteristics, including sparking and a slow, clockwise rotation.  The document carries a high security classification and emphasizes the",
    lines: [
      "observation of unidentified flying objects (UFOs) by Senator Russell and Mr. Efron on October 13, 1947",
      "Witnesses reported seeing two saucer-shaped aircraft ascending vertically from a train",
      "The event prompted Soviet trainmen to close curtains",
    ]
  },
  {
    id: "ALTA / 17 JUL 1934",
    ref: "341 110677 numerical file 5 2500 / p.5",
    family: "AIR INTELLIGENCE",
    src: "media/56.jpg",
    place: ["Alta", "Utah", 40.59, -111.64],
    summary:
      "This page details a reported sighting of an unidentified flying object (UFO) on July 17, 1934, by US Air Force personnel near Alta, Utah. Three observers – Mr. Miron, Col. Hathaway, and Mr. Efron – witnessed a circular, disc-shaped aircraft with two stationary lights near the takeoff area approximately one mile away. The object moved rapidly and was described as rotating clockwise.  Additionally, the document references a separate observation of a long train of aircraft outside Baku, Azerbaijan, and a high-flying unidentified jet aircraft.  The report emphasizes the need for further debriefing to obtain more technical details, and includes security classification warnings regarding the document’s sensitive nature.",
    lines: [
      "witnessed a circular, disc-shaped aircraft with two stationary lights near the takeoff area approximately one mile away",
      "The object moved rapidly and was described as rotating clockwise.",
      "The report emphasizes the need for further debriefing to obtain more technical details",
    ]
  },
  {
    id: "CINQ-MARS-LA-PILE / 28 JAN 1994",
    ref: "255 413270 ufo s and defense what should we prepare for / p.15",
    family: "UFOS AND DEFENSE",
    src: "media/57.jpg",
    place: ["Cinq-Mars-la-Pile", "France", 47.35, 0.46],
    summary:
      "This document details an unusual aerial sighting on January 28, 1994, during Air France Flight AF 3532, operated by Captain Jean-Charles Duboc and Copilot Valérie Chauffour.  The crew observed a large, fluctuating object – initially resembling a weather balloon – at approximately 10,500 meters, described with features like a fluorescent green tail and a bright white center.  Radar data from Cinq-Mars-la-Pile confirmed a brief, unexplained radar track coinciding with the sighting, leading investigators to estimate the object’s length at 250 meters, ultimately ruling out a conventional aircraft.",
    lines: [
      "an unusual aerial sighting on January 28, 1994, during Air France Flight AF 3532",
      "The crew observed a large, fluctuating object – initially resembling a weather balloon",
      "described with features like a fluorescent green tail and a bright white center",
      "Radar data from Cinq-Mars-la-Pile confirmed a brief, unexplained radar track",
    ]
  },
  {
    id: "PERESLAVL-ZALESSKI / 1990",
    ref: "255 413270 ufo s and defense what should we prepare for / p.20",
    family: "UFOS AND DEFENSE",
    src: "media/58.jpg",
    place: ["Pereslavl-Zalesski", "Russia", 56.74, 38.86],
    summary:
      "This document details a remarkable 1990 incident over the Pereslavl-Zalesski region of Russia, involving multiple fighter aircraft intercepting unidentified flying objects (UFOs) detected on air defense radar.  Pilots experienced communication failures and disorientation while pursuing objects described as disk-shaped, maneuvering with exceptional speed and exhibiting unusual properties like silent flight and defying inertia.  Confirmed by multiple witnesses including an Air Force General and radar operators, the event was deemed a “classic” UFO case by DIA analysts, supported by radar confirmation and physiological effects on crew members.  The report, originating from a 1990 article by Igor Maltsev, highlights the object’s size, maneuvers, and lack of sound, solidifying",
    lines: [
      "a remarkable 1990 incident over the Pereslavl-Zalesski region of Russia",
      "involving multiple fighter aircraft intercepting unidentified flying objects (UFOs) detected on air defense radar",
      "Pilots experienced communication failures and disorientation while pursuing objects described as disk-shaped",
      "supported by radar confirmation and physiological effects on crew members",
    ]
  },
  {
    id: "LAKENHEATH / 13-14 AUG 1956",
    ref: "255 413270 ufo s and defense what should we prepare for / p.16",
    family: "UFOS AND DEFENSE",
    src: "media/59.jpg",
    place: ["Lakenheath", "England", 52.41, 0.56],
    summary:
      "This document details the Lakenheath and Bentwaters UFO incidents of August 13-14, 1956, investigated by the Condon Commission.  The report describes radar and visual sightings of unidentified aerial objects, corroborated by multiple witnesses, including pilots and radar operators at both bases.  Notably, the events were initially labeled “unidentified” in 1969, and later analyzed by radar expert Thayer and atmospheric physicist MacDonald.  The incidents involved speeds of up to 6400 km/h and were followed by a stationary object detected 40km southwest of Lakenheath, highlighting the complex investigation and subsequent scrutiny of the case.",
    lines: [
      "the Lakenheath and Bentwaters UFO incidents of August 13-14, 1956",
      "radar and visual sightings of unidentified aerial objects, corroborated by multiple witnesses",
      "The incidents involved speeds of up to 6400 km/h",
      "a stationary object detected 40km southwest of Lakenheath",
    ]
  },
  {
    id: "NORTH SEA / 05 SEP 1948",
    ref: "341 110448 records relating to the collection and dissemination of intelligence 1948 1955 ts cont no 2 2 5300 2 5399 / p.4",
    family: "AIR INTELLIGENCE",
    src: "media/60.jpg",
    place: ["West coast of Holland", "Netherlands", 52.1, 4.3],
    summary:
      "This document, dated November 4, 1948, originates from the 307th Bomb Group of the USAFE, investigating an unidentified aircraft sighting during Operation Dagger. Three crews reported observing the aircraft off the west coast of Holland at 1402Z on September 5, 1948, at 30,000 feet.  Observers described a single, jet-propelled aircraft exhibiting unusual maneuvers – leaving smoke and condensation trails – suggesting potential rocket assistance and exceeding typical jet speeds of 1947.  The aircraft remained beyond identification range.",
    lines: [
      "Three crews reported observing the aircraft off the west coast of Holland at 1402Z on September 5, 1948",
      "a single, jet-propelled aircraft exhibiting unusual maneuvers",
      "The aircraft remained beyond identification range.",
    ]
  },

];


