const PROXY_ENDPOINT = "/api/pexels";

const MEMORY_CACHE = new Map();
const CACHE_PREFIX = "ff-pexels-video:";
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours
const MAX_ERROR_SNIPPET = 160;

function getCache(key) {
  if (MEMORY_CACHE.has(key)) return MEMORY_CACHE.get(key);
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.ts) return null;
    if (Date.now() - parsed.ts > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_PREFIX + key);
      return null;
    }
    MEMORY_CACHE.set(key, parsed.data || null);
    return parsed.data || null;
  } catch (e) {
    return null;
  }
}

function setCache(key, data) {
  MEMORY_CACHE.set(key, data);
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) {}
}

function pickBestVideoFile(files = []) {
  const mp4 = files.filter((f) => f.file_type === "video/mp4");
  if (!mp4.length) return null;
  const sorted = mp4.slice().sort((a, b) => (a.width || 0) - (b.width || 0));
  const target = sorted.find((f) => (f.width || 0) >= 720 && (f.width || 0) <= 1280);
  return target || sorted[sorted.length - 1];
}

async function runFetch(url, signal) {
  return fetch(url, { signal });
}

function clipSnippet(text = "") {
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  return cleaned.slice(0, MAX_ERROR_SNIPPET);
}

async function readJsonResponse(res, label) {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  const isJson = contentType.includes("application/json");

  if (!isJson) {
    const looksHtml = /<!doctype|<html/i.test(text);
    const snippet = clipSnippet(text);
    const hint = looksHtml
      ? " Likely an HTML page (proxy not active or wrong endpoint)."
      : "";
    const tail = snippet ? ` Response: ${snippet}` : "";
    throw new Error(`${label} returned non-JSON (${res.status}).${hint}${tail}`);
  }

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`${label} returned invalid JSON (${res.status}).`);
  }
}

async function fetchJson(url, signal, label) {
  const res = await runFetch(url, signal);
  const data = await readJsonResponse(res, label);
  if (!res.ok) {
    const msg = data?.error || data?.message || `${label} error: ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function fetchPexelsVideo(query, options = {}) {
  const {
    orientation = "landscape",
    size = "medium",
    perPage = 1,
    minDuration = 5,
    maxDuration = 60,
    signal,
  } = options;

  const cacheKey = `${query}|${orientation}|${size}|${perPage}|${minDuration}|${maxDuration}`;
  const cached = getCache(cacheKey);
  if (cached !== null) return cached;

  const base = window?.location?.origin || "http://localhost";
  const makeUrl = (endpoint) => {
    const u = new URL(endpoint, base);
    u.searchParams.set("query", query);
    u.searchParams.set("per_page", String(perPage));
    u.searchParams.set("orientation", orientation);
    if (size) u.searchParams.set("size", size);
    if (minDuration != null) u.searchParams.set("min_duration", String(minDuration));
    if (maxDuration != null) u.searchParams.set("max_duration", String(maxDuration));
    return u.toString();
  };

  const data = await fetchJson(makeUrl(PROXY_ENDPOINT), signal, "Pexels proxy");

  const video = (data?.videos || [])[0];
  if (!video) {
    setCache(cacheKey, null);
    return null;
  }

  const file = pickBestVideoFile(video.video_files || []);
  if (!file) {
    setCache(cacheKey, null);
    return null;
  }

  const result = {
    id: video.id,
    videoUrl: file.link,
    image: video.image || "",
    duration: video.duration,
    width: file.width,
    height: file.height,
    photographer: video.user?.name || "Pexels Creator",
    photographerUrl: video.user?.url || "https://www.pexels.com",
    pexelsUrl: video.url || "https://www.pexels.com/videos/",
  };

  setCache(cacheKey, result);
  return result;
}

export async function fetchPexelsVideoWithFallback(queries = [], options = {}) {
  let lastError = null;
  let lastQuery = null;
  for (const q of queries) {
    if (!q) continue;
    try {
      lastQuery = q;
      const result = await fetchPexelsVideo(q, options);
      if (result) return { result, query: q, error: null };
    } catch (e) {
      lastError = e;
      if (options?.signal?.aborted) throw e;
    }
  }
  return { result: null, query: lastQuery, error: lastError };
}
