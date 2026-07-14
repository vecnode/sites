// Shared feed helper used by every site. No third-party feed-to-JSON API —
// just a CORS proxy plus native parsing.

// RSS/Atom via corsproxy.io + DOMParser. Fast, has real dates.
async function fetchFeedXml(feedUrl, limit) {
  const proxied = "https://corsproxy.io/?url=" + encodeURIComponent(feedUrl);
  const res = await fetch(proxied);
  if (!res.ok) throw new Error("feed request failed: " + res.status);
  const text = await res.text();
  const doc = new DOMParser().parseFromString(text, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("feed parse error");

  const nodes = Array.from(doc.querySelectorAll("item, entry")).slice(0, limit);
  return nodes.map(node => {
    const title = (node.querySelector("title")?.textContent || "").trim();
    const linkNode = node.querySelector("link");
    const link = linkNode ? (linkNode.getAttribute("href") || linkNode.textContent || "").trim() : "";
    const pubDate =
      node.querySelector("pubDate")?.textContent ||
      node.querySelector("updated")?.textContent ||
      node.querySelector("published")?.textContent ||
      node.querySelector("date")?.textContent ||
      "";
    const creators = Array.from(node.querySelectorAll("creator")).map(n => n.textContent.trim());
    const author = creators.length
      ? creators.filter(Boolean).join(", ")
      : (node.querySelector("author > name")?.textContent || node.querySelector("author")?.textContent || "").trim();
    const thumbnail =
      node.querySelector("content[medium=image]")?.getAttribute("url") ||
      node.querySelector("thumbnail")?.getAttribute("url") ||
      node.querySelector("enclosure[type^=image]")?.getAttribute("url") ||
      "";
    return { title, link, pubDate, author, thumbnail };
  });
}

// Fallback for feeds behind hosts corsproxy.io won't relay (e.g. springer.com):
// r.jina.ai's reader mode renders the page as markdown, which we scrape for
// "### [Title](url)" headings. No publish dates available this way.
async function fetchFeedViaReader(feedUrl, limit) {
  const res = await fetch("https://r.jina.ai/" + feedUrl);
  if (!res.ok) throw new Error("reader request failed: " + res.status);
  const text = await res.text();
  const items = [];
  const re = /^###\s+\[(.+?)\]\((https?:\/\/[^\s)]+)\)/gm;
  let match;
  while ((match = re.exec(text)) && items.length < limit) {
    items.push({ title: match[1].trim(), link: match[2].trim(), pubDate: "" });
  }
  return items;
}

window.fetchFeed = async function fetchFeed(feedUrl, limit = 20, mode = "xml") {
  return mode === "reader" ? fetchFeedViaReader(feedUrl, limit) : fetchFeedXml(feedUrl, limit);
};
