/* ---------------------------------------------------------------------------
   agentic montage
   ---------------------------------------------------------------------------
   Reads window.AGENT1_CORPUS (corpus.js) and window.WORLD (world.js) and runs
   the piece: one document at a time, its summary spoken in subtitles over a
   drifting scan of the page, with a locator showing where on Earth it is about.

   Everything is driven by a single requestAnimationFrame loop and one clock, so
   pause is exact and the piece can be left running for hours without drifting
   or growing.
--------------------------------------------------------------------------- */
(function () {
"use strict";

/* ------------------------------------------------------------------ *
 * 0. corpus
 * ------------------------------------------------------------------ */
var CORPUS = (window.AGENT1_CORPUS && window.AGENT1_CORPUS.length)
  ? window.AGENT1_CORPUS
  : [{ id: "NO CORPUS", src: null, lines: ["The manifest is empty. I am describing a page that is not here."] }];
var TOTAL = CORPUS.length;
var HAS_AUDIO = CORPUS.some(function (d) { return !!d.audio; });

/* ------------------------------------------------------------------ *
 * 1. stand-in scans, generated when an entry has no src.
 *    Seeded by slot, so every loop looks identical.
 * ------------------------------------------------------------------ */
function rng(s) {
  s = s >>> 0 || 1;
  return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
var WORDS = ("HEADQUARTERS ARMY AIR FORCES INTELLIGENCE DIVISION REQUIREMENTS FLYING DISCS OBSERVED " +
  "WRIGHT FIELD DAYTON OHIO MATERIEL COMMAND ALERT BASIS INTERCEPTOR AIRCRAFT GUN CAMERA PHOTOGRAPHS " +
  "UNIDENTIFIED AERIAL PHENOMENA REPORTED SIGHTED ALTITUDE KNOTS ESTIMATED WITNESS STATEMENT ATTACHED " +
  "CONFIDENTIAL ROUTING RECORD SHEET COMMENT NO CONCURRENCE REQUESTED BRIGADIER GENERAL STAFF").split(" ");
var docCache = {};
function makeDoc(seed) {
  if (docCache[seed]) return docCache[seed];
  var w = 880, h = 1160, c = document.createElement("canvas");
  c.width = w; c.height = h;
  var x = c.getContext("2d"), r = rng(seed + 1), i, k;
  x.fillStyle = "#ded9c8"; x.fillRect(0, 0, w, h);
  for (i = 0; i < 70; i++) {
    x.fillStyle = "rgba(120,105,70," + (r() * 0.05) + ")";
    var s = 40 + r() * 220;
    x.beginPath(); x.ellipse(r() * w, r() * h, s, s * 0.6, r() * 3, 0, 7); x.fill();
  }
  x.strokeStyle = "rgba(60,50,30,.35)"; x.lineWidth = 1; x.strokeRect(48, 44, w - 96, h - 88);
  x.fillStyle = "#2a2620"; x.font = "bold 22px ui-monospace, monospace";
  x.fillText(["RESTRICTED", "CONFIDENTIAL", "ROUTING AND RECORD SHEET", "MEMORANDUM"][seed % 4], 70, 92);
  x.font = "12px ui-monospace, monospace";
  var y = 140;
  for (i = 0; i < 54; i++) {
    if (r() < 0.09) { y += 16; continue; }
    var line = "", n = 4 + Math.floor(r() * 9);
    for (k = 0; k < n; k++) line += WORDS[Math.floor(r() * WORDS.length)] + " ";
    x.fillStyle = "rgba(38,34,26," + (0.55 + r() * 0.4) + ")";
    x.fillText(line.slice(0, 86), 70 + (r() < 0.2 ? 60 : 0), y);
    y += 19; if (y > h - 120) break;
  }
  for (i = 0; i < 3 + (seed % 4); i++) {
    x.fillStyle = "rgba(24,22,18,.92)";
    x.fillRect(70 + r() * 380, 150 + r() * (h - 320), 120 + r() * 280, 15);
  }
  x.save(); x.translate(w - 262, 150); x.rotate(-0.22);
  x.strokeStyle = "rgba(120,30,25,.5)"; x.lineWidth = 4; x.strokeRect(0, 0, 200, 54);
  x.fillStyle = "rgba(120,30,25,.5)"; x.font = "bold 30px ui-monospace, monospace";
  x.fillText("DECLASS", 12, 38); x.restore();
  for (i = 0; i < 2; i++) { x.fillStyle = "rgba(30,28,22,.6)"; x.beginPath(); x.arc(28, 300 + i * 420, 11, 0, 7); x.fill(); }
  var im = x.getImageData(0, 0, w, h), d = im.data;
  for (i = 0; i < d.length; i += 4) { var nz = (r() - 0.5) * 30; d[i] += nz; d[i + 1] += nz; d[i + 2] += nz; }
  x.putImageData(im, 0, 0);
  docCache[seed] = c.toDataURL();
  return docCache[seed];
}

/* ------------------------------------------------------------------ *
 * 2. montage plates
 * ------------------------------------------------------------------ *
 * A page does not sit still while three or four sentences are said over it.
 * Every subtitle line gets its own shot: the same page, framed somewhere else
 * and at a different distance, dissolved into over the line before it. Shot 0
 * is the page arriving, so it takes the long dissolve; the shots inside a
 * document are quick, because they are the same paper, not a new one.
 *
 * Framings are seeded by slot and shot, so a page is always read the same way
 * round and the piece stays composed rather than random.
 * ------------------------------------------------------------------ */
var DOC_FADE = 2400, SHOT_FADE = 800;
var CALM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

var platesEl = document.getElementById("plates"), plates = [];
var docFallback = false;

function showPlate(item, slot, shot) {
  var fade = shot ? SHOT_FADE : DOC_FADE;
  var el = document.createElement("div");
  el.className = "plate";
  el.style.transitionDuration = fade + "ms";

  if (item.src && !docFallback) {
    el.style.backgroundImage = "url(" + item.src + ")";
    if (!shot) {
      /* one request, not two: the same Image both warms the cache and reports
         a 404, so a missing page falls back instead of showing a blank frame.
         Only shot 0 asks — the shots after it already know the answer. */
      var probe = new Image();
      probe.decoding = "async";
      probe.onerror = function () {
        docFallback = true;
        el.classList.add("gen");
        el.style.backgroundImage = "url(" + makeDoc(slot) + ")";
      };
      probe.src = item.src;
    }
  } else {
    el.classList.add("gen");
    el.style.backgroundImage = "url(" + makeDoc(slot) + ")";
  }

  /* where this shot sits on the page, and where it drifts to */
  var r = rng(slot * 37 + shot * 101 + 77);
  var sx = 1.05 + r() * 0.25;
  var ox = (r() - 0.5) * 14, oy = (r() - 0.5) * 12;
  var dx = (r() - 0.5) * 10, dy = (r() - 0.5) * 8;
  el.anim = el.animate(
    [{ transform: "scale(" + sx + ") translate(" + ox + "%," + oy + "%)" },
     { transform: "scale(" + (sx + 0.16) + ") translate(" + (ox + dx) + "%," + (oy + dy) + "%)" }],
    { duration: 18000, easing: "linear", fill: "forwards" }
  );
  if (halted) el.anim.pause();
  platesEl.appendChild(el);
  requestAnimationFrame(function () { el.classList.add("on"); });
  plates.push(el);

  while (plates.length > 2) {
    var old = plates.shift();
    old.style.transitionDuration = fade + "ms";   /* leave at the speed it arrives */
    old.classList.remove("on");
    (function (o) {
      setTimeout(function () {
        if (o.anim) o.anim.cancel();   /* drop the animation with the node */
        o.remove();
      }, fade + 200);
    })(old);
  }
}

/* ------------------------------------------------------------------ *
 * 3. the locator — where on Earth the page on screen is about
 * ------------------------------------------------------------------ */
var W = window.WORLD || { w: 360, h: 142, top: 84, land: "" };
var locEl = document.getElementById("locator");
var pinEl = document.getElementById("pin");
var hopEl = document.getElementById("hop");
var placeEl = document.getElementById("wplace");
var regionEl = document.getElementById("wregion");
var coordEl = document.getElementById("wcoord");
var dateEl = document.getElementById("wdate");
var lastPt = null;

(function drawWorld() {
  document.getElementById("land").setAttribute("d", W.land);
  var d = [], v;
  for (v = 30; v < 360; v += 30) d.push("M" + v + " 0V" + W.h);                 /* meridians */
  for (v = W.top - 30; v > W.top - W.h; v -= 30) d.push("M0 " + v + "H" + W.w); /* parallels */
  document.getElementById("grat").setAttribute("d", d.join(""));
  document.getElementById("equator").setAttribute("d", "M0 " + W.top + "H" + W.w);
})();

/* plate carree, the same two lines the outline was projected with */
function project(lat, lon) {
  var y = W.top - Math.max(W.top - W.h, Math.min(W.top, lat));
  var x = ((lon + 180) % 360 + 360) % 360;
  return [x, y];
}

function degrees(v, pos, neg) {
  return Math.abs(v).toFixed(2) + "°" + (v < 0 ? neg : pos);
}

/* the footer carries "PLACE / DATE"; the locator takes the date off the end of
   the same string, so the two can never drift apart */
function dateOf(id) {
  var parts = String(id || "").split(" / ");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function flyTo(place, id) {
  dateEl.textContent = dateOf(id) || " ";
  if (!place) {
    locEl.classList.add("blind");
    placeEl.textContent = "unlocated";
    regionEl.textContent = "no position in the page";
    coordEl.innerHTML = "&nbsp;";
    lastPt = null;
    return;
  }
  locEl.classList.remove("blind");
  var lat = place[2], lon = place[3], pt = project(lat, lon);
  placeEl.textContent = place[0];
  regionEl.textContent = place[1];
  coordEl.textContent = degrees(lat, "N", "S") + "  " + degrees(lon, "E", "W");

  if (lastPt) {
    var len = Math.hypot(pt[0] - lastPt[0], pt[1] - lastPt[1]);
    hopEl.setAttribute("x1", lastPt[0]); hopEl.setAttribute("y1", lastPt[1]);
    hopEl.setAttribute("x2", pt[0]);     hopEl.setAttribute("y2", pt[1]);
    hopEl.style.transition = "none";
    hopEl.style.strokeDasharray = len;
    hopEl.style.strokeDashoffset = len;
    /* next frame, so the reset above is not folded into the transition */
    requestAnimationFrame(function () {
      hopEl.style.transition = "";
      hopEl.style.strokeDashoffset = 0;
    });
  }
  if (!lastPt) pinEl.style.transition = "none";   /* the first fix, not a flight */
  pinEl.style.transform = "translate(" + pt[0] + "px," + pt[1] + "px)";
  if (!lastPt) requestAnimationFrame(function () { pinEl.style.transition = ""; });
  lastPt = pt;
}

/* ------------------------------------------------------------------ *
 * 4. clock — one rAF loop drives everything, so pause is exact
 * ------------------------------------------------------------------ */
var t = 0, last = 0, halted = false;

/* ---- state columns : a fixed ring of spans, recycled oldest to newest,
        so the log scrolls without ever allocating or growing the DOM ---- */
var LOG = ["system wants to change, True", "system wants to change, False", "memory valid", "memory flush",
  "gate: media -> ai", "gate: network -> media", "gate: ai -> speech", "adapter fusion 0.41", "adapter fusion 0.77",
  "ocr conf 0.88", "ocr conf 0.61", "llava tokens 128", "llava tokens 512", "tts queue 3", "tts queue 0",
  "router idle", "router busy", "signal 8080 ok", "corpus seek 0x1f2a", "summary accepted", "summary rejected",
  "lora scale 0.5", "frame committed", "frame dropped"];
var colEls = [].slice.call(document.querySelectorAll(".col .inner"));
var colNext = colEls.map(function (_, i) { return i * 30; });

function fillColumns() {
  colEls.forEach(function (inner) {
    inner.textContent = "";
    var probe = document.createElement("span");
    probe.textContent = "x";
    inner.appendChild(probe);
    var lh = probe.offsetHeight || 12;
    var fit = Math.max(6, Math.ceil(inner.parentNode.clientHeight / lh) + 1);
    probe.textContent = "";
    for (var i = 1; i < fit; i++) inner.appendChild(document.createElement("span"));
  });
}

function pumpColumns() {
  for (var i = 0; i < colEls.length; i++) {
    var inner = colEls[i], period = 70 + i * 45;
    while (t > colNext[i]) {
      colNext[i] += period;
      var s = inner.firstChild;          /* oldest line, at the top */
      if (!s) break;
      s.textContent = LOG[(Math.random() * LOG.length) | 0];
      s.className = Math.random() < 0.12 ? "hot" : "";
      inner.appendChild(s);              /* a move, not an allocation */
    }
  }
}

/* ---- timecodes : written only when the digits actually change ---- */
var tcs = [].slice.call(document.querySelectorAll(".tc")), off = [0, 4211000, 9903000];
var tcWas = ["", "", ""];
function pad(n) { return n < 10 ? "0" + n : "" + n; }
function fmt(ms) {
  return pad(Math.floor(ms / 3600000)) + ":" + pad(Math.floor(ms / 60000) % 60) + ":" +
         pad(Math.floor(ms / 1000) % 60) + "." + pad(Math.floor(ms / 40) % 25);
}
function pumpClocks() {
  for (var i = 0; i < tcs.length; i++) {
    var s = fmt(t * (1 + i * 0.31) + off[i]);
    if (s !== tcWas[i]) { tcWas[i] = s; tcs[i].childNodes[0].nodeValue = s; }
  }
}

/* ---- the gate light ---- */
var gateLed = document.getElementById("l0");
var ledNext = 0;
function pumpLeds() {
  if (t < ledNext) return;
  ledNext = t + 900;
  gateLed.classList.toggle("up", Math.random() < 0.9);
}

/* ------------------------------------------------------------------ *
 * 5. sequencer — one document, its lines, then the next one out of the bag.
 *    Lines butt up against each other and the next document starts on the
 *    last one, so there is always a sentence on screen.
 *    The corpus size is deliberately never shown.
 * ------------------------------------------------------------------ */
var subEl = document.getElementById("sub");
var docIdEl = document.getElementById("docid");
var seq = null, activeLine = -1, wordEls = [], shown = -1, audioEl = null;

/* ---- what plays next : a shuffled bag ---------------------------------------
   Deal the whole corpus into a bag, shuffle it, and draw from it. Every page
   shows once before any page shows twice, the montage opens somewhere
   different every time it is loaded, and there is no seam where the last page
   of one pass runs into the first page of the next.

   After the shuffle, neighbours that landed close together on the map are
   swapped further down the bag, so the locator keeps crossing the world rather
   than lingering in one region. The bag is only re-cut every half hour or so,
   and the pass is a couple of hundred comparisons, so this costs nothing.
--------------------------------------------------------------------------- */
var MIN_APART = 25;          /* degrees between consecutive pages, where the bag allows */
var bag = [], lastSlot = -1;

/* plate-carree separation — the same distance the locator draws, not the real
   great circle, which is the point: it is how far the reticle has to travel */
function apart(a, b) {
  var pa = CORPUS[a].place, pb = CORPUS[b].place;
  if (!pa || !pb) return 360;
  var dLat = pa[2] - pb[2], dLon = Math.abs(pa[3] - pb[3]);
  if (dLon > 180) dLon = 360 - dLon;
  return Math.hypot(dLat, dLon);
}

function shuffle() {
  var i, j, k, prev;
  bag.length = 0;
  for (i = 0; i < TOTAL; i++) bag.push(i);
  for (i = TOTAL - 1; i > 0; i--) {              /* Fisher-Yates */
    j = (Math.random() * (i + 1)) | 0;
    k = bag[i]; bag[i] = bag[j]; bag[j] = k;
  }
  for (i = 0; i < TOTAL; i++) {                  /* push close neighbours apart */
    prev = i ? bag[i - 1] : lastSlot;            /* i === 0 answers to the last bag */
    if (prev < 0 || apart(prev, bag[i]) >= MIN_APART) continue;
    for (j = i + 1; j < TOTAL; j++) {
      if (apart(prev, bag[j]) < MIN_APART) continue;
      k = bag[i]; bag[i] = bag[j]; bag[j] = k;   /* the crowded page waits its turn */
      break;
    }
  }
}

function nextSlot() {
  if (!bag.length) shuffle();
  lastSlot = bag.shift();
  if (!bag.length) shuffle();   /* always one ahead, so the next page can preload */
  return lastSlot;
}

var HOLD = 1600;   /* how long a finished line stays before the next begins */

/* corpus.js keeps every line exactly as it was cut out of the summary, mid
   sentence and all. Reading it as a sentence is a presentation job, done here:
   raise the first letter and close it off if the excerpt does not close itself. */
var OPENERS = "“‘\"'([";
var TERMINAL = /[.!?…]$/;
function asSentence(s) {
  s = s.trim();
  var i = 0;
  while (i < s.length && OPENERS.indexOf(s.charAt(i)) >= 0) i++;
  if (i < s.length) s = s.slice(0, i) + s.charAt(i).toUpperCase() + s.slice(i + 1);
  var bare = s.replace(/[”’"')\]]+$/, "");
  return TERMINAL.test(bare) ? s : s + ".";
}

function buildSequence(slot) {
  var item = CORPUS[slot];
  var lines = (item.lines && item.lines.length) ? item.lines : ["—"];
  var out = [], at = t;
  lines.forEach(function (text) {
    var words = asSentence(text).split(/\s+/);
    var dur = 700 + HOLD + words.length * 380;
    out.push({ words: words, start: at, end: at + dur });
    at += dur;
  });
  return { item: item, slot: slot, lines: out, end: at };
}

function enterDocument() {
  var slot = nextSlot();
  seq = buildSequence(slot);
  activeLine = -1;
  docFallback = false;
  docIdEl.textContent = seq.item.id || "—";
  flyTo(seq.item.place, seq.item.id);
  /* the plate arrives with the first line, in renderLine */
  var nxt = CORPUS[bag[0]];
  if (nxt && nxt.src) { var pre = new Image(); pre.decoding = "async"; pre.src = nxt.src; }
  if (seq.item.audio) {
    if (audioEl) audioEl.pause();
    audioEl = new Audio(seq.item.audio);
    audioEl.play().catch(function () { /* blocked or missing: subtitles carry on */ });
  }
}

function renderLine(i) {
  activeLine = i;
  shown = -1;
  subEl.textContent = "";
  wordEls = [];
  if (i < 0) return;
  /* a new shot of the page for every line, unless the viewer asked for calm,
     in which case the page arrives once and simply drifts */
  if (!CALM || i === 0) showPlate(seq.item, seq.slot, i);
  var frag = document.createDocumentFragment();
  seq.lines[i].words.forEach(function (w) {
    var b = document.createElement("b");
    b.textContent = w + " ";
    frag.appendChild(b);
    wordEls.push(b);
  });
  subEl.appendChild(frag);
}

function pumpSequence() {
  if (!seq || t >= seq.end) { enterDocument(); }
  var i = seq.lines.length - 1;
  while (i > 0 && t < seq.lines[i].start) i--;
  if (i !== activeLine) renderLine(i);
  var ln = seq.lines[i];
  var step = Math.max(90, (ln.end - ln.start - HOLD) / ln.words.length);
  var upto = Math.min(wordEls.length - 1, Math.floor((t - ln.start) / step));
  while (shown < upto) { shown++; wordEls[shown].classList.add("on"); }
}

/* ------------------------------------------------------------------ *
 * 6. loop + controls
 * ------------------------------------------------------------------ */
function frame(now) {
  requestAnimationFrame(frame);
  if (!last) last = now;
  var dt = Math.min(now - last, 100);
  last = now;
  if (halted || document.hidden) return;
  t += dt;
  pumpColumns();
  pumpClocks();
  pumpLeds();
  pumpSequence();
}

function setHalted(v) {
  halted = v;
  document.body.classList.toggle("halted", v);
  plates.forEach(function (p) { if (p.anim) { v ? p.anim.pause() : p.anim.play(); } });
  if (audioEl) { v ? audioEl.pause() : audioEl.play().catch(function () {}); }
}

document.addEventListener("visibilitychange", function () {
  if (!document.hidden) last = 0;   /* come back without a jump */
});

document.addEventListener("keydown", function (e) {
  if (e.code === "Space") { e.preventDefault(); setHalted(!halted); }
  else if (e.key === "c" || e.key === "C") { document.body.classList.toggle("bare"); }
  else if (e.key === "f" || e.key === "F") {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(function () {});
  }
});

/* touch has no space bar: tap the stage to pause, but never swallow a link */
if (window.matchMedia && matchMedia("(pointer: coarse)").matches) {
  document.getElementById("stage").addEventListener("click", function (e) {
    if (e.target.closest("a")) return;
    setHalted(!halted);
  });
}

var idleTimer;
function wake() {
  document.body.classList.remove("idle");
  clearTimeout(idleTimer);
  idleTimer = setTimeout(function () { document.body.classList.add("idle"); }, 3000);
}
document.addEventListener("mousemove", wake, { passive: true });
wake();

var resizeTimer;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(fillColumns, 200);
}, { passive: true });

setTimeout(function () { document.getElementById("hint").classList.add("gone"); }, 6000);

/* audio needs a user gesture; without audio the piece just starts */
var gate = document.getElementById("gate");
function start() { fillColumns(); requestAnimationFrame(frame); }
if (HAS_AUDIO) {
  gate.classList.remove("gone");
  gate.addEventListener("click", function () { gate.classList.add("gone"); start(); }, { once: true });
} else {
  start();
}
})();
